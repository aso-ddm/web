import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Handshake } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CederJuegoDialog } from '@/components/organisms/CederJuegoDialog'
import { juegosApi } from '@/services/api/juegos'
import { solicitudesJuegoApi } from '@/services/api/solicitudes_juego'
import { QK } from '@/lib/queryKeys'
import type { EstadoJuego } from '@/types/api'

const estadoJuegoLabel: Record<EstadoJuego, string> = {
  en_estanteria: 'En la estantería',
  prestado: 'Prestado',
  retirado: 'Retirado',
}

/** Juegos que el socio ha cedido al club (y las cesiones aún sin revisar), con el botón para ceder otro */
export function JuegosCedidosCard() {
  const [cederOpen, setCederOpen] = useState(false)
  const { data: juegos = [], isLoading } = useQuery({
    queryKey: QK.MIS_JUEGOS,
    queryFn: () => juegosApi.mios(),
    select: (r) => r.data,
  })
  // Misma query que "Mis solicitudes de cesión" de la ludoteca: el diálogo la invalida al enviar
  const { data: pendientes = [] } = useQuery({
    queryKey: QK.MIS_SOLICITUDES_JUEGO,
    queryFn: () => solicitudesJuegoApi.getMias(),
    select: (r) => r.data.filter((s) => s.estado === 'pendiente'),
  })

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
        <CardTitle className="font-display text-lg text-primary">Mis juegos cedidos</CardTitle>
        <Button size="sm" variant="outline" className="font-display gap-2" onClick={() => setCederOpen(true)}>
          <Handshake className="h-3.5 w-3.5" /> Ceder un juego
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : juegos.length === 0 && pendientes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aún no has cedido ningún juego al club
          </p>
        ) : (
          <ul className="space-y-2">
            {pendientes.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                <p className="text-sm font-display font-bold truncate">{s.nombre}</p>
                <Badge variant="secondary" className="font-display text-xs flex-shrink-0">Pendiente de revisión</Badge>
              </li>
            ))}
            {juegos.map((j) => (
              <li key={j.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
                <p className="text-sm font-display font-bold truncate">{j.nombre}</p>
                <Badge variant={j.estado === 'en_estanteria' ? 'default' : 'outline'} className="font-display text-xs flex-shrink-0">
                  {estadoJuegoLabel[j.estado]}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
      <CederJuegoDialog open={cederOpen} onClose={() => setCederOpen(false)} />
    </Card>
  )
}
