import { useState, type ReactNode } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Settings, FileText, Link, Loader2, Save, Plus, Trash2, MessageCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { RichTextEditor } from '@/components/molecules/RichTextEditor'
import { SEOHead } from '@/components/atoms/SEOHead'
import { configuracionApi, enlacesInteresApi, type ConfigItem, type EnlaceInteres } from '@/services/api/configuracion'
import { invalidarConfig, QK } from '@/lib/queryKeys'

const configLabels: Record<string, { label: string; description: string; suffix?: string }> = {
  precio_cuota_individual: {
    label: 'Precio cuota individual',
    description: 'Precio mensual de la cuota individual',
    suffix: '€/mes',
  },
  precio_cuota_adicional: {
    label: 'Precio por miembro adicional (conjunta)',
    description: 'Importe adicional por cada miembro en una cuota conjunta (se suma al precio individual)',
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
  telegram_bot_username: {
    label: 'Nombre del bot de Telegram',
    description: 'Usuario del bot sin @ (ej: dragondemadera_bot). Necesario para el widget de vinculación de Telegram',
  },
  max_prestamos_activos: {
    label: 'Préstamos simultáneos por socio',
    description: 'Número máximo de préstamos activos que puede tener un socio al mismo tiempo',
    suffix: 'préstamos',
  },
  dias_prestamo: {
    label: 'Duración del préstamo',
    description: 'Días que dura un préstamo desde que el socio se lleva el juego',
    suffix: 'días',
  },
  dias_renovacion: {
    label: 'Días por renovación',
    description: 'Días que añade cada renovación a la fecha límite',
    suffix: 'días',
  },
  max_renovaciones: {
    label: 'Renovaciones máximas',
    description: 'Veces que un socio puede renovar el mismo préstamo',
    suffix: 'veces',
  },
  url_estatutos: {
    label: 'Estatutos (enlace)',
    description: 'URL del documento de estatutos (Google Drive, Dropbox, cualquier alojamiento)',
  },
  texto_baja_confirmada: {
    label: 'Mensaje de baja confirmada',
    description: 'Lo recibe por Telegram el socio al que se da de baja (si lo tiene vinculado). {nombre} se cambia por su nombre. Vacío = no se envía',
  },
  url_reglamento_interno: {
    label: 'Reglamento interno (enlace)',
    description: 'URL del documento de reglamento interno (Google Drive, Dropbox, cualquier alojamiento)',
  },
}

function useGuardarConfig(clave: string, etiqueta: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (valor: string) => configuracionApi.update(clave, valor),
    onSuccess: () => {
      toast.success(`"${etiqueta}" actualizado`)
      invalidarConfig(queryClient, clave)
    },
    onError: (err: Error) => toast.error(err.message),
  })
}

function ConfigField({ config }: { config: ConfigItem }) {
  const [valor, setValor] = useState(config.valor)
  const meta = configLabels[config.clave]
  const { mutate, isPending } = useGuardarConfig(config.clave, meta?.label ?? config.clave)
  const guardar = () => mutate(valor)

  const changed = valor !== config.valor

  return (
    <div className="space-y-2">
      <Label htmlFor={config.clave} className="font-display font-bold text-sm">
        {meta?.label ?? config.clave}
      </Label>
      {meta?.description && (
        <p className="text-xs text-muted-foreground">{meta.description}</p>
      )}
      {config.tipo === 'texto_largo' ? (
        <div className="space-y-2">
          <Textarea id={config.clave} value={valor} onChange={(e) => setValor(e.target.value)} rows={6} />
          <Button size="sm" onClick={() => guardar()} disabled={isPending || !changed} className="font-display font-bold gap-1">
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Guardar
          </Button>
        </div>
      ) : (
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
      )}
    </div>
  )
}

