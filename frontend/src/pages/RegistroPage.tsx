import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, CheckCircle2, FileText, ArrowRight, PlusCircle, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { DragonIcon, DragonTextLogo } from '@/components/atoms/icons'
import { SEOHead } from '@/components/atoms/SEOHead'
import { RichTextContent } from '@/components/molecules/RichTextContent'
import { authApi } from '@/services/api/auth'
import { configuracionApi } from '@/services/api/configuracion'
import { registroSchema, RegistroForm, errMsg } from './registro/schema'
import { FieldError, FormSection, DocumentosCard } from './registro/FormParts'
import { MiembroForm } from './registro/MiembroForm'

// ── Componente principal ──────────────────────────────────────────────────────

export function RegistroPage() {
  const [submitted, setSubmitted] = useState(false)
  const [comprobante, setComprobante] = useState<File | null>(null)
  const [comprobanteError, setComprobanteError] = useState<string | undefined>()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, watch, setValue, control, formState: { errors, isSubmitting } } = useForm<RegistroForm>({
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
      if (!comprobante) throw new Error('Debes adjuntar el comprobante de transferencia')

      if (data.tipo_cuota === 'conjunta') {
        const { confirmPassword: _cp, miembros_adicionales, ...titular } = data as Extract<RegistroForm, { tipo_cuota: 'conjunta' }>
        void _cp
        const miembros = miembros_adicionales.map(({ confirmPassword: _m, ...m }) => { void _m; return m })
        return authApi.register({ ...titular, miembros_adicionales: miembros }, comprobante)
      }
      const { confirmPassword: _cp, ...payload } = data as Extract<RegistroForm, { tipo_cuota: 'individual' }>
      void _cp
      return authApi.register(payload, comprobante)
    },
    onSuccess: () => setSubmitted(true),
    onError: (err: Error) => toast.error(err.message),
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setComprobanteError(undefined)
    if (!file) { setComprobante(null); return }
    // Por extensión, como el backend (file.type viene vacío o distinto según sistema y navegador)
    const extension = file.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? ''
    if (!['.pdf', '.jpg', '.jpeg', '.png', '.webp'].includes(extension)) {
      setComprobanteError('Formato no permitido. Usa PDF, JPG, PNG o WebP.')
      setComprobante(null)
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setComprobanteError('El archivo no puede superar los 10 MB.')
      setComprobante(null)
      return
    }
    setComprobante(file)
  }

  function handleSubmitWithComprobanteCheck(data: RegistroForm) {
    if (!comprobante) {
      setComprobanteError('Debes adjuntar el comprobante de transferencia')
      return
    }
    mutate(data)
  }

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
              {['La directiva revisa tu solicitud y el comprobante de transferencia que ya adjuntaste', 'Recibirás un mensaje de Telegram con la confirmación de alta', '¡Bienvenido al club!'].map((step, i) => (
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
            <Card className="border-primary/30 bg-primary/5 shadow-none">
              <CardContent className="px-6 py-5">
                <RichTextContent html={configBienvenida.data.valor} />
              </CardContent>
            </Card>
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

          <form onSubmit={handleSubmit(handleSubmitWithComprobanteCheck)} className="space-y-4">

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
                  <Input id="alias_telegram" placeholder="tuusuario" {...register('alias_telegram')} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { e.target.value = e.target.value.replace(/^@+/, ''); register('alias_telegram').onChange(e) }} />
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
              <FormSection number={5} title="Miembros adicionales" description={`Añade los miembros de tu cuota conjunta (parejas o familiares directos mayores de edad). Precio total: ${precioIndividual + precioAdicional * fields.length}€/mes`} className="border-secondary/40">
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

            {/* Comprobante de transferencia */}
            <FormSection
              number={tipoCuota === 'conjunta' ? 6 : 5}
              title="Comprobante de transferencia"
              description="Para formalizar el alta, realiza una transferencia del importe de tu cuota (parte proporcional del mes en curso + un mes completo en concepto de matrícula) y adjunta el justificante aquí."
            >
              <div className="space-y-4">
                <div
                  className={`relative rounded-lg border-2 border-dashed transition-colors ${
                    comprobante
                      ? 'border-primary/50 bg-primary/5'
                      : comprobanteError
                      ? 'border-destructive/50 bg-destructive/5'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    aria-label="Subir comprobante de transferencia"
                  />
                  <div className="px-6 py-8 flex flex-col items-center text-center gap-3 pointer-events-none">
                    {comprobante ? (
                      <>
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-display font-bold text-sm text-primary truncate max-w-xs">{comprobante.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{(comprobante.size / 1024).toFixed(0)} KB</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-display font-bold text-sm">Haz clic para adjuntar el comprobante</p>
                          <p className="text-xs text-muted-foreground mt-0.5">PDF, JPG o PNG · máx. 10 MB</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {comprobante && (
                  <button
                    type="button"
                    onClick={() => { setComprobante(null); setComprobanteError(undefined); if (fileInputRef.current) fileInputRef.current.value = '' }}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Eliminar archivo y seleccionar otro
                  </button>
                )}

                {comprobanteError && (
                  <p className="text-xs text-destructive">{comprobanteError}</p>
                )}
              </div>
            </FormSection>

            {/* Consentimientos */}
            <FormSection number={tipoCuota === 'conjunta' ? 7 : 6} title="Consentimientos">
              <div className="space-y-4">
                <label htmlFor="consentimiento_tiendas" className="flex items-start gap-3 rounded-lg border border-border p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                  <Checkbox
                    id="consentimiento_tiendas"
                    checked={consentimientoTiendas}
                    onCheckedChange={(v) => setValue('consentimiento_tiendas', Boolean(v))}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <RichTextContent html={configConsentimiento?.data?.valor || 'Acepto que se compartan mis datos con las tiendas colaboradoras para obtener descuentos.'} className="text-sm leading-relaxed" />
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
              <Button type="submit" disabled={isPending || isSubmitting} className="w-full h-12 font-display font-bold text-base gap-2">
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
