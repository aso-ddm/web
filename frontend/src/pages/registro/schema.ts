import { z } from 'zod'

// ── Schemas ───────────────────────────────────────────────────────────────────

const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE'

export const passwordSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')

const dniSchema = z
  .string()
  .min(9, 'El DNI debe tener 9 caracteres')
  .max(9, 'El DNI debe tener 9 caracteres')
  .regex(/^[0-9]{8}[A-Za-z]$/, 'Formato de DNI no válido (ej: 12345678A)')
  .refine((dni) => {
    const num = parseInt(dni.slice(0, 8), 10)
    return dni[8].toUpperCase() === DNI_LETTERS[num % 23]
  }, 'La letra del DNI no es correcta')

const fechaNacimientoSchema = z
  .string()
  .min(1, 'La fecha de nacimiento es obligatoria')
  .refine((val) => new Date(val) <= new Date(), 'La fecha de nacimiento no puede ser en el futuro')
  .refine((val) => {
    const date = new Date(val)
    const now = new Date()
    const age = now.getFullYear() - date.getFullYear() -
      (now.getMonth() < date.getMonth() || (now.getMonth() === date.getMonth() && now.getDate() < date.getDate()) ? 1 : 0)
    return age >= 16
  }, 'Debes tener al menos 16 años para registrarte')

const miembroAdicionalSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    apellidos: z.string().min(2, 'Los apellidos son obligatorios'),
    dni: dniSchema,
    email: z.string().trim().toLowerCase().email('Introduce un email válido'), // como el backend: Ana@x y ana@x son el mismo
    telefono: z.string().min(1, 'El teléfono es obligatorio'),
    fecha_nacimiento: fechaNacimientoSchema,
    alias_telegram: z.string().min(1, 'El alias de Telegram es obligatorio'),
    apodo: z.string().optional(),
    consentimiento_tiendas: z.boolean().default(false),
    password: passwordSchema,
    confirmPassword: z.string(),
    tipo_relacion: z.enum(['pareja', 'familiar_directo'], {
      required_error: 'Selecciona el tipo de relación',
    }),
  })
  .superRefine((d: { password: string; confirmPassword: string }, ctx: z.RefinementCtx) => {
    if (d.password !== d.confirmPassword) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Las contraseñas no coinciden', path: ['confirmPassword'] })
    }
  })

const camposTitular = {
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: z.string().min(2, 'Los apellidos son obligatorios'),
  dni: dniSchema,
  email: z.string().trim().toLowerCase().email('Introduce un email válido'), // como el backend: Ana@x y ana@x son el mismo
  telefono: z.string().min(1, 'El teléfono es obligatorio'),
  fecha_nacimiento: fechaNacimientoSchema,
  direccion: z.string().min(1, 'La dirección es obligatoria'),
  alias_telegram: z.string().min(1, 'El alias de Telegram es obligatorio'),
  apodo: z.string().optional(),
  consentimiento_tiendas: z.boolean().default(false),
  password: passwordSchema,
  confirmPassword: z.string(),
}

export const registroSchema = z.union([
  z
    .object({ tipo_cuota: z.literal('individual'), ...camposTitular })
    .superRefine((d: { password: string; confirmPassword: string }, ctx: z.RefinementCtx) => {
      if (d.password !== d.confirmPassword) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Las contraseñas no coinciden', path: ['confirmPassword'] })
      }
    }),
  z
    .object({
      tipo_cuota: z.literal('conjunta'),
      ...camposTitular,
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
