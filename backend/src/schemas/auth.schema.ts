import { z } from 'zod'
import { telegramAuthSchema } from './telegram.schema'

// ─── Reutilizable ────────────────────────────────────────────────────────────

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
  .regex(/[0-9]/, 'La contraseña debe contener al menos un número')

// Emails siempre en minúsculas: evita duplicados por mayúsculas y fallos al recuperar contraseña
export const emailSchema = z.string().trim().toLowerCase().email('Email no válido')

// DNI (12345678Z) o NIE (X1234567L). Solo formato: la letra de control la comprueba el front
// (hay cuentas antiguas, como el admin del seed, con letra no válida que deben poder editarse)
export const dniSchema = z.string().regex(/^([0-9]{8}|[XYZxyz][0-9]{7})[A-Za-z]$/, 'DNI/NIE no válido (ej: 12345678Z o X1234567L)')

// ─── Campos comunes del titular ──────────────────────────────────────────────

const titularFields = {
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios'),
  dni: dniSchema,
  email: emailSchema,
  telefono: z.string().optional(),
  fecha_nacimiento: z.string().datetime().optional().or(z.string().date().optional()),
  direccion: z.string().optional(),
  apodo: z.string().trim().min(1, 'El apodo es obligatorio'),
  consentimiento_tiendas: z.boolean().default(false),
  // Sin contraseña: el titular vincula Telegram en el propio registro (datos firmados del widget)
  telegram: telegramAuthSchema,
}

// ─── Miembro adicional ───────────────────────────────────────────────────────

export const miembroAdicionalSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios'),
  dni: dniSchema,
  email: emailSchema,
  telefono: z.string().min(1, 'El teléfono es obligatorio'),
  fecha_nacimiento: z.string().datetime().or(z.string().date()),
  apodo: z.string().trim().min(1, 'El apodo es obligatorio'),
  consentimiento_tiendas: z.boolean().default(false),
  tipo_relacion: z.enum(['pareja', 'familiar_directo']),
})

export type MiembroAdicionalInput = z.infer<typeof miembroAdicionalSchema>

// ─── Register schema (discriminatedUnion) ────────────────────────────────────

export const registerSchema = z.union([
  // Rama individual
  z.object({
    tipo_cuota: z.literal('individual'),
    ...titularFields,
  }),

  // Rama conjunta
  z.object({
    tipo_cuota: z.literal('conjunta'),
    ...titularFields,
    miembros_adicionales: z.array(miembroAdicionalSchema).min(1).max(5),
  }),
])

// Login con Telegram. email + DNI solo en el primer acceso de una cuenta sin vincular
export const telegramLoginSchema = z.object({
  telegram: telegramAuthSchema,
  email: emailSchema.optional(),
  dni: z.string().trim().toUpperCase().optional(),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type TelegramLoginInput = z.infer<typeof telegramLoginSchema>
