import { z } from 'zod'
import { Rol, EstadoSocio } from '@prisma/client'
import { dniSchema, emailSchema, passwordSchema } from './auth.schema'
import { paginacion } from '../lib/paginacion'

// tipo_cuota no está: lo fija la pertenencia a una cuota conjunta (POST/DELETE /socios/:id/cuota-conjunta)
export const filtrosAdminSchema = z.object({
  search: z.string().optional(),
  estado: z.nativeEnum(EstadoSocio).optional(),
  ...paginacion(50, 500),
})

export const updateUsuarioSchema = z.object({
  email: emailSchema.optional(),
  nombre: z.string().min(1).optional(),
  apellidos: z.string().min(1).optional(),
  dni: dniSchema.optional(),
  telefono: z.string().optional().nullable(),
  roles: z.array(z.nativeEnum(Rol)).min(1).optional(),
  estado: z.nativeEnum(EstadoSocio).optional(),
  alias_telegram: z.string().optional().nullable(),
  apodo: z.string().optional().nullable(),
  fecha_nacimiento: z.coerce.date().nullable().optional(),
  direccion: z.string().nullable().optional(),
  consentimiento_tiendas: z.boolean().optional(),
  tiene_llaves: z.boolean().optional(),
  fecha_alta: z.coerce.date().nullable().optional(),
  fecha_baja: z.coerce.date().nullable().optional(),
  password: passwordSchema.optional(),
})
