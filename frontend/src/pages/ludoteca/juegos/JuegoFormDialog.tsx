import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { juegosApi } from '@/services/api/juegos'
import { invalidarJuegos } from '@/lib/queryKeys'
import { sociosApi } from '@/services/api/socios'
import type { Juego } from '@/types/api'

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

// ── Juego form dialog ─────────────────────────────────────────────────────────

export function JuegoFormDialog({ open, onClose, juego }: { open: boolean; onClose: () => void; juego?: Juego }) {
  const queryClient = useQueryClient()
  const isEdit = !!juego

  const { data: sociosData } = useQuery({
    queryKey: ['socios-opciones'],
    queryFn: () => sociosApi.getOpciones(),
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
      // Al editar, un campo vacío se envía como null para que el backend lo borre
      const entries = Object.entries(data).filter(([, v]) => v !== undefined)
      if (isEdit) {
        return juegosApi.update(juego.id, Object.fromEntries(entries.map(([k, v]) => [k, v === '' ? null : v])))
      }
      return juegosApi.create(Object.fromEntries(entries.filter(([, v]) => v !== '')))
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
