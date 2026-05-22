import { PrismaClient, TipoLogJuego } from '@prisma/client'
import type { CrearJuegoInput, UpdateJuegoInput, FiltrosJuegosInput } from '../schemas/juego.schema'
import type { LogsJuegoService } from './logs_juego.service'

const propietarioSelect = { select: { id: true, nombre: true, apellidos: true } }

export class JuegosService {
  constructor(
    private prisma: PrismaClient,
    private logsService: LogsJuegoService,
  ) {}

  async getAll(filtros: FiltrosJuegosInput) {
    const { page, limit, search, estado } = filtros
    const skip = (page - 1) * limit

    const where = {
      ...(estado ? { estado } : {}),
      ...(search
        ? {
            OR: [
              { nombre: { contains: search, mode: 'insensitive' as const } },
              { localizacion: { contains: search, mode: 'insensitive' as const } },
              { notas: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [juegos, total] = await Promise.all([
      this.prisma.juego.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nombre: 'asc' },
        include: { propietario: propietarioSelect },
      }),
      this.prisma.juego.count({ where }),
    ])

    return { data: juegos, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getById(id: string) {
    const juego = await this.prisma.juego.findUnique({
      where: { id },
      include: { propietario: propietarioSelect },
    })
    if (!juego) throw new Error('Juego no encontrado')
    return juego
  }

  async crear(data: CrearJuegoInput, usuario_id?: string) {
    const juego = await this.prisma.juego.create({
      data,
      include: { propietario: propietarioSelect },
    })

    await this.logsService.crearSistema(
      juego.id,
      TipoLogJuego.donado,
      `${juego.nombre} donado al Dragón`,
      usuario_id,
    )

    return juego
  }

  async update(id: string, data: UpdateJuegoInput) {
    const juego = await this.prisma.juego.findUnique({ where: { id } })
    if (!juego) throw new Error('Juego no encontrado')
    return this.prisma.juego.update({
      where: { id },
      data,
      include: { propietario: propietarioSelect },
    })
  }

  async retirar(id: string, usuario_id: string) {
    const juego = await this.prisma.juego.findUnique({ where: { id } })
    if (!juego) throw new Error('Juego no encontrado')
    if (juego.estado === 'retirado') throw new Error('El juego ya está retirado')
    if (juego.estado === 'prestado') throw new Error('No se puede retirar un juego prestado')

    const [updated] = await this.prisma.$transaction([
      this.prisma.juego.update({
        where: { id },
        data: { estado: 'retirado' },
        include: { propietario: propietarioSelect },
      }),
    ])

    await this.logsService.crearSistema(
      id,
      TipoLogJuego.retirado,
      `${juego.nombre} retirado del Dragón`,
      usuario_id,
    )

    return updated
  }

  async delete(id: string) {
    const juego = await this.prisma.juego.findUnique({ where: { id } })
    if (!juego) throw new Error('Juego no encontrado')

    const prestamosActivos = await this.prisma.prestamo.count({
      where: { juego_id: id, estado: 'activo' },
    })
    if (prestamosActivos > 0) {
      throw new Error('El juego tiene préstamos activos y no puede eliminarse')
    }

    return this.prisma.juego.delete({ where: { id } })
  }

  async exportCsv(): Promise<string> {
    const juegos = await this.prisma.juego.findMany({
      orderBy: { nombre: 'asc' },
      include: { propietario: propietarioSelect },
    })

    const escape = (v: string | null | undefined) => {
      if (v == null) return ''
      const s = String(v)
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`
      }
      return s
    }

    const header = 'id,nombre,localizacion,num_jugadores_min,num_jugadores_max,estado,propietario,notas,created_at'
    const rows = juegos.map((j) => [
      escape(j.id),
      escape(j.nombre),
      escape(j.localizacion),
      escape(j.num_jugadores_min != null ? String(j.num_jugadores_min) : null),
      escape(j.num_jugadores_max != null ? String(j.num_jugadores_max) : null),
      escape(j.estado),
      escape(j.propietario ? `${j.propietario.nombre} ${j.propietario.apellidos}` : null),
      escape(j.notas),
      escape(j.created_at.toISOString()),
    ].join(','))

    return [header, ...rows].join('\n')
  }
}
