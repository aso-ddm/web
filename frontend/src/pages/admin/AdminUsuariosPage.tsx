import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, Loader2, UserX, Shield, Trash2, Edit2, Save } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { SEOHead } from '@/components/atoms/SEOHead'
import { adminApi } from '@/services/api/admin'
import { ROL_LABELS, toggleRol as toggleRolLista, ROLES_ASIGNABLES } from '@/lib/roles'
import { QK, invalidarSocios } from '@/lib/queryKeys'
import { useAuthStore } from '@/store/authStore'
import type { Rol, EstadoSocio } from '@/types/api'
import type { SocioAdmin } from '@/services/api/socios'
import { formatDate } from '@/lib/format'
import { ESTADO_SOCIO_VARIANT } from '@/lib/estados'
import { passwordSchema } from '@/pages/registro/schema'

const SELECT_CLASS = 'h-9 w-full rounded-md border border-input bg-card px-3 text-sm shadow-xs disabled:opacity-50 disabled:bg-muted'

const CAMPOS_TEXTO = [
  ['nombre', 'Nombre', 'text', false],
  ['apellidos', 'Apellidos', 'text', false],
  ['email', 'Email', 'email', true],
  ['dni', 'DNI', 'text', false],
  ['telefono', 'Teléfono', 'tel', false],
  ['fecha_nacimiento', 'Nacimiento', 'date', false],
  ['apodo', 'Apodo', 'text', false],
  ['direccion', 'Dirección', 'text', true],
  ['alias_telegram', 'Alias de Telegram', 'text', false],
  ['fecha_alta', 'Alta', 'date', false],
  ['fecha_baja', 'Baja', 'date', false],
] as const

type FormDatos = Record<(typeof CAMPOS_TEXTO)[number][0], string> & {
  tipo_cuota: string
  estado: string
  tiene_llaves: boolean
  consentimiento_tiendas: boolean
}

function aFormulario(u: SocioAdmin): FormDatos {
  return {
    nombre: u.nombre,
    apellidos: u.apellidos,
    email: u.email,
    dni: u.dni,
    telefono: u.telefono ?? '',
    fecha_nacimiento: u.fecha_nacimiento?.slice(0, 10) ?? '',
    apodo: u.apodo ?? '',
    direccion: u.direccion ?? '',
    alias_telegram: u.alias_telegram ?? '',
    fecha_alta: u.fecha_alta?.slice(0, 10) ?? '',
    fecha_baja: u.fecha_baja?.slice(0, 10) ?? '',
    tipo_cuota: u.tipo_cuota,
    estado: u.estado,
    tiene_llaves: u.tiene_llaves,
    consentimiento_tiendas: !!u.consentimiento_tiendas,
  }
}

