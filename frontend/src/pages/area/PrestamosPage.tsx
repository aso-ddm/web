import { useState } from 'react'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { BookOpen, Plus, Loader2, RotateCcw, RefreshCw, AlertTriangle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SEOHead } from '@/components/atoms/SEOHead'
import { QueryError } from '@/components/molecules/QueryError'
import { PrestamoDevueltoRow } from '@/components/molecules/PrestamoDevueltoRow'
import { prestamosApi } from '@/services/api/prestamos'
import { QK, invalidarJuegos, invalidarPrestamos } from '@/lib/queryKeys'
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog'
import type { Prestamo } from '@/types/api'
import { formatDate, diasRestantes } from '@/lib/format'
import { useConfigNumero } from '@/hooks/useConfigValor'
import { useMisPrestamosActivos } from '@/hooks/useMisPrestamosActivos'
import { SolicitarPrestamoDialog } from '@/components/organisms/SolicitarPrestamoDialog'

function FechaLimiteBadge({ fechaLimite }: { fechaLimite: string }) {
  const dias = diasRestantes(fechaLimite)
  if (dias < 0) return (
    <span className="flex items-center gap-1 text-xs text-destructive font-medium">
      <AlertTriangle className="h-3 w-3" /> Vencido hace {Math.abs(dias)}d
    </span>
  )
  if (dias <= 3) return (
    <span className="flex items-center gap-1 text-xs text-amber-700 font-medium">
      <Clock className="h-3 w-3" /> {dias === 0 ? 'Vence hoy' : `Vence en ${dias}d`}
    </span>
  )
  return <span className="text-xs text-muted-foreground">Hasta {formatDate(fechaLimite)}</span>
}

function PrestamoCard({ prestamo, maxRenovaciones }: { prestamo: Prestamo; maxRenovaciones: number }) {
  const queryClient = useQueryClient()
  const puedeRenovar = prestamo.renovaciones < maxRenovaciones

  const { mutate: renovar, isPending: renovando } = useMutation({
    mutationFn: () => prestamosApi.renovar(prestamo.id),
    onSuccess: () => {
      toast.success('Préstamo renovado')
      invalidarPrestamos(queryClient)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const [confirmarDevolucion, setConfirmarDevolucion] = useState(false)
  const { mutate: devolver, isPending: devolviendo } = useMutation({
    mutationFn: () => prestamosApi.devolucion(prestamo.id),
    onSuccess: () => {
      setConfirmarDevolucion(false)
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
            <span>Prestado: {formatDate(prestamo.fecha_prestamo)}</span>
            <FechaLimiteBadge fechaLimite={prestamo.fecha_limite} />
            <span>Renovado {prestamo.renovaciones}/{maxRenovaciones}</span>
          </div>
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
            onClick={() => setConfirmarDevolucion(true)}
            disabled={devolviendo}
            className="font-display font-bold h-8 gap-1"
          >
            {devolviendo ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
            Devolver
          </Button>
          <ConfirmDialog
            open={confirmarDevolucion}
            onOpenChange={setConfirmarDevolucion}
            title={`¿Has devuelto ${prestamo.juego?.nombre ?? 'el juego'} a la estantería?`}
            description="El préstamo quedará cerrado y el juego disponible para otros socios."
            confirmLabel="Sí, lo he devuelto"
            onConfirm={() => devolver()}
            pending={devolviendo}
          />
        </div>
      </div>
    </div>
  )
}

export function PrestamosPage() {
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data: activos = [], isLoading: loadingActivos, isError: errorActivos, refetch: recargarActivos } = useMisPrestamosActivos()
  const historialQuery = useInfiniteQuery({
    queryKey: QK.MIS_PRESTAMOS_HISTORIAL,
    queryFn: ({ pageParam }) => prestamosApi.misPrestamos({ estado: 'devuelto', page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  })
  const historial = historialQuery.data?.pages.flatMap((p) => p.data) ?? []
  const totalHistorial = historialQuery.data?.pages[0]?.total ?? 0
  const isLoading = loadingActivos || historialQuery.isLoading
  const isError = errorActivos || historialQuery.isError
  const refetch = () => { recargarActivos(); historialQuery.refetch() }

  const maxRenovaciones = useConfigNumero('max_renovaciones', 2)

  const maxPrestamosActivos = useConfigNumero('max_prestamos_activos', 3)

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
        ) : isError ? (
          <QueryError onRetry={() => refetch()} />
        ) : activos.length === 0 && historial.length === 0 ? (
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
                    Historial ({totalHistorial})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {historial.map((p) => <PrestamoDevueltoRow key={p.id} prestamo={p} />)}
                  {historialQuery.hasNextPage && (
                    <div className="flex justify-center pt-3">
                      <Button variant="outline" size="sm" className="font-display gap-2" disabled={historialQuery.isFetchingNextPage} onClick={() => historialQuery.fetchNextPage()}>
                        {historialQuery.isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />}
                        Cargar más
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <SolicitarPrestamoDialog key={String(dialogOpen)} open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  )
}
