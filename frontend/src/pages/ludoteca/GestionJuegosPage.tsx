import { useState } from 'react'
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Plus, Pencil, Trash2, Loader2, Library, Search, MapPin, Archive, ChevronDown, ChevronUp, Download, RefreshCw,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { SEOHead } from '@/components/atoms/SEOHead'
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog'
import { juegosApi } from '@/services/api/juegos'
import { solicitudesJuegoApi } from '@/services/api/solicitudes_juego'
import { invalidarJuegos } from '@/lib/queryKeys'
import { useAuthStore } from '@/store/authStore'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { Juego, EstadoJuego } from '@/types/api'
import { estadoConfig } from './juegos/constants'
import { LogsPanel } from './juegos/LogsPanel'
import { JuegoFormDialog } from './juegos/JuegoFormDialog'
import { SolicitudesTab } from './juegos/SolicitudesTab'
import { HistorialLogsTab } from './juegos/HistorialLogsTab'

// ── Main page ─────────────────────────────────────────────────────────────────

export function GestionJuegosPage() {
  const [search, setSearch] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoJuego | 'todos'>('todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Juego | undefined>()
  const [eliminando, setEliminando] = useState<Juego | undefined>()
  const [retirando, setRetirando] = useState<Juego | undefined>()
  const [reactivando, setReactivando] = useState<Juego | undefined>()
  const [expandedLogs, setExpandedLogs] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const puedeEliminar = useAuthStore((s) => s.isDirectiva()) // ludotecario: retirar sí, eliminar no

  const debouncedSearch = useDebouncedValue(search)
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['juegos', debouncedSearch, estadoFiltro],
    queryFn: ({ pageParam }) =>
      juegosApi.getAll({ search: debouncedSearch || undefined, estado: estadoFiltro !== 'todos' ? estadoFiltro : undefined, page: pageParam, limit: 50 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
  })
  const total = data?.pages[0]?.total ?? 0

  const { data: solicitudesData } = useQuery({
    queryKey: ['solicitudes-juego-pendientes'],
    queryFn: () => solicitudesJuegoApi.getPendientes(),
  })
  const pendientesCount = solicitudesData?.data.length ?? 0

  const { mutate: eliminar, isPending: eliminandoPending } = useMutation({
    mutationFn: (id: string) => juegosApi.delete(id),
    onSuccess: () => {
      toast.success('Juego eliminado del catálogo')
      invalidarJuegos(queryClient)
      setEliminando(undefined)
    },
    onError: (err: Error) => toast.error(err.message), // el diálogo sigue abierto para reintentar
  })

  const { mutate: retirar, isPending: retirandoPending } = useMutation({
    mutationFn: (id: string) => juegosApi.retirar(id),
    onSuccess: () => {
      toast.success('Juego retirado del catálogo')
      invalidarJuegos(queryClient)
      queryClient.invalidateQueries({ queryKey: ['logs-juego-all'] })
      setRetirando(undefined)
    },
    onError: (err: Error) => toast.error(err.message), // el diálogo sigue abierto para reintentar
  })

  const { mutate: reactivar, isPending: reactivandoPending } = useMutation({
    mutationFn: (id: string) => juegosApi.reactivar(id),
    onSuccess: () => {
      toast.success('Juego reactivado y disponible en la estantería')
      invalidarJuegos(queryClient)
      queryClient.invalidateQueries({ queryKey: ['logs-juego-all'] })
      setReactivando(undefined)
    },
    onError: (err: Error) => toast.error(err.message), // el diálogo sigue abierto para reintentar
  })

  const handleExportCsv = async () => {
    try {
      const { blob } = await juegosApi.exportCsv()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `ludoteca-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al exportar CSV')
    }
  }

  const juegos = data?.pages.flatMap((p) => p.data) ?? []

  return (
    <>
      <SEOHead title="Gestión de juegos" description="Catálogo de la ludoteca" path="/ludoteca/juegos" noindex />

      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Catálogo de juegos</h1>
            <p className="text-muted-foreground mt-1">
              {total} juego{total !== 1 ? 's' : ''} en el catálogo
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="font-display gap-2" onClick={handleExportCsv}>
              <Download className="h-4 w-4" /> CSV
            </Button>
            <Button onClick={() => setDialogOpen(true)} className="font-display font-bold gap-2">
              <Plus className="h-4 w-4" /> Añadir juego
            </Button>
          </div>
        </div>

        <Tabs defaultValue="catalogo">
          <TabsList className="mb-4">
            <TabsTrigger value="catalogo" className="font-display">Catálogo</TabsTrigger>
            <TabsTrigger value="historial" className="font-display">Historial</TabsTrigger>
            <TabsTrigger value="solicitudes" className="font-display relative">
              Solicitudes
              {pendientesCount > 0 && (
                <span className="ml-1.5 bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5 font-bold">
                  {pendientesCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="catalogo">
            {/* Filtros */}
            <div className="flex gap-3 flex-wrap mb-4">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, estantería..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={estadoFiltro} onValueChange={(v) => setEstadoFiltro(v as EstadoJuego | 'todos')}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="en_estanteria">En estantería</SelectItem>
                  <SelectItem value="prestado">Prestado</SelectItem>
                  <SelectItem value="retirado">Retirado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Lista */}
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
                  </div>
                ) : juegos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Library className="h-12 w-12 text-muted-foreground/30 mb-4" />
                    <h2 className="font-display font-bold text-lg text-primary mb-1">Sin juegos aún</h2>
                    <p className="text-muted-foreground text-sm mb-4">
                      Empieza añadiendo los primeros juegos al catálogo
                    </p>
                    <Button onClick={() => setDialogOpen(true)} className="font-display font-bold gap-2">
                      <Plus className="h-4 w-4" /> Añadir primer juego
                    </Button>
                  </div>
                ) : (
                  <div>
                    {juegos.map((juego) => {
                      const cfg = estadoConfig[juego.estado]
                      const logsExpanded = expandedLogs === juego.id
                      return (
                        <div key={juego.id} className="border-b border-border last:border-0">
                          <div className="flex items-center gap-4 px-4 py-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-display font-bold text-sm">{juego.nombre}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {juego.localizacion && (
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />{juego.localizacion}
                                  </span>
                                )}
                                {(juego.num_jugadores_min || juego.num_jugadores_max) && (
                                  <span className="text-xs text-muted-foreground">
                                    {juego.num_jugadores_min}
                                    {juego.num_jugadores_max && juego.num_jugadores_max !== juego.num_jugadores_min
                                      ? `–${juego.num_jugadores_max}` : ''}{' '}j.
                                  </span>
                                )}
                                {juego.propietario && (
                                  <span className="text-xs text-muted-foreground">
                                    {juego.propietario.nombre} {juego.propietario.apellidos}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <Badge variant={cfg.variant} className="font-display text-xs">
                                {cfg.label}
                              </Badge>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-primary"
                                title="Ver historial"
                                onClick={() => setExpandedLogs(logsExpanded ? null : juego.id)}
                              >
                                {logsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </Button>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-primary"
                                title="Editar"
                                onClick={() => { setEditando(juego); setDialogOpen(true) }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>

                              {juego.estado === 'retirado' ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-emerald-600"
                                  title="Reactivar juego"
                                  onClick={() => setReactivando(juego)}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-amber-600"
                                  title="Retirar juego"
                                  disabled={juego.estado === 'prestado'}
                                  onClick={() => setRetirando(juego)}
                                >
                                  <Archive className="h-4 w-4" />
                                </Button>
                              )}

                              {puedeEliminar && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  title="Eliminar"
                                  onClick={() => setEliminando(juego)}
                                  disabled={juego.estado === 'prestado'}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>

                          {logsExpanded && <LogsPanel juego={juego} />}
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            {hasNextPage && (
              <div className="flex justify-center mt-4">
                <Button variant="outline" size="sm" className="font-display gap-2" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
                  {isFetchingNextPage && <Loader2 className="h-4 w-4 animate-spin" />}
                  Cargar más
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="historial">
            <HistorialLogsTab />
          </TabsContent>

          <TabsContent value="solicitudes">
            <SolicitudesTab />
          </TabsContent>
        </Tabs>
      </div>

      <JuegoFormDialog
        open={dialogOpen}
        juego={editando}
        onClose={() => { setDialogOpen(false); setEditando(undefined) }}
      />

      <ConfirmDialog
        open={!!retirando}
        onOpenChange={(v) => !v && setRetirando(undefined)}
        title={`¿Retirar «${retirando?.nombre}»?`}
        description="El juego quedará marcado como retirado y se registrará en el historial. No podrá prestarse."
        confirmLabel={<><Archive className="h-4 w-4 mr-1" /> Retirar</>}
        confirmClassName="bg-amber-600 text-white hover:bg-amber-700"
        onConfirm={() => retirando && retirar(retirando.id)}
        pending={retirandoPending}
      />

      <ConfirmDialog
        open={!!reactivando}
        onOpenChange={(v) => !v && setReactivando(undefined)}
        title={`¿Reactivar «${reactivando?.nombre}»?`}
        description="El juego volverá a estar disponible en la estantería y podrá prestarse de nuevo."
        confirmLabel={<><RefreshCw className="h-4 w-4 mr-1" /> Reactivar</>}
        onConfirm={() => reactivando && reactivar(reactivando.id)}
        pending={reactivandoPending}
      />

      <ConfirmDialog
        open={!!eliminando}
        onOpenChange={(v) => !v && setEliminando(undefined)}
        title={`¿Eliminar «${eliminando?.nombre}»?`}
        description="Esta acción es irreversible. El juego se eliminará del catálogo permanentemente."
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => eliminando && eliminar(eliminando.id)}
        pending={eliminandoPending}
      />
    </>
  )
}
