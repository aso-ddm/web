import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Key, User, Users, Loader2, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { SEOHead } from '@/components/SEOHead'
import { sociosApi, type SocioAdmin } from '@/services/api/socios'
import { calcularPrecio } from '@/lib/cuota'
import { configuracionApi } from '@/services/api/configuracion'
import { useAuthStore } from '@/store/authStore'
import type { SolicitudGrupal } from '@/types/api'

// Abre el comprobante en una nueva pestaña autenticado
async function abrirComprobante(socioId: string) {
  const token = useAuthStore.getState().token
  try {
    const res = await fetch(`/api/socios/${socioId}/comprobante`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) { toast.error('No se pudo cargar el comprobante'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener')
    // Liberar la URL después de un momento
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } catch {
    toast.error('Error al obtener el comprobante')
  }
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function tipoCuotaLabel(tipo: string, precioIndividual: number) {
  return { individual: `Individual (${precioIndividual}€/mes)`, conjunta: 'Conjunta' }[tipo] ?? tipo
}

function tipoRelacionLabel(tipo: string | null) {
  if (tipo === 'pareja') return 'Pareja'
  if (tipo === 'familiar_directo') return 'Familiar directo'
  return tipo ?? '—'
}

// ── Tarjeta solicitud individual ──────────────────────────────────────────────

function AltaSolicitudCard({ socio, precioIndividual }: { socio: SocioAdmin; precioIndividual: number }) {
  const queryClient = useQueryClient()
  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['pendientes'] })
    queryClient.invalidateQueries({ queryKey: ['socios-gestion'] })
    queryClient.invalidateQueries({ queryKey: ['socios-activos'] })
  }

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
            <p className="font-display font-bold">{socio.nombre} {socio.apellidos}</p>
            {socio.apodo && <span className="text-xs text-muted-foreground">({socio.apodo})</span>}
          </div>
          <p className="text-sm text-muted-foreground">{socio.email}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            <span>DNI: {socio.dni}</span>
            <span>Cuota: {tipoCuotaLabel(socio.tipo_cuota, precioIndividual)}</span>
            <span>Solicitud: {formatDate(socio.created_at)}</span>
          </div>
          {socio.alias_telegram && (
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span>Telegram: {socio.alias_telegram}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2 flex-shrink-0 items-end">
          <div className="flex gap-2">
            <Button size="sm" onClick={() => aprobar()} disabled={aprobando || rechazando} className="font-display font-bold gap-1 h-9">
              {aprobando ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Aprobar
            </Button>
            <Button size="sm" variant="outline" onClick={() => rechazar()} disabled={aprobando || rechazando} className="font-display h-9 text-destructive border-destructive/30 hover:bg-destructive/10">
              {rechazando ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
              Rechazar
            </Button>
          </div>
          {socio.comprobante_transferencia ? (
            <Button
              size="sm"
              variant="ghost"
              className="font-display h-8 gap-1.5 text-xs text-secondary hover:text-secondary hover:bg-secondary/10"
              onClick={() => abrirComprobante(socio.id)}
            >
              <FileText className="h-3.5 w-3.5" />
              Ver comprobante
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground italic">Sin comprobante</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Tarjeta solicitud conjunta ────────────────────────────────────────────────

function GrupoSolicitudCard({ grupo, precioIndividual, precioAdicional }: { grupo: SolicitudGrupal; precioIndividual: number; precioAdicional: number }) {
  const queryClient = useQueryClient()
  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['pendientes'] })
    queryClient.invalidateQueries({ queryKey: ['socios-gestion'] })
    queryClient.invalidateQueries({ queryKey: ['socios-activos'] })
  }

  const { mutate: aprobar, isPending: aprobando } = useMutation({
    mutationFn: () => sociosApi.aprobarGrupo(grupo.id),
    onSuccess: () => { toast.success(`Solicitud conjunta aprobada (${grupo.miembros.length + 1} socios)`); invalidar() },
    onError: (err: Error) => toast.error(err.message),
  })

  const { mutate: rechazar, isPending: rechazando } = useMutation({
    mutationFn: () => sociosApi.rechazarGrupo(grupo.id),
    onSuccess: () => { toast.success('Solicitud conjunta rechazada'); invalidar() },
    onError: (err: Error) => toast.error(err.message),
  })

  const precioTotal = calcularPrecio(grupo.miembros.length, precioIndividual, precioAdicional)

  return (
    <div className="py-4 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
        <div className="flex-1 min-w-0 space-y-3">
          {/* Titular */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-display font-bold">{grupo.titular.nombre} {grupo.titular.apellidos}</p>
              {grupo.titular.apodo && <span className="text-xs text-muted-foreground">({grupo.titular.apodo})</span>}
              <Badge variant="outline" className="text-xs font-display">Titular</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{grupo.titular.email}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
              <span>DNI: {grupo.titular.dni}</span>
              <span>Solicitud: {formatDate(grupo.created_at)}</span>
            </div>
            {grupo.titular.alias_telegram && (
              <p className="text-xs text-muted-foreground">Telegram: {grupo.titular.alias_telegram}</p>
            )}
          </div>

          {/* Miembros adicionales */}
          {grupo.miembros.length > 0 && (
            <div className="space-y-2 pl-3 border-l-2 border-secondary/30">
              {grupo.miembros.map((miembro) => (
                <div key={miembro.id} className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-display font-bold">{miembro.nombre} {miembro.apellidos}</p>
                    <Badge variant="secondary" className="text-xs font-display">{tipoRelacionLabel(miembro.tipo_relacion)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{miembro.email} · DNI: {miembro.dni}</p>
                </div>
              ))}
            </div>
          )}

          {/* Precio total */}
          <p className="text-sm font-display font-bold text-secondary">
            {precioTotal}€/mes · {grupo.miembros.length + 1} socios
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-col gap-2 flex-shrink-0 items-end">
          <div className="flex gap-2">
            <Button size="sm" onClick={() => aprobar()} disabled={aprobando || rechazando} className="font-display font-bold gap-1 h-9">
              {aprobando ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Aprobar
            </Button>
            <Button size="sm" variant="outline" onClick={() => rechazar()} disabled={aprobando || rechazando} className="font-display h-9 text-destructive border-destructive/30 hover:bg-destructive/10">
              {rechazando ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
              Rechazar
            </Button>
          </div>
          {grupo.titular.comprobante_transferencia ? (
            <Button
              size="sm"
              variant="ghost"
              className="font-display h-8 gap-1.5 text-xs text-secondary hover:text-secondary hover:bg-secondary/10"
              onClick={() => abrirComprobante(grupo.titular.id)}
            >
              <FileText className="h-3.5 w-3.5" />
              Ver comprobante
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground italic">Sin comprobante</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Tarjeta solicitud de llaves ───────────────────────────────────────────────

function LlavesSolicitudCard({ socio }: { socio: SocioAdmin }) {
  const queryClient = useQueryClient()

  const { mutate: aprobar, isPending } = useMutation({
    mutationFn: () => sociosApi.aprobarLlaves(socio.id),
    onSuccess: () => {
      toast.success(`Llaves aprobadas para ${socio.nombre} ${socio.apellidos}`)
      queryClient.invalidateQueries({ queryKey: ['socios-activos-llaves'] })
      queryClient.invalidateQueries({ queryKey: ['socios-llaves'] })
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
        <Button size="sm" onClick={() => aprobar()} disabled={isPending} className="font-display font-bold gap-1 h-9 flex-shrink-0">
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Key className="h-3 w-3" />}
          Aprobar llaves
        </Button>
      </div>
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export function SolicitudesPage() {
  const { data: pendientesData, isLoading: loadingAltas } = useQuery({
    queryKey: ['pendientes'],
    queryFn: () => sociosApi.getPendientes(),
  })

  const { data: sociosData, isLoading: loadingLlaves } = useQuery({
    queryKey: ['socios-activos-llaves'],
    queryFn: () => sociosApi.getAll({ estado: 'activo', limit: 100 }),
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

  const { individuales = [], grupos = [] } = pendientesData?.data ?? {}
  const pendientesLlaves = (sociosData?.data ?? [] as SocioAdmin[]).filter(
    (s: SocioAdmin) => s.fecha_solicitud_llaves && !s.tiene_llaves,
  )

  const totalPendiente = individuales.length + grupos.length + pendientesLlaves.length

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

        {/* Solicitudes de alta individuales */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base text-primary flex items-center gap-2">
              <User className="h-4 w-4" />
              Solicitudes individuales ({loadingAltas ? '…' : individuales.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAltas ? (
              <div className="space-y-4">{[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : individuales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay solicitudes individuales pendientes</p>
              </div>
            ) : (
            individuales.map((s: SocioAdmin) => <AltaSolicitudCard key={s.id} socio={s} precioIndividual={precioIndividual} />)
            )}
          </CardContent>
        </Card>

        {/* Solicitudes conjuntas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base text-primary flex items-center gap-2">
              <Users className="h-4 w-4" />
              Solicitudes conjuntas ({loadingAltas ? '…' : grupos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAltas ? (
              <div className="space-y-4">{[1].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
            ) : grupos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay solicitudes conjuntas pendientes</p>
              </div>
            ) : (
            grupos.map((g: SolicitudGrupal) => <GrupoSolicitudCard key={g.id} grupo={g} precioIndividual={precioIndividual} precioAdicional={precioAdicional} />)
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
              <div className="space-y-4">{[1].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : pendientesLlaves.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay solicitudes de llaves pendientes</p>
              </div>
            ) : (
              pendientesLlaves.map((s: SocioAdmin) => <LlavesSolicitudCard key={s.id} socio={s} />)
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
