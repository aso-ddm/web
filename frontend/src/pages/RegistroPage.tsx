import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, FileText, ArrowRight, PlusCircle, Trash2, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DragonIcon, DragonTextLogo } from '@/components/atoms/icons'
import { SEOHead } from '@/components/SEOHead'
import { PdfViewerDialog } from '@/components/organisms/PdfViewerDialog'
import { authApi } from '@/services/api/auth'
import { configuracionApi } from '@/services/api/configuracion'
import { calcularPrecio } from '@/lib/cuota'

// ── Schemas ───────────────────────────────────────────────────────────────────

const passwordSchema = z
  .string()
  .min(8, 'Mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')

const dniSchema = z
  .string()
  .min(9, 'El DNI debe tener 9 caracteres')
  .max(9, 'El DNI debe tener 9 caracteres')
  .regex(/^[0-9]{8}[A-Za-z]$/, 'Formato de DNI no válido (ej: 12345678A)')

const miembroAdicionalSchema = z
  .object({
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    apellidos: z.string().min(2, 'Los apellidos son obligatorios'),
    dni: dniSchema,
    email: z.string().email('Introduce un email válido'),
    telefono: z.string().optional(),
    fecha_nacimiento: z.string().optional(),
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
  email: z.string().email('Introduce un email válido'),
  telefono: z.string().min(1, 'El teléfono es obligatorio'),
  fecha_nacimiento: z.string().min(1, 'La fecha de nacimiento es obligatoria'),
  direccion: z.string().min(1, 'La dirección es obligatoria'),
  alias_telegram: z.string().min(1, 'El alias de Telegram es obligatorio'),
  apodo: z.string().optional(),
  consentimiento_tiendas: z.boolean().default(false),
  password: passwordSchema,
  confirmPassword: z.string(),
}

const registroSchema = z.union([
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

type RegistroForm = z.infer<typeof registroSchema>

// Helper para extraer mensaje de error de react-hook-form (compatible con discriminatedUnion)
function errMsg(err: unknown): string | undefined {
  if (!err) return undefined
  if (typeof err === 'string') return err
  if (typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message
  }
  return undefined
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(https?:\/\/[^\s)]+|[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/g)
  return (
    <>
      {parts.map((part, i) => {
        if (/^https?:\/\//.test(part))
          return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-secondary underline hover:opacity-80 break-all">{part}</a>
        if (/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/.test(part))
          return <a key={i} href={`mailto:${part}`} className="text-secondary underline hover:opacity-80">{part}</a>
        return part
      })}
    </>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

// ── Sub-components ────────────────────────────────────────────────────────────

function FormSection({
  number,
  title,
  description,
  children,
  className = '',
}: {
  number: number
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={`border-border shadow-none overflow-hidden ${className}`}>
      <CardHeader className="px-6 pt-6 pb-4 flex-row items-start gap-3 space-y-0">
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground font-display font-bold text-xs flex items-center justify-center mt-0.5 select-none">
          {number}
        </div>
        <div>
          <CardTitle className="font-display font-bold text-base text-primary leading-tight">{title}</CardTitle>
          {description && (
            <CardDescription className="text-xs mt-0.5 leading-relaxed">{description}</CardDescription>
          )}
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="px-6 pt-5 pb-6">{children}</CardContent>
    </Card>
  )
}

function BienvenidaCard({ texto }: { texto: string }) {
  const lines = texto.split('\n')
  const nonEmptyIdx = lines.reduce<number[]>((acc, l, i) => (l.trim() ? [...acc, i] : acc), [])
  const titleIdx = nonEmptyIdx[0] ?? -1
  const subtitleIdx = nonEmptyIdx[1] ?? -1
  const elements: React.ReactNode[] = []

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx]
    if (!line.trim()) { elements.push(<div key={idx} className="h-2" />); continue }
    if (idx === titleIdx) { elements.push(<p key={idx} className="font-display font-bold text-base text-primary">{line}</p>); continue }
    if (idx === subtitleIdx) { elements.push(<p key={idx} className="font-display font-bold text-sm text-secondary">{line}</p>); continue }
    if (/^\*\*[^*]+\*\*$/.test(line.trim())) {
      elements.push(<h4 key={idx} className="font-display font-bold text-xs uppercase tracking-widest text-primary mt-4 pt-3 border-t border-primary/20">{line.replace(/\*\*/g, '')}</h4>)
      continue
    }
    elements.push(<p key={idx} className="text-sm leading-relaxed">{renderInline(line)}</p>)
  }

  return (
    <Card className="border-primary/30 bg-primary/5 shadow-none">
      <CardContent className="px-6 py-5 space-y-1">{elements}</CardContent>
    </Card>
  )
}

function DocumentosCard({ urlEstatutos, urlReglamento }: { urlEstatutos?: string; urlReglamento?: string }) {
  const [pdfOpen, setPdfOpen] = useState<{ url: string; title: string } | null>(null)
  const docs = [
    { key: 'estatutos', label: 'Estatutos', url: urlEstatutos },
    { key: 'reglamento', label: 'Reglamento interno', url: urlReglamento },
  ]

  return (
    <>
      <Card className="border-secondary/30 shadow-none">
        <CardHeader className="px-6 pt-5 pb-4 flex-row items-center gap-3 space-y-0">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-secondary/10 flex items-center justify-center">
            <FileText className="h-3.5 w-3.5 text-secondary" />
          </div>
          <div>
            <CardTitle className="font-display font-bold text-base text-secondary leading-tight">Estatutos y Reglamento interno</CardTitle>
            <CardDescription className="text-xs mt-0.5">De obligada lectura antes de enviar la solicitud</CardDescription>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="px-6 pt-4 pb-5 space-y-3">
          <p className="text-sm leading-relaxed">Aquí tienes un resumen de la información relevante sobre el club, de obligada lectura.</p>
          <div className="flex flex-wrap gap-2">
            {docs.map(({ key, label, url }) =>
              url ? (
                <Button key={key} variant="outline" size="sm" className="font-display font-bold gap-1.5 text-xs border-secondary/40 text-secondary hover:bg-secondary/5 hover:text-secondary hover:border-secondary" onClick={() => setPdfOpen({ url, title: label })}>
                  <FileText className="h-3.5 w-3.5" />Ver {label}
                </Button>
              ) : (
                <Button key={key} variant="ghost" size="sm" disabled className="font-display font-bold gap-1.5 text-xs">
                  <FileText className="h-3.5 w-3.5" />{label} — próximamente
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>
      {pdfOpen && <PdfViewerDialog url={pdfOpen.url} title={pdfOpen.title} open={!!pdfOpen} onOpenChange={(open) => { if (!open) setPdfOpen(null) }} />}
    </>
  )
}

// ── Formulario de miembro adicional ──────────────────────────────────────────

type AnyErrors = Record<string, unknown>

function MiembroForm({
  index,
  register,
  errors,
  setValue,
  watch,
  onRemove,
  textoConsentimiento,
}: {
  index: number
  register: ReturnType<typeof useForm<RegistroForm>>['register']
  errors: AnyErrors
  setValue: ReturnType<typeof useForm<RegistroForm>>['setValue']
  watch: ReturnType<typeof useForm<RegistroForm>>['watch']
  onRemove: () => void
  textoConsentimiento?: string
}) {
  const miembrosErrors = (errors as { miembros_adicionales?: AnyErrors[] }).miembros_adicionales
  const err = miembrosErrors?.[index] as AnyErrors | undefined
  const tipoRelacion = (watch as (name: string) => string)(`miembros_adicionales.${index}.tipo_relacion`)
  const consentimiento = (watch as (name: string) => boolean)(`miembros_adicionales.${index}.consentimiento_tiendas`)

  return (
    <div className="rounded-lg border border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-display font-bold text-sm text-primary">Miembro {index + 1}</p>
        <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" onClick={onRemove} aria-label="Eliminar miembro">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label className="font-display font-bold text-sm">Tipo de relación <span className="text-destructive">*</span></Label>
        <Select value={tipoRelacion} onValueChange={(v: string) => (setValue as (name: string, value: string) => void)(`miembros_adicionales.${index}.tipo_relacion`, v)}>
          <SelectTrigger><SelectValue placeholder="Selecciona el tipo de relación" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pareja">Pareja</SelectItem>
            <SelectItem value="familiar_directo">Familiar directo</SelectItem>
          </SelectContent>
        </Select>
        <FieldError message={(err?.tipo_relacion as { message?: string } | undefined)?.message} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="font-display font-bold text-sm">Nombre <span className="text-destructive">*</span></Label>
          <Input placeholder="Juan" {...register(`miembros_adicionales.${index}.nombre` as const)} />
          <FieldError message={(err?.nombre as { message?: string } | undefined)?.message} />
        </div>
        <div className="space-y-1.5">
          <Label className="font-display font-bold text-sm">Apellidos <span className="text-destructive">*</span></Label>
          <Input placeholder="García López" {...register(`miembros_adicionales.${index}.apellidos` as const)} />
          <FieldError message={(err?.apellidos as { message?: string } | undefined)?.message} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="font-display font-bold text-sm">DNI <span className="text-destructive">*</span></Label>
          <Input placeholder="12345678A" maxLength={9} {...register(`miembros_adicionales.${index}.dni` as const)} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { e.target.value = e.target.value.toUpperCase(); register(`miembros_adicionales.${index}.dni` as const).onChange(e) }} />
          <FieldError message={(err?.dni as { message?: string } | undefined)?.message} />
        </div>
        <div className="space-y-1.5">
          <Label className="font-display font-bold text-sm">Email <span className="text-destructive">*</span></Label>
          <Input type="email" placeholder="email@ejemplo.com" {...register(`miembros_adicionales.${index}.email` as const)} />
          <FieldError message={(err?.email as { message?: string } | undefined)?.message} />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="font-display font-bold text-sm">Teléfono</Label>
          <Input type="tel" placeholder="600 000 000" {...register(`miembros_adicionales.${index}.telefono` as const)} />
        </div>
        <div className="space-y-1.5">
          <Label className="font-display font-bold text-sm">Fecha de nacimiento</Label>
          <Input type="date" {...register(`miembros_adicionales.${index}.fecha_nacimiento` as const)} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="font-display font-bold text-sm">Alias de Telegram <span className="text-destructive">*</span></Label>
        <Input placeholder="@tuusuario" {...register(`miembros_adicionales.${index}.alias_telegram` as const)} />
        <FieldError message={(err?.alias_telegram as { message?: string } | undefined)?.message} />
      </div>

      <div className="space-y-1.5">
        <Label className="font-display font-bold text-sm">Apodo <span className="text-muted-foreground font-normal text-xs">(cómo te conoce la gente)</span></Label>
        <Input placeholder="Ej: Carly, El Mago..." {...register(`miembros_adicionales.${index}.apodo` as const)} />
      </div>

      <label className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30 transition-colors">
        <Checkbox
          checked={consentimiento}
          onCheckedChange={(v) => (setValue as (name: string, value: boolean) => void)(`miembros_adicionales.${index}.consentimiento_tiendas`, Boolean(v))}
          className="mt-0.5 flex-shrink-0"
        />
        <span className="text-sm leading-relaxed">
          {textoConsentimiento ?? 'Acepto que se compartan mis datos con las tiendas colaboradoras para obtener descuentos.'}
        </span>
      </label>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="font-display font-bold text-sm">Contraseña <span className="text-destructive">*</span></Label>
          <Input type="password" autoComplete="new-password" placeholder="Mín. 8 caracteres" {...register(`miembros_adicionales.${index}.password` as const)} />
          <FieldError message={(err?.password as { message?: string } | undefined)?.message} />
        </div>
        <div className="space-y-1.5">
          <Label className="font-display font-bold text-sm">Confirmar contraseña <span className="text-destructive">*</span></Label>
          <Input type="password" autoComplete="new-password" placeholder="Repite la contraseña" {...register(`miembros_adicionales.${index}.confirmPassword` as const)} />
          <FieldError message={(err?.confirmPassword as { message?: string } | undefined)?.message} />
        </div>
      </div>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────

export function RegistroPage() {
  const [submitted, setSubmitted] = useState(false)

  const { register, handleSubmit, watch, setValue, control, formState: { errors } } = useForm<RegistroForm>({
    resolver: zodResolver(registroSchema),
    defaultValues: { tipo_cuota: 'individual', consentimiento_tiendas: false },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'miembros_adicionales' as never,
  })

  const tipoCuota = watch('tipo_cuota') as 'individual' | 'conjunta'
  const consentimientoTiendas = watch('consentimiento_tiendas')

  const { data: configBienvenida, isPending: isBienvenidaLoading } = useQuery({
    queryKey: ['config', 'texto_bienvenida_alta'],
    queryFn: () => configuracionApi.getOne('texto_bienvenida_alta'),
    retry: false,
    staleTime: 1000 * 60 * 10,
  })
  const { data: configEstatutos } = useQuery({
    queryKey: ['config', 'url_estatutos'],
    queryFn: () => configuracionApi.getOne('url_estatutos'),
    retry: false,
    staleTime: 1000 * 60 * 10,
  })
  const { data: configReglamento } = useQuery({
    queryKey: ['config', 'url_reglamento_interno'],
    queryFn: () => configuracionApi.getOne('url_reglamento_interno'),
    retry: false,
    staleTime: 1000 * 60 * 10,
  })
  const { data: configConsentimiento } = useQuery({
    queryKey: ['config', 'texto_consentimiento_tiendas'],
    queryFn: () => configuracionApi.getOne('texto_consentimiento_tiendas'),
    retry: false,
    staleTime: 1000 * 60 * 10,
  })
  const { data: configPrecioIndividual } = useQuery({
    queryKey: ['config', 'precio_cuota_individual'],
    queryFn: () => configuracionApi.getOne('precio_cuota_individual'),
    retry: false,
    staleTime: 1000 * 60 * 10,
  })
  const { data: configPrecioAdicional } = useQuery({
    queryKey: ['config', 'precio_cuota_adicional'],
    queryFn: () => configuracionApi.getOne('precio_cuota_adicional'),
    retry: false,
    staleTime: 1000 * 60 * 10,
  })

  const precioIndividual = Number(configPrecioIndividual?.data?.valor ?? 15)
  const precioAdicional = Number(configPrecioAdicional?.data?.valor ?? 5)

  const { mutate, isPending } = useMutation({
    mutationFn: (data: RegistroForm) => {
      if (data.tipo_cuota === 'conjunta') {
        const { confirmPassword: _cp, miembros_adicionales, ...titular } = data as Extract<RegistroForm, { tipo_cuota: 'conjunta' }>
        void _cp
        const miembros = miembros_adicionales.map(({ confirmPassword: _m, ...m }) => { void _m; return m })
        return authApi.register({ ...titular, miembros_adicionales: miembros })
      }
      const { confirmPassword: _cp, ...payload } = data as Extract<RegistroForm, { tipo_cuota: 'individual' }>
      void _cp
      return authApi.register(payload)
    },
    onSuccess: () => setSubmitted(true),
    onError: (err: Error) => toast.error(err.message),
  })

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl text-primary mb-2">¡Solicitud enviada!</h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              La directiva revisará tu solicitud y recibirás un email cuando sea aprobada.
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 text-left space-y-3">
            <p className="font-display font-bold text-sm text-primary uppercase tracking-wide">Próximos pasos</p>
            <ol className="space-y-2">
              {['La directiva revisa tu solicitud', 'Recibirás un email con la aprobación', 'Realiza la transferencia de la cuota', '¡Bienvenido al club!'].map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary font-display font-bold text-xs flex items-center justify-center mt-0.5">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
          <Link to="/">
            <Button variant="outline" className="font-display font-bold gap-2">← Volver a la web</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <SEOHead title="Hazte Socio" description="Solicita el alta como socio de Dragón de Madera" path="/registro" />

      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b border-border">
          <div className="max-w-2xl mx-auto px-4 py-8 flex flex-col items-center text-center">
            <Link to="/" className="flex items-center gap-3 mb-5 group">
              <DragonIcon className="h-11 w-11 fill-primary transition-transform group-hover:scale-105" />
              <DragonTextLogo className="h-7 w-36 fill-primary" />
            </Link>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Solicitud de alta</h1>
            <p className="text-muted-foreground text-sm mt-1.5 max-w-xs leading-relaxed">
              Rellena el formulario y la directiva aprobará tu solicitud
            </p>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">

          {/* Texto de bienvenida */}
          {isBienvenidaLoading ? (
            <Card className="border-primary/30 shadow-none">
              <CardContent className="px-6 py-5 space-y-3">
                {[80, 40, 100, 60, 90].map((w, i) => (
                  <div key={i} className="h-3 bg-muted animate-pulse rounded" style={{ width: `${w}%` }} />
                ))}
              </CardContent>
            </Card>
          ) : configBienvenida?.data?.valor ? (
            <BienvenidaCard texto={configBienvenida.data.valor} />
          ) : null}

          {/* Documentos */}
          <DocumentosCard
            urlEstatutos={configEstatutos?.data?.valor || undefined}
            urlReglamento={configReglamento?.data?.valor || undefined}
          />

          {/* Separador */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs font-display font-bold text-muted-foreground uppercase tracking-widest px-1">Formulario de alta</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleSubmit((data: RegistroForm) => mutate(data))} className="space-y-4">

            {/* 1. Tipo de cuota */}
            <FormSection number={1} title="Tipo de cuota">
              <RadioGroup
                value={tipoCuota}
                onValueChange={(v: string) => setValue('tipo_cuota', v as RegistroForm['tipo_cuota'])}
                className="space-y-2.5"
              >
                {([
                  { tipo: 'individual', precio: `${precioIndividual}€/mes`, descripcion: 'Para un socio' },
                  { tipo: 'conjunta', precio: `desde ${precioIndividual + precioAdicional}€/mes`, descripcion: `Para parejas o familiares directos mayores de edad (${precioIndividual}€ titular + ${precioAdicional}€ por cada miembro adicional)` },
                ] as const).map(({ tipo, precio, descripcion }) => (
                  <label
                    key={tipo}
                    htmlFor={`cuota-${tipo}`}
                    className={`flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-all ${
                      tipoCuota === tipo ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/40 hover:bg-muted/40'
                    }`}
                  >
                    <RadioGroupItem value={tipo} id={`cuota-${tipo}`} className="mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-display font-bold capitalize text-sm">{tipo === 'individual' ? 'Individual' : 'Conjunta'}</span>
                        <span className="text-secondary font-display font-bold text-sm">{precio}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{descripcion}</p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
              {'tipo_cuota' in errors && <FieldError message={(errors as { tipo_cuota?: { message?: string } }).tipo_cuota?.message} />}
            </FormSection>

            {/* 2. Datos personales */}
            <FormSection number={2} title={`Datos personales${tipoCuota === 'conjunta' ? ' — Titular' : ''}`}>
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="nombre" className="font-display font-bold text-sm">Nombre <span className="text-destructive">*</span></Label>
                    <Input id="nombre" placeholder="Juan" {...register('nombre')} />
                    <FieldError message={errMsg(errors.nombre)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="apellidos" className="font-display font-bold text-sm">Apellidos <span className="text-destructive">*</span></Label>
                    <Input id="apellidos" placeholder="García López" {...register('apellidos')} />
                    <FieldError message={errMsg(errors.apellidos)} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="dni" className="font-display font-bold text-sm">DNI <span className="text-destructive">*</span></Label>
                    <Input id="dni" placeholder="12345678A" maxLength={9} {...register('dni')} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { e.target.value = e.target.value.toUpperCase(); register('dni').onChange(e) }} />
                    <FieldError message={errMsg(errors.dni)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fecha_nacimiento" className="font-display font-bold text-sm">Fecha de nacimiento <span className="text-destructive">*</span></Label>
                    <Input id="fecha_nacimiento" type="date" {...register('fecha_nacimiento')} />
                    <FieldError message={errMsg(errors.fecha_nacimiento)} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefono" className="font-display font-bold text-sm">Teléfono <span className="text-destructive">*</span></Label>
                  <Input id="telefono" type="tel" placeholder="600 000 000" {...register('telefono')} />
                  <FieldError message={errMsg(errors.telefono)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="direccion" className="font-display font-bold text-sm">Dirección <span className="text-destructive">*</span></Label>
                  <Input id="direccion" placeholder="Calle, número, ciudad" {...register('direccion')} />
                  <FieldError message={errMsg(errors.direccion)} />
                </div>
              </div>
            </FormSection>

            {/* 3. Cuenta de acceso */}
            <FormSection number={3} title={`Cuenta de acceso${tipoCuota === 'conjunta' ? ' — Titular' : ''}`} description="Con estas credenciales podrás acceder al área de socios">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="font-display font-bold text-sm">Email <span className="text-destructive">*</span></Label>
                  <Input id="email" type="email" autoComplete="email" placeholder="tu@email.com" {...register('email')} />
                  <FieldError message={errMsg(errors.email)} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="font-display font-bold text-sm">Contraseña <span className="text-destructive">*</span></Label>
                    <Input id="password" type="password" autoComplete="new-password" placeholder="Mín. 8 caracteres" {...register('password')} />
                    <FieldError message={errMsg(errors.password)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="font-display font-bold text-sm">Confirmar contraseña <span className="text-destructive">*</span></Label>
                    <Input id="confirmPassword" type="password" autoComplete="new-password" placeholder="Repite la contraseña" {...register('confirmPassword')} />
                    <FieldError message={errMsg(errors.confirmPassword)} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Mínimo 8 caracteres, una mayúscula y un número.</p>
              </div>
            </FormSection>

            {/* 4. Comunicación */}
            <FormSection number={4} title="Comunicación en el club" description="La asociación usa Telegram como canal principal de comunicación">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="alias_telegram" className="font-display font-bold text-sm">Alias de Telegram <span className="text-destructive">*</span></Label>
                  <Input id="alias_telegram" placeholder="@tuusuario" {...register('alias_telegram')} />
                  <FieldError message={errMsg(errors.alias_telegram)} />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="apodo" className="font-display font-bold text-sm">Apodo <span className="text-muted-foreground font-normal text-xs">(cómo te conoce la gente)</span></Label>
                    <Input id="apodo" placeholder="Ej: Carly, El Mago..." {...register('apodo')} />
                  </div>
                </div>
              </div>
            </FormSection>

            {/* 5. Miembros adicionales (solo cuota conjunta) */}
            {tipoCuota === 'conjunta' && (
              <FormSection number={5} title="Miembros adicionales" description={`Añade los miembros de tu cuota conjunta (parejas o familiares directos mayores de edad). Precio total: ${calcularPrecio(fields.length, precioIndividual, precioAdicional)}€/mes`} className="border-secondary/40">
                <div className="space-y-4">
                  {'miembros_adicionales' in errors && (errors as { miembros_adicionales?: { message?: string } }).miembros_adicionales?.message && (
                    <FieldError message={(errors as { miembros_adicionales?: { message?: string } }).miembros_adicionales?.message} />
                  )}

                  {fields.map((field: { id: string }, index: number) => (
                    <MiembroForm
                      key={field.id}
                      index={index}
                      register={register}
                      errors={errors}
                      setValue={setValue}
                      watch={watch}
                      onRemove={() => remove(index)}
                      textoConsentimiento={configConsentimiento?.data?.valor}
                    />
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full font-display font-bold gap-2 border-dashed"
                    disabled={fields.length >= 5}
                    onClick={() => append({ nombre: '', apellidos: '', dni: '', email: '', telefono: '', fecha_nacimiento: '', alias_telegram: '', apodo: '', consentimiento_tiendas: false, password: '', confirmPassword: '', tipo_relacion: 'pareja' })}
                  >
                    <PlusCircle className="h-4 w-4" />
                    {fields.length >= 5 ? 'Máximo 5 miembros adicionales' : 'Añadir miembro'}
                  </Button>
                </div>
              </FormSection>
            )}

            {/* Consentimientos */}
            <FormSection number={tipoCuota === 'conjunta' ? 6 : 5} title="Consentimientos">
              <div className="space-y-4">
                <label htmlFor="consentimiento_tiendas" className="flex items-start gap-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                  <Checkbox
                    id="consentimiento_tiendas"
                    checked={consentimientoTiendas}
                    onCheckedChange={(v) => setValue('consentimiento_tiendas', Boolean(v))}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <span className="text-sm leading-relaxed">
                    {configConsentimiento?.data?.valor ?? 'Acepto que se compartan mis datos con las tiendas colaboradoras para obtener descuentos.'}
                  </span>
                </label>
                <Separator />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Al enviar esta solicitud aceptas la normativa interna de la asociación Dragón de Madera.
                  Tus datos serán tratados conforme al RGPD y solo se usarán para la gestión de la asociación.
                </p>
              </div>
            </FormSection>

            {/* Submit */}
            <div className="pt-2 pb-8 space-y-4">
              <Button type="submit" disabled={isPending} className="w-full h-12 font-display font-bold text-base gap-2">
                {isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Enviando solicitud...</>
                ) : (
                  <>Enviar solicitud de alta<ArrowRight className="h-4 w-4" /></>
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                ¿Ya eres socio?{' '}
                <Link to="/login" className="text-secondary font-display font-bold hover:underline">Accede aquí</Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
