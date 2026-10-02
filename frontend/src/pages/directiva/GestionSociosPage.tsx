import { useState } from 'react'
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, Users, ChevronRight, Loader2, UserX, UserCheck, Shield, Key, CheckCircle2, FileText } from 'lucide-react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { SEOHead } from '@/components/SEOHead'
import { sociosApi, type SocioAdmin } from '@/services/api/socios'
import { invalidarSocios } from '@/lib/queryKeys'
import { useAuthStore } from '@/store/authStore'
import { ROL_LABELS, toggleRol as toggleRolLista, ROLES_ASIGNABLES } from '@/lib/roles'
import type { Rol, EstadoSocio } from '@/types/api'
import { formatDate } from '@/lib/format'
import { ESTADO_SOCIO_VARIANT } from '@/lib/estados'

function RolBadge({ rol }: { rol: Rol }) {
  const colors: Record<Rol, string> = {
    administrador: 'bg-destructive text-destructive-foreground',
    presidente: 'bg-primary text-primary-foreground',
    secretario: 'bg-primary/80 text-primary-foreground',
    tesorero: 'bg-primary/70 text-primary-foreground',
    vocal: 'bg-secondary/20 text-secondary-foreground',
    ludotecario: 'bg-accent text-accent-foreground',
    socio_basico: 'bg-muted text-muted-foreground',
  }
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-display ${colors[rol]}`}>
      {ROL_LABELS[rol]}
    </span>
  )
}


function SocioDetalle({ socio, onClose }: { socio: SocioAdmin; onClose: () => void }) {
  const queryClient = useQueryClient()
  const puedeEditar = useAuthStore((s) => s.isDirectiva()) // vocales: solo lectura
  // Nadie cambia sus propios roles ni su estado, ni los de un administrador
  const puedeGestionar = useAuthStore((s) => s.usuario?.id !== socio.id) && puedeEditar && !socio.roles.includes('administrador')
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

export function GestionSociosPage() {
  const [search, setSearch] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoSocio | 'todos'>('activo')
  const [page, setPage] = useState(1)
  const [socioSeleccionado, setSocioSeleccionado] = useState<SocioAdmin | null>(null)

  const debouncedSearch = useDebouncedValue(search)
  const { data, isLoading } = useQuery({
    queryKey: ['socios-gestion', debouncedSearch, estadoFiltro, page],
    placeholderData: keepPreviousData,
    queryFn: () =>
      sociosApi.getAll({
        search: debouncedSearch || undefined,
        estado: estadoFiltro !== 'todos' ? (estadoFiltro as EstadoSocio) : undefined,
        page,
        limit: 20,
      }),
  })

  const socios = data?.data ?? []
  const pag = data?.pagination

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
              <SelectItem value="baja">Baja</SelectItem>
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
                      onClick={() => setSocioSeleccionado(socio)}
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
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{socio.email}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {socio.roles.map((r) => <RolBadge key={r} rol={r} />)}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Paginación */}
        {pag && pag.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {pag.page} de {pag.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="font-display"
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pag.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="font-display"
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer detalle */}
      <Sheet open={!!socioSeleccionado} onOpenChange={(v) => !v && setSocioSeleccionado(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          {socioSeleccionado && (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-primary">
                  {socioSeleccionado.nombre} {socioSeleccionado.apellidos}
                </SheetTitle>
                <SheetDescription>{socioSeleccionado.email}</SheetDescription>
              </SheetHeader>
              <div className="px-4 pb-6">
                <SocioDetalle
                  socio={socioSeleccionado}
                  onClose={() => setSocioSeleccionado(null)}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
