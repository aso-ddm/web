import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { logsJuegoApi } from '@/services/api/logs_juego'
import type { Juego, LogJuego } from '@/types/api'
import { formatDate } from '@/lib/format'
import { tipoLogLabel } from './constants'

// ── Logs panel ────────────────────────────────────────────────────────────────

export function LogsPanel({ juego }: { juego: Juego }) {
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
