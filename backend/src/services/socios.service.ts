import { Prisma, PrismaClient, Rol, EstadoSocio, EstadoPago, EstadoSolicitud, TipoCambioEstado, TipoCuota, TipoRelacion } from '@prisma/client'
import { UpdateSocioInput, FiltrosSociosInput } from '../schemas/socio.schema'
import { buscarIdsUsuarios } from '../lib/search'
import fs from 'fs'
import path from 'path'

function borrarComprobantes(nombres: (string | null)[]) {
  for (const nombre of new Set(nombres)) {
    if (!nombre) continue
    fs.promises.unlink(path.resolve(process.cwd(), 'uploads/transferencias', nombre))
      .catch((err) => console.error('Borrar comprobante:', err))
  }
}

// Campos públicos que se devuelven en listados (sin datos sensibles)
const SOCIO_PUBLIC_SELECT = {
  id: true,
  email: true,
  nombre: true,
  apellidos: true,
  dni: true,
  telefono: true,
  fecha_nacimiento: true,
  alias_telegram: true,
  telegram_chat_id: true,
  apodo: true,
  tipo_cuota: true,
  roles: true,
  estado: true,
  fecha_alta: true,
  fecha_baja: true,
  tiene_llaves: true,
  comprobante_transferencia: true,
  created_at: true,
  // Cuota conjunta: miembros del grupo (null = cuota individual)
  solicitud_grupal: {
    select: {
      id: true,
      miembros: { select: { id: true, nombre: true, apellidos: true, estado: true }, orderBy: { created_at: 'asc' } },
    },
  },
  aprobado_por: { select: { id: true, nombre: true, apellidos: true } },
  baja_por: { select: { id: true, nombre: true, apellidos: true } },
  historial_estado: {
    select: { id: true, tipo: true, detalle: true, created_at: true, por: { select: { id: true, nombre: true, apellidos: true } } },
    orderBy: { created_at: 'desc' },
  },
} as const

// El rol administrador no se asigna ni se retira desde la app (solo BD/seed).
export function comprobarCambioAdmin(actuales: Rol[], nuevos: Rol[]) {
  if (actuales.includes(Rol.administrador) !== nuevos.includes(Rol.administrador)) {
    throw new Error('El rol de administrador no se puede asignar ni retirar desde la aplicación')
  }
}

const PENDIENTE_EN_SOLICITUDES = 'Este socio está pendiente: apruébalo o recházalo desde Solicitudes'

// Un único rol base por persona; ludotecario es el único que se acumula sobre cualquiera.
// Socio o vocal + ludotecario → gana los permisos de ludoteca. Presidente, secretario o
// tesorero + ludotecario → solo queda marcado (la directiva ya tiene esos permisos).
// Sin rol base → socio_basico. Orden: rol base primero, ludotecario al final.
const ROLES_BASE: Rol[] = [Rol.presidente, Rol.secretario, Rol.tesorero, Rol.vocal, Rol.socio_basico]
export function normalizarRoles(roles: Rol[]): Rol[] {
  const unicos = [...new Set(roles)]
  const base = unicos.filter((r) => ROLES_BASE.includes(r))
  if (base.length > 1) {
    throw new Error('Solo se puede tener un rol, además de ludotecario')
  }
  const esAdmin = unicos.includes(Rol.administrador)
  if (base.length === 0 && !esAdmin) base.push(Rol.socio_basico)
  return [
    ...(esAdmin ? [Rol.administrador] : []),
    ...base,
    ...(unicos.includes(Rol.ludotecario) ? [Rol.ludotecario] : []),
  ]
}

function mesPagadoAlAlta(fecha: Date) {
  return { anio: fecha.getFullYear(), mes: fecha.getMonth() + 1, estado: EstadoPago.pagado }
}

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
  await tx.relacionSocio.updateMany({
    where: { activa: true, OR: [{ socio_principal_id: socioId }, { socio_relacionado_id: socioId }] },
    data: { activa: false, fecha_fin: new Date() },
  })
}

/**
 * Saca a un socio de su cuota conjunta: se lleva una copia de los pagos del grupo.
 * Si queda un solo miembro, el grupo se disuelve y ese miembro también se lleva la copia.
 */
