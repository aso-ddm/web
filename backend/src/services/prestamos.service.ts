import { PrismaClient, EstadoPrestamo, TipoLogJuego, EstadoJuego } from '@prisma/client'
import { alertar } from '../lib/alertas'
import type { SolicitarPrestamoInput, FiltrosPrestamosInput, FiltrosGestionPrestamosInput } from '../schemas/prestamo.schema'
import type { LogsJuegoService } from './logs_juego.service'
import { finDelDiaMadrid } from '../lib/fechas'
import { HttpError } from '../lib/httpError'
import { configNumero } from '../lib/config'
import { paginado } from '../lib/paginacion'

export class PrestamosService {
  constructor(
    private prisma: PrismaClient,
    private logsService: LogsJuegoService,
  ) {}

  // ── Socio ─────────────────────────────────────────────────────────────────

  async misPrestamos(socioId: string, filtros: FiltrosPrestamosInput) {
    const { page, limit } = filtros
    const skip = (page - 1) * limit

    const where = { socio_id: socioId, ...(filtros.estado && { estado: filtros.estado }) }
    const [prestamos, total] = await Promise.all([
      this.prisma.prestamo.findMany({
        where,
        include: {
          juego: { select: { id: true, nombre: true } },
        },
        orderBy: { fecha_prestamo: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.prestamo.count({ where }),
    ])

    return paginado(prestamos, total, filtros)
  }

  async solicitar(socioId: string, input: SolicitarPrestamoInput) {
    const juego = await this.prisma.juego.findUnique({ where: { id: input.juego_id } })
    if (!juego) throw new HttpError(404, 'Juego no encontrado')
    if (juego.estado !== EstadoJuego.en_estanteria) throw new HttpError(409, 'El juego no está disponible para préstamo')

    const diasPrestamo = await configNumero(this.prisma, 'dias_prestamo', 14)
    const ahora = new Date()
    // Vence al acabar el día; 0 = sin fecha límite
    const fechaLimite = diasPrestamo > 0 ? finDelDiaMadrid(ahora, diasPrestamo) : null

    return this.prisma.$transaction(async (tx) => {
      // Reserva atómica: si dos socios piden el mismo juego a la vez, solo uno lo consigue
      const { count } = await tx.juego.updateMany({
        where: { id: input.juego_id, estado: EstadoJuego.en_estanteria },
        data: { estado: EstadoJuego.prestado },
      })
      if (count !== 1) throw new HttpError(409, 'El juego no está disponible para préstamo')
      const prestamo = await tx.prestamo.create({
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
      await this.logsService.crearSistema(input.juego_id, TipoLogJuego.prestamo_activo, `${juego.nombre} prestado`, socioId, tx)
      return prestamo
    }).then((prestamo) => {
      void this.avisarLudotecarios(prestamo.id, 'prestamo')
      return prestamo
    })
  }

  async renovar(prestamoId: string, socioId: string) {
    const prestamo = await this.prisma.prestamo.findUnique({ where: { id: prestamoId } })
    if (!prestamo) throw new HttpError(404, 'Préstamo no encontrado')
    if (prestamo.socio_id !== socioId) throw new HttpError(403, 'No tienes permiso para renovar este préstamo')
    if (prestamo.estado !== EstadoPrestamo.activo) throw new HttpError(409, 'Solo se pueden renovar préstamos activos')
    if (!prestamo.fecha_limite) throw new HttpError(409, 'Este préstamo no tiene fecha límite: no hace falta renovarlo')

    const [maxRenovaciones, diasRenovacion] = await Promise.all([
      configNumero(this.prisma, 'max_renovaciones', 2),
      configNumero(this.prisma, 'dias_renovacion', 14),
    ])

    // 0 = renovaciones sin límite
    if (maxRenovaciones > 0 && prestamo.renovaciones >= maxRenovaciones) {
      throw new HttpError(409, `Máximo de renovaciones alcanzado (${maxRenovaciones})`)
    }

    // 0 = la renovación deja el préstamo sin fecha límite
    const nuevaFechaLimite = diasRenovacion > 0 ? finDelDiaMadrid(prestamo.fecha_limite, diasRenovacion) : null

    // Condición en el where: dos renovaciones simultáneas no pueden pasar del máximo
    const { count } = await this.prisma.prestamo.updateMany({
      where: { id: prestamoId, estado: EstadoPrestamo.activo, renovaciones: prestamo.renovaciones },
      data: {
        fecha_limite: nuevaFechaLimite,
        renovaciones: { increment: 1 },
        fechas_renovacion: { push: new Date() },
      },
    })
    if (count !== 1) throw new HttpError(409, 'El préstamo ha cambiado, recarga e inténtalo de nuevo')
    void this.avisarLudotecarios(prestamoId, 'renovacion')
    return this.prisma.prestamo.findUniqueOrThrow({ where: { id: prestamoId } })
  }

  async devolucion(prestamoId: string, usuarioId: string, esAdmin = false) {
    const prestamo = await this.prisma.prestamo.findUnique({ where: { id: prestamoId } })
    if (!prestamo) throw new HttpError(404, 'Préstamo no encontrado')
    if (!esAdmin && prestamo.socio_id !== usuarioId) throw new HttpError(403, 'No tienes permiso para devolver este préstamo')
    if (prestamo.estado !== EstadoPrestamo.activo) throw new HttpError(409, 'Solo se pueden devolver préstamos activos')

    const juego = await this.prisma.juego.findUnique({
      where: { id: prestamo.juego_id },
      select: { nombre: true },
    })

    return this.prisma.$transaction(async (tx) => {
      // Solo una devolución gana si se confirma dos veces a la vez
      const { count } = await tx.prestamo.updateMany({
        where: { id: prestamoId, estado: EstadoPrestamo.activo },
        data: {
          estado: EstadoPrestamo.devuelto,
          fecha_devolucion: new Date(),
          usuario_confirmo_dev_id: usuarioId,
        },
      })
      if (count !== 1) throw new HttpError(409, 'Solo se pueden devolver préstamos activos')
      await tx.juego.update({
        where: { id: prestamo.juego_id },
        data: { estado: EstadoJuego.en_estanteria },
      })
      await this.logsService.crearSistema(prestamo.juego_id, TipoLogJuego.prestamo_devuelto, `${juego?.nombre ?? 'Juego'} devuelto`, usuarioId, tx)
      return tx.prestamo.findUniqueOrThrow({ where: { id: prestamoId } })
    }).then((devuelto) => {
      void this.avisarLudotecarios(prestamoId, 'devolucion')
      return devuelto
    })
  }

  // Aviso por Telegram a los ludotecarios, después de confirmar la operación. Nunca lanza
  private async avisarLudotecarios(prestamoId: string, tipo: 'prestamo' | 'renovacion' | 'devolucion') {
    try {
      const p = await this.prisma.prestamo.findUnique({
        where: { id: prestamoId },
        select: {
          fecha_limite: true,
          renovaciones: true,
          juego: { select: { nombre: true } },
          socio: { select: { nombre: true, apellidos: true } },
        },
      })
      if (!p) return
      await alertar(this.prisma, `alerta_${tipo}`, {
        socio: `${p.socio.nombre} ${p.socio.apellidos}`.trim(),
        juego: p.juego.nombre,
        renovaciones: String(p.renovaciones),
        fecha_limite: p.fecha_limite
          ? `hasta el ${p.fecha_limite.toLocaleDateString('es-ES', { timeZone: 'Europe/Madrid' })}`
          : 'sin fecha límite',
      })
    } catch (err) {
      console.error('No se pudo avisar a los ludotecarios:', err)
    }
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

    return paginado(prestamos, total, filtros)
  }
}
