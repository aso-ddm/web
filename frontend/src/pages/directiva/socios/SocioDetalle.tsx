import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, UserX, UserCheck, Shield, Key, CheckCircle2, FileText } from 'lucide-react'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { sociosApi, type SocioAdmin } from '@/services/api/socios'
import { invalidarSocios } from '@/lib/queryKeys'
import { useAuthStore } from '@/store/authStore'
import { ROL_LABELS, toggleRol as toggleRolLista, ROLES_ASIGNABLES } from '@/lib/roles'
import type { Rol } from '@/types/api'
import { formatDate } from '@/lib/format'
import { ESTADO_SOCIO_VARIANT } from '@/lib/estados'

export function SocioDetalle({ socio, onClose }: { socio: SocioAdmin; onClose: () => void }) {
  const queryClient = useQueryClient()
  const puedeEditar = useAuthStore((s) => s.isDirectiva()) // vocales: solo lectura
  const pendiente = socio.estado === 'pendiente' // se aprueba o rechaza en Solicitudes
  // Nadie cambia sus propios roles ni su estado, ni los de un administrador o un pendiente
  const puedeGestionar = useAuthStore((s) => s.usuario?.id !== socio.id) && puedeEditar && !socio.roles.includes('administrador') && !pendiente
  const [rolesEditados, setRolesEditados] = useState<Rol[]>(socio.roles)
  const [confirmBaja, setConfirmBaja] = useState(false)
  const [confirmDevolucion, setConfirmDevolucion] = useState(false)
  const [confirmReactivar, setConfirmReactivar] = useState(false)
  const [abriendo, setAbriendo] = useState(false)

  const invalidar = () => {
    invalidarSocios(queryClient)
    onClose()
  }

  const { mutate: darBaja, isPending: bajando } = useMutation({
    mutationFn: () => sociosApi.darDeBaja(socio.id),
    onSuccess: () => { toast.success(`${socio.nombre} dado de baja`); invalidar() },
    onError: (err: Error) => toast.error(err.message),
  })

  const { mutate: reactivar, isPending: reactivando } = useMutation({
    mutationFn: () => sociosApi.reactivar(socio.id),
    onSuccess: () => { toast.success(`${socio.nombre} reactivado correctamente`); invalidar() },
    onError: (err: Error) => toast.error(err.message),
  })

  const abrirComprobante = async () => {
    setAbriendo(true)
    try {
      await sociosApi.getComprobante(socio.id)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al abrir el comprobante')
    } finally {
      setAbriendo(false)
    }
  }

  const { mutate: setLlaves, isPending: guardandoLlaves } = useMutation({
    mutationFn: (tiene: boolean) => sociosApi.setLlaves(socio.id, tiene),
    onSuccess: (_, tiene) => {
      toast.success(tiene ? 'Llaves asignadas' : 'Devolución de llaves registrada')
      invalidar()
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const { mutate: guardarRoles, isPending: guardandoRoles } = useMutation({
    mutationFn: () => sociosApi.updateRoles(socio.id, rolesEditados),
    onSuccess: () => { toast.success('Roles actualizados'); invalidar() },
    onError: (err: Error) => toast.error(err.message),
  })

  const toggleRol = (rol: Rol) => setRolesEditados((prev) => toggleRolLista(prev, rol))

  const rolesChanged = JSON.stringify([...rolesEditados].sort()) !== JSON.stringify([...socio.roles].sort())

  return (
    <>
      <div className="space-y-5 py-2">
        {/* Info básica */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground font-display">Estado</p>
            <Badge variant={ESTADO_SOCIO_VARIANT[socio.estado]} className="mt-0.5 font-display capitalize">
              {socio.estado}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-display">Cuota</p>
            <p className="font-medium capitalize">{socio.tipo_cuota}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-display">DNI</p>
            <p className="font-medium">{socio.dni}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-display">Alta</p>
            <p className="font-medium">{formatDate(socio.fecha_alta)}</p>
          </div>
          {socio.telefono && (
            <div>
              <p className="text-xs text-muted-foreground font-display">Teléfono</p>
              <p className="font-medium">{socio.telefono}</p>
            </div>
          )}
          {socio.alias_telegram && (
            <div>
              <p className="text-xs text-muted-foreground font-display">Telegram</p>
              <p className="font-medium">{socio.alias_telegram}</p>
            </div>
          )}
          {socio.aprobado_por && (
            <div>
              <p className="text-xs text-muted-foreground font-display">Aprobado por</p>
              <p className="font-medium text-xs">{socio.aprobado_por.nombre} {socio.aprobado_por.apellidos}</p>
            </div>
          )}
        </div>

        {socio.comprobante_transferencia && (
          <>
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <p className="font-display font-bold text-sm">Comprobante de alta</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={abrirComprobante}
                disabled={abriendo}
                className="font-display gap-2"
              >
                {abriendo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                Ver justificante
              </Button>
            </div>
          </>
        )}


        <Separator />

        {/* Llaves */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            <p className="font-display font-bold text-sm">Llaves del club</p>
          </div>
          {socio.tiene_llaves ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-sm font-display font-bold text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                Tiene llaves
              </span>
              {puedeEditar && (
                <Button size="sm" variant="ghost" onClick={() => setConfirmDevolucion(true)} disabled={guardandoLlaves} className="font-display text-xs text-muted-foreground">
                  Registrar devolución
                </Button>
              )}
            </div>
          ) : puedeEditar && socio.estado === 'activo' ? (
            <Button size="sm" variant="outline" onClick={() => setLlaves(true)} disabled={guardandoLlaves} className="font-display gap-2">
              {guardandoLlaves ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Key className="h-3.5 w-3.5" />}
              Asignar llaves
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">Sin llaves</p>
          )}
        </div>

        <Separator />

        {pendiente && puedeEditar && <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Solicitud pendiente de revisar.</p>
          <Button asChild variant="outline" size="sm" className="font-display">
            <Link to="/directiva/solicitudes" onClick={onClose}>Ir a Solicitudes →</Link>
          </Button>
        </div>}

        {/* Roles */}
        {puedeGestionar && <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <p className="font-display font-bold text-sm">Roles</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {ROLES_ASIGNABLES.map((rol) => (
              <button
                key={rol}
                onClick={() => toggleRol(rol)}
                className={`px-2.5 py-1 rounded text-xs font-display capitalize transition-colors border ${
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
              onClick={() => guardarRoles()}
              disabled={guardandoRoles || rolesEditados.length === 0}
              className="font-display font-bold"
            >
              {guardandoRoles ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Guardar roles
            </Button>
          )}
        </div>}

        {/* Nadie se da de baja a sí mismo ni a un administrador */}
        {puedeGestionar && <Separator />}
        {puedeGestionar && <div className="space-y-2">
          {socio.estado === 'baja' ? (
            <>
              <p className="font-display font-bold text-sm text-emerald-700">Reactivar socio</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmReactivar(true)}
                className="font-display text-emerald-700 border-emerald-300 hover:bg-emerald-50 gap-2"
              >
                <UserCheck className="h-4 w-4" />
                Dar de alta al socio
              </Button>
            </>
          ) : (
            <>
              <p className="font-display font-bold text-sm text-destructive">Zona peligrosa</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmBaja(true)}
                className="font-display text-destructive border-destructive/30 hover:bg-destructive/10 gap-2"
              >
                <UserX className="h-4 w-4" />
                Dar de baja al socio
              </Button>
            </>
          )}
        </div>}
      </div>

      <AlertDialog open={confirmBaja} onOpenChange={setConfirmBaja}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-primary">
              ¿Dar de baja a {socio.nombre} {socio.apellidos}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              El socio quedará en estado "baja" y perderá acceso al área privada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-display">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => darBaja()}
              disabled={bajando}
              className="font-display font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bajando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Dar de baja'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmDevolucion} onOpenChange={setConfirmDevolucion}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-primary">
              ¿Registrar devolución de llaves?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Se marcará que {socio.nombre} {socio.apellidos} ha devuelto las llaves del club.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-display">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => setLlaves(false)} disabled={guardandoLlaves} className="font-display font-bold">
              {guardandoLlaves ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar devolución'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmReactivar} onOpenChange={setConfirmReactivar}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-primary">
              ¿Dar de alta a {socio.nombre} {socio.apellidos}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              El socio volverá al estado activo y recuperará el acceso al área privada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-display">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => reactivar()}
              disabled={reactivando}
              className="font-display font-bold bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {reactivando ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Dar de alta'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
