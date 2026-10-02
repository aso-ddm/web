import { z } from 'zod'
import { EstadoJuego } from '@prisma/client'

// null = vaciar el campo al editar (propietario null = del club)
const jugadores = z.union([z.null(), z.coerce.number().int().positive()]).optional()

export const crearJuegoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  localizacion: z.string().nullish(),
  num_jugadores_min: jugadores,
  num_jugadores_max: jugadores,
  notas: z.string().nullish(),
  propietario_id: z.string().uuid().nullish(),
})

// El estado solo cambia por préstamo, devolución, retirar o reactivar
export const updateJuegoSchema = crearJuegoSchema.partial()

export const filtrosJuegosSchema = z.object({
  search: z.string().optional(),
  estado: z.nativeEnum(EstadoJuego).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type CrearJuegoInput = z.infer<typeof crearJuegoSchema>
export type UpdateJuegoInput = z.infer<typeof updateJuegoSchema>
export type FiltrosJuegosInput = z.infer<typeof filtrosJuegosSchema>
