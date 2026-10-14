import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Shield, Trash2, Edit2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { adminApi } from '@/services/api/admin'
import { ROL_LABELS, toggleRol as toggleRolLista, ROLES_ASIGNABLES } from '@/lib/roles'
import { invalidarSocios } from '@/lib/queryKeys'
import { useAuthStore } from '@/store/authStore'
import type { Rol } from '@/types/api'
import type { SocioAdmin } from '@/services/api/socios'
import { formatDate } from '@/lib/format'
import { passwordSchema } from '@/pages/registro/schema'

// Ficha editable de un usuario en el panel de administración

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
    estado: u.estado,
    tiene_llaves: u.tiene_llaves,
    consentimiento_tiendas: !!u.consentimiento_tiendas,
  }
}

// ponytail: administrador no es asignable desde la app (solo BD/seed)
export function UsuarioDetalle({
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
            {/* La cuota conjunta se gestiona desde Gestión de socios (unir / pasar a individual) */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-display">Cuota</p>
              <p className="text-sm h-9 flex items-center capitalize">{usuario.tipo_cuota}</p>
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
            {/* Telegram no se desvincula a mano: solo se borra al dar de baja */}
            {usuario.telegram_chat_id && ' · Telegram vinculado'}
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
