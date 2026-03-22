import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Settings, Loader2, Save } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { SEOHead } from '@/components/SEOHead'
import { configuracionApi, type ConfigItem } from '@/services/api/configuracion'

const configLabels: Record<string, { label: string; description: string; suffix?: string }> = {
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
      <p className="text-xs text-muted-foreground">
        Valor actual en BD: <strong>{config.valor}</strong>
        {meta?.suffix && ` ${meta.suffix}`}
      </p>
    </div>
  )
}

export function ConfiguracionPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['configuracion'],
    queryFn: () => configuracionApi.getAll(),
  })

  const configs = data?.data ?? []

  return (
    <>
      <SEOHead title="Configuración" description="Configuración del sistema" path="/directiva/configuracion" noindex />

      <div className="space-y-6 max-w-xl">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Configuración</h1>
          <p className="text-muted-foreground mt-1">Parámetros globales del sistema de gestión</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base text-primary flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Parámetros del sistema
            </CardTitle>
            <CardDescription>
              Estos valores afectan al comportamiento del sistema para todos los socios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoading ? (
              [1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)
            ) : configs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay parámetros de configuración disponibles.</p>
            ) : (
              configs.map((c) => <ConfigField key={c.clave} config={c} />)
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
