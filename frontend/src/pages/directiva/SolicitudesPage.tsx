import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { CheckCircle2, User, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SEOHead } from '@/components/atoms/SEOHead'
import { sociosApi, type SocioListado } from '@/services/api/socios'
import { escucharEventos } from '@/services/api/eventos'
import { QK } from '@/lib/queryKeys'
import type { SolicitudGrupal } from '@/types/api'
import { useConfigNumero } from '@/hooks/useConfigValor'
import { ApiRequestError } from '@/services/api/client'
import { QueryError } from '@/components/molecules/QueryError'
import { AltaSolicitudCard, GrupoSolicitudCard } from './solicitudes/SolicitudCards'

export function SolicitudesPage() {
  const queryClient = useQueryClient()
  const { data: pendientesData, isLoading: loadingAltas, isError, refetch } = useQuery({
    queryKey: QK.PENDIENTES,
    queryFn: () => sociosApi.getPendientes(),
    staleTime: 0,
  })

  // Altas nuevas en vivo. Si la conexión se corta, reintenta con espera creciente (5 s → 1 min) y recarga
  // por si se perdió algún aviso. Un 4xx (sin permiso, sesión caducada) no se arregla reintentando: se deja
  useEffect(() => {
    const ctrl = new AbortController()
    void (async () => {
      let espera = 5000
      while (!ctrl.signal.aborted) {
        const inicio = Date.now()
        try {
          await escucharEventos((key) => queryClient.invalidateQueries({ queryKey: [key] }), ctrl.signal)
        } catch (err) {
          if (err instanceof ApiRequestError && err.status < 500) return
        }
        if (ctrl.signal.aborted) return
        if (Date.now() - inicio > 60_000) espera = 5000 // estuvo conectado un rato: corte puntual
        await new Promise((r) => setTimeout(r, espera))
        espera = Math.min(espera * 2, 60_000)
        queryClient.invalidateQueries({ queryKey: QK.PENDIENTES })
      }
    })()
    return () => ctrl.abort()
  }, [queryClient])

  const precioIndividual = useConfigNumero('precio_cuota_individual', 15)
  const precioAdicional = useConfigNumero('precio_cuota_adicional', 5)


  const { individuales = [], grupos = [] } = pendientesData?.data ?? {}
  const totalPendiente = individuales.length + grupos.length

  return (
    <>
      <SEOHead title="Solicitudes pendientes" description="Panel de directiva" path="/directiva/solicitudes" noindex />

      <div className="space-y-6">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Solicitudes pendientes</h1>
          <p className="text-muted-foreground mt-1">
            {totalPendiente === 0
              ? 'No hay solicitudes pendientes'
              : `${totalPendiente} solicitud${totalPendiente !== 1 ? 'es' : ''} pendiente${totalPendiente !== 1 ? 's' : ''} de revisión`}
          </p>
        </div>

        {/* Solicitudes de alta individuales */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base text-primary flex items-center gap-2">
              <User className="h-4 w-4" />
              Solicitudes individuales ({loadingAltas ? '…' : individuales.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAltas ? (
              <div className="space-y-4">{[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
            ) : isError ? (
              <QueryError onRetry={() => refetch()} />
            ) : individuales.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay solicitudes individuales pendientes</p>
              </div>
            ) : (
            individuales.map((s: SocioListado) => <AltaSolicitudCard key={s.id} socio={s} precioIndividual={precioIndividual} />)
            )}
          </CardContent>
        </Card>

        {/* Solicitudes conjuntas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-base text-primary flex items-center gap-2">
              <Users className="h-4 w-4" />
              Solicitudes conjuntas ({loadingAltas ? '…' : grupos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAltas ? (
              <div className="space-y-4">{[1].map((i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
            ) : isError ? (
              <QueryError onRetry={() => refetch()} />
            ) : grupos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No hay solicitudes conjuntas pendientes</p>
              </div>
            ) : (
            grupos.map((g: SolicitudGrupal) => <GrupoSolicitudCard key={g.id} grupo={g} precioIndividual={precioIndividual} precioAdicional={precioAdicional} />)
            )}
          </CardContent>
        </Card>

      </div>
    </>
  )
}
