import { z } from 'zod'
import { EstadoJuego } from '@prisma/client'

export const crearJuegoSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio'),
  autor: z.string().optional(),
  editorial: z.string().optional(),
  anio_publicacion: z.coerce.number().int().min(1900).max(2100).optional(),
  num_jugadores_min: z.coerce.number().int().positive().optional(),
  num_jugadores_max: z.coerce.number().int().positive().optional(),
  duracion_minutos: z.coerce.number().int().positive().optional(),
  edad_recomendada: z.coerce.number().int().positive().optional(),
  categoria: z.string().optional(),
  propietario: z.string().optional(),
  foto_url: z.string().url().optional().or(z.literal('')),
  bgg_id: z.string().optional(),
})

export const updateJuegoSchema = crearJuegoSchema.partial().extend({
  estado: z.nativeEnum(EstadoJuego).optional(),
})

export const filtrosJuegosSchema = z.object({
  search: z.string().optional(),
  estado: z.nativeEnum(EstadoJuego).optional(),
  categoria: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type CrearJuegoInput = z.infer<typeof crearJuegoSchema>
export type UpdateJuegoInput = z.infer<typeof updateJuegoSchema>
export type FiltrosJuegosInput = z.infer<typeof filtrosJuegosSchema>
