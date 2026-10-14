import { z } from 'zod'

// ── Schemas ───────────────────────────────────────────────────────────────────

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE'

export const passwordSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')

// DNI (12345678Z) o NIE (X1234567L): en el NIE la X/Y/Z cuenta como 0/1/2 para calcular la letra
export const dniSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^([0-9]{8}|[XYZ][0-9]{7})[A-Z]$/, 'Formato no válido (ej: 12345678Z o X1234567L)')
  .refine((dni) => {
    const num = Number(dni.slice(0, 8).replace(/^[XYZ]/, (c) => String('XYZ'.indexOf(c))))
    return dni[8] === DNI_LETTERS[num % 23]
  }, 'La letra del DNI/NIE no es correcta')

// Fecha local de hoy en YYYY-MM-DD: <input type="date"> da ese formato y se compara como texto, sin zonas horarias
const hoy = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Anterior a hoy y mayor de edad (cumple 18 hoy o antes; un 29 de febrero cumple el 1 de marzo). Igual que el backend
export const fechaNacimientoSchema = z
  .string()
  .min(1, 'La fecha de nacimiento es obligatoria')
  .refine((f) => f < hoy(), 'La fecha de nacimiento debe ser anterior a hoy')
  .refine((f) => `${Number(f.slice(0, 4)) + 18}${f.slice(4)}` <= hoy(), 'Debes ser mayor de edad para registrarte')

const miembroAdicionalSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    apellidos: z.string().min(2, 'Los apellidos son obligatorios'),
    dni: dniSchema,
    email: z.string().trim().toLowerCase().email('Introduce un email válido'), // como el backend: Ana@x y ana@x son el mismo
    telefono: z.string().min(1, 'El teléfono es obligatorio'),
    fecha_nacimiento: fechaNacimientoSchema,
    direccion: z.string().min(1, 'La dirección es obligatoria'),
    apodo: z.string().trim().min(1, 'El apodo es obligatorio'),
    consentimiento_tiendas: z.boolean().default(false),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .superRefine((d: { password: string; confirmPassword: string }, ctx: z.RefinementCtx) => {
    if (d.password !== d.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Las contraseñas no coinciden', path: ['confirmPassword'] })
    }
  })

const camposPersona = {
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: z.string().min(2, 'Los apellidos son obligatorios'),
  dni: dniSchema,
  email: z.string().trim().toLowerCase().email('Introduce un email válido'), // como el backend: Ana@x y ana@x son el mismo
  telefono: z.string().min(1, 'El teléfono es obligatorio'),
  fecha_nacimiento: fechaNacimientoSchema,
  direccion: z.string().min(1, 'La dirección es obligatoria'),
  apodo: z.string().trim().min(1, 'El apodo es obligatorio'),
  consentimiento_tiendas: z.boolean().default(false),
  password: passwordSchema,
  confirmPassword: z.string(),
}

export const registroSchema = z.union([
  z
    .object({ tipo_cuota: z.literal('individual'), ...camposPersona })
    .superRefine((d: { password: string; confirmPassword: string }, ctx: z.RefinementCtx) => {
        if (d.password !== d.confirmPassword) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Las contraseñas no coinciden', path: ['confirmPassword'] })
        }
      }),
  z
    .object({
      tipo_cuota: z.literal('conjunta'),
      ...camposPersona,
      miembros_adicionales: z
        .array(miembroAdicionalSchema)
        .min(1, 'Debes añadir al menos un miembro')
        .max(5, 'Máximo 5 miembros adicionales'),
    })
    .superRefine((d: { password: string; confirmPassword: string; email: string; dni: string; miembros_adicionales: Array<{ email: string; dni: string }> }, ctx: z.RefinementCtx) => {
      if (d.password !== d.confirmPassword) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Las contraseñas no coinciden', path: ['confirmPassword'] })
      }
      // Unicidad de emails
      const emails = [d.email, ...d.miembros_adicionales.map((m) => m.email)]
      const emailsDuplicados = emails.filter((e, i) => emails.indexOf(e) !== i)
      if (emailsDuplicados.length > 0) {
        d.miembros_adicionales.forEach((m, i) => {
          if (emailsDuplicados.includes(m.email)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Email duplicado en el grupo', path: ['miembros_adicionales', i, 'email'] })
          }
        })
      }
      // Unicidad de DNIs
      const dnis = [d.dni, ...d.miembros_adicionales.map((m) => m.dni)]
      const dnisDuplicados = dnis.filter((e, i) => dnis.indexOf(e) !== i)
      if (dnisDuplicados.length > 0) {
        d.miembros_adicionales.forEach((m, i) => {
          if (dnisDuplicados.includes(m.dni)) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'DNI duplicado en el grupo', path: ['miembros_adicionales', i, 'dni'] })
          }
        })
      }
    }),
])

export type RegistroForm = z.infer<typeof registroSchema>

// Helper para extraer mensaje de error de react-hook-form (compatible con discriminatedUnion)
export function errMsg(err: unknown): string | undefined {
  if (!err) return undefined
  if (typeof err === 'string') return err
  if (typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message
  }
  return undefined
}
