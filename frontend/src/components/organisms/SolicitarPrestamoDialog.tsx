import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, Loader2, Package } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { useConfig, useConfigNumero } from '@/hooks/useConfigValor'
import { useMisPrestamosActivos } from '@/hooks/useMisPrestamosActivos'
import { prestamosApi } from '@/services/api/prestamos'
import { juegosApi } from '@/services/api/juegos'
import { QK, invalidarJuegos, invalidarPrestamos } from '@/lib/queryKeys'
import { formatJugadores } from '@/lib/format'
import type { Juego } from '@/types/api'

function JuegoOpcion({ juego, onSelect }: { juego: Juego; onSelect: (j: Juego) => void }) {
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
              {formatJugadores(juego)}
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

/**
 * Pedir un juego prestado. Sin `juegoInicial` empieza con el buscador (Mis préstamos); con él, directamente en la
 * confirmación (Ludoteca). Montarlo con `key` para que cada apertura empiece limpia.
 */
export function SolicitarPrestamoDialog({ open, onClose, juegoInicial = null }: {
  open: boolean
  onClose: () => void
  juegoInicial?: Juego | null
}) {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [juegoSeleccionado, setJuegoSeleccionado] = useState<Juego | null>(juegoInicial)
  // El backend rechaza el préstamo por encima del límite: se avisa antes de intentarlo
  const { data: activos = [] } = useMisPrestamosActivos()
  const maxPrestamos = useConfigNumero('max_prestamos_activos', 3)
  const limiteAlcanzado = activos.length >= maxPrestamos
  const [notas, setNotas] = useState('')
  const queryClient = useQueryClient()

  const diasPrestamo = useConfig('dias_prestamo', open).data ?? '14'

  const { data, isLoading } = useQuery({
    queryKey: QK.JUEGOS_CATALOGO(debouncedSearch),
    queryFn: () => juegosApi.getAll({ search: debouncedSearch || undefined, limit: 50 }),
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
                  <JuegoOpcion key={juego.id} juego={juego} onSelect={setJuegoSeleccionado} />
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
            {limiteAlcanzado && (
              <p className="text-sm text-destructive">
                Ya tienes {maxPrestamos} préstamos activos, el máximo. Devuelve alguno para pedir otro.
              </p>
            )}
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
            <Button onClick={() => solicitar()} disabled={isPending || limiteAlcanzado} className="font-display font-bold">
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Procesando...</> : 'Confirmar préstamo'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
