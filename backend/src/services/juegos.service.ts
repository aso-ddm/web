import { PrismaClient } from '@prisma/client'
import type { CrearJuegoInput, UpdateJuegoInput, FiltrosJuegosInput } from '../schemas/juego.schema'

const propietarioSelect = { select: { id: true, nombre: true, apellidos: true } }

export class JuegosService {
  constructor(private prisma: PrismaClient) {}

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

  async crear(data: CrearJuegoInput) {
    return this.prisma.juego.create({
      data,
      include: { propietario: propietarioSelect },
    })
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

  async delete(id: string) {
    const juego = await this.prisma.juego.findUnique({ where: { id } })
    if (!juego) throw new Error('Juego no encontrado')

    const prestamosActivos = await this.prisma.prestamo.count({
      where: {
        juego_id: id,
        estado: { in: ['pendiente', 'aprobado', 'activo'] },
      },
    })
    if (prestamosActivos > 0) {
      throw new Error('El juego tiene préstamos activos y no puede eliminarse')
    }

    return this.prisma.juego.delete({ where: { id } })
  }
}
