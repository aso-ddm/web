import { PrismaClient, EstadoPrestamo, TipoLogJuego } from '@prisma/client'
import type { SolicitarPrestamoInput, FiltrosPrestamosInput, FiltrosGestionPrestamosInput } from '../schemas/prestamo.schema'
import type { LogsJuegoService } from './logs_juego.service'

export class PrestamosService {
  constructor(
    private prisma: PrismaClient,
    private logsService: LogsJuegoService,
  ) {}

  // ── Helpers de configuración ──────────────────────────────────────────────

  private async getConfigNum(clave: string, fallback: number): Promise<number> {
    const config = await this.prisma.configuracion.findUnique({ where: { clave } })
    return config ? parseInt(config.valor, 10) : fallback
  }

  private addDays(date: Date, days: number): Date {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
  }

  // ── Socio ─────────────────────────────────────────────────────────────────

  async misPrestamos(socioId: string, filtros: FiltrosPrestamosInput) {
    const { page, limit } = filtros
    const skip = (page - 1) * limit

    const [prestamos, total] = await Promise.all([
      this.prisma.prestamo.findMany({
        where: { socio_id: socioId },
        include: {
          juego: { select: { id: true, nombre: true } },
        },
        orderBy: { fecha_prestamo: 'desc' },
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
      where: { socio_id: socioId, juego_id: input.juego_id, estado: EstadoPrestamo.activo },
    })
    if (prestamoExistente) throw new Error('Ya tienes un préstamo activo para este juego')

    const [prestamosActivos, maxPrestamos] = await Promise.all([
      this.prisma.prestamo.count({ where: { socio_id: socioId, estado: EstadoPrestamo.activo } }),
      this.getConfigNum('max_prestamos_activos', 3),
    ])
    if (prestamosActivos >= maxPrestamos) {
      throw new Error(`Has alcanzado el límite de ${maxPrestamos} préstamos simultáneos`)
    }

    const diasPrestamo = await this.getConfigNum('dias_prestamo', 14)
    const ahora = new Date()
    const fechaLimite = this.addDays(ahora, diasPrestamo)

    const prestamo = await this.prisma.$transaction(async (tx) => {
      const created = await tx.prestamo.create({
        data: {
          juego_id: input.juego_id,
          socio_id: socioId,
          notas: input.notas,
          estado: EstadoPrestamo.activo,
          fecha_prestamo: ahora,
          fecha_limite: fechaLimite,
        },
        include: { juego: { select: { id: true, nombre: true } } },
      })
      await tx.juego.update({
        where: { id: input.juego_id },
        data: { estado: 'prestado' as const },
      })
      return created
    })

    await this.logsService.crearSistema(
      input.juego_id,
      TipoLogJuego.prestamo_activo,
      `${prestamo.juego?.nombre ?? 'Juego'} prestado`,
      socioId,
    )

    return prestamo
  }

  async renovar(prestamoId: string, socioId: string) {
    const prestamo = await this.prisma.prestamo.findUnique({ where: { id: prestamoId } })
    if (!prestamo) throw new Error('Préstamo no encontrado')
    if (prestamo.socio_id !== socioId) throw new Error('No tienes permiso para renovar este préstamo')
    if (prestamo.estado !== EstadoPrestamo.activo) throw new Error('Solo se pueden renovar préstamos activos')

    const [maxRenovaciones, diasRenovacion] = await Promise.all([
      this.getConfigNum('max_renovaciones', 2),
      this.getConfigNum('dias_renovacion', 14),
    ])

    if (prestamo.renovaciones >= maxRenovaciones) {
      throw new Error(`Máximo de renovaciones alcanzado (${maxRenovaciones})`)
    }

    const nuevaFechaLimite = this.addDays(prestamo.fecha_limite, diasRenovacion)

    return this.prisma.prestamo.update({
      where: { id: prestamoId },
      data: {
        fecha_limite: nuevaFechaLimite,
        renovaciones: { increment: 1 },
      },
    })
  }

  async devolucion(prestamoId: string, usuarioId: string, esAdmin = false) {
    const prestamo = await this.prisma.prestamo.findUnique({ where: { id: prestamoId } })
    if (!prestamo) throw new Error('Préstamo no encontrado')
    if (!esAdmin && prestamo.socio_id !== usuarioId) throw new Error('No tienes permiso para devolver este préstamo')
    if (prestamo.estado !== EstadoPrestamo.activo) throw new Error('Solo se pueden devolver préstamos activos')

    const juego = await this.prisma.juego.findUnique({
      where: { id: prestamo.juego_id },
      select: { nombre: true },
    })

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.prestamo.update({
        where: { id: prestamoId },
        data: {
          estado: EstadoPrestamo.devuelto,
          fecha_devolucion: new Date(),
          usuario_confirmo_dev_id: usuarioId,
        },
      })
      await tx.juego.update({
        where: { id: prestamo.juego_id },
        data: { estado: 'en_estanteria' as const },
      })
      return result
    })

    await this.logsService.crearSistema(
      prestamo.juego_id,
      TipoLogJuego.prestamo_devuelto,
      `${juego?.nombre ?? 'Juego'} devuelto`,
      usuarioId,
    )

    return updated
  }

  // ── Ludotecario / Directiva ───────────────────────────────────────────────

  async getAll(filtros: FiltrosGestionPrestamosInput) {
    const { page, limit, estado, socio_id, vencidos } = filtros
    const skip = (page - 1) * limit
    const ahora = new Date()

    const where = {
      ...(estado ? { estado } : {}),
      ...(socio_id ? { socio_id } : {}),
      ...(vencidos ? { estado: EstadoPrestamo.activo, fecha_limite: { lt: ahora } } : {}),
    }

    const [prestamos, total] = await Promise.all([
      this.prisma.prestamo.findMany({
        where,
        include: {
          juego: { select: { id: true, nombre: true } },
          socio: { select: { id: true, nombre: true, apellidos: true, email: true, apodo: true } },
        },
        orderBy: { fecha_limite: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.prestamo.count({ where }),
    ])

    return { data: prestamos, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  // ── Notificaciones ────────────────────────────────────────────────────────
  // TODO: Implementar sistema de notificaciones (Telegram bot / email)
  // Llamar desde un cron job periódico (p.ej. backend/src/jobs/prestamos.cron.ts)
  //
  // async enviarAvisosVencimiento(): Promise<void> {
  //   const diasAviso = await this.getConfigNum('dias_aviso_devolucion', 3)
  //   const ahora = new Date()
  //   const fechaLimiteAviso = this.addDays(ahora, diasAviso)
  //
  //   const proximos = await this.prisma.prestamo.findMany({
  //     where: {
  //       estado: EstadoPrestamo.activo,
  //       fecha_limite: { lte: fechaLimiteAviso, gte: ahora },
  //     },
  //     include: {
  //       socio: { select: { id: true, nombre: true, apellidos: true, email: true, alias_telegram: true } },
  //       juego: { select: { id: true, nombre: true } },
  //     },
  //   })
  //
  //   for (const prestamo of proximos) {
  //     // await notificacionService.enviar({
  //     //   socio: prestamo.socio,
  //     //   juego: prestamo.juego,
  //     //   fecha_limite: prestamo.fecha_limite,
  //     //   renovaciones_restantes: maxRenovaciones - prestamo.renovaciones,
  //     // })
  //   }
  // }
}
