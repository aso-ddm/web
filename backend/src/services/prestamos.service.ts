import { PrismaClient, EstadoPrestamo } from '@prisma/client'
import type { SolicitarPrestamoInput, FiltrosPrestamosInput } from '../schemas/prestamo.schema.js'

export class PrestamosService {
  constructor(private prisma: PrismaClient) {}

  async misPrestamos(socioId: string, filtros: FiltrosPrestamosInput) {
    const { page, limit } = filtros
    const skip = (page - 1) * limit

    const [prestamos, total] = await Promise.all([
      this.prisma.prestamo.findMany({
        where: { socio_id: socioId },
        include: {
          juego: {
            select: { id: true, titulo: true, foto_url: true, categoria: true },
          },
        },
        orderBy: { fecha_solicitud: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.prestamo.count({ where: { socio_id: socioId } }),
    ])

    return { data: prestamos, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async solicitar(socioId: string, input: SolicitarPrestamoInput) {
    const juego = await this.prisma.juego.findUnique({ where: { id: input.juego_id } })
    if (!juego) throw new Error('Juego no encontrado')
    if (juego.estado !== 'disponible') throw new Error('El juego no está disponible para préstamo')

    const prestamoExistente = await this.prisma.prestamo.findFirst({
      where: {
        socio_id: socioId,
        juego_id: input.juego_id,
        estado: { in: ['pendiente', 'aprobado', 'activo'] },
      },
    })
    if (prestamoExistente) {
      throw new Error('Ya tienes un préstamo activo o pendiente para este juego')
    }

    return this.prisma.prestamo.create({
      data: {
        juego_id: input.juego_id,
        socio_id: socioId,
        notas: input.notas,
        estado: EstadoPrestamo.pendiente,
      },
      include: {
        juego: { select: { id: true, titulo: true } },
      },
    })
  }

  async cancelar(prestamoId: string, socioId: string) {
    const prestamo = await this.prisma.prestamo.findUnique({ where: { id: prestamoId } })
    if (!prestamo) throw new Error('Préstamo no encontrado')
    if (prestamo.socio_id !== socioId) {
      throw new Error('No tienes permiso para cancelar este préstamo')
    }
    if (prestamo.estado !== EstadoPrestamo.pendiente) {
      throw new Error('Solo se pueden cancelar préstamos en estado pendiente')
    }

    return this.prisma.prestamo.update({
      where: { id: prestamoId },
      data: { estado: EstadoPrestamo.rechazado },
    })
  }
}
