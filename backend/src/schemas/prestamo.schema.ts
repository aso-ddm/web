import { z } from 'zod'
import { EstadoPrestamo } from '@prisma/client'

export const solicitarPrestamoSchema = z.object({
  juego_id: z.string().uuid('ID de juego no válido'),
  notas: z.string().optional(),
})

export const filtrosPrestamosSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export const filtrosGestionPrestamosSchema = z.object({
  estado: z.nativeEnum(EstadoPrestamo).optional(),
  socio_id: z.string().optional(),
  vencidos: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(30),
})

export type SolicitarPrestamoInput = z.infer<typeof solicitarPrestamoSchema>
export type FiltrosPrestamosInput = z.infer<typeof filtrosPrestamosSchema>
export type FiltrosGestionPrestamosInput = z.infer<typeof filtrosGestionPrestamosSchema>
