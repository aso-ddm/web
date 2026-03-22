import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CheckCircle2, Clock, XCircle, RotateCcw, Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { SEOHead } from '@/components/SEOHead'
import { prestamosApi } from '@/services/api/prestamos'
import type { Prestamo, EstadoPrestamo } from '@/types/api'

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function nombreSocio(p: Prestamo) {
  if (!p.socio) return 'Socio desconocido'
  const apodo = p.socio.apodo ? ` (${p.socio.apodo})` : ''
  return `${p.socio.nombre} ${p.socio.apellidos}${apodo}`
}

function RechazarDialog({ prestamo, onClose }: { prestamo: Prestamo; onClose: () => void }) {
  const [motivo, setMotivo] = useState('')
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: () => prestamosApi.rechazar(prestamo.id, motivo || undefined),
    onSuccess: () => {
      toast.success('Préstamo rechazado')
      queryClient.invalidateQueries({ queryKey: ['prestamos-gestion'] })
      onClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-primary">Rechazar préstamo</DialogTitle>
          <DialogDescription>
            <strong>{nombreSocio(prestamo)}</strong> — <em>{prestamo.juego?.titulo}</em>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5 py-2">
          <label className="text-sm font-display font-bold">Motivo del rechazo (opcional)</label>
          <Input
            placeholder="Ej: el juego está reservado para un evento..."
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="font-display">Cancelar</Button>
          <Button
            variant="destructive"
            onClick={() => mutate()}
            disabled={isPending}
            className="font-display font-bold"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rechazar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AccionesPrestamo({ prestamo }: { prestamo: Prestamo }) {
  const queryClient = useQueryClient()
  const [rechazando, setRechazando] = useState(false)

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['prestamos-gestion'] })

  const { mutate: aprobar, isPending: aprobando } = useMutation({
    mutationFn: () => prestamosApi.aprobar(prestamo.id),
    onSuccess: () => { toast.success('Préstamo aprobado'); invalidar() },
    onError: (err: Error) => toast.error(err.message),
  })

  const { mutate: activar, isPending: activando } = useMutation({
    mutationFn: () => prestamosApi.activar(prestamo.id),
    onSuccess: () => { toast.success('Préstamo activado — juego entregado'); invalidar() },
    onError: (err: Error) => toast.error(err.message),
  })

  const { mutate: devolver, isPending: devolviendo } = useMutation({
    mutationFn: () => prestamosApi.confirmarDevolucion(prestamo.id),
    onSuccess: () => { toast.success('Devolución confirmada'); invalidar() },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <>
      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
        {prestamo.estado === 'pendiente' && (
          <>
            <Button
              size="sm"
              onClick={() => aprobar()}
              disabled={aprobando}
              className="font-display font-bold gap-1 h-8"
            >
              {aprobando ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Aprobar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRechazando(true)}
              className="font-display h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <XCircle className="h-3 w-3 mr-1" />
              Rechazar
            </Button>
          </>
        )}
        {prestamo.estado === 'aprobado' && (
          <>
            <Button
              size="sm"
              onClick={() => activar()}
              disabled={activando}
              className="font-display font-bold gap-1 h-8"
            >
              {activando ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
              Entregar juego
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setRechazando(true)}
              className="font-display h-8 text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <XCircle className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
          </>
        )}
        {prestamo.estado === 'activo' && (
          <Button
            size="sm"
            onClick={() => devolver()}
            disabled={devolviendo}
            className="font-display font-bold gap-1 h-8"
          >
            {devolviendo ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            Confirmar devolución
          </Button>
        )}
      </div>

      {rechazando && (
        <RechazarDialog prestamo={prestamo} onClose={() => setRechazando(false)} />
      )}
    </>
  )
}

const estadoBadge: Record<EstadoPrestamo, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pendiente: { label: 'Pendiente', variant: 'secondary' },
  aprobado: { label: 'Aprobado', variant: 'default' },
  activo: { label: 'Activo', variant: 'default' },
  devuelto: { label: 'Devuelto', variant: 'outline' },
  rechazado: { label: 'Cancelado', variant: 'destructive' },
}

function PrestamoRow({ prestamo }: { prestamo: Prestamo }) {
  const cfg = estadoBadge[prestamo.estado]
  return (
    <div className="py-3 border-b border-border last:border-0">
      <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-bold text-sm">{prestamo.juego?.titulo ?? '—'}</p>
            <Badge variant={cfg.variant} className="font-display text-xs">{cfg.label}</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {nombreSocio(prestamo)}
            {prestamo.socio?.email && (
              <span className="text-muted-foreground/70"> · {prestamo.socio.email}</span>
            )}
          </p>
          <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-1">
            <span>Solicitud: {formatDate(prestamo.fecha_solicitud)}</span>
            {prestamo.fecha_aprobacion && <span>Aprobado: {formatDate(prestamo.fecha_aprobacion)}</span>}
            {prestamo.fecha_prestamo && <span>Entregado: {formatDate(prestamo.fecha_prestamo)}</span>}
            {prestamo.fecha_devolucion && <span>Devuelto: {formatDate(prestamo.fecha_devolucion)}</span>}
          </div>
          {prestamo.notas && (
            <p className="text-xs text-muted-foreground italic mt-1">"{prestamo.notas}"</p>
          )}
          {prestamo.motivo_rechazo && (
            <p className="text-xs text-destructive mt-1">Motivo: {prestamo.motivo_rechazo}</p>
          )}
        </div>
        <AccionesPrestamo prestamo={prestamo} />
      </div>
    </div>
  )
}

function TabContent({ estados, emptyMsg }: { estados: EstadoPrestamo[]; emptyMsg: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['prestamos-gestion', estados[0]],
    queryFn: () => prestamosApi.getAll({ estado: estados[0] }),
  })

  const todos = estados.length > 1
    ? (data?.data ?? [])
    : (data?.data ?? [])

  if (isLoading) {
    return (
      <div className="space-y-3 pt-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    )
  }

  if (todos.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">{emptyMsg}</p>
      </div>
    )
  }

  return (
    <div>
      {todos.map((p) => <PrestamoRow key={p.id} prestamo={p} />)}
    </div>
  )
}

