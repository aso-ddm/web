import { PrismaClient, EstadoPrestamo } from '@prisma/client'
import type { SolicitarPrestamoInput, FiltrosPrestamosInput, FiltrosGestionPrestamosInput } from '../schemas/prestamo.schema'

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
            select: { id: true, nombre: true },
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
    if (juego.estado !== 'en_estanteria') throw new Error('El juego no está disponible para préstamo')

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
        juego: { select: { id: true, nombre: true } },
      },
    })
  }

  // ── Métodos para ludotecario / directiva ──────────────────────────────────

  async getAll(filtros: FiltrosGestionPrestamosInput) {
    const { page, limit, estado, socio_id } = filtros
    const skip = (page - 1) * limit

    const where = {
      ...(estado ? { estado } : {}),
      ...(socio_id ? { socio_id } : {}),
    }

    const [prestamos, total] = await Promise.all([
      this.prisma.prestamo.findMany({
        where,
        include: {
          juego: { select: { id: true, nombre: true } },
          socio: { select: { id: true, nombre: true, apellidos: true, email: true, apodo: true } },
        },
        orderBy: { fecha_solicitud: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.prestamo.count({ where }),
    ])

    return { data: prestamos, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async aprobar(prestamoId: string, aprobadoPorId: string) {
    const prestamo = await this.prisma.prestamo.findUnique({ where: { id: prestamoId } })
    if (!prestamo) throw new Error('Préstamo no encontrado')
    if (prestamo.estado !== EstadoPrestamo.pendiente) {
      throw new Error('Solo se pueden aprobar préstamos en estado pendiente')
    }
    return this.prisma.prestamo.update({
      where: { id: prestamoId },
      data: {
        estado: EstadoPrestamo.aprobado,
        fecha_aprobacion: new Date(),
        usuario_aprobo_id: aprobadoPorId,
      },
      include: {
        juego: { select: { id: true, titulo: true } },
        socio: { select: { id: true, nombre: true, apellidos: true } },
      },
    })
  }

  async activar(prestamoId: string) {
    const prestamo = await this.prisma.prestamo.findUnique({ where: { id: prestamoId } })
    if (!prestamo) throw new Error('Préstamo no encontrado')
    if (prestamo.estado !== EstadoPrestamo.aprobado) {
      throw new Error('Solo se pueden activar préstamos en estado aprobado')
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.prestamo.update({
        where: { id: prestamoId },
        data: { estado: EstadoPrestamo.activo, fecha_prestamo: new Date() },
      })
      await tx.juego.update({
        where: { id: prestamo.juego_id },
        data: { estado: 'prestado' as const },
      })
      return updated
    })
  }

  async rechazar(prestamoId: string, motivo?: string) {
    const prestamo = await this.prisma.prestamo.findUnique({ where: { id: prestamoId } })
    if (!prestamo) throw new Error('Préstamo no encontrado')
    if (!['pendiente', 'aprobado'].includes(prestamo.estado)) {
      throw new Error('Solo se pueden rechazar préstamos pendientes o aprobados')
    }
    return this.prisma.prestamo.update({
      where: { id: prestamoId },
      data: { estado: EstadoPrestamo.rechazado, motivo_rechazo: motivo ?? null },
    })
  }

  async confirmarDevolucion(prestamoId: string, confirmadoPorId: string) {
    const prestamo = await this.prisma.prestamo.findUnique({ where: { id: prestamoId } })
    if (!prestamo) throw new Error('Préstamo no encontrado')
    if (prestamo.estado !== EstadoPrestamo.activo) {
      throw new Error('Solo se pueden devolver préstamos en estado activo')
    }
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.prestamo.update({
        where: { id: prestamoId },
        data: {
          estado: EstadoPrestamo.devuelto,
          fecha_devolucion: new Date(),
          usuario_confirmo_dev_id: confirmadoPorId,
        },
      })
      await tx.juego.update({
        where: { id: prestamo.juego_id },
        data: { estado: 'en_estanteria' as const },
      })
      return updated
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
