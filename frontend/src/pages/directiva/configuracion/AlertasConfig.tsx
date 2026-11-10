import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { configuracionApi, type ConfigItem } from '@/services/api/configuracion'
import { invalidarConfig } from '@/lib/queryKeys'

// Las alertas y sus textos por defecto los define el backend (lib/alertas.ts); aquí solo nombre y variables
const ALERTAS: { clave: string; destino: string; label: string; descripcion: string; variables: string[] }[] = [
  { clave: 'alerta_alta', destino: 'Secretaría', label: 'Nueva solicitud de alta', descripcion: 'Cuando alguien se registra. Va con el comprobante adjunto', variables: ['nombre', 'email', 'cuota'] },
  { clave: 'alerta_llaves', destino: 'Secretaría', label: 'Solicitud de llaves', descripcion: 'Cuando un socio pide las llaves. Desactivada, el socio no puede pedirlas desde la web', variables: ['nombre', 'email', 'telegram'] },
  { clave: 'alerta_baja', destino: 'Secretaría', label: 'Solicitud de baja', descripcion: 'Cuando un socio pide la baja. Desactivada, el socio no puede pedirla desde la web', variables: ['nombre', 'email', 'telegram', 'cuota'] },
  { clave: 'alerta_prestamo', destino: 'Ludotecario', label: 'Nuevo préstamo', descripcion: 'Cuando un socio se lleva un juego', variables: ['socio', 'juego', 'fecha_limite'] },
  { clave: 'alerta_renovacion', destino: 'Ludotecario', label: 'Renovación', descripcion: 'Cuando un socio renueva un préstamo', variables: ['socio', 'juego', 'renovaciones', 'fecha_limite'] },
  { clave: 'alerta_devolucion', destino: 'Ludotecario', label: 'Devolución', descripcion: 'Cuando se devuelve un juego', variables: ['socio', 'juego'] },
]

type Alerta = { activa: boolean; texto: string }

function AlertaField({ config, meta }: { config: ConfigItem; meta: (typeof ALERTAS)[number] }) {
  const inicial = JSON.parse(config.valor) as Alerta
  const [alerta, setAlerta] = useState(inicial)
  const queryClient = useQueryClient()
  const { mutate, isPending } = useMutation({
    mutationFn: () => configuracionApi.update(config.clave, JSON.stringify(alerta)),
    onSuccess: () => {
      toast.success(`Alerta "${meta.label}" actualizada`)
      invalidarConfig(queryClient, config.clave)
    },
    onError: (err: Error) => toast.error(err.message),
  })
  const changed = alerta.activa !== inicial.activa || alerta.texto !== inicial.texto

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Checkbox
          id={`${config.clave}-activa`}
          checked={alerta.activa}
          onCheckedChange={(v) => setAlerta((a) => ({ ...a, activa: v === true }))}
        />
        <Label htmlFor={`${config.clave}-activa`} className="font-display font-bold text-sm">
          {meta.label} <span className="font-normal text-muted-foreground">· {meta.destino}</span>
        </Label>
      </div>
      <p className="text-xs text-muted-foreground">
        {meta.descripcion}. Variables: {meta.variables.map((v) => `{${v}}`).join(' ')}
      </p>
      <Textarea
        aria-label={`Mensaje de la alerta ${meta.label}`}
        value={alerta.texto}
        onChange={(e) => setAlerta((a) => ({ ...a, texto: e.target.value }))}
        rows={4}
        maxLength={1000}
        disabled={!alerta.activa}
      />
      <Button size="sm" onClick={() => mutate()} disabled={isPending || !changed || !alerta.texto.trim()} className="font-display font-bold gap-1">
        {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
        Guardar
      </Button>
    </div>
  )
}

export function AlertasConfig({ configs }: { configs: ConfigItem[] }) {
  return ALERTAS.map((meta) => {
    const config = configs.find((c) => c.clave === meta.clave)
    // key = valor guardado: tras guardar se reinicia con lo nuevo
    return config && <AlertaField key={config.valor} config={config} meta={meta} />
  })
}