function AllPrestamos() {
  const queryClient = useQueryClient()

  const { data: pendData } = useQuery({
    queryKey: ['prestamos-gestion', 'pendiente'],
    queryFn: () => prestamosApi.getAll({ estado: 'pendiente' }),
  })
  const { data: aprobData } = useQuery({
    queryKey: ['prestamos-gestion', 'aprobado'],
    queryFn: () => prestamosApi.getAll({ estado: 'aprobado' }),
  })
  const { data: activoData } = useQuery({
    queryKey: ['prestamos-gestion', 'activo'],
    queryFn: () => prestamosApi.getAll({ estado: 'activo' }),
  })
  const { data: histData } = useQuery({
    queryKey: ['prestamos-gestion', 'devuelto'],
    queryFn: () => prestamosApi.getAll({ estado: 'devuelto' }),
  })

  const pendientes = pendData?.data ?? []
  const aprobados = aprobData?.data ?? []
  const activos = activoData?.data ?? []
  const historial = histData?.data ?? []

  const pendCount = pendientes.length + aprobados.length

  return (
    <Tabs defaultValue="activos">
      <TabsList className="mb-4">
        <TabsTrigger value="activos" className="font-display relative">
          Activos
          {pendCount > 0 && (
            <span className="ml-1.5 bg-secondary text-secondary-foreground text-xs rounded-full px-1.5 py-0.5 font-bold">
              {pendCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="historial" className="font-display">Historial</TabsTrigger>
      </TabsList>

      <TabsContent value="activos">
        {pendientes.length === 0 && aprobados.length === 0 && activos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay préstamos activos ni pendientes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendientes.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-sm text-amber-600 flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Pendientes de aprobación ({pendientes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pendientes.map((p) => <PrestamoRow key={p.id} prestamo={p} />)}
                </CardContent>
              </Card>
            )}
            {aprobados.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-sm text-primary flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Aprobados — pendientes de entrega ({aprobados.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aprobados.map((p) => <PrestamoRow key={p.id} prestamo={p} />)}
                </CardContent>
              </Card>
            )}
            {activos.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-sm text-emerald-600 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" /> En préstamo ({activos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activos.map((p) => <PrestamoRow key={p.id} prestamo={p} />)}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </TabsContent>

      <TabsContent value="historial">
        {historial.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin historial de préstamos aún</p>
          </div>
        ) : (
          <Card>
            <CardContent className="pt-4">
              {historial.map((p) => <PrestamoRow key={p.id} prestamo={p} />)}
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  )
}

export function GestionPrestamosPage() {
  return (
    <>
      <SEOHead title="Gestión de préstamos" description="Panel de préstamos de la ludoteca" path="/ludoteca/prestamos" noindex />

      <div className="space-y-6">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Gestión de préstamos</h1>
          <p className="text-muted-foreground mt-1">Aprueba solicitudes, registra entregas y confirmación de devoluciones</p>
        </div>

        <AllPrestamos />
      </div>
    </>
  )
}
