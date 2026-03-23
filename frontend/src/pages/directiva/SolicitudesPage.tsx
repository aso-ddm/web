import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Key, User, Loader2, ClipboardList } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { SEOHead } from '@/components/SEOHead'
import { sociosApi, type SocioAdmin } from '@/services/api/socios'

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function tipoCuotaLabel(tipo: string) {
  return { individual: 'Individual (30€/año)', pareja: 'Pareja (50€/año)', familiar: 'Familiar (65€/año)' }[tipo] ?? tipo
}

function AltaSolicitudCard({ socio }: { socio: SocioAdmin }) {
  const queryClient = useQueryClient()
  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['pendientes'] })

  const { mutate: aprobar, isPending: aprobando } = useMutation({
    mutationFn: () => sociosApi.aprobar(socio.id),
    onSuccess: () => { toast.success(`Alta aprobada para ${socio.nombre} ${socio.apellidos}`); invalidar() },
    onError: (err: Error) => toast.error(err.message),
  })

  const { mutate: rechazar, isPending: rechazando } = useMutation({
    mutationFn: () => sociosApi.rechazar(socio.id),
    onSuccess: () => { toast.success('Solicitud rechazada'); invalidar() },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="py-4 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-bold">
              {socio.nombre} {socio.apellidos}
            </p>
            {socio.apodo && (
              <span className="text-xs text-muted-foreground">({socio.apodo})</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{socio.email}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            <span>DNI: {socio.dni}</span>
            <span>Cuota: {tipoCuotaLabel(socio.tipo_cuota)}</span>
            <span>Solicitud: {formatDate(socio.created_at)}</span>
          </div>
          {socio.alias_telegram && (
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>Telegram: {socio.alias_telegram}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={() => aprobar()}
            disabled={aprobando || rechazando}
            className="font-display font-bold gap-1 h-9"
          >
            {aprobando ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
            Aprobar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => rechazar()}
            disabled={aprobando || rechazando}
            className="font-display h-9 text-destructive border-destructive/30 hover:bg-destructive/10"
          >
            {rechazando ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
            Rechazar
          </Button>
        </div>
      </div>
    </div>
  )
}

function LlavesSolicitudCard({ socio }: { socio: SocioAdmin }) {
  const queryClient = useQueryClient()

  const { mutate: aprobar, isPending } = useMutation({
    mutationFn: () => sociosApi.aprobarLlaves(socio.id),
    onSuccess: () => {
      toast.success(`Llaves aprobadas para ${socio.nombre} ${socio.apellidos}`)
      queryClient.invalidateQueries({ queryKey: ['socios-activos-llaves'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="py-4 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex-1 min-w-0 space-y-1">
          <p className="font-display font-bold">
            {socio.nombre} {socio.apellidos}
            {socio.apodo && <span className="text-xs text-muted-foreground ml-1">({socio.apodo})</span>}
          </p>
          <p className="text-sm text-muted-foreground">{socio.email}</p>
          <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
            <span>Solicitud: {formatDate(socio.fecha_solicitud_llaves)}</span>
            <span>Socio desde: {formatDate(socio.fecha_alta)}</span>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => aprobar()}
          disabled={isPending}
          className="font-display font-bold gap-1 h-9 flex-shrink-0"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Key className="h-3 w-3" />}
          Aprobar llaves
        </Button>
      </div>
    </div>
  )
}

export function SolicitudesPage() {
  const { data: pendientesData, isLoading: loadingAltas } = useQuery({
    queryKey: ['pendientes'],
    queryFn: () => sociosApi.getPendientes(),
  })

  // Socios activos con solicitud de llaves pendiente
  const { data: sociosData, isLoading: loadingLlaves } = useQuery({
    queryKey: ['socios-activos-llaves'],
    queryFn: () => sociosApi.getAll({ estado: 'activo', limit: 100 }),
  })

  const pendientesAlta = pendientesData?.data ?? []
  const pendientesLlaves = (sociosData?.data ?? []).filter(
    (s) => s.fecha_solicitud_llaves && !s.tiene_llaves,
  )

  const totalPendiente = pendientesAlta.length + pendientesLlaves.length

  return (
    <>
      <SEOHead title="Solicitudes pendientes" description="Panel de directiva" path="/directiva/solicitudes" noindex />

      <div className="space-y-6">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Solicitudes pendientes</h1>
          <p className="text-muted-foreground mt-1">
            {totalPendiente === 0
              ? 'No hay solicitudes pendientes'
              : `${totalPendiente} solicitud${totalPendiente !== 1 ? 'es' : ''} pendiente${totalPendiente !== 1 ? 's' : ''} de revisión`}
          </p>
        </div>

        {/* Solicitudes de alta */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base text-primary flex items-center gap-2">
              <User className="h-4 w-4" />
              Solicitudes de alta ({loadingAltas ? '…' : pendientesAlta.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAltas ? (
              <div className="space-y-4">
                {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
              </div>
            ) : pendientesAlta.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay solicitudes de alta pendientes</p>
              </div>
            ) : (
              pendientesAlta.map((s) => <AltaSolicitudCard key={s.id} socio={s} />)
            )}
          </CardContent>
        </Card>

        {/* Solicitudes de llaves */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base text-primary flex items-center gap-2">
              <Key className="h-4 w-4" />
              Solicitudes de llaves ({loadingLlaves ? '…' : pendientesLlaves.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingLlaves ? (
              <div className="space-y-4">
                {[1].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : pendientesLlaves.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay solicitudes de llaves pendientes</p>
              </div>
            ) : (
              pendientesLlaves.map((s) => <LlavesSolicitudCard key={s.id} socio={s} />)
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
