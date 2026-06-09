import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, BookOpen, MapPin, Users, Plus, Loader2, Gift } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { SEOHead } from '@/components/SEOHead'
import { juegosApi } from '@/services/api/juegos'
import { prestamosApi } from '@/services/api/prestamos'
import { solicitudesJuegoApi } from '@/services/api/solicitudes_juego'
import { invalidarJuegos, invalidarPrestamos } from '@/lib/queryKeys'
import type { Juego, SolicitudJuego, EstadoSolicitudJuego } from '@/types/api'

const estadoJuegoLabel: Record<string, string> = {
  en_estanteria: 'Disponible',
  prestado: 'Prestado',
  retirado: 'Retirado',
}

const estadoSolicitudLabel: Record<EstadoSolicitudJuego, string> = {
  pendiente: 'Pendiente de revisión',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
}

const estadoSolicitudVariant: Record<EstadoSolicitudJuego, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pendiente: 'secondary',
  aprobada: 'default',
  rechazada: 'destructive',
}

function JuegoCard({ juego, onSolicitar }: { juego: Juego; onSolicitar: (j: Juego) => void }) {
  const disponible = juego.estado === 'en_estanteria'
  return (
    <Card className={`transition-shadow ${disponible ? 'hover:shadow-md cursor-pointer' : 'opacity-70'}`}>
      <CardContent className="pt-4 pb-3 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-display font-bold text-sm leading-tight">{juego.nombre}</p>
          <Badge
            variant={disponible ? 'default' : 'outline'}
            className="font-display text-xs flex-shrink-0"
          >
            {estadoJuegoLabel[juego.estado] ?? juego.estado}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
          {juego.localizacion && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {juego.localizacion}
            </span>
          )}
          {(juego.num_jugadores_min || juego.num_jugadores_max) && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {juego.num_jugadores_min ?? '?'}
              {juego.num_jugadores_max && juego.num_jugadores_max !== juego.num_jugadores_min
                ? `–${juego.num_jugadores_max}`
                : ''} jugadores
            </span>
          )}
        </div>
        {juego.propietario && (
          <p className="text-xs text-muted-foreground">
            Donado por {juego.propietario.nombre} {juego.propietario.apellidos}
          </p>
        )}
        {disponible && (
          <Button
            size="sm"
            variant="secondary"
            className="font-display w-full mt-1 h-7 text-xs"
            onClick={() => onSolicitar(juego)}
          >
            <BookOpen className="h-3 w-3 mr-1" /> Solicitar préstamo
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function SolicitarDialog({
  juego,
  onClose,
}: {
  juego: Juego | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [notas, setNotas] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: () => prestamosApi.solicitar(juego!.id, notas || undefined),
    onSuccess: () => {
      toast.success('Préstamo solicitado')
      invalidarPrestamos(queryClient)
      invalidarJuegos(queryClient)
      onClose()
      setNotas('')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={!!juego} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Solicitar préstamo</DialogTitle>
          <DialogDescription>{juego?.nombre}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Label className="font-display text-sm">Notas (opcional)</Label>
          <Textarea
            placeholder="Alguna nota para el ludotecario..."
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="font-display">Cancelar</Button>
          <Button onClick={() => mutate()} disabled={isPending} className="font-display">
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar préstamo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CederJuegoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [nombre, setNombre] = useState('')
  const [notas, setNotas] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: () => solicitudesJuegoApi.crear({ nombre, notas: notas || undefined }),
    onSuccess: () => {
      toast.success('Solicitud enviada al ludotecario')
      queryClient.invalidateQueries({ queryKey: ['mis-solicitudes-juego'] })
      onClose()
      setNombre('')
      setNotas('')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Ceder un juego al club</DialogTitle>
          <DialogDescription>
            El ludotecario revisará tu solicitud y añadirá el juego al catálogo si es aprobada.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="font-display text-sm">Nombre del juego *</Label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Nombre del juego"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="font-display text-sm">Notas (opcional)</Label>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Estado del juego, número de expansiones, etc."
              rows={3}
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="font-display">Cancelar</Button>
          <Button
            onClick={() => mutate()}
            disabled={isPending || !nombre.trim()}
            className="font-display"
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enviar solicitud
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function MisSolicitudes() {
  const { data, isLoading } = useQuery({
    queryKey: ['mis-solicitudes-juego'],
    queryFn: () => solicitudesJuegoApi.getMias(),
  })

  const solicitudes = data?.data ?? []

  if (isLoading) return <Skeleton className="h-20 w-full" />
  if (solicitudes.length === 0) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-base text-primary">Mis solicitudes de donación</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {solicitudes.map((s: SolicitudJuego) => (
          <div key={s.id} className="flex items-center justify-between gap-3 py-1 border-b border-border last:border-0">
            <div>
              <p className="font-display font-bold text-sm">{s.nombre}</p>
              {s.motivo_rechazo && (
                <p className="text-xs text-muted-foreground italic">"{s.motivo_rechazo}"</p>
              )}
            </div>
            <Badge variant={estadoSolicitudVariant[s.estado]} className="font-display text-xs flex-shrink-0">
              {estadoSolicitudLabel[s.estado]}
            </Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function LudotecaPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<string>('')
  const [selectedJuego, setSelectedJuego] = useState<Juego | null>(null)
  const [cederOpen, setCederOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['ludoteca', debouncedSearch, estadoFiltro],
    queryFn: () => juegosApi.getAll({ search: debouncedSearch || undefined, estado: estadoFiltro || undefined, limit: 50 }),
  })

  const juegos = data?.data ?? []

  const handleSearch = (val: string) => {
    setSearch(val)
    clearTimeout((handleSearch as { _t?: ReturnType<typeof setTimeout> })._t)
    ;(handleSearch as { _t?: ReturnType<typeof setTimeout> })._t = setTimeout(() => setDebouncedSearch(val), 300)
  }

  return (
    <>
      <SEOHead title="Ludoteca" description="Catálogo de juegos del club" path="/area/ludoteca" noindex />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Ludoteca</h1>
            <p className="text-muted-foreground mt-1">Catálogo de juegos disponibles en el club</p>
          </div>
          <Button
            variant="outline"
            className="font-display gap-2 self-start sm:self-auto"
            onClick={() => setCederOpen(true)}
          >
            <Gift className="h-4 w-4" /> Ceder un juego
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar juego..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 font-display"
            />
          </div>
          <div className="flex gap-2">
            {(['', 'en_estanteria', 'prestado'] as const).map((e) => (
              <Button
                key={e}
                size="sm"
                variant={estadoFiltro === e ? 'default' : 'outline'}
                className="font-display text-xs"
                onClick={() => setEstadoFiltro(e)}
              >
                {e === '' ? 'Todos' : e === 'en_estanteria' ? 'Disponibles' : 'Prestados'}
              </Button>
            ))}
          </div>
        </div>

        {/* Grid de juegos */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-36 w-full" />)}
          </div>
        ) : juegos.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No se encontraron juegos</p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">{juegos.length} juego{juegos.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {juegos.map((j) => (
                <JuegoCard key={j.id} juego={j} onSolicitar={setSelectedJuego} />
              ))}
            </div>
          </>
        )}

        <MisSolicitudes />
      </div>

      <SolicitarDialog juego={selectedJuego} onClose={() => setSelectedJuego(null)} />
      <CederJuegoDialog open={cederOpen} onClose={() => setCederOpen(false)} />
    </>
  )
}
