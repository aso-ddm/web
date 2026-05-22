import { PrismaClient, TipoLogJuego } from '@prisma/client'
import type {
  CrearSolicitudJuegoInput,
  RechazarSolicitudJuegoInput,
  FiltrosSolicitudesJuegoInput,
} from '../schemas/solicitud_juego.schema'

const socioSelect = {
  select: { id: true, nombre: true, apellidos: true, email: true, apodo: true },
}

export class SolicitudesJuegoService {
  constructor(private prisma: PrismaClient) {}

  async getAll(filtros: FiltrosSolicitudesJuegoInput) {
    const { estado, page, limit } = filtros
    const skip = (page - 1) * limit
    const where = estado ? { estado } : {}

    const [solicitudes, total] = await Promise.all([
      this.prisma.solicitudJuego.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { socio: socioSelect },
      }),
      this.prisma.solicitudJuego.count({ where }),
    ])

    return { data: solicitudes, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getMias(socio_id: string, filtros: FiltrosSolicitudesJuegoInput) {
    const { estado, page, limit } = filtros
    const skip = (page - 1) * limit
    const where = { socio_id, ...(estado ? { estado } : {}) }

    const [solicitudes, total] = await Promise.all([
      this.prisma.solicitudJuego.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.solicitudJuego.count({ where }),
    ])

    return { data: solicitudes, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async crear(socio_id: string, input: CrearSolicitudJuegoInput) {
    return this.prisma.solicitudJuego.create({
      data: { socio_id, ...input },
    })
  }

  async aprobar(id: string, staff_id: string) {
    const solicitud = await this.prisma.solicitudJuego.findUnique({ where: { id } })
    if (!solicitud) throw new Error('Solicitud no encontrada')
    if (solicitud.estado !== 'pendiente') throw new Error('La solicitud ya fue procesada')

    return this.prisma.$transaction(async (tx) => {
      const juego = await tx.juego.create({
        data: {
          nombre: solicitud.nombre,
          notas: solicitud.notas ?? null,
          propietario_id: solicitud.socio_id,
        },
      })

      await tx.logJuego.create({
        data: {
          juego_id: juego.id,
          tipo: TipoLogJuego.donado,
          texto: `${juego.nombre} donado al Dragón`,
          usuario_id: staff_id,
        },
      })

      const updated = await tx.solicitudJuego.update({
        where: { id },
        data: { estado: 'aprobada', juego_id: juego.id },
        include: { socio: socioSelect },
      })

      // TODO: notificar al socio por Telegram cuando esté implementado
      return updated
    })
  }

  async rechazar(id: string, input: RechazarSolicitudJuegoInput) {
    const solicitud = await this.prisma.solicitudJuego.findUnique({ where: { id } })
    if (!solicitud) throw new Error('Solicitud no encontrada')
    if (solicitud.estado !== 'pendiente') throw new Error('La solicitud ya fue procesada')

    return this.prisma.solicitudJuego.update({
      where: { id },
      data: {
        estado: 'rechazada',
        motivo_rechazo: input.motivo_rechazo ?? null,
      },
      include: { socio: socioSelect },
    })
  }
}
