import { useQuery } from '@tanstack/react-query'
import { Key, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SEOHead } from '@/components/atoms/SEOHead'
import { sociosApi } from '@/services/api/socios'
import { QK } from '@/lib/queryKeys'
import { QueryError } from '@/components/molecules/QueryError'
import { SocioDatos } from '@/components/molecules/SocioDatos'
import { RolBadge } from '@/components/atoms/RolBadge'

export function LlavesPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QK.SOCIOS_LLAVES,
    queryFn: () => sociosApi.getAll({ estado: 'activo', tiene_llaves: true, limit: 500 }),
  })

  const titulares = [...(data?.data ?? [])].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

  return (
    <>
      <SEOHead title="Titulares de llaves" description="Panel de directiva" path="/directiva/llaves" noindex />

      <div className="space-y-6">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary flex items-center gap-2">
            <Key className="h-7 w-7" />
            Llaves del club
          </h1>
          <p className="text-muted-foreground mt-1">
            {isLoading ? '…' : `${titulares.length} llave${titulares.length !== 1 ? 's' : ''} entregada${titulares.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : isError ? (
              <QueryError onRetry={() => refetch()} />
            ) : titulares.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-sm text-muted-foreground">Ningún socio tiene llaves asignadas</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {titulares.map((socio) => (
                  <li key={socio.id} className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-display font-bold text-sm">{socio.nombre} {socio.apellidos}</p>
                      {socio.apodo && <span className="text-xs text-muted-foreground">({socio.apodo})</span>}
                      {socio.roles.map((r) => <RolBadge key={r} rol={r} />)}
                    </div>
                    <SocioDatos socio={socio} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
