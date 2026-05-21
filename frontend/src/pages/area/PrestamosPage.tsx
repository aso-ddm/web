import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  BookOpen, Clock, CheckCircle2, XCircle, Plus, Search, Loader2, Package
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { SEOHead } from '@/components/SEOHead'
import { prestamosApi } from '@/services/api/prestamos'
import { juegosApi } from '@/services/api/juegos'
import type { EstadoPrestamo, Juego } from '@/types/api'

const estadoConfig: Record<EstadoPrestamo, { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pendiente: { label: 'Pendiente', icon: <Clock className="h-3 w-3" />, variant: 'secondary' },
  aprobado: { label: 'Aprobado', icon: <CheckCircle2 className="h-3 w-3" />, variant: 'default' },
  activo: { label: 'Activo', icon: <CheckCircle2 className="h-3 w-3" />, variant: 'default' },
  devuelto: { label: 'Devuelto', icon: <CheckCircle2 className="h-3 w-3" />, variant: 'outline' },
  rechazado: { label: 'Cancelado', icon: <XCircle className="h-3 w-3" />, variant: 'destructive' },
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function JuegoCard({ juego, onSelect }: { juego: Juego; onSelect: (j: Juego) => void }) {
  const disponible = juego.estado === 'en_estanteria'
  return (
    <button
      onClick={() => disponible && onSelect(juego)}
      disabled={!disponible}
      className={`w-full text-left p-3 rounded-lg border transition-colors ${
        disponible
          ? 'border-border hover:border-primary hover:bg-accent/30 cursor-pointer'
          : 'border-border bg-muted/30 opacity-60 cursor-not-allowed'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm truncate">{juego.nombre}</p>
          {(juego.num_jugadores_min || juego.num_jugadores_max) && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {juego.num_jugadores_min}
              {juego.num_jugadores_max && juego.num_jugadores_max !== juego.num_jugadores_min
                ? `–${juego.num_jugadores_max}`
                : ''}{' '}
              jugadores
            </p>
          )}
        </div>
        <Badge
          variant={disponible ? 'default' : 'secondary'}
          className="text-xs flex-shrink-0"
        >
          {disponible ? 'En estantería' : juego.estado === 'prestado' ? 'Prestado' : 'No disponible'}
        </Badge>
      </div>
    </button>
  )
}

function SolicitarDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [search, setSearch] = useState('')
  const [juegoSeleccionado, setJuegoSeleccionado] = useState<Juego | null>(null)
  const [notas, setNotas] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['juegos-catalogo', search],
    queryFn: () => juegosApi.getAll({ search: search || undefined, limit: 50 }),
    enabled: open,
  })

  const { mutate: solicitar, isPending } = useMutation({
    mutationFn: () => prestamosApi.solicitar(juegoSeleccionado!.id, notas || undefined),
    onSuccess: () => {
      toast.success(`Préstamo de "${juegoSeleccionado?.nombre}" solicitado correctamente`)
      queryClient.invalidateQueries({ queryKey: ['mis-prestamos'] })
      handleClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleClose = () => {
    setSearch('')
    setJuegoSeleccionado(null)
    setNotas('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display text-primary">Solicitar préstamo</DialogTitle>
          <DialogDescription>
            Selecciona un juego disponible del catálogo de la ludoteca
          </DialogDescription>
        </DialogHeader>

        {!juegoSeleccionado ? (
          <>
            {/* Buscador */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar juego..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Lista de juegos */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ minHeight: 0, maxHeight: '50vh' }}>
              {isLoading ? (
                [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-16 w-full" />)
              ) : !data?.data.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No hay juegos disponibles</p>
                </div>
              ) : (
                data.data.map((juego) => (
                  <JuegoCard key={juego.id} juego={juego} onSelect={setJuegoSeleccionado} />
                ))
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            {/* Juego seleccionado */}
            <div className="p-3 rounded-lg border border-primary/30 bg-accent/20">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display font-bold">{juegoSeleccionado.nombre}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground"
                  onClick={() => setJuegoSeleccionado(null)}
                >
                  Cambiar
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-display font-bold">Notas (opcional)</label>
              <Input
                placeholder="Alguna indicación para el ludotecario..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter className="mt-2 gap-2">
          <Button variant="outline" onClick={handleClose} className="font-display">
            Cancelar
          </Button>
          {juegoSeleccionado && (
            <Button
              onClick={() => solicitar()}
              disabled={isPending}
              className="font-display font-bold"
            >
              {isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Solicitando...</>
              ) : (
                'Confirmar solicitud'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PrestamosPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['mis-prestamos', 1],
    queryFn: () => prestamosApi.misPrestamos(1),
  })

  const { mutate: cancelar } = useMutation({
    mutationFn: (id: string) => prestamosApi.cancelar(id),
    onSuccess: () => {
      toast.success('Solicitud cancelada')
      queryClient.invalidateQueries({ queryKey: ['mis-prestamos'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const prestamos = data?.data ?? []
  const activos = prestamos.filter((p) => ['activo', 'aprobado'].includes(p.estado))
  const pendientes = prestamos.filter((p) => p.estado === 'pendiente')
  const historial = prestamos.filter((p) => ['devuelto', 'rechazado'].includes(p.estado))

  return (
    <>
      <SEOHead title="Mis préstamos" description="Historial y gestión de préstamos" path="/area/prestamos" noindex />

      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Mis préstamos</h1>
            <p className="text-muted-foreground mt-1">Gestiona tus solicitudes y préstamos activos</p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="font-display font-bold gap-2">
            <Plus className="h-4 w-4" />
            Solicitar juego
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
          </div>
        ) : prestamos.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h2 className="font-display font-bold text-lg text-primary mb-1">Sin préstamos aún</h2>
              <p className="text-muted-foreground text-sm mb-4">
                Solicita un juego de la ludoteca cuando quieras llevártelo a casa
              </p>
              <Button onClick={() => setDialogOpen(true)} className="font-display font-bold gap-2">
                <Plus className="h-4 w-4" />
                Solicitar mi primer juego
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Activos y aprobados */}
            {activos.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base text-primary flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Préstamos activos ({activos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PrestamosList prestamos={activos} onCancelar={cancelar} />
                </CardContent>
              </Card>
            )}

            {/* Pendientes */}
            {pendientes.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base text-primary flex items-center gap-2">
                    <Clock className="h-4 w-4 text-amber-500" />
                    Pendientes de aprobación ({pendientes.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PrestamosList prestamos={pendientes} onCancelar={cancelar} showCancel />
                </CardContent>
              </Card>
            )}

            {/* Historial */}
            {historial.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base text-muted-foreground">
                    Historial ({historial.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <PrestamosList prestamos={historial} onCancelar={cancelar} />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <SolicitarDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  )
}

function PrestamosList({
  prestamos,
  onCancelar,
  showCancel = false,
}: {
  prestamos: ReturnType<typeof prestamosApi.misPrestamos> extends Promise<infer R>
    ? R extends { data: (infer T)[] } ? T[] : never
    : never
  onCancelar: (id: string) => void
  showCancel?: boolean
}) {
  return (
    <ul className="divide-y divide-border">
      {prestamos.map((p, idx) => {
        const cfg = estadoConfig[p.estado]
        return (
          <li key={p.id} className={`py-3 ${idx === 0 ? '' : ''}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm truncate">
                  {p.juego?.nombre ?? 'Juego desconocido'}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                  <span>Solicitado: {formatDate(p.fecha_solicitud)}</span>
                  {p.fecha_prestamo && <span>Prestado: {formatDate(p.fecha_prestamo)}</span>}
                  {p.fecha_devolucion && <span>Devuelto: {formatDate(p.fecha_devolucion)}</span>}
                </div>
                {p.motivo_rechazo && (
                  <p className="text-xs text-destructive mt-1">Motivo: {p.motivo_rechazo}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={cfg.variant} className="font-display gap-1 text-xs">
                  {cfg.icon}
                  {cfg.label}
                </Badge>
                {showCancel && p.estado === 'pendiente' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                    onClick={() => onCancelar(p.id)}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
            {p.notas && (
              <>
                <Separator className="my-2" />
                <p className="text-xs text-muted-foreground italic">Nota: {p.notas}</p>
              </>
            )}
          </li>
        )
      })}
    </ul>
  )
}
