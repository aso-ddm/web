import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Plus, Pencil, Trash2, Loader2, Library, Search, MapPin, Archive,
  ChevronDown, ChevronUp, Download, Check, X, RefreshCw,
} from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { SEOHead } from '@/components/SEOHead'
import { juegosApi } from '@/services/api/juegos'
import { logsJuegoApi } from '@/services/api/logs_juego'
import { solicitudesJuegoApi } from '@/services/api/solicitudes_juego'
import { invalidarJuegos } from '@/lib/queryKeys'
import { sociosApi } from '@/services/api/socios'
import { api } from '@/services/api/client'
import { useAuthStore } from '@/store/authStore'
import type { Juego, EstadoJuego, LogJuego, SolicitudJuego } from '@/types/api'

const juegoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  localizacion: z.string().optional(),
  num_jugadores_min: z.coerce.number().int().positive().optional().or(z.literal('')),
  num_jugadores_max: z.coerce.number().int().positive().optional().or(z.literal('')),
  notas: z.string().optional(),
  propietario_id: z.string().uuid().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  const min = data.num_jugadores_min
  const max = data.num_jugadores_max
  if (min !== '' && max !== '' && min !== undefined && max !== undefined && Number(min) > Number(max)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'El mínimo no puede ser mayor que el máximo', path: ['num_jugadores_min'] })
  }
})
type JuegoForm = z.infer<typeof juegoSchema>

const estadoConfig: Record<EstadoJuego, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  en_estanteria: { label: 'En estantería', variant: 'default' },
  prestado: { label: 'Prestado', variant: 'secondary' },
  retirado: { label: 'Retirado', variant: 'destructive' },
}

