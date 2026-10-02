import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { logsJuegoApi } from '@/services/api/logs_juego'
import type { LogJuego } from '@/types/api'
import { formatDate } from '@/lib/format'

// ── Historial global ─────────────────────────────────────────────────────────

export function HistorialLogsTab() {
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