function RichTextConfigField({
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
  const [valor, setValor] = useState(initialValor)
  const { mutate, isPending } = useGuardarConfig(clave, label)
  const guardar = () => mutate(valor)

  const changed = valor !== initialValor

  return (
    <div className="space-y-2">
      <Label className="font-display font-bold text-sm">{label}</Label>
      <p className="text-xs text-muted-foreground">{description}</p>
      <RichTextEditor
        key={initialValor}
        value={initialValor}
        onChange={setValor}
        placeholder="Escribe aquí el texto..."
      />
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
  )
}

function EnlacesInteresEditor({ initial }: { initial: EnlaceInteres[] }) {
  const queryClient = useQueryClient()
  const [enlaces, setEnlaces] = useState(() => initial.map((e) => ({ ...e, id: crypto.randomUUID() })))

  const { mutate: guardar, isPending } = useMutation({
    mutationFn: () => enlacesInteresApi.save(enlaces.map(({ label, url }) => ({ label, url }))),
    onSuccess: () => {
      toast.success('Enlaces de interés actualizados')
      invalidarConfig(queryClient, 'enlaces_interes')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const editar = (i: number, campo: keyof EnlaceInteres, valor: string) =>
    setEnlaces((prev) => prev.map((e, j) => (j === i ? { ...e, [campo]: valor } : e)))

  const changed = JSON.stringify(enlaces.map(({ label, url }) => ({ label, url }))) !== JSON.stringify(initial)

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        guardar()
      }}
    >
      {enlaces.length === 0 && (
        <p className="text-sm text-muted-foreground">No hay enlaces. Añade el primero.</p>
      )}
      {enlaces.map((e, i) => (
        <div key={e.id} className="flex flex-col sm:flex-row gap-2">
          <Input
            aria-label={`Nombre del enlace ${i + 1}`}
            placeholder="Nombre (ej: Grupo de partidas)"
            value={e.label}
            onChange={(ev) => editar(i, 'label', ev.target.value)}
            maxLength={100}
            required
            className="sm:max-w-56"
          />
          <Input
            aria-label={`URL del enlace ${i + 1}`}
            type="url"
            placeholder="https://t.me/..."
            value={e.url}
            onChange={(ev) => editar(i, 'url', ev.target.value)}
            pattern="https?://.+"
            maxLength={500}
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Eliminar enlace ${i + 1}`}
            onClick={() => setEnlaces((prev) => prev.filter((_, j) => j !== i))}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="font-display font-bold gap-1"
          onClick={() => setEnlaces((prev) => [...prev, { label: '', url: '', id: crypto.randomUUID() }])}
          disabled={enlaces.length >= 50}
        >
          <Plus className="h-3 w-3" />
          Añadir enlace
        </Button>
        <Button type="submit" size="sm" disabled={isPending || !changed} className="font-display font-bold gap-1">
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Guardar
        </Button>
      </div>
    </form>
  )
}

function Seccion({ icono, titulo, descripcion, children }: {
  icono: ReactNode
  titulo: string
  descripcion?: string
  children: ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base text-primary flex items-center gap-2">
          {icono}
          {titulo}
        </CardTitle>
        {descripcion && <CardDescription>{descripcion}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  )
}

const SECCIONES_NUMERICAS = [
  { titulo: 'Configuración de cuotas', descripcion: 'Precios mensuales aplicados a los socios', claves: ['precio_cuota_individual', 'precio_cuota_adicional'] },
  { titulo: 'Configuración de visitas', descripcion: 'Parámetros para el control de visitas de no socios', claves: ['visitas_gratuitas', 'precio_visita_pago'] },
  { titulo: 'Configuración de préstamos', descripcion: 'Límites y plazos de los préstamos de la ludoteca', claves: ['max_prestamos_activos', 'dias_prestamo', 'dias_renovacion', 'max_renovaciones'] },
]

const TEXTOS_LARGOS = [
  {
    clave: 'texto_bienvenida_alta',
    titulo: 'Texto de bienvenida — Formulario de alta',
    descripcion: 'Texto informativo que se muestra al inicio del formulario de solicitud de alta. Se actualiza en tiempo real para los nuevos socios.',
    label: 'Texto de bienvenida',
    ayuda: 'Mostrado al inicio del formulario de alta de nuevos socios',
  },
  {
    clave: 'texto_consentimiento_tiendas',
    titulo: 'Consentimiento de datos — Tiendas colaboradoras',
    descripcion: 'Texto del checkbox de consentimiento visible en el formulario de alta. Actualízalo si cambian las tiendas o el porcentaje de descuento.',
    label: 'Texto de consentimiento',
    ayuda: 'Se muestra como etiqueta del checkbox de consentimiento en el formulario de alta',
  },
]

export function ConfiguracionPage() {
  const { data, isLoading } = useQuery({
    queryKey: QK.CONFIGURACION,
    queryFn: () => configuracionApi.getAll(),
  })

  // Todo sale del listado (una petición): textos largos y enlaces incluidos
  const configs = data?.data ?? []
  const porClave = (claves: string[]) => claves.map((c) => configs.find((x) => x.clave === c)).filter((x): x is ConfigItem => !!x)
  const valorDe = (clave: string) => configs.find((c) => c.clave === clave)?.valor ?? ''
  const enlacesData = JSON.parse(valorDe('enlaces_interes') || '[]') as EnlaceInteres[]
  const cargando = (n: number, alto = 'h-20') => [...Array(n)].map((_, i) => <Skeleton key={i} className={`${alto} w-full`} />)

  const textoLargo = (clave: string, label: string, ayuda: string, alto: string) =>
    isLoading ? <Skeleton className={`${alto} w-full`} /> : (
      // key = valor guardado: al recargar tras guardar, el editor se reinicia con el valor nuevo
      <RichTextConfigField key={valorDe(clave)} clave={clave} initialValor={valorDe(clave)} label={label} description={ayuda} />
    )

  return (
    <>
      <SEOHead title="Configuración" description="Configuración del sistema" path="/directiva/configuracion" noindex />

      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Configuración</h1>
          <p className="text-muted-foreground mt-1">Parámetros globales del sistema de gestión</p>
        </div>

        {SECCIONES_NUMERICAS.map(({ titulo, descripcion, claves }) => (
          <Seccion key={titulo} icono={<Settings className="h-4 w-4" />} titulo={titulo} descripcion={descripcion}>
            {isLoading ? cargando(claves.length) : porClave(claves).map((c) => <ConfigField key={c.clave} config={c} />)}
          </Seccion>
        ))}

        <Seccion icono={<Settings className="h-4 w-4" />} titulo="Comunicaciones y bot" descripcion="Bot de Telegram y avisos a los socios">
          {isLoading ? cargando(2) : porClave(['telegram_bot_username', 'texto_baja_confirmada']).map((c) => <ConfigField key={c.clave} config={c} />)}
          {textoLargo('texto_baja_socio', 'Aviso de baja', 'Se muestra en el popup de confirmación del botón «Darme de baja»', 'h-48')}
        </Seccion>

        <Seccion icono={<Link className="h-4 w-4" />} titulo="Documentos públicos">
          {isLoading ? cargando(2) : configs.some((c) => c.tipo === 'url')
            ? configs.filter((c) => c.tipo === 'url').map((c) => <ConfigField key={c.clave} config={c} />)
            : <p className="text-sm text-muted-foreground">No hay documentos configurados en la base de datos.</p>}
        </Seccion>

        <Seccion icono={<MessageCircle className="h-4 w-4" />} titulo="Enlaces de interés" descripcion="Grupos de Telegram y otros enlaces que los socios ven en Mi panel">
          {isLoading ? cargando(1) : <EnlacesInteresEditor key={JSON.stringify(enlacesData)} initial={enlacesData} />}
        </Seccion>

        {TEXTOS_LARGOS.map(({ clave, titulo, descripcion, label, ayuda }) => (
          <Seccion key={clave} icono={<FileText className="h-4 w-4" />} titulo={titulo} descripcion={descripcion}>
            {textoLargo(clave, label, ayuda, 'h-32')}
          </Seccion>
        ))}
      </div>
    </>
  )
}
