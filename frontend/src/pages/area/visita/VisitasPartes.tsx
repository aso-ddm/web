import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Search, Euro, Gift, Loader2, RotateCcw, Users, CalendarDays } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { visitasApi } from '@/services/api/visitas'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { Visita } from '@/types/api'
import { formatDate } from '@/lib/format'
import { QK } from '@/lib/queryKeys'

// Confirmación tras registrar una visita y listado de visitas

export function VisitaConfirmada({ visita, onNueva }: { visita: Visita; onNueva: () => void }) {
  return (
    <div className="space-y-6">
      <div className={`rounded-xl border-2 p-6 text-center space-y-3 ${
        visita.es_pago
          ? 'border-secondary/40 bg-secondary/5'
          : 'border-primary/40 bg-primary/5'
      }`}>
        {visita.es_pago ? (
          <>
            <Euro className="h-12 w-12 mx-auto text-secondary" />
            <h2 className="font-display font-bold text-xl text-secondary">Visita de pago</h2>
            <p className="text-3xl font-display font-bold text-secondary">
              {visita.importe}€
            </p>
            <p className="text-muted-foreground text-sm">
              Es la visita número <strong>{visita.numero_visita}</strong> de{' '}
              <strong>{visita.nombre_completo}</strong>
            </p>
          </>
        ) : (
          <>
            <Gift className="h-12 w-12 mx-auto text-primary" />
            <h2 className="font-display font-bold text-xl text-primary">Visita gratuita</h2>
            <p className="text-muted-foreground text-sm">
              Es la visita número <strong>{visita.numero_visita}</strong> de{' '}
              <strong>{visita.nombre_completo}</strong>
            </p>
          </>
        )}
      </div>

      <Button
        onClick={onNueva}
        variant="outline"
        className="w-full font-display font-bold gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Registrar otra visita
      </Button>
    </div>
  )
}

const PAGE_SIZE = 25

export function ListadoVisitas() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: QK.VISITAS_LISTA(debouncedSearch),
    queryFn: ({ pageParam }) =>
      visitasApi.getAll({ search: debouncedSearch || undefined, page: pageParam as number, limit: PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  })

  const visitas = data?.pages.flatMap((p) => p.data) ?? []
  const total = data?.pages[0]?.total

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-xl text-primary flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Historial de invitados
          </h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {total !== undefined
              ? `${total} visita${total !== 1 ? 's' : ''} registradas`
              : 'Historial de visitas de no socios'}
          </p>
        </div>
        <div className="relative max-w-sm w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 font-display"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : visitas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm">
                {debouncedSearch ? 'Sin resultados para esa búsqueda' : 'Sin visitas registradas'}
              </p>
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

      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="font-display gap-2"
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            {isFetchingNextPage && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isFetchingNextPage ? 'Cargando...' : `Cargar más (${total! - visitas.length} restantes)`}
          </Button>
        </div>
      )}
    </div>
  )
}
