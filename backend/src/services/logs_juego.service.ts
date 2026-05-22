import { PrismaClient, TipoLogJuego } from '@prisma/client'
import type { FiltrosLogsInput } from '../schemas/log_juego.schema'

const usuarioSelect = { select: { id: true, nombre: true, apellidos: true } }
const juegoSelect   = { select: { id: true, nombre: true } }

export class LogsJuegoService {
  constructor(private prisma: PrismaClient) {}

  async getAll(filtros: FiltrosLogsInput) {
    const { page, limit } = filtros
    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      this.prisma.logJuego.findMany({
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { usuario: usuarioSelect, juego: juegoSelect },
      }),
      this.prisma.logJuego.count(),
    ])

    return { data: logs, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async getByJuego(juego_id: string, filtros: FiltrosLogsInput) {
    const { page, limit } = filtros
    const skip = (page - 1) * limit

    const [logs, total] = await Promise.all([
      this.prisma.logJuego.findMany({
        where: { juego_id },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: { usuario: usuarioSelect },
      }),
      this.prisma.logJuego.count({ where: { juego_id } }),
    ])

    return { data: logs, total, page, limit, totalPages: Math.ceil(total / limit) }
  }

  async crearManual(juego_id: string, usuario_id: string, texto: string) {
    const juego = await this.prisma.juego.findUnique({ where: { id: juego_id } })
    if (!juego) throw new Error('Juego no encontrado')

    return this.prisma.logJuego.create({
      data: { juego_id, tipo: TipoLogJuego.nota_manual, texto, usuario_id },
      include: { usuario: usuarioSelect },
    })
  }

  async crearSistema(
    juego_id: string,
    tipo: TipoLogJuego,
    texto: string,
    usuario_id?: string,
  ) {
    return this.prisma.logJuego.create({
      data: { juego_id, tipo, texto, usuario_id: usuario_id ?? null },
    })
  }
}
