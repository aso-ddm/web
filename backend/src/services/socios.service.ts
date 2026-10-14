import { Prisma, PrismaClient, Rol, EstadoSocio, EstadoPago, EstadoSolicitud, TipoCambioEstado } from '@prisma/client'
import { UpdateSocioInput, FiltrosSociosInput } from '../schemas/socio.schema'
import { buscarIdsUsuarios } from '../lib/search'
import { telegram } from '../lib/telegram'
import { eventos } from '../lib/eventos'
import { anioMesMadrid } from '../lib/fechas'
import fs from 'fs'
import path from 'path'
import { HttpError } from '../lib/httpError'
import { paginado } from '../lib/paginacion'
import { comprobarCambioAdmin, normalizarRoles } from '../lib/roles'
import { salirDeCuotaConjunta, unirACuotaConjunta } from './cuotaConjunta'

function borrarComprobantes(nombres: (string | null)[]) {
  for (const nombre of new Set(nombres)) {
    if (!nombre) continue
    fs.promises.unlink(path.resolve(process.cwd(), 'uploads/transferencias', nombre))
      .catch((err) => console.error('Borrar comprobante:', err))
  }
}

// Listados y respuestas de mutaciones: sin historial ni trazabilidad (solo se ven en la ficha)
const SOCIO_LIST_SELECT = {
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
  solicitud_grupal: { select: { id: true } }, // null = cuota individual
} as const

