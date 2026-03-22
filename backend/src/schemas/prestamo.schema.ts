import { z } from 'zod'

export const solicitarPrestamoSchema = z.object({
  juego_id: z.string().uuid('ID de juego no válido'),
  notas: z.string().optional(),
})

export const filtrosPrestamosSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type SolicitarPrestamoInput = z.infer<typeof solicitarPrestamoSchema>
export type FiltrosPrestamosInput = z.infer<typeof filtrosPrestamosSchema>
