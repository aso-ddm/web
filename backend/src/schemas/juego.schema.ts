import { z } from 'zod'
import { EstadoJuego } from '@prisma/client'

export const crearJuegoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  localizacion: z.string().optional(),
  num_jugadores_min: z.coerce.number().int().positive().optional(),
  num_jugadores_max: z.coerce.number().int().positive().optional(),
  notas: z.string().optional(),
  propietario_id: z.string().uuid().optional(),
})

export const updateJuegoSchema = crearJuegoSchema.partial().extend({
  estado: z.nativeEnum(EstadoJuego).optional(),
})

export const filtrosJuegosSchema = z.object({
  search: z.string().optional(),
  estado: z.nativeEnum(EstadoJuego).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type CrearJuegoInput = z.infer<typeof crearJuegoSchema>
export type UpdateJuegoInput = z.infer<typeof updateJuegoSchema>
export type FiltrosJuegosInput = z.infer<typeof filtrosJuegosSchema>
