import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DragonIcon, DragonTextLogo } from '@/components/atoms/icons'
import { SEOHead } from '@/components/SEOHead'
import { PdfViewerDialog } from '@/components/organisms/PdfViewerDialog'
import { authApi } from '@/services/api/auth'
import { configuracionApi } from '@/services/api/configuracion'
import { SPACING } from '@/lib/constants'

const registroSchema = z
  .object({
    tipo_cuota: z.enum(['individual', 'pareja', 'familiar'], {
      required_error: 'Selecciona un tipo de cuota',
    }),
    nombre: z.string().min(1, 'El nombre es obligatorio'),
    apellidos: z.string().min(2, 'Los apellidos son obligatorios'),
    dni: z
      .string()
      .min(9, 'El DNI debe tener 9 caracteres')
      .max(9, 'El DNI debe tener 9 caracteres')
      .regex(/^[0-9]{8}[A-Za-z]$/, 'Formato de DNI no válido (ej: 12345678A)'),
    email: z.string().email('Introduce un email válido'),
    telefono: z.string().min(1, 'El teléfono es obligatorio'),
    fecha_nacimiento: z.string().min(1, 'La fecha de nacimiento es obligatoria'),
    direccion: z.string().min(1, 'La dirección es obligatoria'),
    alias_telegram: z.string().min(1, 'El alias de Telegram es obligatorio'),
    apodo: z.string().optional(),
    consentimiento_tiendas: z.boolean().default(false),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
      .regex(/[0-9]/, 'Debe contener al menos un número'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  })

type RegistroForm = z.infer<typeof registroSchema>

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

function BienvenidaCard({ texto }: { texto: string }) {
  const lines = texto.split('\n')
  const nonEmptyIdx = lines.reduce<number[]>((acc, l, i) => (l.trim() ? [...acc, i] : acc), [])
  const titleIdx = nonEmptyIdx[0] ?? -1
  const subtitleIdx = nonEmptyIdx[1] ?? -1

  const elements: React.ReactNode[] = []

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx]

    if (!line.trim()) { elements.push(<div key={idx} className="h-2" />); continue }

    if (idx === titleIdx) {
      elements.push(<p key={idx} className="font-display font-bold text-lg text-primary">{line}</p>)
      continue
    }
    if (idx === subtitleIdx) {
      elements.push(<p key={idx} className="font-display font-bold text-base text-secondary mb-1">{line}</p>)
      continue
    }
    if (/^\*\*[^*]+\*\*$/.test(line.trim())) {
      elements.push(
        <h4 key={idx} className="font-display font-bold text-xs uppercase tracking-wide text-primary mt-4 pt-3 border-t border-primary/20">
          {line.replace(/\*\*/g, '')}
        </h4>
      )
      continue
    }
    elements.push(<p key={idx} className="text-sm text-foreground leading-relaxed">{renderInline(line)}</p>)
  }

  return (
    <Card className="border-primary/40 bg-primary/5">
      <CardContent className="pt-5 pb-5 space-y-0.5">{elements}</CardContent>
    </Card>
  )
}

