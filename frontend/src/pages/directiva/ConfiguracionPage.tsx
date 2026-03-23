import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Settings, FileText, Link, Loader2, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { SEOHead } from '@/components/SEOHead'
import { configuracionApi, type ConfigItem } from '@/services/api/configuracion'

const configLabels: Record<string, { label: string; description: string; suffix?: string }> = {
  precio_cuota_individual: {
    label: 'Precio cuota individual',
    description: 'Precio mensual de la cuota individual',
    suffix: '€/mes',
  },
  precio_cuota_adicional: {
    label: 'Precio por miembro adicional (conjunta)',
    description: 'Importe adicional por cada miembro en una cuota conjunta (se suma al precio individual del titular)',
    suffix: '€/mes',
  },
  visitas_gratuitas: {
    label: 'Visitas gratuitas',
    description: 'Número de visitas gratuitas permitidas para no socios antes de tener que pagar',
    suffix: 'visitas',
  },
  precio_visita_pago: {
    label: 'Precio visita de pago',
    description: 'Importe en euros que se cobra a los no socios que ya superaron las visitas gratuitas',
    suffix: '€',
  },
  url_estatutos: {
    label: 'Estatutos (enlace)',
    description: 'URL del documento de estatutos (Google Drive, Dropbox, cualquier alojamiento)',
  },
  url_reglamento_interno: {
    label: 'Reglamento interno (enlace)',
    description: 'URL del documento de reglamento interno (Google Drive, Dropbox, cualquier alojamiento)',
  },
}

function ConfigField({ config }: { config: ConfigItem }) {
  const queryClient = useQueryClient()
  const [valor, setValor] = useState(config.valor)
  const meta = configLabels[config.clave]

  const { mutate: guardar, isPending } = useMutation({
    mutationFn: () => configuracionApi.update(config.clave, valor),
    onSuccess: () => {
      toast.success(`"${meta?.label ?? config.clave}" actualizado`)
      queryClient.invalidateQueries({ queryKey: ['configuracion'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const changed = valor !== config.valor

  return (
    <div className="space-y-2">
      <Label htmlFor={config.clave} className="font-display font-bold text-sm">
        {meta?.label ?? config.clave}
      </Label>
      {meta?.description && (
        <p className="text-xs text-muted-foreground">{meta.description}</p>
      )}
      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-xs">
          <Input
            id={config.clave}
            type={config.tipo === 'numero' ? 'number' : 'text'}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            min={config.tipo === 'numero' ? 0 : undefined}
            className="pr-12"
          />
          {meta?.suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {meta.suffix}
            </span>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => guardar()}
          disabled={isPending || !changed}
          className="font-display font-bold gap-1"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Guardar
        </Button>
      </div>
    </div>
  )
}

function TextAreaConfigField({
  clave,
  initialValor,
  label,
  description,
}: {
  clave: string
  initialValor: string
  label: string
  description: string
}) {
  const queryClient = useQueryClient()
  const [valor, setValor] = useState(initialValor)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [])

  useEffect(() => {
    setValor(initialValor)
  }, [initialValor])

  useEffect(() => {
    autoResize()
  }, [valor, autoResize])

  const { mutate: guardar, isPending } = useMutation({
    mutationFn: () => configuracionApi.update(clave, valor),
    onSuccess: () => {
      toast.success(`"${label}" actualizado`)
      queryClient.invalidateQueries({ queryKey: ['configuracion'] })
      queryClient.invalidateQueries({ queryKey: ['config', clave] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const changed = valor !== initialValor

  return (
    <div className="space-y-2">
      <Label className="font-display font-bold text-sm">{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <Textarea
        ref={textareaRef}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="font-mono text-xs resize-none overflow-hidden"
        placeholder="Escribe aquí el texto..."
      />
      <p className="text-xs text-muted-foreground">
        Usa <code className="bg-muted px-1 rounded">**SECCIÓN**</code> para cabeceras y escribe las URLs completas para que sean clicables.
      </p>
      <Button
        size="sm"
        onClick={() => guardar()}
        disabled={isPending || !changed}
        className="font-display font-bold gap-1"
      >
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
        Guardar texto
      </Button>
    </div>
  )
}

export function ConfiguracionPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['configuracion'],
    queryFn: () => configuracionApi.getAll(),
  })

  const { data: bienvenidaData, isLoading: isBienvenidaLoading } = useQuery({
    queryKey: ['config', 'texto_bienvenida_alta'],
    queryFn: () => configuracionApi.getOne('texto_bienvenida_alta'),
    retry: false,
  })

  const { data: consentimientoData, isLoading: isConsentimientoLoading } = useQuery({
    queryKey: ['config', 'texto_consentimiento_tiendas'],
    queryFn: () => configuracionApi.getOne('texto_consentimiento_tiendas'),
    retry: false,
  })

  const configs = (data?.data ?? []).filter((c) => c.tipo === 'numero')
  const urlConfigs = (data?.data ?? []).filter((c) => c.tipo === 'url')

  const configsCuota = ['precio_cuota_individual', 'precio_cuota_adicional']
    .map((clave) => configs.find((c) => c.clave === clave))
    .filter(Boolean) as typeof configs

  const configsVisitas = ['visitas_gratuitas', 'precio_visita_pago']
    .map((clave) => configs.find((c) => c.clave === clave))
    .filter(Boolean) as typeof configs

  return (
    <>
      <SEOHead title="Configuración" description="Configuración del sistema" path="/directiva/configuracion" noindex />

      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Configuración</h1>
          <p className="text-muted-foreground mt-1">Parámetros globales del sistema de gestión</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base text-primary flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración de cuotas
            </CardTitle>
            <CardDescription>
              Precios mensuales aplicados a los socios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              [1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)
            ) : (
              configsCuota.map((c) => <ConfigField key={c.clave} config={c} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base text-primary flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración de visitas
            </CardTitle>
            <CardDescription>
              Parámetros para el control de visitas de no socios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              [1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)
            ) : (
              configsVisitas.map((c) => <ConfigField key={c.clave} config={c} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-display text-base text-primary flex items-center gap-2">
              <Link className="h-4 w-4" />
              Documentos públicos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              [1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)
            ) : urlConfigs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay documentos configurados en la base de datos.</p>
            ) : (
              urlConfigs.map((c) => <ConfigField key={c.clave} config={c} />)
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base text-primary flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Texto de bienvenida — Formulario de alta
            </CardTitle>
            <CardDescription>
              Texto informativo que se muestra al inicio del formulario de solicitud de alta.
              Se actualiza en tiempo real para los nuevos socios.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isBienvenidaLoading ? (
              <Skeleton className="h-96 w-full" />
            ) : (
              <TextAreaConfigField
                key={bienvenidaData?.data?.valor ?? 'empty'}
                clave="texto_bienvenida_alta"
                initialValor={bienvenidaData?.data?.valor ?? ''}
                label="Texto de bienvenida"
                description="Mostrado al inicio del formulario de alta de nuevos socios"
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base text-primary flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Consentimiento de datos — Tiendas colaboradoras
            </CardTitle>
            <CardDescription>
              Texto del checkbox de consentimiento visible en el formulario de alta.
              Actualízalo si cambian las tiendas o el porcentaje de descuento.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isConsentimientoLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <TextAreaConfigField
                key={consentimientoData?.data?.valor ?? 'empty-consentimiento'}
                clave="texto_consentimiento_tiendas"
                initialValor={consentimientoData?.data?.valor ?? ''}
                label="Texto de consentimiento"
                description="Se muestra como etiqueta del checkbox de consentimiento en el formulario de alta"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
