import { Prisma, EstadoSocio, EstadoSolicitud, TipoCambioEstado, TipoCuota } from '@prisma/client'
import { HttpError } from '../lib/httpError'

// Cuota conjunta: entrar y salir de un grupo. Funciones sobre una transacción (las llama SociosService)

type Tx = Prisma.TransactionClient

const nombreCompleto = (u: { nombre: string; apellidos: string }) => `${u.nombre} ${u.apellidos}`

// Copia los pagos de la cuota conjunta al socio; en los meses que coincidan prevalecen los copiados
async function copiarPagos(tx: Tx, grupoId: string, aId: string) {
  const pagos = await tx.pagoCuota.findMany({ where: { grupo_id: grupoId } })
  if (!pagos.length) return
  await tx.pagoCuota.deleteMany({ where: { socio_id: aId, OR: pagos.map(({ anio, mes }) => ({ anio, mes })) } })
  await tx.pagoCuota.createMany({
    data: pagos.map(({ anio, mes, estado, revisado_por_id }) => ({ socio_id: aId, anio, mes, estado, revisado_por_id })),
  })
}

async function pasarAIndividual(tx: Tx, socioId: string) {
  await tx.usuario.update({ where: { id: socioId }, data: { solicitud_grupal_id: null, tipo_cuota: TipoCuota.individual } })
}

/**
 * Saca a un socio de su cuota conjunta: se lleva una copia de los pagos del grupo.
 * Si queda un solo miembro, el grupo se disuelve y ese miembro también se lleva la copia.
 */
export async function salirDeCuotaConjunta(tx: Tx, socioId: string, porId: string, motivo: string) {
  // Bloquea el grupo: si dos miembros salen a la vez, el segundo ve ya al primero fuera (y no queda un grupo de uno)
  await tx.$queryRaw`SELECT 1 FROM "SolicitudGrupal" WHERE id = (SELECT solicitud_grupal_id FROM "Usuario" WHERE id = ${socioId}) FOR UPDATE`
  const socio = await tx.usuario.findUnique({
    where: { id: socioId },
    select: {
      nombre: true,
      apellidos: true,
      solicitud_grupal: { include: { miembros: { select: { id: true } } } },
    },
  })
  const grupo = socio?.solicitud_grupal
  if (!socio || !grupo) throw new HttpError(409, 'El socio no pertenece a una cuota conjunta')
  const restantes = grupo.miembros.filter((m) => m.id !== socioId)
  const historial = (socio_id: string, tipo: TipoCambioEstado, detalle: string) =>
    tx.historialEstadoSocio.create({ data: { socio_id, tipo, detalle, por_id: porId } })

  await copiarPagos(tx, grupo.id, socioId)
  await pasarAIndividual(tx, socioId)
  await historial(socioId, TipoCambioEstado.cuota_individual, motivo)

  // Una cuota conjunta de una persona no tiene sentido: el que queda (ya con el historial) pasa a individual
  if (restantes.length <= 1) {
    if (restantes.length) {
      await copiarPagos(tx, grupo.id, restantes[0].id)
      await pasarAIndividual(tx, restantes[0].id)
      await historial(restantes[0].id, TipoCambioEstado.cuota_individual, `Cuota conjunta disuelta al salir ${nombreCompleto(socio)}`)
    }
    await tx.solicitudGrupal.delete({ where: { id: grupo.id } })
  }
}

/** Une al socio `id` a la cuota conjunta de `otroId`; si el otro es individual, crea una con los dos. */
export async function unirACuotaConjunta(tx: Tx, id: string, otroId: string, porId: string) {
  // Bloquea a los dos socios y el grupo del otro: dos uniones o una unión y una salida a la vez no se pisan
  await tx.$queryRaw`SELECT 1 FROM "Usuario" WHERE id IN (${id}, ${otroId}) FOR UPDATE`
  await tx.$queryRaw`SELECT 1 FROM "SolicitudGrupal" WHERE id = (SELECT solicitud_grupal_id FROM "Usuario" WHERE id = ${otroId}) FOR UPDATE`
  const select = {
    id: true,
    nombre: true,
    apellidos: true,
    estado: true,
    solicitud_grupal: { select: { id: true } },
  } as const
  const [socio, otro] = await Promise.all([
    tx.usuario.findUnique({ where: { id }, select }),
    tx.usuario.findUnique({ where: { id: otroId }, select }),
  ])
  if (!socio || !otro) throw new HttpError(404, 'Socio no encontrado')
  if (socio.estado !== EstadoSocio.activo || otro.estado !== EstadoSocio.activo) {
    throw new HttpError(409, 'Solo los socios activos pueden compartir cuota')
  }
  if (socio.solicitud_grupal) throw new HttpError(409, 'El socio ya pertenece a una cuota conjunta')
  const historial = (socio_id: string, detalle: string) =>
    tx.historialEstadoSocio.create({ data: { socio_id, tipo: TipoCambioEstado.cuota_conjunta, detalle, por_id: porId } })

  let grupo = otro.solicitud_grupal
  if (!grupo) {
    grupo = await tx.solicitudGrupal.create({ data: { estado: EstadoSolicitud.aprobada }, select: { id: true } })
    await tx.usuario.update({ where: { id: otro.id }, data: { solicitud_grupal_id: grupo.id, tipo_cuota: TipoCuota.conjunta } })
    // Sus pagos pasan a ser los de la cuota conjunta: sigue al corriente de lo que ya tenía
    await tx.pagoCuota.updateMany({ where: { socio_id: otro.id }, data: { socio_id: null, grupo_id: grupo.id } })
    await historial(otro.id, `Crea una cuota conjunta con ${nombreCompleto(socio)}`)
  }
  // Desde ahora cuentan los pagos del grupo; los suyos de antes se conservan pero no se muestran
  await tx.usuario.update({ where: { id }, data: { solicitud_grupal_id: grupo.id, tipo_cuota: TipoCuota.conjunta } })
  await historial(id, `Se une a la cuota conjunta de ${nombreCompleto(otro)}`)
}