function DocumentosCard({
  urlEstatutos,
  urlReglamento,
}: {
  urlEstatutos?: string
  urlReglamento?: string
}) {
  const [pdfOpen, setPdfOpen] = useState<{ url: string; title: string } | null>(null)

  const docs = [
    { key: 'estatutos', label: 'Estatutos', url: urlEstatutos },
    { key: 'reglamento', label: 'Reglamento interno', url: urlReglamento },
  ]

  return (
    <>
      <Card className="border-primary/40">
        <CardHeader className="pb-2 pt-4 px-5">
          <h3 className="font-display font-bold text-sm uppercase tracking-wide text-primary flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Estatutos y Reglamento interno
          </h3>
        </CardHeader>
        <CardContent className="px-5 pb-4 space-y-3">
          <p className="text-sm text-foreground">
            Aquí tienes un resumen de la información relevante sobre el club, de obligada lectura.
          </p>
          <div className="flex flex-wrap gap-2">
            {docs.map(({ key, label, url }) =>
              url ? (
                <Button key={key} variant="outline" size="sm"
                  className="font-display font-bold gap-1.5 text-xs"
                  onClick={() => setPdfOpen({ url, title: label })}>
                  <FileText className="h-3.5 w-3.5" />
                  Ver {label}
                </Button>
              ) : (
                <Button key={key} variant="ghost" size="sm" disabled
                  className="font-display font-bold gap-1.5 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  {label} — próximamente disponible
                </Button>
              )
            )}
          </div>
        </CardContent>
      </Card>
      {pdfOpen && (
        <PdfViewerDialog
          url={pdfOpen.url}
          title={pdfOpen.title}
          open={!!pdfOpen}
          onOpenChange={(open) => { if (!open) setPdfOpen(null) }}
        />
      )}
    </>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-display font-bold text-lg text-primary mb-4 flex items-center gap-2">
      {children}
    </h3>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

export function RegistroPage() {
  const [submitted, setSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegistroForm>({
    resolver: zodResolver(registroSchema),
    defaultValues: {
      tipo_cuota: 'individual',
      consentimiento_tiendas: false,
    },
  })

  const tipoCuota = watch('tipo_cuota')
  const consentimientoTiendas = watch('consentimiento_tiendas')

  const cuotaInfo = {
    individual: { precio: '15€/mes', descripcion: 'Para un socio' },
    pareja: { precio: '20€/mes', descripcion: 'Para dos socios (la pareja puede registrarse después)' },
    familiar: { precio: 'A definir', descripcion: 'Pareja + hijos (contactar con directiva)' },
  }

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

  const { mutate, isPending } = useMutation({
    mutationFn: (data: RegistroForm) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { confirmPassword, ...payload } = data
      return authApi.register({
        ...payload,
        fecha_nacimiento: payload.fecha_nacimiento,
        telefono: payload.telefono,
        direccion: payload.direccion,
        alias_telegram: payload.alias_telegram,
        apodo: payload.apodo || undefined,
      })
    },
    onSuccess: () => setSubmitted(true),
    onError: (err: Error) => toast.error(err.message),
  })

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <CheckCircle2 className="h-20 w-20 text-primary mx-auto" />
          <div>
            <h1 className="font-display font-bold text-3xl text-primary mb-3">
              ¡Solicitud enviada!
            </h1>
            <p className="text-lg text-foreground leading-relaxed">
              La directiva revisará tu solicitud y recibirás un email cuando sea aprobada.
            </p>
          </div>
          <div className="bg-accent rounded-xl p-5 text-left space-y-2">
            <p className="font-display font-bold text-primary">Próximos pasos:</p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-foreground">
              <li>La directiva revisa tu solicitud</li>
              <li>Recibirás un email con la aprobación</li>
              <li>Realiza la transferencia de la cuota</li>
              <li>¡Bienvenido al club!</li>
            </ol>
          </div>
          <Link to="/" className="inline-block">
            <Button variant="outline" className="font-display font-bold">
              ← Volver a la web
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <SEOHead title="Hazte Socio" description="Solicita el alta como socio de Dragón de Madera" path="/registro" />

      <div className="min-h-screen bg-background py-8 px-4">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-3 mb-4 group">
            <DragonIcon className="h-12 w-12 fill-primary transition-transform group-hover:scale-105" />
            <DragonTextLogo className="h-8 w-40 fill-primary" />
          </Link>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-primary text-center">
            Solicitud de alta
          </h1>
          <p className="text-muted-foreground text-center mt-2 max-w-sm">
            Rellena el formulario y la directiva aprobará tu solicitud
          </p>
        </div>

        {/* ── TEXTO DE BIENVENIDA ───────────────────────────────────── */}
        <div className={`${SPACING.maxWidthForm} mb-6`}>
          {isBienvenidaLoading ? (
            <Card className="border-primary/40">
              <CardContent className="pt-5 pb-5 space-y-3">
                {[80, 40, 100, 60, 90, 70].map((w, i) => (
                  <div key={i} className={`h-3 bg-muted animate-pulse rounded`} style={{ width: `${w}%` }} />
                ))}
              </CardContent>
            </Card>
          ) : configBienvenida?.data?.valor ? (
            <BienvenidaCard texto={configBienvenida.data.valor} />
          ) : null}
        </div>

        {/* ── DOCUMENTOS PÚBLICOS ───────────────────────────────────── */}
        <div className={`${SPACING.maxWidthForm} mb-6`}>
          <DocumentosCard
            urlEstatutos={configEstatutos?.data?.valor || undefined}
            urlReglamento={configReglamento?.data?.valor || undefined}
          />
        </div>

        <form
          onSubmit={handleSubmit((data) => mutate(data))}
          className={`${SPACING.maxWidthForm} space-y-6`}
        >
          {/* ── TIPO DE CUOTA ─────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <SectionTitle>Tipo de cuota</SectionTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={tipoCuota}
                onValueChange={(v) => setValue('tipo_cuota', v as RegistroForm['tipo_cuota'])}
                className="space-y-3"
              >
                {(['individual', 'pareja', 'familiar'] as const).map((tipo) => (
                  <label
                    key={tipo}
                    htmlFor={`cuota-${tipo}`}
                    className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
                      tipoCuota === tipo
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <RadioGroupItem value={tipo} id={`cuota-${tipo}`} className="mt-0.5" />
                    <div className="flex-1">
                      <span className="font-display font-bold capitalize text-base">
                        {tipo}{' '}
                        <span className="text-secondary font-bold">
                          — {cuotaInfo[tipo].precio}
                        </span>
                      </span>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {cuotaInfo[tipo].descripcion}
                      </p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
              <FieldError message={errors.tipo_cuota?.message} />
            </CardContent>
          </Card>

          {/* ── DATOS PERSONALES ─────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <SectionTitle>Datos personales</SectionTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="nombre" className="font-display font-bold">
                    Nombre <span className="text-destructive">*</span>
                  </Label>
                  <Input id="nombre" placeholder="Juan" {...register('nombre')} />
                  <FieldError message={errors.nombre?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="apellidos" className="font-display font-bold">
                    Apellidos <span className="text-destructive">*</span>
                  </Label>
                  <Input id="apellidos" placeholder="García López" {...register('apellidos')} />
                  <FieldError message={errors.apellidos?.message} />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="dni" className="font-display font-bold">
                    DNI <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dni"
                    placeholder="12345678A"
                    maxLength={9}
                    {...register('dni')}
                    onChange={(e) => {
                      e.target.value = e.target.value.toUpperCase()
                      register('dni').onChange(e)
                    }}
                  />
                  <FieldError message={errors.dni?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="fecha_nacimiento" className="font-display font-bold">
                    Fecha de nacimiento <span className="text-destructive">*</span>
                  </Label>
                  <Input id="fecha_nacimiento" type="date" {...register('fecha_nacimiento')} />
                  <FieldError message={errors.fecha_nacimiento?.message} />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="telefono" className="font-display font-bold">
                  Teléfono <span className="text-destructive">*</span>
                </Label>
                <Input id="telefono" type="tel" placeholder="600 000 000" {...register('telefono')} />
                <FieldError message={errors.telefono?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="direccion" className="font-display font-bold">
                  Dirección <span className="text-destructive">*</span>
                </Label>
                <Input id="direccion" placeholder="Calle, número, ciudad" {...register('direccion')} />
                <FieldError message={errors.direccion?.message} />
              </div>
            </CardContent>
          </Card>

          {/* ── CUENTA ───────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <SectionTitle>Cuenta de acceso</SectionTitle>
              <CardDescription>
                Con estas credenciales podrás acceder al área de socios
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="font-display font-bold">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="tu@email.com"
                  {...register('email')}
                />
                <FieldError message={errors.email?.message} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="font-display font-bold">
                    Contraseña <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Mín. 8 caracteres"
                    {...register('password')}
                  />
                  <FieldError message={errors.password?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="font-display font-bold">
                    Confirmar contraseña <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Repite la contraseña"
                    {...register('confirmPassword')}
                  />
                  <FieldError message={errors.confirmPassword?.message} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Mínimo 8 caracteres, una mayúscula y un número.
              </p>
            </CardContent>
          </Card>

          {/* ── COMUNICACIÓN ─────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <SectionTitle>Comunicación en el club</SectionTitle>
              <CardDescription>La asociación usa Telegram como canal principal de comunicación</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="alias_telegram" className="font-display font-bold">
                  Alias de Telegram <span className="text-destructive">*</span>
                </Label>
                <Input id="alias_telegram" placeholder="@tuusuario" {...register('alias_telegram')} />
                <FieldError message={errors.alias_telegram?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="apodo" className="font-display font-bold">
                  Apodo <span className="text-muted-foreground font-normal text-xs">(cómo te conoce la gente)</span>
                </Label>
                <Input id="apodo" placeholder="Ej: Carly, El Mago..." {...register('apodo')} />
              </div>
            </CardContent>
          </Card>

          {/* ── LEGAL ────────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-3">
              <SectionTitle>Consentimientos</SectionTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3 rounded-xl border border-border p-4">
                <Checkbox
                  id="consentimiento_tiendas"
                  checked={consentimientoTiendas}
                  onCheckedChange={(v) => setValue('consentimiento_tiendas', Boolean(v))}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="consentimiento_tiendas"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  {configConsentimiento?.data?.valor ?? 'Acepto que se compartan mis datos con las tiendas colaboradoras para obtener descuentos.'}
                </Label>
              </div>
              <Separator className="my-4" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Al enviar esta solicitud aceptas la normativa interna de la asociación Dragón de
                Madera. Tus datos serán tratados conforme al RGPD y solo se usarán para la gestión
                de la asociación.
              </p>
            </CardContent>
          </Card>

          {/* ── SUBMIT ───────────────────────────────────────────────── */}
          <div className="pb-8">
            <Button
              type="submit"
              disabled={isPending}
              className={`w-full font-display font-bold text-lg ${SPACING.ctaButton}`}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Enviando solicitud...
                </>
              ) : (
                'Enviar solicitud de alta'
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground mt-4">
              ¿Ya eres socio?{' '}
              <Link to="/login" className="text-secondary font-display font-bold hover:underline">
                Accede aquí
              </Link>
            </p>
          </div>
        </form>
      </div>
    </>
  )
}
