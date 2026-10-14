import { z } from 'zod'

// Formato único de los listados paginados: { data, total, page, limit, totalPages }

/** Campos page/limit de un schema de filtros (se esparce dentro de z.object). */
export const paginacion = (limitPorDefecto: number, max = 100) => ({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(max).default(limitPorDefecto),
})

export function paginado<T>(data: T[], total: number, { page, limit }: { page: number; limit: number }) {
  return { data, total, page, limit, totalPages: Math.ceil(total / limit) }
}
