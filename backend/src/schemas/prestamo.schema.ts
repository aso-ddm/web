import { z } from 'zod'
import { EstadoPrestamo } from '@prisma/client'
import { paginacion } from '../lib/paginacion'

export const solicitarPrestamoSchema = z.object({
  juego_id: z.string().uuid('ID de juego no válido'),
  notas: z.string().optional(),
})

export const filtrosPrestamosSchema = z.object({
  estado: z.nativeEnum(EstadoPrestamo).optional(), // activos e historial se piden por separado
  ...paginacion(20, 100),
})

export const filtrosGestionPrestamosSchema = z.object({
  estado: z.nativeEnum(EstadoPrestamo).optional(),
  socio_id: z.string().optional(),
  // z.coerce.boolean() convierte "false" en true
  vencidos: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
  ...paginacion(30, 100),
})

export type SolicitarPrestamoInput = z.infer<typeof solicitarPrestamoSchema>
export type FiltrosPrestamosInput = z.infer<typeof filtrosPrestamosSchema>
export type FiltrosGestionPrestamosInput = z.infer<typeof filtrosGestionPrestamosSchema>