const tipoLogLabel: Record<string, string> = {
  donado: '🎁 Donado',
  retirado: '📦 Retirado',
  prestamo_activo: '📤 Prestado',
  prestamo_devuelto: '📥 Devuelto',
  nota_manual: '📝 Nota',
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Logs panel ────────────────────────────────────────────────────────────────

function LogsPanel({ juego }: { juego: Juego }) {
  const queryClient = useQueryClient()
  const [nota, setNota] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['juego-logs', juego.id],
    queryFn: () => logsJuegoApi.getByJuego(juego.id),
  })

  const { mutate: addNota, isPending } = useMutation({
    mutationFn: () => logsJuegoApi.crearManual(juego.id, nota),
    onSuccess: () => {
      toast.success('Nota añadida')
      queryClient.invalidateQueries({ queryKey: ['juego-logs', juego.id] })
      queryClient.invalidateQueries({ queryKey: ['logs-juego-all'] })
      setNota('')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const logs = data?.data ?? []

  return (
    <div className="bg-muted/40 px-4 py-3 border-t border-border space-y-3">
      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : logs.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin entradas de historial aún</p>
      ) : (
        <ul className="space-y-1.5">
          {logs.map((log: LogJuego) => (
            <li key={log.id} className="text-xs flex items-start gap-2">
              <span className="text-muted-foreground flex-shrink-0">{formatDate(log.created_at)}</span>
              <span className="font-medium flex-shrink-0">{tipoLogLabel[log.tipo] ?? log.tipo}</span>
              <span className="text-muted-foreground">{log.texto}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <Input
          placeholder="Añadir nota manual..."
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          className="h-7 text-xs"
          onKeyDown={(e) => e.key === 'Enter' && nota.trim() && addNota()}
        />
        <Button
          size="sm"
          variant="outline"
          className="h-7 px-2 font-display text-xs"
          disabled={isPending || !nota.trim()}
          onClick={() => addNota()}
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Añadir'}
        </Button>
      </div>
    </div>
  )
}

// ── Juego form dialog ─────────────────────────────────────────────────────────

function JuegoFormDialog({ open, onClose, juego }: { open: boolean; onClose: () => void; juego?: Juego }) {
  const queryClient = useQueryClient()
  const isEdit = !!juego

  const { data: sociosData } = useQuery({
    queryKey: ['socios-activos'],
    queryFn: () => sociosApi.getAll({ estado: 'activo', limit: 200 }),
    enabled: open,
  })
  const socios = sociosData?.data ?? []

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<JuegoForm>({
    resolver: zodResolver(juegoSchema),
    defaultValues: juego
      ? {
          nombre: juego.nombre,
          localizacion: juego.localizacion ?? '',
          num_jugadores_min: juego.num_jugadores_min ?? '',
          num_jugadores_max: juego.num_jugadores_max ?? '',
          notas: juego.notas ?? '',
          propietario_id: juego.propietario_id ?? '',
        }
      : {},
  })

  const propietarioId = watch('propietario_id')

  useEffect(() => {
    if (open) {
      reset(juego ? {
        nombre: juego.nombre,
        localizacion: juego.localizacion ?? '',
        num_jugadores_min: juego.num_jugadores_min ?? '',
        num_jugadores_max: juego.num_jugadores_max ?? '',
        notas: juego.notas ?? '',
        propietario_id: juego.propietario_id ?? '',
      } : { nombre: '', localizacion: '', num_jugadores_min: '', num_jugadores_max: '', notas: '', propietario_id: '' })
    }
  }, [open, juego?.id])

  const { mutate, isPending } = useMutation({
    mutationFn: (data: JuegoForm) => {
      const clean = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== '' && v !== undefined))
      if (isEdit) return api.put<{ data: Juego }>(`/juegos/${juego.id}`, clean)
      return api.post<{ data: Juego }>('/juegos', clean)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Juego actualizado' : 'Juego añadido al catálogo')
      invalidarJuegos(queryClient)
      if (!isEdit) queryClient.invalidateQueries({ queryKey: ['logs-juego-all'] })
      handleClose()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleClose = () => { reset(); onClose() }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-primary">
            {isEdit ? 'Editar juego' : 'Añadir juego al catálogo'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? 'Edita los datos del juego' : 'Rellena los datos para añadir un nuevo juego al catálogo'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="nombre" className="font-display font-bold text-xs">Nombre *</Label>
            <Input id="nombre" {...register('nombre')} className={errors.nombre ? 'border-destructive' : ''} />
            {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="localizacion" className="font-display font-bold text-xs">Estantería / Localización</Label>
            <Input id="localizacion" {...register('localizacion')} placeholder="Ej: A3, Estante superior..." />
          </div>
          <div className="space-y-1.5">
            <Label className="font-display font-bold text-xs">Nº jugadores</Label>
            <div className="flex items-center gap-2">
              <Input type="number" {...register('num_jugadores_min')} placeholder="Mín" />
              <span className="text-muted-foreground">—</span>
              <Input type="number" {...register('num_jugadores_max')} placeholder="Máx" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="font-display font-bold text-xs">Propietario</Label>
            <Select
              value={propietarioId ?? ''}
              onValueChange={(v) => setValue('propietario_id', v === 'club' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Club (por defecto)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="club">Club (sin propietario específico)</SelectItem>
                {socios.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.nombre} {s.apellidos}{s.apodo ? ` (${s.apodo})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notas" className="font-display font-bold text-xs">Notas</Label>
            <Textarea id="notas" {...register('notas')} placeholder="Estado del juego, piezas faltantes..." rows={3} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} className="font-display">Cancelar</Button>
            <Button type="submit" disabled={isPending} className="font-display font-bold">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? 'Guardar cambios' : 'Añadir juego'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Solicitudes tab ───────────────────────────────────────────────────────────

function SolicitudesTab() {
  const queryClient = useQueryClient()
  const [rechazando, setRechazando] = useState<SolicitudJuego | null>(null)
  const [motivo, setMotivo] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['solicitudes-juego-pendientes'],
    queryFn: () => solicitudesJuegoApi.getPendientes(),
  })

  const { mutate: aprobar, isPending: aprobando } = useMutation({
    mutationFn: (id: string) => solicitudesJuegoApi.aprobar(id),
    onSuccess: () => {
      toast.success('Solicitud aprobada — juego añadido al catálogo')
      queryClient.invalidateQueries({ queryKey: ['solicitudes-juego-pendientes'] })
      invalidarJuegos(queryClient)
      queryClient.invalidateQueries({ queryKey: ['logs-juego-all'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const { mutate: rechazar, isPending: rechazando2 } = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo?: string }) =>
      solicitudesJuegoApi.rechazar(id, motivo),
    onSuccess: () => {
      toast.success('Solicitud rechazada')
      queryClient.invalidateQueries({ queryKey: ['solicitudes-juego-pendientes'] })
      setRechazando(null)
      setMotivo('')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const solicitudes = data?.data ?? []

  if (isLoading) return (
    <div className="space-y-3 pt-4">
      {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
    </div>
  )

  if (solicitudes.length === 0) return (
    <div className="text-center py-12 text-muted-foreground">
      <Check className="h-8 w-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">Sin solicitudes pendientes</p>
    </div>
  )

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-sm text-primary">
            Solicitudes pendientes ({solicitudes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y divide-border p-0">
          {solicitudes.map((s: SolicitudJuego) => (
            <div key={s.id} className="px-4 py-3 flex items-start gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm">{s.nombre}</p>
                {s.socio && (
                  <p className="text-xs text-muted-foreground">
                    {s.socio.nombre} {s.socio.apellidos}
                    {s.socio.apodo ? ` (${s.socio.apodo})` : ''}
                    {' · '}{s.socio.email}
                  </p>
                )}
                {s.notas && <p className="text-xs text-muted-foreground italic mt-0.5">"{s.notas}"</p>}
                <p className="text-xs text-muted-foreground mt-0.5">{formatDate(s.created_at)}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 font-display text-xs gap-1"
                  onClick={() => aprobar(s.id)}
                  disabled={aprobando}
                >
                  <Check className="h-3 w-3" /> Aprobar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 font-display text-xs gap-1 text-destructive border-destructive/40 hover:bg-destructive/10"
                  onClick={() => setRechazando(s)}
                >
                  <X className="h-3 w-3" /> Rechazar
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!rechazando} onOpenChange={(v) => { if (!v) { setRechazando(null); setMotivo('') } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display">Rechazar solicitud</DialogTitle>
            <DialogDescription>«{rechazando?.nombre}» de {rechazando?.socio?.nombre}</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="font-display text-sm">Motivo (opcional)</Label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Explica al socio por qué se rechaza..."
              rows={3}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRechazando(null)} className="font-display">Cancelar</Button>
            <Button
              variant="destructive"
              className="font-display"
              disabled={rechazando2}
              onClick={() => rechazando && rechazar({ id: rechazando.id, motivo: motivo || undefined })}
            >
              {rechazando2 && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ── Historial global ─────────────────────────────────────────────────────────

function HistorialLogsTab() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['logs-juego-all', page],
    queryFn: () => logsJuegoApi.getAll(page),
  })

  const logs = data?.data ?? []

  if (isLoading) return (
    <div className="space-y-2 pt-2">
      {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
    </div>
  )

  if (logs.length === 0) return (
    <div className="text-center py-12 text-muted-foreground">
      <p className="text-sm">Sin entradas de historial aún</p>
    </div>
  )

  return (
    <div className="space-y-3">
      <Card>
        <CardContent className="p-0 divide-y divide-border">
          {logs.map((log: LogJuego) => (
            <div key={log.id} className="flex items-start gap-3 px-4 py-2.5">
              <span className="text-xs text-muted-foreground flex-shrink-0 pt-0.5 w-24">
                {formatDate(log.created_at)}
              </span>
              <span className="text-xs font-display font-bold flex-shrink-0 w-32">
                {log.juego?.nombre ?? '—'}
              </span>
              <span className="text-xs flex-1">{log.texto}</span>
              {log.usuario && (
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {log.usuario.nombre} {log.usuario.apellidos}
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="font-display"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-xs text-muted-foreground">
            {page} / {data.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="font-display"
            disabled={page === data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}

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

  const token = useAuthStore((s) => s.token)

  const { data, isLoading } = useQuery({
    queryKey: ['juegos', search, estadoFiltro],
    queryFn: () => juegosApi.getAll({ search: search || undefined, estado: estadoFiltro !== 'todos' ? estadoFiltro : undefined, limit: 50 }),
  })

  const { data: solicitudesData } = useQuery({
    queryKey: ['solicitudes-juego-pendientes'],
    queryFn: () => solicitudesJuegoApi.getPendientes(),
  })
  const pendientesCount = solicitudesData?.data.length ?? 0

  const { mutate: eliminar, isPending: eliminandoPending } = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/juegos/${id}`),
    onSuccess: () => {
      toast.success('Juego eliminado del catálogo')
      invalidarJuegos(queryClient)
      setEliminando(undefined)
    },
    onError: (err: Error) => { toast.error(err.message); setEliminando(undefined) },
  })

  const { mutate: retirar, isPending: retirandoPending } = useMutation({
    mutationFn: (id: string) => juegosApi.retirar(id),
    onSuccess: () => {
      toast.success('Juego retirado del catálogo')
      invalidarJuegos(queryClient)
      queryClient.invalidateQueries({ queryKey: ['logs-juego-all'] })
      setRetirando(undefined)
    },
    onError: (err: Error) => { toast.error(err.message); setRetirando(undefined) },
  })

  const { mutate: reactivar, isPending: reactivandoPending } = useMutation({
    mutationFn: (id: string) => juegosApi.reactivar(id),
    onSuccess: () => {
      toast.success('Juego reactivado y disponible en la estantería')
      invalidarJuegos(queryClient)
      queryClient.invalidateQueries({ queryKey: ['logs-juego-all'] })
      setReactivando(undefined)
    },
    onError: (err: Error) => { toast.error(err.message); setReactivando(undefined) },
  })

  const handleExportCsv = () => {
    const url = `/api/juegos/export/csv`
    const a = document.createElement('a')
    a.href = url
    a.setAttribute('download', '')
    // Token en cabecera no es posible con <a> directo; usamos fetch + blob
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const objUrl = URL.createObjectURL(blob)
        a.href = objUrl
        a.click()
        URL.revokeObjectURL(objUrl)
      })
      .catch(() => toast.error('Error al exportar CSV'))
  }

  const juegos = data?.data ?? []

  return (
    <>
      <SEOHead title="Gestión de juegos" description="Catálogo de la ludoteca" path="/ludoteca/juegos" noindex />

      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Catálogo de juegos</h1>
            <p className="text-muted-foreground mt-1">
              {data?.total ?? 0} juego{data?.total !== 1 ? 's' : ''} en el catálogo
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

      {/* Confirmar retirar */}
      <AlertDialog open={!!retirando} onOpenChange={(v) => !v && setRetirando(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-primary">
              ¿Retirar «{retirando?.nombre}»?
            </AlertDialogTitle>
            <AlertDialogDescription>
              El juego quedará marcado como retirado y se registrará en el historial. No podrá prestarse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-display">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="font-display font-bold bg-amber-600 text-white hover:bg-amber-700"
              onClick={() => retirando && retirar(retirando.id)}
              disabled={retirandoPending}
            >
              {retirandoPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Archive className="h-4 w-4 mr-1" /> Retirar</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmar reactivar */}
      <AlertDialog open={!!reactivando} onOpenChange={(v) => !v && setReactivando(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-primary">
              ¿Reactivar «{reactivando?.nombre}»?
            </AlertDialogTitle>
            <AlertDialogDescription>
              El juego volverá a estar disponible en la estantería y podrá prestarse de nuevo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-display">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="font-display font-bold"
              onClick={() => reactivando && reactivar(reactivando.id)}
              disabled={reactivandoPending}
            >
              {reactivandoPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><RefreshCw className="h-4 w-4 mr-1" /> Reactivar</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmar eliminar */}
      <AlertDialog open={!!eliminando} onOpenChange={(v) => !v && setEliminando(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-primary">
              ¿Eliminar «{eliminando?.nombre}»?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible. El juego se eliminará del catálogo permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-display">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="font-display font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => eliminando && eliminar(eliminando.id)}
              disabled={eliminandoPending}
            >
              {eliminandoPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
