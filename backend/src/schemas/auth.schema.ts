import { z } from 'zod'

// ─── Reutilizable ────────────────────────────────────────────────────────────

export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
  .regex(/[0-9]/, 'La contraseña debe contener al menos un número')

// ─── Campos comunes del titular ──────────────────────────────────────────────

const titularFields = {
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios'),
  dni: z.string().regex(/^[0-9]{8}[A-Za-z]$/, 'DNI no válido (formato: 8 dígitos + letra)'),
  email: z.string().email('Email no válido'),
  telefono: z.string().optional(),
  fecha_nacimiento: z.string().datetime().optional().or(z.string().date().optional()),
  direccion: z.string().optional(),
  alias_telegram: z.string().min(1, 'El alias de Telegram es obligatorio'),
  apodo: z.string().optional(),
  consentimiento_tiendas: z.boolean().default(false),
  password: passwordSchema,
}

// ─── Miembro adicional ───────────────────────────────────────────────────────

export const miembroAdicionalSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: z.string().min(1, 'Los apellidos son obligatorios'),
  dni: z.string().regex(/^[0-9]{8}[A-Za-z]$/, 'DNI no válido (formato: 8 dígitos + letra)'),
  email: z.string().email('Email no válido'),
  telefono: z.string().min(1, 'El teléfono es obligatorio'),
  fecha_nacimiento: z.string().datetime().or(z.string().date()),
  alias_telegram: z.string().min(1, 'El alias de Telegram es obligatorio'),
  apodo: z.string().optional(),
  consentimiento_tiendas: z.boolean().default(false),
  password: passwordSchema,
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

export const loginSchema = z.object({
  email: z.string().email('Email no válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
