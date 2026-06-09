import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, Loader2, UserX, UserCheck, Shield, Trash2, Plus, Edit2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SEOHead } from '@/components/SEOHead'
import { api } from '@/services/api/client'
import { ROL_LABELS } from '@/lib/roles'
import type { Rol, EstadoSocio } from '@/types/api'
import type { SocioAdmin } from '@/services/api/socios'

const ALL_ROLES: Rol[] = ['administrador', 'presidente', 'secretario', 'tesorero', 'vocal', 'ludotecario', 'socio_basico']

const estadoVariant: Record<EstadoSocio, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  activo: 'default',
  pendiente: 'secondary',
  inactivo: 'outline',
  baja: 'destructive',
}

function formatDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function UsuarioDetalle({
  usuario,
  onClose,
}: {
  usuario: SocioAdmin
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [confirmEliminar, setConfirmEliminar] = useState(false)
  const [editPassword, setEditPassword] = useState('')
  const [rolesEditados, setRolesEditados] = useState<Rol[]>(usuario.roles)

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-usuarios'] })
    onClose()
  }

  const { mutate: eliminar, isPending: eliminando } = useMutation({
    mutationFn: () => api.delete(`/admin/usuarios/${usuario.id}`),
    onSuccess: () => { toast.success(`${usuario.nombre} eliminado`); invalidar() },
    onError: (err: Error) => { toast.error(err.message); setConfirmEliminar(false) },
  })

  const { mutate: cambiarRoles, isPending: cambiandoRoles } = useMutation({
    mutationFn: () => api.put(`/admin/usuarios/${usuario.id}`, { roles: rolesEditados }),
    onSuccess: () => { toast.success('Roles actualizados'); invalidar() },
    onError: (err: Error) => toast.error(err.message),
  })

  const { mutate: cambiarPassword, isPending: cambiandoPassword } = useMutation({
    mutationFn: () => {
      if (editPassword.length < 8) throw new Error('Mínimo 8 caracteres')
      return api.put(`/admin/usuarios/${usuario.id}`, { password: editPassword })
    },
    onSuccess: () => { toast.success('Contraseña actualizada'); setEditPassword('') },
    onError: (err: Error) => toast.error(err.message),
  })

  const toggleRol = (rol: Rol) =>
    setRolesEditados((prev) => prev.includes(rol) ? prev.filter(r => r !== rol) : [...prev, rol])

  const rolesChanged = JSON.stringify([...rolesEditados].sort()) !== JSON.stringify([...usuario.roles].sort())

  return (
    <>
      <div className="space-y-5 py-2">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground font-display">Estado</p>
            <Badge variant={estadoVariant[usuario.estado]} className="mt-0.5 font-display capitalize">
              {usuario.estado}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-display">Alta</p>
            <p className="font-medium">{formatDate(usuario.fecha_alta)}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-muted-foreground font-display">Email</p>
            <p className="font-medium text-sm">{usuario.email}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-display">DNI</p>
            <p className="font-medium">{usuario.dni}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-display">Cuota</p>
            <p className="font-medium capitalize">{usuario.tipo_cuota}</p>
          </div>
        </div>

        {/* Roles */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <p className="font-display font-bold text-sm">Roles</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ALL_ROLES.map((rol) => (
              <button
                key={rol}
                onClick={() => toggleRol(rol)}
                className={`px-2.5 py-1 rounded text-xs font-display transition-colors border ${
                  rolesEditados.includes(rol)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/50'
                }`}
              >
                {ROL_LABELS[rol]}
              </button>
            ))}
          </div>
          {rolesChanged && (
            <Button
              size="sm"
              onClick={() => cambiarRoles()}
              disabled={cambiandoRoles || rolesEditados.length === 0}
              className="font-display font-bold"
            >
              {cambiandoRoles ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Guardar roles
            </Button>
          )}
        </div>

        {/* Cambiar contraseña */}
        <div className="space-y-2">
          <p className="font-display font-bold text-sm">Cambiar contraseña</p>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="Nueva contraseña"
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              className="text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => cambiarPassword()}
              disabled={!editPassword || cambiandoPassword}
              className="font-display shrink-0"
            >
              {cambiandoPassword ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Edit2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Eliminar */}
        <div className="space-y-2 pt-2 border-t border-destructive/20">
          <p className="font-display font-bold text-sm text-destructive">Zona destructiva</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmEliminar(true)}
            className="font-display text-destructive border-destructive/30 hover:bg-destructive/10 gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar usuario definitivamente
          </Button>
        </div>
      </div>

      <AlertDialog open={confirmEliminar} onOpenChange={setConfirmEliminar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-primary">
              ¿Eliminar a {usuario.nombre} {usuario.apellidos}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es <strong>irreversible</strong>. Se eliminará el usuario y todos sus datos del sistema.
              No se puede eliminar si tiene préstamos activos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-display">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => eliminar()}
              disabled={eliminando}
              className="font-display font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {eliminando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eliminar definitivamente'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function AdminUsuariosPage() {
  const [search, setSearch] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoSocio | 'todos'>('todos')
  const [page, setPage] = useState(1)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<SocioAdmin | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-usuarios', search, estadoFiltro, page],
    queryFn: () => {
      const q = new URLSearchParams()
      if (search) q.set('search', search)
      if (estadoFiltro !== 'todos') q.set('estado', estadoFiltro)
      q.set('page', String(page))
      q.set('limit', '50')
      return api.get<{ data: SocioAdmin[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(`/admin/usuarios?${q.toString()}`)
    },
  })

  const usuarios = data?.data ?? []
  const pag = data?.pagination

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
              <SelectItem value="inactivo" className="font-display">Inactivos</SelectItem>
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
                  <Badge variant={estadoVariant[usuario.estado]} className="font-display capitalize text-xs hidden sm:flex">
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

        {/* Paginación */}
        {pag && pag.totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
            <span className="px-3 py-1.5 text-sm text-muted-foreground font-display">
              {page} / {pag.totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= pag.totalPages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
          </div>
        )}
      </div>

      <Sheet open={!!usuarioSeleccionado} onOpenChange={(v) => !v && setUsuarioSeleccionado(null)}>
        <SheetContent className="overflow-y-auto">
          {usuarioSeleccionado && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="font-display text-primary">
                  {usuarioSeleccionado.nombre} {usuarioSeleccionado.apellidos}
                </SheetTitle>
                <SheetDescription>{usuarioSeleccionado.email}</SheetDescription>
              </SheetHeader>
              <UsuarioDetalle
                usuario={usuarioSeleccionado}
                onClose={() => setUsuarioSeleccionado(null)}
              />
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
