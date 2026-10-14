import { useEffect, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Search, UserX, Shield } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { SEOHead } from '@/components/atoms/SEOHead'
import { adminApi } from '@/services/api/admin'
import { QK } from '@/lib/queryKeys'
import type { EstadoSocio } from '@/types/api'
import type { SocioAdmin } from '@/services/api/socios'
import { ESTADO_SOCIO_VARIANT } from '@/lib/estados'
import { Paginacion } from '@/components/molecules/Paginacion'
import { UsuarioDetalle } from './usuarios/UsuarioDetalle'

export function AdminUsuariosPage() {
  const [search, setSearch] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoSocio | 'todos'>('todos')
  const [page, setPage] = useState(1)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<SocioAdmin | null>(null)

  const debouncedSearch = useDebouncedValue(search)
  const { data, isLoading } = useQuery({
    queryKey: QK.ADMIN_USUARIOS_LISTA(debouncedSearch, estadoFiltro, page),
    placeholderData: keepPreviousData,
    queryFn: () => adminApi.getUsuarios({
      search: debouncedSearch || undefined,
      estado: estadoFiltro !== 'todos' ? estadoFiltro : undefined,
      page,
      limit: 50,
    }),
  })

  const usuarios = data?.data ?? []
  const pag = data
  // Tras una baja o un borrado la última página puede quedar vacía: volver a la última que existe
  useEffect(() => {
    if (pag && page > Math.max(1, pag.totalPages)) setPage(Math.max(1, pag.totalPages))
  }, [pag, page])

  return (
    <>
      <SEOHead title="Admin — Usuarios" description="Gestión completa de usuarios" path="/admin/usuarios" noindex />

      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Usuarios</h1>
          </div>
          <p className="text-muted-foreground">
            {pag ? `${pag.total} usuarios en total` : '…'}
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o DNI..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9"
            />
          </div>
          <Select value={estadoFiltro} onValueChange={(v) => { setEstadoFiltro(v as EstadoSocio | 'todos'); setPage(1) }}>
            <SelectTrigger className="w-full sm:w-40 font-display">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos" className="font-display">Todos</SelectItem>
              <SelectItem value="activo" className="font-display">Activos</SelectItem>
              <SelectItem value="pendiente" className="font-display">Pendientes</SelectItem>
              <SelectItem value="baja" className="font-display">Baja</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lista */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : usuarios.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <UserX className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">No hay usuarios</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-1">
            {usuarios.map((usuario) => (
              <div
                key={usuario.id}
                onClick={() => setUsuarioSeleccionado(usuario)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg border border-transparent hover:border-border hover:bg-accent/30 cursor-pointer transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-display font-bold text-primary">
                    {usuario.nombre[0]}{usuario.apellidos[0]}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-bold truncate">
                    {usuario.nombre} {usuario.apellidos}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{usuario.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={ESTADO_SOCIO_VARIANT[usuario.estado]} className="font-display capitalize text-xs hidden sm:flex">
                    {usuario.estado}
                  </Badge>
                  {usuario.roles.includes('administrador') && (
                    <Shield className="h-3.5 w-3.5 text-primary" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Paginacion page={page} totalPages={pag?.totalPages ?? 1} onChange={setPage} />
      </div>

      <Sheet open={!!usuarioSeleccionado} onOpenChange={(v) => !v && setUsuarioSeleccionado(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {usuarioSeleccionado && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-primary">
                  {usuarioSeleccionado.nombre} {usuarioSeleccionado.apellidos}
                </SheetTitle>
                <SheetDescription>{usuarioSeleccionado.email}</SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-6">
                <UsuarioDetalle
                  usuario={usuarioSeleccionado}
                  onClose={() => setUsuarioSeleccionado(null)}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
