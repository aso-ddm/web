import { useEffect, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Search, Users, ChevronRight, Key } from 'lucide-react'
import { SocioDatos } from '@/components/molecules/SocioDatos'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { SEOHead } from '@/components/atoms/SEOHead'
import { sociosApi } from '@/services/api/socios'
import { QK } from '@/lib/queryKeys'
import { PageLoader } from '@/components/atoms/PageLoader'
import type { EstadoSocio } from '@/types/api'
import { ESTADO_SOCIO_VARIANT } from '@/lib/estados'
import { RolBadge } from '@/components/atoms/RolBadge'
import { SocioDetalle } from './socios/SocioDetalle'
import { QueryError } from '@/components/molecules/QueryError'
import { Paginacion } from '@/components/molecules/Paginacion'
import { useAuthStore } from '@/store/authStore'

export function GestionSociosPage() {
  const [search, setSearch] = useState('')
  const esDirectiva = useAuthStore((s) => s.isDirectiva())
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoSocio | 'todos'>('activo')
  const [page, setPage] = useState(1)
  // Solo el id: la ficha se carga (y se refresca tras cada cambio) con su propia query
  const [socioId, setSocioId] = useState<string | null>(null)

  const debouncedSearch = useDebouncedValue(search)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: QK.SOCIOS_GESTION_LISTA(debouncedSearch, estadoFiltro, page),
    placeholderData: keepPreviousData,
    queryFn: () =>
      sociosApi.getAll({
        search: debouncedSearch || undefined,
        estado: estadoFiltro !== 'todos' ? (estadoFiltro as EstadoSocio) : undefined,
        page,
        limit: 20,
      }),
  })

  const { data: socioSeleccionado } = useQuery({
    queryKey: QK.SOCIO(socioId ?? ''),
    queryFn: () => sociosApi.getById(socioId!),
    enabled: !!socioId,
    select: (r) => r.data,
  })

  const socios = data?.data ?? []
  const pag = data
  // Tras una baja o un borrado la última página puede quedar vacía: volver a la última que existe
  useEffect(() => {
    if (pag && page > Math.max(1, pag.totalPages)) setPage(Math.max(1, pag.totalPages))
  }, [pag, page])

  return (
    <>
      <SEOHead title="Gestión de socios" description="Panel de directiva" path="/directiva/socios" noindex />

      <div className="space-y-6">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Gestión de socios</h1>
          <p className="text-muted-foreground mt-1">
            {pag ? `${pag.total} socio${pag.total !== 1 ? 's' : ''} registrado${pag.total !== 1 ? 's' : ''}` : '…'}
          </p>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nombre, email, DNI, apodo..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9"
            />
          </div>
          <Select
            value={estadoFiltro}
            onValueChange={(v) => { setEstadoFiltro(v as EstadoSocio | 'todos'); setPage(1) }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="activo">Activos</SelectItem>
              <SelectItem value="pendiente">Pendientes</SelectItem>
              {/* Protección de datos: las bajas solo las ve la directiva */}
              {esDirectiva && <SelectItem value="baja">Baja</SelectItem>}
            </SelectContent>
          </Select>
        </div>

        {/* Lista */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : isError && socios.length === 0 ? (
              <QueryError onRetry={() => refetch()} />
            ) : socios.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-sm text-muted-foreground">No hay socios con los filtros aplicados</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {socios.map((socio) => (
                  <li key={socio.id}>
                    <button
                      className="w-full flex items-center gap-4 px-4 py-3 hover:bg-accent/30 transition-colors text-left"
                      onClick={() => setSocioId(socio.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-display font-bold text-sm">
                            {socio.nombre} {socio.apellidos}
                          </p>
                          {socio.apodo && (
                            <span className="text-xs text-muted-foreground">({socio.apodo})</span>
                          )}
                          <Badge variant={ESTADO_SOCIO_VARIANT[socio.estado]} className="text-xs font-display capitalize">
                            {socio.estado}
                          </Badge>
                          {socio.solicitud_grupal && (
                            <Badge variant="outline" className="text-xs font-display">Cuota conjunta</Badge>
                          )}
                          {socio.tiene_llaves && (
                            <Badge variant="outline" className="text-xs font-display gap-1"><Key className="h-3 w-3" />Llaves</Badge>
                          )}
                          {socio.roles.map((r) => <RolBadge key={r} rol={r} />)}
                        </div>
                        <SocioDatos socio={socio} />
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Paginacion page={page} totalPages={pag?.totalPages ?? 1} onChange={setPage} />
      </div>

      {/* Drawer detalle */}
      <Sheet open={!!socioId} onOpenChange={(v) => !v && setSocioId(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {!socioSeleccionado ? (
            <>
              <SheetTitle className="sr-only">Cargando socio</SheetTitle>
              <PageLoader />
            </>
          ) : (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-primary">
                  {socioSeleccionado.nombre} {socioSeleccionado.apellidos}
                </SheetTitle>
                <SheetDescription>{socioSeleccionado.email}</SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-6">
                <SocioDetalle
                  key={socioSeleccionado.id}
                  socio={socioSeleccionado}
                  onClose={() => setSocioId(null)}
                  onAbrirSocio={setSocioId}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
