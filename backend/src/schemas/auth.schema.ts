import { z } from 'zod'
import { TipoCuota } from '@prisma/client'

export const registerSchema = z.object({
  email: z.string().email('Email no válido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios'),
  dni: z.string().min(9, 'DNI no válido').max(9, 'DNI no válido'),
  telefono: z.string().optional(),
  fecha_nacimiento: z.string().datetime().optional().or(z.string().date().optional()),
  direccion: z.string().optional(),
  alias_telegram: z.string().optional(),
  usuario_bgg: z.string().optional(),
  apodo: z.string().optional(),
  tipo_cuota: z.nativeEnum(TipoCuota).default('individual'),
  consentimiento_tiendas: z.boolean().default(false),
})

export const loginSchema = z.object({
  email: z.string().email('Email no válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
