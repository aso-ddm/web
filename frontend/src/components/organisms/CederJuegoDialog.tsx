import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { solicitudesJuegoApi } from '@/services/api/solicitudes_juego'
import { QK } from '@/lib/queryKeys'
import type { TipoJuego } from '@/types/api'
import { tipoJuegoLabel } from '@/pages/ludoteca/juegos/constants'

export function CederJuegoDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [nombre, setNombre] = useState('')
  const [notas, setNotas] = useState('')
  const [tipo, setTipo] = useState<TipoJuego>('juego')

  const { mutate, isPending } = useMutation({
    mutationFn: () => solicitudesJuegoApi.crear({ nombre: nombre.trim(), notas: notas.trim() || undefined, tipo }),
    onSuccess: () => {
      toast.success('Solicitud de cesión enviada al ludotecario. Puedes seguirla en Mis préstamos y cesiones')
      queryClient.invalidateQueries({ queryKey: QK.MIS_SOLICITUDES_JUEGO })
      onClose()
      setNombre('')
      setNotas('')
      setTipo('juego')
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Ceder un juego al club</DialogTitle>
          <DialogDescription>
            El juego sigue siendo tuyo: lo cedes al club para que forme parte de la ludoteca y el resto de
            socios pueda jugarlo y pedirlo prestado. El ludotecario revisará la solicitud y, si la aprueba,
            lo añadirá al catálogo contigo como propietario.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div>
            <Label className="font-display text-sm">¿Qué cedes?</Label>
            <div className="flex gap-2 mt-1">
              {(['juego', 'libro'] as const).map((t) => (
                <Button key={t} type="button" size="sm" variant={tipo === t ? 'default' : 'outline'} className="font-display text-xs" onClick={() => setTipo(t)}>
                  {tipoJuegoLabel[t]}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <Label className="font-display text-sm">Nombre *</Label>
            <Input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder={tipo === 'libro' ? 'Título del libro o cómic' : 'Nombre del juego'}
              maxLength={200}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="font-display text-sm">Notas (opcional)</Label>
            <Textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder={tipo === 'libro' ? 'Autor, estado, tomos, etc.' : 'Estado del juego, número de expansiones, etc.'}
              rows={3}
              maxLength={1000}
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