// ponytail: administrador no es asignable desde la app (solo BD/seed)
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
  const esUnoMismo = useAuthStore((s) => s.usuario?.id === usuario.id)

  const invalidar = () => {
    invalidarSocios(queryClient)
    onClose()
  }

  const { mutate: eliminar, isPending: eliminando } = useMutation({
    mutationFn: () => adminApi.deleteUsuario(usuario.id),
    onSuccess: () => { toast.success(`${usuario.nombre} eliminado`); invalidar() },
    onError: (err: Error) => toast.error(err.message), // el diálogo sigue abierto para reintentar
  })

  const { mutate: cambiarRoles, isPending: cambiandoRoles } = useMutation({
    mutationFn: () => adminApi.updateUsuario(usuario.id, { roles: rolesEditados }),
    onSuccess: () => { toast.success('Roles actualizados'); invalidar() },
    onError: (err: Error) => toast.error(err.message),
  })

  const { mutate: cambiarPassword, isPending: cambiandoPassword } = useMutation({
    mutationFn: () => {
      // Mismas reglas que el backend: 8 caracteres, una mayúscula y un número
      const valida = passwordSchema.safeParse(editPassword)
      if (!valida.success) throw new Error(valida.error.issues[0].message)
      return adminApi.updateUsuario(usuario.id, { password: editPassword })
    },
    onSuccess: () => { toast.success('Contraseña actualizada'); setEditPassword('') },
    onError: (err: Error) => toast.error(err.message),
  })

  const esAdmin = usuario.roles.includes('administrador')
  const { register, control, handleSubmit, formState: { isDirty, dirtyFields } } = useForm<FormDatos>({
    defaultValues: aFormulario(usuario),
  })

  const { mutate: guardarDatos, isPending: guardando } = useMutation({
    // Solo se envía lo modificado; vacío = null en los campos opcionales
    mutationFn: (v: FormDatos) => adminApi.updateUsuario(usuario.id, Object.fromEntries(
      (Object.keys(dirtyFields) as (keyof FormDatos)[]).map((k) => [k, v[k] === '' ? null : v[k]]),
    )),
    onSuccess: () => { toast.success('Datos actualizados'); invalidar() },
    onError: (err: Error) => toast.error(err.message),
  })

  const { mutate: desvincularTelegram } = useMutation({
    mutationFn: () => adminApi.updateUsuario(usuario.id, { telegram_chat_id: null }),
    onSuccess: () => { toast.success('Telegram desvinculado'); invalidar() },
    onError: (err: Error) => toast.error(err.message),
  })

  const toggleRol = (rol: Rol) => setRolesEditados((prev) => toggleRolLista(prev, rol))

  const rolesChanged = JSON.stringify([...rolesEditados].sort()) !== JSON.stringify([...usuario.roles].sort())

  return (
    <>
      <div className="space-y-5 py-2">
        <form onSubmit={handleSubmit((v) => guardarDatos(v))} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {CAMPOS_TEXTO.map(([campo, label, type, ancho]) => (
              <div key={campo} className={ancho ? 'col-span-2 space-y-1' : 'space-y-1'}>
                <Label htmlFor={campo} className="text-xs text-muted-foreground font-display">{label}</Label>
                <Input id={campo} type={type} className="text-sm" {...register(campo)} />
              </div>
            ))}
            <div className="space-y-1">
              <Label htmlFor="tipo_cuota" className="text-xs text-muted-foreground font-display">Cuota</Label>
              <select id="tipo_cuota" className={SELECT_CLASS} {...register('tipo_cuota')}>
                <option value="individual">Individual</option>
                <option value="conjunta">Conjunta</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="estado" className="text-xs text-muted-foreground font-display">Estado</Label>
              {/* El backend no deja cambiar el estado de un administrador */}
              <select id="estado" className={SELECT_CLASS} disabled={esAdmin} {...register('estado')}>
                <option value="pendiente">Pendiente</option>
                <option value="activo">Activo</option>
                <option value="baja">Baja</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Controller control={control} name="tiene_llaves" render={({ field }) => (
                <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
              )} />
              Tiene llaves
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Controller control={control} name="consentimiento_tiendas" render={({ field }) => (
                <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
              )} />
              Consentimiento tiendas
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            Registrado el {formatDate(usuario.created_at)}
            {usuario.telegram_chat_id && <> · Telegram vinculado{' '}
              <button type="button" className="underline hover:text-destructive" onClick={() => desvincularTelegram()}>
                (desvincular)
              </button>
            </>}
          </p>
          {isDirty && (
            <Button type="submit" size="sm" disabled={guardando} className="font-display font-bold gap-1">
              {guardando ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Guardar datos
            </Button>
          )}
        </form>

        {/* Roles — nadie cambia sus propios roles */}
        {!esUnoMismo && <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <p className="font-display font-bold text-sm">Roles</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ROLES_ASIGNABLES.map((rol) => (
              <button
                key={rol}
                onClick={() => toggleRol(rol)}
                className={`px-2.5 py-1 rounded text-xs font-display transition-colors border ${
                  rolesEditados.includes(rol)
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-card text-foreground hover:border-primary'
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
        </div>}

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

        {/* Eliminar — las cuentas de administrador no se borran desde la app */}
        {!esAdmin && <div className="space-y-2 pt-2 border-t border-destructive/20">
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
        </div>}
      </div>

      <ConfirmDialog
        open={confirmEliminar}
        onOpenChange={setConfirmEliminar}
        title={`¿Eliminar a ${usuario.nombre} ${usuario.apellidos}?`}
        description={<>
          Esta acción es <strong>irreversible</strong>. Se eliminará el usuario y todos sus datos del sistema.
          No se puede eliminar si tiene préstamos activos.
        </>}
        confirmLabel="Eliminar definitivamente"
        destructive
        onConfirm={() => eliminar()}
        pending={eliminando}
      />
    </>
  )
}

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
  const pag = data?.pagination
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
