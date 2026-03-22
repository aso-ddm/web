import { z } from 'zod'
import { TipoCuota, Rol, EstadoSocio } from '@prisma/client'

export const updateSocioSchema = z.object({
  nombre: z.string().min(1).optional(),
  apellidos: z.string().min(1).optional(),
  telefono: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  direccion: z.string().optional(),
  alias_telegram: z.string().optional(),
  usuario_bgg: z.string().optional(),
  apodo: z.string().optional(),
  tipo_cuota: z.nativeEnum(TipoCuota).optional(),
  consentimiento_tiendas: z.boolean().optional(),
})

export const updateRolesSchema = z.object({
  roles: z.array(z.nativeEnum(Rol)).min(1, 'Al menos un rol es obligatorio'),
})

export const bajaSchema = z.object({
  motivo: z.string().optional(),
})

export const filtrosSociosSchema = z.object({
  estado: z.nativeEnum(EstadoSocio).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type UpdateSocioInput = z.infer<typeof updateSocioSchema>
export type UpdateRolesInput = z.infer<typeof updateRolesSchema>
export type FiltrosSociosInput = z.infer<typeof filtrosSociosSchema>
