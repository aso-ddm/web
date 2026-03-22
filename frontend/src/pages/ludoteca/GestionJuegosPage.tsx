import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, Loader2, Library, Search } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { SEOHead } from '@/components/SEOHead'
import { juegosApi } from '@/services/api/juegos'
import { api } from '@/services/api/client'
import type { Juego, EstadoJuego } from '@/types/api'

const juegoSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio'),
  autor: z.string().optional(),
  editorial: z.string().optional(),
  anio_publicacion: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal('')),
  num_jugadores_min: z.coerce.number().int().positive().optional().or(z.literal('')),
  num_jugadores_max: z.coerce.number().int().positive().optional().or(z.literal('')),
  duracion_minutos: z.coerce.number().int().positive().optional().or(z.literal('')),
  edad_recomendada: z.coerce.number().int().positive().optional().or(z.literal('')),
  categoria: z.string().optional(),
  propietario: z.string().optional(),
  foto_url: z.string().url('URL no válida').optional().or(z.literal('')),
  bgg_id: z.string().optional(),
})
type JuegoForm = z.infer<typeof juegoSchema>

const estadoConfig: Record<EstadoJuego, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  disponible: { label: 'Disponible', variant: 'default' },
  prestado: { label: 'Prestado', variant: 'secondary' },
  mantenimiento: { label: 'Mantenimiento', variant: 'destructive' },
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

  const { register, handleSubmit, reset, formState: { errors } } = useForm<JuegoForm>({
    resolver: zodResolver(juegoSchema),
    defaultValues: juego
      ? {
          titulo: juego.titulo,
          autor: juego.autor ?? '',
          editorial: juego.editorial ?? '',
          anio_publicacion: juego.anio_publicacion ?? '',
          num_jugadores_min: juego.num_jugadores_min ?? '',
          num_jugadores_max: juego.num_jugadores_max ?? '',
          duracion_minutos: juego.duracion_minutos ?? '',
          edad_recomendada: juego.edad_recomendada ?? '',
          categoria: juego.categoria ?? '',
          propietario: juego.propietario ?? '',
          foto_url: juego.foto_url ?? '',
          bgg_id: juego.bgg_id ?? '',
        }
      : {},
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: JuegoForm) => {
      // Limpiar campos vacíos
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-primary">
            {isEdit ? 'Editar juego' : 'Añadir juego al catálogo'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit((data) => mutate(data))} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="titulo" className="font-display font-bold text-xs">Título *</Label>
              <Input id="titulo" {...register('titulo')} className={errors.titulo ? 'border-destructive' : ''} />
              {errors.titulo && <p className="text-xs text-destructive">{errors.titulo.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="autor" className="font-display font-bold text-xs">Autor / Diseñador</Label>
              <Input id="autor" {...register('autor')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="editorial" className="font-display font-bold text-xs">Editorial</Label>
              <Input id="editorial" {...register('editorial')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="categoria" className="font-display font-bold text-xs">Categoría</Label>
              <Input id="categoria" {...register('categoria')} placeholder="Estrategia, Familiar, Party..." />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="anio_publicacion" className="font-display font-bold text-xs">Año de publicación</Label>
              <Input id="anio_publicacion" type="number" {...register('anio_publicacion')} placeholder="2023" />
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
              <Label htmlFor="duracion_minutos" className="font-display font-bold text-xs">Duración (min)</Label>
              <Input id="duracion_minutos" type="number" {...register('duracion_minutos')} placeholder="60" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edad_recomendada" className="font-display font-bold text-xs">Edad recomendada</Label>
              <Input id="edad_recomendada" type="number" {...register('edad_recomendada')} placeholder="12" />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="propietario" className="font-display font-bold text-xs">Propietario</Label>
              <Input id="propietario" {...register('propietario')} placeholder="Club / Nombre del socio donante" />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="foto_url" className="font-display font-bold text-xs">URL de imagen</Label>
              <Input id="foto_url" {...register('foto_url')} placeholder="https://..." />
              {errors.foto_url && <p className="text-xs text-destructive">{errors.foto_url.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bgg_id" className="font-display font-bold text-xs">ID en BoardGameGeek</Label>
              <Input id="bgg_id" {...register('bgg_id')} placeholder="123456" />
            </div>
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
              placeholder="Buscar por título, autor..."
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
              <SelectItem value="disponible">Disponible</SelectItem>
              <SelectItem value="prestado">Prestado</SelectItem>
              <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabla / Lista */}
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-display font-bold text-sm">{juego.titulo}</p>
                          {juego.categoria && (
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {juego.categoria}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {[juego.autor, juego.editorial].filter(Boolean).join(' · ')}
                          {(juego.num_jugadores_min || juego.num_jugadores_max) && (
                            <span>
                              {' · '}
                              {juego.num_jugadores_min}
                              {juego.num_jugadores_max && juego.num_jugadores_max !== juego.num_jugadores_min
                                ? `–${juego.num_jugadores_max}`
                                : ''}{' '}
                              j.
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Select
                          value={juego.estado}
                          onValueChange={(v) => cambiarEstado({ id: juego.id, estado: v as EstadoJuego })}
                        >
                          <SelectTrigger className="h-8 w-36 text-xs">
                            <SelectValue>
                              <Badge variant={cfg.variant} className="font-display text-xs">
                                {cfg.label}
                              </Badge>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="disponible">Disponible</SelectItem>
                            <SelectItem value="prestado">Prestado</SelectItem>
                            <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
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

      {/* Dialog crear/editar */}
      <JuegoFormDialog
        open={dialogOpen}
        juego={editando}
        onClose={() => { setDialogOpen(false); setEditando(undefined) }}
      />

      {/* Confirm eliminar */}
      <AlertDialog open={!!eliminando} onOpenChange={(v) => !v && setEliminando(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-primary">
              ¿Eliminar «{eliminando?.titulo}»?
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
