import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Handshake } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { QueryError } from '@/components/molecules/QueryError'
import { TipoJuegoBadge } from '@/components/atoms/TipoJuegoBadge'
import { CederJuegoDialog } from '@/components/organisms/CederJuegoDialog'
import { solicitudesJuegoApi } from '@/services/api/solicitudes_juego'
import { QK } from '@/lib/queryKeys'
import { formatDate } from '@/lib/format'
import type { EstadoSolicitudJuego } from '@/types/api'

const estadoSolicitud: Record<EstadoSolicitudJuego, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
  pendiente: { label: 'Pendiente de revisión', variant: 'secondary' },
  aprobada: { label: 'Aprobada', variant: 'default' },
  rechazada: { label: 'Rechazada', variant: 'destructive' },
}

/** Solicitudes de cesión del socio (juegos y libros que ofrece al club) */
export function MisCesiones() {
  const [cederOpen, setCederOpen] = useState(false)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QK.MIS_SOLICITUDES_JUEGO,
    queryFn: () => solicitudesJuegoApi.getMias(),
  })
  const solicitudes = data?.data ?? []
  const total = data?.total ?? 0

  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between gap-2 space-y-0">
        <CardTitle className="font-display text-base text-primary">Mis cesiones{total > 0 && ` (${total})`}</CardTitle>
        <Button variant="outline" size="sm" className="font-display gap-1.5 h-8" onClick={() => setCederOpen(true)}>
          <Handshake className="h-4 w-4" /> Ceder al club
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : isError ? (
          <QueryError onRetry={() => refetch()} />
        ) : solicitudes.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Aún no has cedido nada. Si tienes un juego, libro o cómic que quieras compartir, cédelo al club: sigue siendo tuyo.
          </p>
        ) : (
          solicitudes.map((s) => (
            <div key={s.id} className="flex items-start justify-between gap-3 py-2.5 border-b border-border last:border-0">
              <div className="min-w-0">
                <p className="font-display font-bold text-sm">{s.nombre}<TipoJuegoBadge tipo={s.tipo} /></p>
                <p className="text-xs text-muted-foreground">Solicitada el {formatDate(s.created_at)}</p>
                {s.motivo_rechazo && <p className="text-xs text-muted-foreground italic">"{s.motivo_rechazo}"</p>}
              </div>
              <Badge variant={estadoSolicitud[s.estado].variant} className="font-display text-xs flex-shrink-0">
                {estadoSolicitud[s.estado].label}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
      <CederJuegoDialog open={cederOpen} onClose={() => setCederOpen(false)} />
    </Card>
  )
}