// Ficha del socio (GET /socios/:id)
const SOCIO_DETAIL_SELECT = {
  ...SOCIO_LIST_SELECT,
  direccion: true,
  consentimiento_tiendas: true,
  // Cuota conjunta: miembros del grupo
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


const PENDIENTE_EN_SOLICITUDES = 'Este socio está pendiente: apruébalo o recházalo desde Solicitudes'


function mesPagadoAlAlta(fecha: Date) {
  return { ...anioMesMadrid(fecha), estado: EstadoPago.pagado }
}


// La escritura lleva la condición (estado pendiente) en el where: si otra petición se adelantó, Prisma da P2025
const yaNoPendiente = (mensaje: string) => (err: unknown): never => {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') throw new HttpError(409, mensaje)
  throw err
}


export class SociosService {
  constructor(private prisma: PrismaClient) {}

  async getAll(filtros: FiltrosSociosInput) {
    const { estado, search, tiene_llaves, con_telegram, page, limit } = filtros
    const skip = (page - 1) * limit

    if (search) {
      const { ids, total } = await buscarIdsUsuarios(this.prisma, {
        search, estado, tieneLlaves: tiene_llaves, conTelegram: con_telegram, limit, skip,
      })

      const socios = ids.length > 0
        ? await this.prisma.usuario.findMany({
            where: { id: { in: ids } },
            select: SOCIO_LIST_SELECT,
            orderBy: { created_at: 'desc' },
          })
        : []

      return paginado(socios, total, filtros)
    }

    const where: Prisma.UsuarioWhereInput = {
      ...(estado && { estado }),
      ...(tiene_llaves !== undefined && { tiene_llaves }),
      ...(con_telegram !== undefined && { telegram_chat_id: con_telegram ? { not: null } : null }),
    }

    const [socios, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        select: SOCIO_LIST_SELECT,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.usuario.count({ where }),
    ])

    return paginado(socios, total, filtros)
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
        select: SOCIO_LIST_SELECT,
        orderBy: { created_at: 'asc' },
      }),
      this.prisma.solicitudGrupal.findMany({
        where: { estado: EstadoSolicitud.pendiente },
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
            },
            orderBy: { created_at: 'asc' },
          },
        },
      }),
    ])

    return { individuales, grupos }
  }

  async aprobarGrupo(grupoId: string, aprobadoPorId: string) {
    const grupo = await this.prisma.solicitudGrupal.findUnique({
      where: { id: grupoId },
      include: { miembros: true },
    })
    if (!grupo) throw new HttpError(404, 'Solicitud grupal no encontrada')
    if (grupo.estado !== EstadoSolicitud.pendiente) {
      throw new HttpError(409, 'La solicitud grupal no está en estado pendiente')
    }
    for (const u of grupo.miembros) {
      if (u.estado !== EstadoSocio.pendiente) {
        throw new HttpError(409, `El usuario ${u.nombre} no está en estado pendiente`)
      }
    }

    const ahora = new Date()
    await this.prisma.$transaction([
      this.prisma.solicitudGrupal.update({
        where: { id: grupoId, estado: EstadoSolicitud.pendiente },
        data: { estado: EstadoSolicitud.aprobada },
      }),
      this.prisma.usuario.updateMany({
        where: { solicitud_grupal_id: grupoId },
        data: {
          estado: EstadoSocio.activo,
          fecha_alta: ahora,
          aprobado_por_id: aprobadoPorId,
          roles: [Rol.socio_basico],
        },
      }),
      this.prisma.historialEstadoSocio.createMany({
        data: grupo.miembros.map((u) => ({ socio_id: u.id, tipo: TipoCambioEstado.alta, por_id: aprobadoPorId, created_at: ahora })),
      }),
      // El comprobante de alta cubre el mes de alta
      this.prisma.pagoCuota.create({ data: { grupo_id: grupoId, ...mesPagadoAlAlta(ahora) } }),
    ]).catch(yaNoPendiente('La solicitud grupal ya no está pendiente'))

    eventos.emit('cambio', 'pendientes')
    return this.prisma.solicitudGrupal.findUnique({
      where: { id: grupoId },
      include: { miembros: { select: SOCIO_LIST_SELECT } },
    })
  }

  // Un rechazado nunca fue socio: se borra para que pueda volver a solicitar el alta con el mismo email/DNI
  async rechazarGrupo(grupoId: string) {
    const grupo = await this.prisma.solicitudGrupal.findUnique({
      where: { id: grupoId },
      include: { miembros: true },
    })
    if (!grupo) throw new HttpError(404, 'Solicitud grupal no encontrada')
    if (grupo.estado !== EstadoSolicitud.pendiente) {
      throw new HttpError(409, 'La solicitud grupal no está en estado pendiente')
    }
    for (const u of grupo.miembros) {
      if (u.estado !== EstadoSocio.pendiente) {
        throw new HttpError(409, `El usuario ${u.nombre} no está en estado pendiente`)
      }
    }

    await this.prisma.$transaction([
      // Condición primero: si otra petición la aprobó entretanto, no se borra a nadie
      this.prisma.solicitudGrupal.update({ where: { id: grupoId, estado: EstadoSolicitud.pendiente }, data: { estado: EstadoSolicitud.rechazada } }),
      this.prisma.usuario.deleteMany({ where: { solicitud_grupal_id: grupoId } }),
      this.prisma.solicitudGrupal.delete({ where: { id: grupoId } }),
    ]).catch(yaNoPendiente('La solicitud grupal ya no está pendiente'))
    borrarComprobantes([grupo.comprobante_transferencia])
    eventos.emit('cambio', 'pendientes')
  }

  async getById(id: string) {
    const socio = await this.prisma.usuario.findUnique({ where: { id }, select: SOCIO_DETAIL_SELECT })
    if (!socio) throw new HttpError(404, 'Socio no encontrado')
    return socio
  }

  async update(id: string, data: UpdateSocioInput) {
    const exists = await this.prisma.usuario.findUnique({ where: { id } })
    if (!exists) throw new HttpError(404, 'Socio no encontrado')

    return this.prisma.usuario.update({
      where: { id },
      data: {
        ...data,
        fecha_nacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : undefined,
      },
      select: SOCIO_LIST_SELECT,
    })
  }

  async aprobar(id: string, aprobadoPorId: string, rol: Rol) {
    const socio = await this.prisma.usuario.findUnique({ where: { id } })
    if (!socio) throw new HttpError(404, 'Socio no encontrado')
    if (socio.estado !== EstadoSocio.pendiente) {
      throw new HttpError(409, 'Solo se pueden aprobar solicitudes en estado pendiente')
    }
    // Los miembros de una solicitud conjunta se aprueban o rechazan juntos
    if (socio.solicitud_grupal_id) {
      throw new HttpError(409, 'Este socio pertenece a una solicitud conjunta: gestiónala desde el grupo')
    }
    comprobarCambioAdmin(socio.roles, [rol])

    const ahora = new Date()
    const aprobado = await this.prisma.usuario.update({
      where: { id, estado: EstadoSocio.pendiente },
      data: {
        estado: EstadoSocio.activo,
        fecha_alta: ahora,
        aprobado_por_id: aprobadoPorId,
        roles: normalizarRoles([rol]),
        // El comprobante de alta cubre el mes de alta
        pagos_cuota: { create: mesPagadoAlAlta(ahora) },
        historial_estado: { create: { tipo: TipoCambioEstado.alta, por_id: aprobadoPorId, created_at: ahora } },
      },
      select: SOCIO_LIST_SELECT,
    }).catch(yaNoPendiente('La solicitud ya no está pendiente'))
    eventos.emit('cambio', 'pendientes')
    return aprobado
  }

  // Un rechazado nunca fue socio: se borra para que pueda volver a solicitar el alta con el mismo email/DNI
  async rechazar(id: string) {
    const socio = await this.prisma.usuario.findUnique({ where: { id } })
    if (!socio) throw new HttpError(404, 'Socio no encontrado')
    if (socio.estado !== EstadoSocio.pendiente) {
      throw new HttpError(409, 'Solo se pueden rechazar solicitudes en estado pendiente')
    }
    // Los miembros de una solicitud conjunta se aprueban o rechazan juntos
    if (socio.solicitud_grupal_id) {
      throw new HttpError(409, 'Este socio pertenece a una solicitud conjunta: gestiónala desde el grupo')
    }

    await this.prisma.usuario.delete({ where: { id, estado: EstadoSocio.pendiente } })
      .catch(yaNoPendiente('La solicitud ya no está pendiente'))
    borrarComprobantes([socio.comprobante_transferencia])
    eventos.emit('cambio', 'pendientes')
  }

  async darDeBaja(id: string, bajaPorId: string) {
    if (id === bajaPorId) throw new HttpError(403, 'No puedes darte de baja a ti mismo')
    const socio = await this.prisma.usuario.findUnique({ where: { id } })
    if (!socio) throw new HttpError(404, 'Socio no encontrado')
    if (socio.roles.includes(Rol.administrador)) {
      throw new HttpError(403, 'Una cuenta de administrador no se puede dar de baja desde la aplicación')
    }
    if (socio.estado === EstadoSocio.baja) {
      throw new HttpError(409, 'El socio ya está dado de baja')
    }
    if (socio.estado === EstadoSocio.pendiente) throw new HttpError(409, PENDIENTE_EN_SOLICITUDES)

    const actualizado = await this.prisma.$transaction(async (tx) => {
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
        select: SOCIO_LIST_SELECT,
      })
    })

    if (socio.telegram_chat_id) this.avisarBaja(socio.telegram_chat_id, socio.nombre)
    return actualizado
  }

  // Fire and forget: un fallo del bot no debe deshacer ni bloquear la baja
  private avisarBaja(chatId: bigint, nombre: string) {
    if (!process.env.BOT_TOKEN) return
    this.prisma.configuracion.findUnique({ where: { clave: 'texto_baja_confirmada' } })
      .then((config) => {
        if (!config?.valor.trim()) return
        // Texto plano (sin parse_mode): lo escribe la directiva y no hay que escapar nada
        return telegram(this.prisma, 'sendMessage', { chat_id: chatId.toString(), text: config.valor.split('{nombre}').join(nombre) }, 'aviso_baja')
      })
      .catch((err) => console.error('Aviso de baja por Telegram:', err))
  }

  async salirCuotaConjunta(id: string, porId: string) {
    return this.prisma.$transaction(async (tx) => {
      await salirDeCuotaConjunta(tx, id, porId, 'Sale de la cuota conjunta')
      return tx.usuario.findUnique({ where: { id }, select: SOCIO_LIST_SELECT })
    })
  }

  /** Une al socio a la cuota conjunta de otro; si el otro es individual, se crea una con los dos. */
  async unirCuotaConjunta(id: string, otroId: string, porId: string) {
    if (id === otroId) throw new HttpError(400, 'Elige a otro socio')
    return this.prisma.$transaction(async (tx) => {
      await unirACuotaConjunta(tx, id, otroId, porId)
      return tx.usuario.findUnique({ where: { id }, select: SOCIO_LIST_SELECT })
    })
  }

  async reactivar(id: string, reactivadoPorId: string) {
    const socio = await this.prisma.usuario.findUnique({ where: { id } })
    if (!socio) throw new HttpError(404, 'Socio no encontrado')
    if (socio.estado !== EstadoSocio.baja) {
      throw new HttpError(409, 'Solo se pueden reactivar socios dados de baja')
    }
    // Un rechazado nunca fue socio: reactivarlo se saltaría la aprobación
    if (!socio.fecha_alta) {
      throw new HttpError(409, 'Solo se pueden reactivar socios que llegaron a darse de alta')
    }

    return this.prisma.usuario.update({
      where: { id },
      data: {
        estado: EstadoSocio.activo,
        fecha_baja: null,
        baja_por_id: null,
        historial_estado: { create: { tipo: TipoCambioEstado.alta, por_id: reactivadoPorId } },
      },
      select: SOCIO_LIST_SELECT,
    })
  }

  /** Cambio de estado genérico (panel de admin) por el mismo ciclo de vida que Socios y Solicitudes. */
  async cambiarEstado(id: string, estado: EstadoSocio, porId: string) {
    const socio = await this.prisma.usuario.findUnique({ where: { id }, select: { estado: true } })
    if (!socio) throw new HttpError(404, 'Socio no encontrado')
    if (socio.estado === estado) return
    if (socio.estado === EstadoSocio.pendiente) {
      // Aprobar desde aquí equivale a Solicitudes con rol socio_basico; rechazar borra la solicitud: solo desde Solicitudes
      if (estado !== EstadoSocio.activo) throw new HttpError(409, PENDIENTE_EN_SOLICITUDES)
      await this.aprobar(id, porId, Rol.socio_basico)
    } else if (estado === EstadoSocio.baja) {
      await this.darDeBaja(id, porId)
    } else if (estado === EstadoSocio.activo) {
      await this.reactivar(id, porId)
    } else {
      throw new HttpError(409, 'Un socio dado de alta no puede volver a pendiente')
    }
  }

  async updateRoles(id: string, roles: Rol[], actorId: string) {
    if (id === actorId) throw new HttpError(403, 'No puedes cambiar tus propios roles')
    const socio = await this.prisma.usuario.findUnique({ where: { id } })
    if (!socio) throw new HttpError(404, 'Socio no encontrado')
    if (socio.estado === EstadoSocio.pendiente) throw new HttpError(409, PENDIENTE_EN_SOLICITUDES)
    roles = normalizarRoles(roles)
    comprobarCambioAdmin(socio.roles, roles)

    return this.prisma.usuario.update({
      where: { id },
      data: { roles },
      select: SOCIO_LIST_SELECT,
    })
  }

  // Llaves: solo se registra si el socio las tiene o no.
  async setLlaves(socioId: string, tieneLlaves: boolean, porId: string) {
    const socio = await this.prisma.usuario.findUnique({ where: { id: socioId } })
    if (!socio) throw new HttpError(404, 'Socio no encontrado')
    if (tieneLlaves && socio.estado !== EstadoSocio.activo) {
      throw new HttpError(409, 'Solo se pueden asignar llaves a socios activos')
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
      select: SOCIO_LIST_SELECT,
    })
  }
}