export async function salirDeCuotaConjunta(tx: Tx, socioId: string, porId: string, motivo: string) {
  const socio = await tx.usuario.findUnique({
    where: { id: socioId },
    select: {
      nombre: true,
      apellidos: true,
      solicitud_grupal: { include: { miembros: { select: { id: true } } } },
    },
  })
  const grupo = socio?.solicitud_grupal
  if (!socio || !grupo) throw new Error('El socio no pertenece a una cuota conjunta')
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

export class SociosService {
  constructor(private prisma: PrismaClient) {}

  async getAll(filtros: FiltrosSociosInput) {
    const { estado, search, page, limit } = filtros
    const skip = (page - 1) * limit

    if (search) {
      const { ids, total } = await buscarIdsUsuarios(this.prisma, { search, estado, limit, skip })

      const socios = ids.length > 0
        ? await this.prisma.usuario.findMany({
            where: { id: { in: ids } },
            select: SOCIO_PUBLIC_SELECT,
            orderBy: { created_at: 'desc' },
          })
        : []

      return {
        data: socios,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      }
    }

    const where = { ...(estado && { estado }) }

    const [socios, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        select: SOCIO_PUBLIC_SELECT,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.usuario.count({ where }),
    ])

    return {
      data: socios,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  }

  /** Socios activos para selectores (solo id y nombre). */
  async getOpciones() {
    return this.prisma.usuario.findMany({
      where: { estado: EstadoSocio.activo },
      select: { id: true, nombre: true, apellidos: true, apodo: true },
      orderBy: [{ nombre: 'asc' }, { apellidos: 'asc' }],
    })
  }

  async getPendientes() {
    const [individuales, grupos] = await Promise.all([
      this.prisma.usuario.findMany({
        where: { estado: EstadoSocio.pendiente, solicitud_grupal_id: null },
        select: SOCIO_PUBLIC_SELECT,
        orderBy: { created_at: 'asc' },
      }),
      this.prisma.solicitudGrupal.findMany({
        where: { estado: 'pendiente' },
        orderBy: { created_at: 'asc' },
        include: {
          miembros: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              dni: true,
              email: true,
              apodo: true,
              alias_telegram: true,
              relaciones_como_relacionado: { select: { tipo_relacion: true }, take: 1 },
            },
            orderBy: { created_at: 'asc' },
          },
        },
      }),
    ])

    // tipo_relacion: parentesco declarado en el formulario (null en quien lo rellenó)
    const gruposConTipoRelacion = grupos.map((grupo) => ({
      ...grupo,
      miembros: grupo.miembros.map(({ relaciones_como_relacionado: relaciones, ...miembro }) => ({
        ...miembro,
        tipo_relacion: relaciones[0]?.tipo_relacion ?? null,
      })),
    }))

    return { individuales, grupos: gruposConTipoRelacion }
  }

  async aprobarGrupo(grupoId: string, aprobadoPorId: string) {
    const grupo = await this.prisma.solicitudGrupal.findUnique({
      where: { id: grupoId },
      include: { miembros: true },
    })
    if (!grupo) throw new Error('Solicitud grupal no encontrada')
    if (grupo.estado !== 'pendiente') {
      throw new Error('La solicitud grupal no está en estado pendiente')
    }
    for (const u of grupo.miembros) {
      if (u.estado !== EstadoSocio.pendiente) {
        throw new Error(`El usuario ${u.nombre} no está en estado pendiente`)
      }
    }

    const ahora = new Date()
    await this.prisma.$transaction([
      this.prisma.usuario.updateMany({
        where: { solicitud_grupal_id: grupoId },
        data: {
          estado: EstadoSocio.activo,
          fecha_alta: ahora,
          aprobado_por_id: aprobadoPorId,
          roles: [Rol.socio_basico],
        },
      }),
      this.prisma.solicitudGrupal.update({
        where: { id: grupoId },
        data: { estado: 'aprobada' },
      }),
      this.prisma.historialEstadoSocio.createMany({
        data: grupo.miembros.map((u) => ({ socio_id: u.id, tipo: TipoCambioEstado.alta, por_id: aprobadoPorId, created_at: ahora })),
      }),
      // El comprobante de alta cubre el mes de alta
      this.prisma.pagoCuota.create({ data: { grupo_id: grupoId, ...mesPagadoAlAlta(ahora) } }),
    ])

    return this.prisma.solicitudGrupal.findUnique({
      where: { id: grupoId },
      include: { miembros: { select: SOCIO_PUBLIC_SELECT } },
    })
  }

  // Un rechazado nunca fue socio: se borra para que pueda volver a solicitar el alta con el mismo email/DNI
  async rechazarGrupo(grupoId: string) {
    const grupo = await this.prisma.solicitudGrupal.findUnique({
      where: { id: grupoId },
      include: { miembros: true },
    })
    if (!grupo) throw new Error('Solicitud grupal no encontrada')
    if (grupo.estado !== 'pendiente') {
      throw new Error('La solicitud grupal no está en estado pendiente')
    }
    for (const u of grupo.miembros) {
      if (u.estado !== EstadoSocio.pendiente) {
        throw new Error(`El usuario ${u.nombre} no está en estado pendiente`)
      }
    }

    await this.prisma.$transaction([
      this.prisma.usuario.deleteMany({ where: { solicitud_grupal_id: grupoId } }),
      this.prisma.solicitudGrupal.delete({ where: { id: grupoId } }),
    ])
    borrarComprobantes([grupo.comprobante_transferencia])
  }

  async getById(id: string) {
    const socio = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        ...SOCIO_PUBLIC_SELECT,
        direccion: true,
        consentimiento_tiendas: true,
        relaciones_como_principal: {
          where: { activa: true },
          include: {
            socio_relacionado: { select: { id: true, nombre: true, apellidos: true, roles: true } },
          },
        },
        relaciones_como_relacionado: {
          where: { activa: true },
          include: {
            socio_principal: { select: { id: true, nombre: true, apellidos: true, roles: true } },
          },
        },
      },
    })

    if (!socio) throw new Error('Socio no encontrado')
    return socio
  }

  async update(id: string, data: UpdateSocioInput) {
    const exists = await this.prisma.usuario.findUnique({ where: { id } })
    if (!exists) throw new Error('Socio no encontrado')

    return this.prisma.usuario.update({
      where: { id },
      data: {
        ...data,
        fecha_nacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : undefined,
      },
      select: SOCIO_PUBLIC_SELECT,
    })
  }

  async aprobar(id: string, aprobadoPorId: string, rol: Rol) {
    const socio = await this.prisma.usuario.findUnique({ where: { id } })
    if (!socio) throw new Error('Socio no encontrado')
    if (socio.estado !== EstadoSocio.pendiente) {
      throw new Error('Solo se pueden aprobar solicitudes en estado pendiente')
    }
    // Los miembros de una solicitud conjunta se aprueban o rechazan juntos
    if (socio.solicitud_grupal_id) {
      throw new Error('Este socio pertenece a una solicitud conjunta: gestiónala desde el grupo')
    }
    comprobarCambioAdmin(socio.roles, [rol])

    const ahora = new Date()
    return this.prisma.usuario.update({
      where: { id },
      data: {
        estado: EstadoSocio.activo,
        fecha_alta: ahora,
        aprobado_por_id: aprobadoPorId,
        roles: normalizarRoles([rol]),
        // El comprobante de alta cubre el mes de alta
        pagos_cuota: { create: mesPagadoAlAlta(ahora) },
        historial_estado: { create: { tipo: TipoCambioEstado.alta, por_id: aprobadoPorId, created_at: ahora } },
      },
      select: SOCIO_PUBLIC_SELECT,
    })
  }

  // Un rechazado nunca fue socio: se borra para que pueda volver a solicitar el alta con el mismo email/DNI
  async rechazar(id: string) {
    const socio = await this.prisma.usuario.findUnique({ where: { id } })
    if (!socio) throw new Error('Socio no encontrado')
    if (socio.estado !== EstadoSocio.pendiente) {
      throw new Error('Solo se pueden rechazar solicitudes en estado pendiente')
    }
    // Los miembros de una solicitud conjunta se aprueban o rechazan juntos
    if (socio.solicitud_grupal_id) {
      throw new Error('Este socio pertenece a una solicitud conjunta: gestiónala desde el grupo')
    }

    await this.prisma.usuario.delete({ where: { id } })
    borrarComprobantes([socio.comprobante_transferencia])
  }

  async darDeBaja(id: string, bajaPorId: string) {
    if (id === bajaPorId) throw new Error('No puedes darte de baja a ti mismo')
    const socio = await this.prisma.usuario.findUnique({ where: { id } })
    if (!socio) throw new Error('Socio no encontrado')
    if (socio.roles.includes(Rol.administrador)) {
      throw new Error('Una cuenta de administrador no se puede dar de baja desde la aplicación')
    }
    if (socio.estado === EstadoSocio.baja) {
      throw new Error('El socio ya está dado de baja')
    }
    if (socio.estado === EstadoSocio.pendiente) throw new Error(PENDIENTE_EN_SOLICITUDES)

    return this.prisma.$transaction(async (tx) => {
      if (socio.solicitud_grupal_id) {
        await salirDeCuotaConjunta(tx, id, bajaPorId, 'Sale de la cuota conjunta por la baja')
      }
      return tx.usuario.update({
        where: { id },
        data: {
          estado: EstadoSocio.baja,
          fecha_baja: new Date(),
          baja_por_id: bajaPorId,
          tiene_llaves: false,
          historial_estado: {
            create: [
              { tipo: TipoCambioEstado.baja, por_id: bajaPorId },
              ...(socio.tiene_llaves ? [{ tipo: TipoCambioEstado.llaves_devueltas, detalle: 'Por la baja', por_id: bajaPorId }] : []),
            ],
          },
        },
        select: SOCIO_PUBLIC_SELECT,
      })
    })
  }

  async salirCuotaConjunta(id: string, porId: string) {
    return this.prisma.$transaction(async (tx) => {
      await salirDeCuotaConjunta(tx, id, porId, 'Sale de la cuota conjunta')
      return tx.usuario.findUnique({ where: { id }, select: SOCIO_PUBLIC_SELECT })
    })
  }

  /** Une al socio a la cuota conjunta de otro; si el otro es individual, se crea una con los dos. */
  async unirCuotaConjunta(id: string, otroId: string, tipoRelacion: TipoRelacion, porId: string) {
    if (id === otroId) throw new Error('Elige a otro socio')
    return this.prisma.$transaction(async (tx) => {
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
      if (!socio || !otro) throw new Error('Socio no encontrado')
      if (socio.estado !== EstadoSocio.activo || otro.estado !== EstadoSocio.activo) {
        throw new Error('Solo los socios activos pueden compartir cuota')
      }
      if (socio.solicitud_grupal) throw new Error('El socio ya pertenece a una cuota conjunta')
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
      await tx.relacionSocio.create({
        data: { socio_principal_id: otro.id, socio_relacionado_id: id, tipo_relacion: tipoRelacion },
      })
      await historial(id, `Se une a la cuota conjunta de ${nombreCompleto(otro)}`)
      return tx.usuario.findUnique({ where: { id }, select: SOCIO_PUBLIC_SELECT })
    })
  }

  async reactivar(id: string, reactivadoPorId: string) {
    const socio = await this.prisma.usuario.findUnique({ where: { id } })
    if (!socio) throw new Error('Socio no encontrado')
    if (socio.estado !== EstadoSocio.baja) {
      throw new Error('Solo se pueden reactivar socios dados de baja')
    }
    // Un rechazado nunca fue socio: reactivarlo se saltaría la aprobación
    if (!socio.fecha_alta) {
      throw new Error('Solo se pueden reactivar socios que llegaron a darse de alta')
    }

    return this.prisma.usuario.update({
      where: { id },
      data: {
        estado: EstadoSocio.activo,
        fecha_baja: null,
        baja_por_id: null,
        historial_estado: { create: { tipo: TipoCambioEstado.alta, por_id: reactivadoPorId } },
      },
      select: SOCIO_PUBLIC_SELECT,
    })
  }

  async updateRoles(id: string, roles: Rol[], actorId: string) {
    if (id === actorId) throw new Error('No puedes cambiar tus propios roles')
    const socio = await this.prisma.usuario.findUnique({ where: { id } })
    if (!socio) throw new Error('Socio no encontrado')
    if (socio.estado === EstadoSocio.pendiente) throw new Error(PENDIENTE_EN_SOLICITUDES)
    roles = normalizarRoles(roles)
    comprobarCambioAdmin(socio.roles, roles)

    return this.prisma.usuario.update({
      where: { id },
      data: { roles },
      select: SOCIO_PUBLIC_SELECT,
    })
  }

  // Llaves: solo se registra si el socio las tiene o no.
  async setLlaves(socioId: string, tieneLlaves: boolean, porId: string) {
    const socio = await this.prisma.usuario.findUnique({ where: { id: socioId } })
    if (!socio) throw new Error('Socio no encontrado')
    if (tieneLlaves && socio.estado !== EstadoSocio.activo) {
      throw new Error('Solo se pueden asignar llaves a socios activos')
    }

    return this.prisma.usuario.update({
      where: { id: socioId },
      data: {
        tiene_llaves: tieneLlaves,
        ...(socio.tiene_llaves !== tieneLlaves && {
          historial_estado: {
            create: { tipo: tieneLlaves ? TipoCambioEstado.llaves_entregadas : TipoCambioEstado.llaves_devueltas, por_id: porId },
          },
        }),
      },
      select: SOCIO_PUBLIC_SELECT,
    })
  }
}
