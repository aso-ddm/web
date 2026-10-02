import { useQuery } from '@tanstack/react-query'
import { Key, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { SEOHead } from '@/components/SEOHead'
import { sociosApi } from '@/services/api/socios'

export function LlavesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['socios-llaves'],
    queryFn: () => sociosApi.getAll({ estado: 'activo', limit: 500 }),
  })

  const titulares = (data?.data ?? [])
    .filter((s) => s.tiene_llaves)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

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
            ) : titulares.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-sm text-muted-foreground">Ningún socio tiene llaves asignadas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-4 py-3 font-display font-bold text-muted-foreground text-xs uppercase tracking-wide">
                        Socio
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {titulares.map((socio) => (
                      <tr key={socio.id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-display font-bold">
                            {socio.nombre} {socio.apellidos}
                          </p>
                          {socio.apodo && (
                            <p className="text-xs text-muted-foreground">({socio.apodo})</p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
