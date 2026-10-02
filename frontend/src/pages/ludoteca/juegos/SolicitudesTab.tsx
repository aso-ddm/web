import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Check, X } from 'lucide-react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { solicitudesJuegoApi } from '@/services/api/solicitudes_juego'
import { invalidarJuegos } from '@/lib/queryKeys'
import type { SolicitudJuego } from '@/types/api'
import { formatDate } from '@/lib/format'

// ── Solicitudes tab ───────────────────────────────────────────────────────────

export function SolicitudesTab() {
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
