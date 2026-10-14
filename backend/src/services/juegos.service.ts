import { PrismaClient, TipoLogJuego, Prisma, EstadoJuego } from '@prisma/client'
import type { CrearJuegoInput, UpdateJuegoInput, FiltrosJuegosInput } from '../schemas/juego.schema'
import { textoAltaJuego, type LogsJuegoService } from './logs_juego.service'
import { HttpError } from '../lib/httpError'
import { likePattern } from '../lib/search'
import { paginado } from '../lib/paginacion'

const propietarioSelect = { select: { id: true, nombre: true, apellidos: true } }

function comprobarJugadores(min?: number | null, max?: number | null) {
  if (min != null && max != null && min > max) {
    throw new HttpError(400, 'El mínimo de jugadores no puede ser mayor que el máximo')
  }
}

export class JuegosService {
  constructor(
    private prisma: PrismaClient,
    private logsService: LogsJuegoService,
  ) {}

  async getAll(filtros: FiltrosJuegosInput) {
    const { page, limit, search, estado } = filtros
    const skip = (page - 1) * limit

    if (search) {
      const pattern = likePattern(search)
      const estadoClause = estado
        ? Prisma.sql`AND estado::text = ${estado}`
        : Prisma.sql``

      const [rows, countRows] = await Promise.all([
        this.prisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM "Juego"
          WHERE (
            unaccent(nombre) ILIKE unaccent(${pattern})
            OR localizacion ILIKE ${pattern}
            OR notas ILIKE ${pattern}
          )
          ${estadoClause}
          ORDER BY nombre ASC
          LIMIT ${limit} OFFSET ${skip}
        `,
        this.prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(*) as count FROM "Juego"
          WHERE (
            unaccent(nombre) ILIKE unaccent(${pattern})
            OR localizacion ILIKE ${pattern}
            OR notas ILIKE ${pattern}
          )
          ${estadoClause}
        `,
      ])

      const ids = rows.map((r) => r.id)
      const total = Number(countRows[0]?.count ?? 0)

      const juegos = ids.length > 0
        ? await this.prisma.juego.findMany({
            where: { id: { in: ids } },
            orderBy: { nombre: 'asc' },
            include: { propietario: propietarioSelect },
          })
        : []

      return paginado(juegos, total, filtros)
    }

    const where = { ...(estado ? { estado } : {}) }

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

    return paginado(juegos, total, filtros)
  }

  async getById(id: string) {
    const juego = await this.prisma.juego.findUnique({
      where: { id },
      include: { propietario: propietarioSelect },
    })
    if (!juego) throw new HttpError(404, 'Juego no encontrado')
    return juego
  }

  async crear(data: CrearJuegoInput, usuario_id?: string) {
    comprobarJugadores(data.num_jugadores_min, data.num_jugadores_max)
    return this.prisma.$transaction(async (tx) => {
      const juego = await tx.juego.create({
        data,
        include: { propietario: propietarioSelect },
      })
      await this.logsService.crearSistema(
        juego.id,
        TipoLogJuego.donado,
        textoAltaJuego(juego.nombre, juego.propietario),
        usuario_id,
        tx,
      )
      return juego
    })
  }

  async update(id: string, data: UpdateJuegoInput) {
    const juego = await this.prisma.juego.findUnique({ where: { id } })
    if (!juego) throw new HttpError(404, 'Juego no encontrado')
    // Si solo llega uno de los dos, se compara con el guardado
    comprobarJugadores(
      data.num_jugadores_min !== undefined ? data.num_jugadores_min : juego.num_jugadores_min,
      data.num_jugadores_max !== undefined ? data.num_jugadores_max : juego.num_jugadores_max,
    )
    return this.prisma.juego.update({
      where: { id },
      data,
      include: { propietario: propietarioSelect },
    })
  }

  async retirar(id: string, usuario_id: string) {
    const juego = await this.prisma.juego.findUnique({ where: { id } })
    if (!juego) throw new HttpError(404, 'Juego no encontrado')
    if (juego.estado === EstadoJuego.retirado) throw new HttpError(409, 'El juego ya está retirado')
    if (juego.estado === EstadoJuego.prestado) throw new HttpError(409, 'No se puede retirar un juego prestado')

    // Solo desde la estantería: si alguien lo presta a la vez, no queda retirado con préstamo activo
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.juego.updateMany({
        where: { id, estado: EstadoJuego.en_estanteria },
        data: { estado: EstadoJuego.retirado },
      })
      if (count !== 1) throw new HttpError(409, 'No se puede retirar un juego prestado')
      await this.logsService.crearSistema(id, TipoLogJuego.retirado, `${juego.nombre} retirado del Dragón`, usuario_id, tx)
      return tx.juego.findUniqueOrThrow({
        where: { id },
        include: { propietario: propietarioSelect },
      })
    })
  }

  async reactivar(id: string, usuario_id: string) {
    const juego = await this.prisma.juego.findUnique({ where: { id } })
    if (!juego) throw new HttpError(404, 'Juego no encontrado')
    if (juego.estado !== EstadoJuego.retirado) throw new HttpError(409, 'Solo se pueden reactivar juegos retirados')

    return this.prisma.$transaction(async (tx) => {
      await this.logsService.crearSistema(id, TipoLogJuego.nota_manual, `${juego.nombre} reactivado y vuelto a la estantería`, usuario_id, tx)
      return tx.juego.update({
        where: { id },
        data: { estado: EstadoJuego.en_estanteria },
        include: { propietario: propietarioSelect },
      })
    })
  }

  async delete(id: string) {
    const juego = await this.prisma.juego.findUnique({ where: { id } })
    if (!juego) throw new HttpError(404, 'Juego no encontrado')

    // Cualquier préstamo (también devuelto) lo referencia sin onDelete: borrar daría error de FK
    const prestamos = await this.prisma.prestamo.count({ where: { juego_id: id } })
    if (prestamos > 0) {
      throw new HttpError(409, 'El juego tiene historial de préstamos y no puede eliminarse: retíralo del catálogo')
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
      // Prefijo ' para que Excel no ejecute fórmulas (=, +, -, @) escritas en nombres o notas
      const s = /^[=+\-@\t\r]/.test(String(v)) ? `'${v}` : String(v)
      if (/[",\r\n]/.test(s)) {
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
