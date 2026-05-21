import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2, Library, Search, MapPin } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { SEOHead } from '@/components/SEOHead'
import { juegosApi } from '@/services/api/juegos'
import { sociosApi } from '@/services/api/socios'
import { api } from '@/services/api/client'
import type { Juego, EstadoJuego } from '@/types/api'

const juegoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  localizacion: z.string().optional(),
  num_jugadores_min: z.coerce.number().int().positive().optional().or(z.literal('')),
  num_jugadores_max: z.coerce.number().int().positive().optional().or(z.literal('')),
  notas: z.string().optional(),
  propietario_id: z.string().uuid().optional().or(z.literal('')),
})
type JuegoForm = z.infer<typeof juegoSchema>

const estadoConfig: Record<EstadoJuego, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  en_estanteria: { label: 'En estantería', variant: 'default' },
  prestado: { label: 'Prestado', variant: 'secondary' },
  retirado: { label: 'Retirado', variant: 'destructive' },
}

function JuegoFormDialog({
  open, onClose, juego,
}: {
  open: boolean
  onClose: () => void
  juego?: Juego
}) {
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

  const { mutate, isPending } = useMutation({
    mutationFn: (data: JuegoForm) => {
      const clean = Object.fromEntries(
        Object.entries(data).filter(([, v]) => v !== '' && v !== undefined),
      )
      if (isEdit) {
        return api.put<{ data: Juego }>(`/juegos/${juego.id}`, clean)
      }
      return api.post<{ data: Juego }>('/juegos', clean)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Juego actualizado' : 'Juego añadido al catálogo')
      queryClient.invalidateQueries({ queryKey: ['juegos'] })
      queryClient.invalidateQueries({ queryKey: ['juegos-catalogo'] })
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
            <Textarea
              id="notas"
              {...register('notas')}
              placeholder="Estado del juego, piezas faltantes, observaciones..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} className="font-display">
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending} className="font-display font-bold">
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? 'Guardar cambios' : 'Añadir juego'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function GestionJuegosPage() {
  const [search, setSearch] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoJuego | 'todos'>('todos')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editando, setEditando] = useState<Juego | undefined>()
  const [eliminando, setEliminando] = useState<Juego | undefined>()
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['juegos', search, estadoFiltro],
    queryFn: () =>
      juegosApi.getAll({
        search: search || undefined,
        estado: estadoFiltro !== 'todos' ? estadoFiltro : undefined,
        limit: 50,
      }),
  })

  const { mutate: eliminar, isPending: eliminandoPending } = useMutation({
    mutationFn: (id: string) => api.delete<void>(`/juegos/${id}`),
    onSuccess: () => {
      toast.success('Juego eliminado del catálogo')
      queryClient.invalidateQueries({ queryKey: ['juegos'] })
      setEliminando(undefined)
    },
    onError: (err: Error) => { toast.error(err.message); setEliminando(undefined) },
  })

  const { mutate: cambiarEstado } = useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: EstadoJuego }) =>
      api.put<{ data: Juego }>(`/juegos/${id}`, { estado }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['juegos'] })
      queryClient.invalidateQueries({ queryKey: ['juegos-catalogo'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

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
          <Button onClick={() => setDialogOpen(true)} className="font-display font-bold gap-2">
            <Plus className="h-4 w-4" /> Añadir juego
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, estantería..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={estadoFiltro}
            onValueChange={(v) => setEstadoFiltro(v as EstadoJuego | 'todos')}
          >
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
                  Empieza añadiendo los primeros juegos al catálogo de la ludoteca
                </p>
                <Button onClick={() => setDialogOpen(true)} className="font-display font-bold gap-2">
                  <Plus className="h-4 w-4" /> Añadir primer juego
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {juegos.map((juego) => {
                  const cfg = estadoConfig[juego.estado]
                  return (
                    <div key={juego.id} className="flex items-center gap-4 px-4 py-3">
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
                                ? `–${juego.num_jugadores_max}`
                                : ''}{' '}j.
                            </span>
                          )}
                          {juego.propietario && (
                            <span className="text-xs text-muted-foreground">
                              {juego.propietario.nombre} {juego.propietario.apellidos}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Select
                          value={juego.estado}
                          onValueChange={(v) => cambiarEstado({ id: juego.id, estado: v as EstadoJuego })}
                        >
                          <SelectTrigger className="h-8 w-40 text-xs">
                            <SelectValue>
                              <Badge variant={cfg.variant} className="font-display text-xs">
                                {cfg.label}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en_estanteria">En estantería</SelectItem>
                            <SelectItem value="prestado">Prestado</SelectItem>
                            <SelectItem value="retirado">Retirado</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => { setEditando(juego); setDialogOpen(true) }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setEliminando(juego)}
                          disabled={juego.estado === 'prestado'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <JuegoFormDialog
        open={dialogOpen}
        juego={editando}
        onClose={() => { setDialogOpen(false); setEditando(undefined) }}
      />

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
