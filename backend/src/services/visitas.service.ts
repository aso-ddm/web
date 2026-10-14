import { Prisma, PrismaClient } from '@prisma/client'
import { configNumero } from '../lib/config'
import { likePattern } from '../lib/search'

const normalizarNombre = (s: string) => s.trim().replace(/\s+/g, ' ')

const MAX_SUGERENCIAS = 20

export class VisitasService {
  constructor(private prisma: PrismaClient) {}

  /** La regla de cobro vive solo aquí: la usan el registro y la vista previa del formulario. */
  private async reglas(db: Prisma.TransactionClient = this.prisma) {
    const [gratuitas, precio] = await Promise.all([
      configNumero(db, 'visitas_gratuitas', 3),
      configNumero(db, 'precio_visita_pago', 4),
    ])
    return {
      gratuitas,
      precio,
      cobro: (visitasPrevias: number) => {
        const esPago = visitasPrevias >= gratuitas
        return { es_pago: esPago, importe: esPago ? precio : null }
      },
    }
  }

  /**
   * Visitantes cuyo nombre coincide (autocompletar), con su recuento y lo que pagarían en la siguiente visita.
   * Agrupa como cuenta `registrar`: "juan  pérez" y "Juan Pérez" son el mismo visitante.
   * `nuevo`: lo que pagaría alguien que aún no ha venido nunca.
   */
  async buscar(nombre: string) {
    const { cobro } = await this.reglas()
    const nuevo = cobro(0)
    if (nombre.trim().length < 2) return { data: [], nuevo }

    const filas = await this.prisma.$queryRaw<{ nombre_completo: string; total_visitas: number; ultima_visita: Date }[]>`
      SELECT (array_agg(nombre_completo ORDER BY fecha_visita DESC))[1] AS nombre_completo,
             COUNT(*)::int AS total_visitas,
             MAX(fecha_visita) AS ultima_visita
      FROM "Visita"
      WHERE nombre_completo ILIKE ${likePattern(normalizarNombre(nombre))}
      GROUP BY lower(regexp_replace(trim(nombre_completo), '\\s+', ' ', 'g'))
      ORDER BY MAX(fecha_visita) DESC
      LIMIT ${MAX_SUGERENCIAS}`

    const data = filas.map((f) => {
      const siguiente = cobro(f.total_visitas)
      return { ...f, siguiente_es_pago: siguiente.es_pago, importe_siguiente: siguiente.importe }
    })
    return { data, nuevo }
  }

  /** Registra una visita aplicando la lógica de gratis vs. pago */
  async registrar(data: { nombre_completo: string; socio_registro_id: string }) {
    // "juan  pérez " y "Juan Pérez" son la misma persona: si no, las visitas gratis se multiplican
    const nombre = normalizarNombre(data.nombre_completo)

    return this.prisma.$transaction(async (tx) => {
      // Dos registros simultáneos del mismo visitante esperan su turno: si no, ambos podrían salir gratis
      await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${nombre.toLowerCase()}))`
      const [{ cobro }, visitasPrevias] = await Promise.all([
        this.reglas(tx),
        tx.visita.count({ where: { nombre_completo: { equals: nombre, mode: 'insensitive' } } }),
      ])
      const { es_pago, importe } = cobro(visitasPrevias)

      return tx.visita.create({
        data: {
          nombre_completo: nombre,
          fecha_visita: new Date(),
          numero_visita: visitasPrevias + 1,
          es_pago,
          importe,
          socio_registro_id: data.socio_registro_id,
        },
      })
    })
  }

  async getAll(filtros: { page: number; limit: number; search?: string }) {
    const { page, limit, search } = filtros
    const skip = (page - 1) * limit
    const where = search
      ? { nombre_completo: { contains: search, mode: 'insensitive' as const } }
      : {}

    const [visitas, total] = await Promise.all([
      this.prisma.visita.findMany({
        where,
        skip,
        take: limit,
        orderBy: { fecha_visita: 'desc' },
        include: { socio_registro: { select: { id: true, nombre: true, apellidos: true } } },
      }),
      this.prisma.visita.count({ where }),
    ])

    return { data: visitas, total, page, limit, totalPages: Math.ceil(total / limit) }
  }
}
