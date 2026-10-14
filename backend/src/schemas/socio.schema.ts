import { z } from 'zod'
import { Rol, EstadoSocio } from '@prisma/client'
import { fechaNacimientoEdicionSchema } from './auth.schema'
import { paginacion } from '../lib/paginacion'

export const updateSocioSchema = z.object({
  nombre: z.string().min(1).optional(),
  apellidos: z.string().min(1).optional(),
  telefono: z.string().optional(),
  fecha_nacimiento: fechaNacimientoEdicionSchema.optional(),
  direccion: z.string().optional(),
  alias_telegram: z.string().optional(),
  apodo: z.string().optional(),
  consentimiento_tiendas: z.boolean().optional(),
})

export const updateRolesSchema = z.object({
  roles: z.array(z.nativeEnum(Rol)).min(1, 'Al menos un rol es obligatorio'),
})

export const aprobarSocioSchema = z.object({
  rol: z.nativeEnum(Rol, { message: 'Rol inválido' }),
})

export type AprobarSocioInput = z.infer<typeof aprobarSocioSchema>

export const llavesSchema = z.object({
  tiene_llaves: z.boolean(),
})

// Une al socio a la cuota conjunta de socio_id (o crea una con los dos)
export const unirCuotaConjuntaSchema = z.object({
  socio_id: z.string().uuid(),
})

export const filtrosSociosSchema = z.object({
  estado: z.nativeEnum(EstadoSocio).optional(),
  search: z.string().optional(),
  ...paginacion(20, 500),
})

export type UpdateSocioInput = z.infer<typeof updateSocioSchema>
export type UpdateRolesInput = z.infer<typeof updateRolesSchema>
export type FiltrosSociosInput = z.infer<typeof filtrosSociosSchema>
