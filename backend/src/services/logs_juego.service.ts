import { Prisma, PrismaClient, TipoLogJuego } from '@prisma/client'
import { HttpError } from '../lib/httpError'
import type { FiltrosLogsInput } from '../schemas/log_juego.schema'
import { paginado } from '../lib/paginacion'

/** Texto del log de alta de un juego: cedido por un socio o comprado por el club */
export function textoAltaJuego(nombre: string, propietario?: { nombre: string; apellidos: string } | null) {
  return propietario
    ? `${nombre} cedido al Dragón por ${propietario.nombre} ${propietario.apellidos}`
    : `${nombre} añadido al catálogo del Dragón`
}

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

    return paginado(logs, total, filtros)
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

    return paginado(logs, total, filtros)
  }

  async crearManual(juego_id: string, usuario_id: string, texto: string) {
    const juego = await this.prisma.juego.findUnique({ where: { id: juego_id } })
    if (!juego) throw new HttpError(404, 'Juego no encontrado')

    return this.prisma.logJuego.create({
      data: { juego_id, tipo: TipoLogJuego.nota_manual, texto, usuario_id },
      include: { usuario: usuarioSelect },
    })
  }

  // Con `db` = transacción, el log se guarda (o se deshace) junto a la operación que registra
  async crearSistema(
    juego_id: string,
    tipo: TipoLogJuego,
    texto: string,
    usuario_id?: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    return db.logJuego.create({
      data: { juego_id, tipo, texto, usuario_id: usuario_id ?? null },
    })
  }
}
