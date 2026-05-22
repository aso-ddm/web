import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Euro, Gift, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { SEOHead } from '@/components/SEOHead'
import { visitasApi } from '@/services/api/visitas'
import type { Visita } from '@/types/api'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function VisitasPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['visitas-listado', debouncedSearch, page],
    queryFn: () => visitasApi.getAll({ search: debouncedSearch || undefined, page, limit: 50 }),
  })

  const handleSearch = (val: string) => {
    setSearch(val)
    setPage(1)
    clearTimeout((handleSearch as { _t?: ReturnType<typeof setTimeout> })._t)
    ;(handleSearch as { _t?: ReturnType<typeof setTimeout> })._t = setTimeout(
      () => setDebouncedSearch(val),
      300,
    )
  }

  const visitas = data?.data ?? []

  return (
    <>
      <SEOHead title="Listado de invitados" description="Historial de visitas de no socios" path="/directiva/visitas" noindex />

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Invitados</h1>
            <p className="text-muted-foreground mt-1">
              {data ? `${data.total} visita${data.total !== 1 ? 's' : ''} registradas` : 'Historial de visitas de no socios'}
            </p>
          </div>
        </div>

        {/* Buscador */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-9 font-display"
          />
        </div>

        {/* Lista */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : visitas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Users className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">Sin visitas registradas</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {visitas.map((v: Visita) => (
                  <div key={v.id} className="flex items-center gap-4 px-4 py-2.5">
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-sm">{v.nombre_completo}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(v.fecha_visita)}
                        {v.socio_registro && (
                          <span className="ml-2 opacity-60">
                            · registrado por {v.socio_registro.nombre} {v.socio_registro.apellidos}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">visita #{v.numero_visita}</span>
                      <Badge
                        variant={v.es_pago ? 'secondary' : 'default'}
                        className="font-display text-xs gap-1"
                      >
                        {v.es_pago
                          ? <><Euro className="h-3 w-3" />{v.importe}€</>
                          : <><Gift className="h-3 w-3" />Gratis</>
                        }
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Paginación */}
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
    </>
  )
}
