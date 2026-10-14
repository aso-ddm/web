import { z } from 'zod'

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

const DNI_LETRAS = 'TRWAGMYFPDXBNJZSQVHLCKE'

// Registro: además del formato, la letra de control (en el NIE la X/Y/Z cuenta como 0/1/2)
export const dniRegistroSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^([0-9]{8}|[XYZ][0-9]{7})[A-Z]$/, 'DNI/NIE no válido (ej: 12345678Z o X1234567L)')
  .refine((dni) => {
    const num = Number(dni.slice(0, 8).replace(/^[XYZ]/, (c) => String('XYZ'.indexOf(c))))
    return dni[8] === DNI_LETRAS[num % 23]
  }, 'La letra del DNI/NIE no es correcta')

// Fecha local de hoy en YYYY-MM-DD: las fechas del formulario se comparan como texto, sin zonas horarias
const hoy = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Anterior a hoy y mayor de edad (cumple 18 hoy o antes; un 29 de febrero cumple el 1 de marzo)
export const fechaNacimientoSchema = z
  .string({ required_error: 'La fecha de nacimiento es obligatoria' })
  .date('Fecha de nacimiento no válida')
  .refine((f) => f < hoy(), 'La fecha de nacimiento debe ser anterior a hoy')
  .refine((f) => `${Number(f.slice(0, 4)) + 18}${f.slice(4)}` <= hoy(), 'Debes ser mayor de edad para registrarte')

// Edición de un socio ya dado de alta: fecha real y pasada (sin la regla de mayoría de edad del alta)
export const fechaNacimientoEdicionSchema = z
  .string()
  .date('Fecha de nacimiento no válida')
  .refine((f) => f < hoy(), 'La fecha de nacimiento debe ser anterior a hoy')

// ─── Campos de quien rellena el formulario ───────────────────────────────────

// Mismas reglas que el formulario (frontend/src/pages/registro/schema.ts): lo vigila contrato_frontend.test.ts
const apellidosSchema = z.string().min(2, 'Los apellidos son obligatorios')
const telefonoSchema = z.string().min(1, 'El teléfono es obligatorio')
const direccionSchema = z.string().min(1, 'La dirección es obligatoria')

const camposPersona = {
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: apellidosSchema,
  dni: dniRegistroSchema,
  email: emailSchema,
  telefono: telefonoSchema,
  fecha_nacimiento: fechaNacimientoSchema,
  direccion: direccionSchema,
  apodo: z.string().trim().min(1, 'El apodo es obligatorio'),
  consentimiento_tiendas: z.boolean().default(false),
  password: passwordSchema,
}

// ─── Miembro adicional ───────────────────────────────────────────────────────

export const miembroAdicionalSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: apellidosSchema,
  dni: dniRegistroSchema,
  email: emailSchema,
  telefono: telefonoSchema,
  fecha_nacimiento: fechaNacimientoSchema,
  direccion: direccionSchema,
  apodo: z.string().trim().min(1, 'El apodo es obligatorio'),
  consentimiento_tiendas: z.boolean().default(false),
  password: passwordSchema,
})

export type MiembroAdicionalInput = z.infer<typeof miembroAdicionalSchema>

// ─── Register schema (discriminatedUnion) ────────────────────────────────────

export const registerSchema = z.union([
  // Rama individual
  z.object({
    tipo_cuota: z.literal('individual'),
    ...camposPersona,
  }),

  // Rama conjunta
  z.object({
    tipo_cuota: z.literal('conjunta'),
    ...camposPersona,
    miembros_adicionales: z.array(miembroAdicionalSchema).min(1).max(5),
  }),
])

// Edición de la solicitud pendiente: los datos personales. Email, contraseña y composición del grupo no se tocan
export const solicitudSchema = z.object({
  nombre: camposPersona.nombre,
  apellidos: camposPersona.apellidos,
  dni: dniRegistroSchema,
  telefono: telefonoSchema,
  fecha_nacimiento: fechaNacimientoSchema,
  direccion: z.string().optional(),
  apodo: camposPersona.apodo,
  consentimiento_tiendas: z.boolean().default(false),
})

export type SolicitudInput = z.infer<typeof solicitudSchema>

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

export const resetRequestSchema = z.object({ email: emailSchema })

export const resetConfirmSchema = z.object({
  email: emailSchema,
  token: z.string().trim().regex(/^\d{6}$/, 'El código son 6 dígitos'),
  password: passwordSchema,
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
