import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  BookOpen, Plus, Search, Loader2, Package, RotateCcw, RefreshCw, AlertTriangle, Clock,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SEOHead } from '@/components/SEOHead'
import { prestamosApi } from '@/services/api/prestamos'
import { juegosApi } from '@/services/api/juegos'
import { configuracionApi } from '@/services/api/configuracion'
import { invalidarJuegos, invalidarPrestamos } from '@/lib/queryKeys'
import type { Juego, Prestamo } from '@/types/api'

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function diasRestantes(fechaLimite: string): number {
  const diff = new Date(fechaLimite).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function FechaLimiteBadge({ fechaLimite }: { fechaLimite: string }) {
  const dias = diasRestantes(fechaLimite)
  if (dias < 0) return (
    <span className="flex items-center gap-1 text-xs text-destructive font-medium">
      <AlertTriangle className="h-3 w-3" /> Vencido hace {Math.abs(dias)}d
    </span>
  )
  if (dias <= 3) return (
    <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
      <Clock className="h-3 w-3" /> Vence en {dias}d
    </span>
  )
  return <span className="text-xs text-muted-foreground">Hasta {formatDate(fechaLimite)}</span>
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
                : ''}{' '}jugadores
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

  const { data: configData } = useQuery({
    queryKey: ['config', 'dias_prestamo'],
    queryFn: () => configuracionApi.getOne('dias_prestamo'),
    enabled: open,
  })
  const diasPrestamo = configData?.data?.valor ?? '14'

  const { data, isLoading } = useQuery({
    queryKey: ['juegos-catalogo', search],
    queryFn: () => juegosApi.getAll({ search: search || undefined, limit: 50 }),
    enabled: open,
  })

  const { mutate: solicitar, isPending } = useMutation({
    mutationFn: () => prestamosApi.solicitar(juegoSeleccionado!.id, notas || undefined),
    onSuccess: () => {
      toast.success(`Préstamo de "${juegoSeleccionado?.nombre}" creado — tienes ${diasPrestamo} días`)
      invalidarPrestamos(queryClient)
      invalidarJuegos(queryClient)
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
          <DialogTitle className="font-display text-primary">Pedir un juego prestado</DialogTitle>
          <DialogDescription>
            Selecciona un juego disponible. El préstamo dura {diasPrestamo} días y puedes renovarlo desde aquí.
          </DialogDescription>
        </DialogHeader>

        {!juegoSeleccionado ? (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar juego..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
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
            <div className="p-3 rounded-lg border border-primary/30 bg-accent/20">
              <div className="flex items-start justify-between gap-2">
                <p className="font-display font-bold">{juegoSeleccionado.nombre}</p>
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
                placeholder="Alguna indicación..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter className="mt-2 gap-2">
          <Button variant="outline" onClick={handleClose} className="font-display">Cancelar</Button>
          {juegoSeleccionado && (
            <Button onClick={() => solicitar()} disabled={isPending} className="font-display font-bold">
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Procesando...</> : 'Confirmar préstamo'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PrestamoCard({ prestamo, maxRenovaciones }: { prestamo: Prestamo; maxRenovaciones: number }) {
  const queryClient = useQueryClient()
  const puedeRenovar = prestamo.renovaciones < maxRenovaciones

  const { mutate: renovar, isPending: renovando } = useMutation({
    mutationFn: () => prestamosApi.renovar(prestamo.id),
    onSuccess: () => {
      toast.success('Préstamo renovado')
      queryClient.invalidateQueries({ queryKey: ['mis-prestamos'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const { mutate: devolver, isPending: devolviendo } = useMutation({
    mutationFn: () => prestamosApi.devolucion(prestamo.id),
    onSuccess: () => {
      toast.success('Devolución registrada')
      invalidarPrestamos(queryClient)
      invalidarJuegos(queryClient)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="py-3 border-b border-border last:border-0">
      <div className="flex items-start justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm">{prestamo.juego?.nombre ?? '—'}</p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
            <span>Prestado: {formatDate(prestamo.fecha_prestamo)}</span>
            <FechaLimiteBadge fechaLimite={prestamo.fecha_limite} />
          </div>
          {prestamo.renovaciones > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Renovado {prestamo.renovaciones}/{maxRenovaciones} veces
            </p>
          )}
          {prestamo.notas && (
            <p className="text-xs text-muted-foreground italic mt-1">"{prestamo.notas}"</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {puedeRenovar && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => renovar()}
              disabled={renovando}
              className="font-display h-8 gap-1"
            >
              {renovando ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
              Renovar
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => devolver()}
            disabled={devolviendo}
            className="font-display font-bold h-8 gap-1"
          >
            {devolviendo ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            Devolver
          </Button>
        </div>
      </div>
    </div>
  )
}

export function PrestamosPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['mis-prestamos', 1],
    queryFn: () => prestamosApi.misPrestamos(1),
  })

  const { data: configData } = useQuery({
    queryKey: ['config', 'max_renovaciones'],
    queryFn: () => configuracionApi.getOne('max_renovaciones'),
  })
  const maxRenovaciones = parseInt(configData?.data?.valor ?? '2', 10)

  const { data: configMaxPrestamos } = useQuery({
    queryKey: ['config', 'max_prestamos_activos'],
    queryFn: () => configuracionApi.getOne('max_prestamos_activos'),
  })
  const maxPrestamosActivos = parseInt(configMaxPrestamos?.data?.valor ?? '3', 10)

  const prestamos = data?.data ?? []
  const activos = prestamos.filter((p) => p.estado === 'activo')
  const historial = prestamos.filter((p) => p.estado === 'devuelto')
  const limitePrestamosAlcanzado = activos.length >= maxPrestamosActivos

  return (
    <>
      <SEOHead title="Mis préstamos" description="Historial y gestión de préstamos" path="/area/prestamos" noindex />

      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Mis préstamos</h1>
            <p className="text-muted-foreground mt-1">Gestiona tus préstamos activos y devoluciones</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Button
              onClick={() => setDialogOpen(true)}
              disabled={limitePrestamosAlcanzado}
              className="font-display font-bold gap-2"
            >
              <Plus className="h-4 w-4" /> Pedir juego prestado
            </Button>
            {limitePrestamosAlcanzado && (
              <p className="text-xs text-muted-foreground">
                Límite de {maxPrestamosActivos} préstamos simultáneos alcanzado
              </p>
            )}
          </div>
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
                Llévate un juego de la ludoteca cuando quieras
              </p>
              <Button onClick={() => setDialogOpen(true)} className="font-display font-bold gap-2">
                <Plus className="h-4 w-4" /> Pedir mi primer juego
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {activos.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base text-primary">
                    Préstamos activos ({activos.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {activos.map((p) => (
                    <PrestamoCard key={p.id} prestamo={p} maxRenovaciones={maxRenovaciones} />
                  ))}
                </CardContent>
              </Card>
            )}

            {historial.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base text-muted-foreground">
                    Historial ({historial.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {historial.map((p) => (
                    <div key={p.id} className="py-2 border-b border-border last:border-0 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-display font-bold text-sm">{p.juego?.nombre ?? '—'}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(p.fecha_prestamo)} → {formatDate(p.fecha_devolucion)}
                        </p>
                      </div>
                      <Badge variant="outline" className="font-display text-xs">Devuelto</Badge>
                    </div>
                  ))}
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
