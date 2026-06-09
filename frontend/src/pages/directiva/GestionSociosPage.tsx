import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, Users, ChevronRight, Loader2, UserX, UserCheck, Shield, Key, CheckCircle2, Clock, Send, FileText } from 'lucide-react'
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
import { SEOHead } from '@/components/SEOHead'
import { sociosApi, type SocioAdmin } from '@/services/api/socios'
import { getEstadoLlaves } from '@/lib/llaves'
import { ROL_LABELS } from '@/lib/roles'
import type { Rol, EstadoSocio } from '@/types/api'

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

function TelegramSection({ socio }: { socio: SocioAdmin }) {
  const { mutate: enviarBienvenida, isPending } = useMutation({
    mutationFn: () => sociosApi.enviarBienvenidaTelegram(socio.id),
    onSuccess: () => toast.success('Mensaje de bienvenida enviado por Telegram'),
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Send className="h-4 w-4 text-primary" />
        <p className="font-display font-bold text-sm">Telegram vinculado</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => enviarBienvenida()}
        disabled={isPending}
        className="font-display gap-2"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        Enviar bienvenida
      </Button>
    </div>
  )
}

function SocioDetalle({ socio, onClose }: { socio: SocioAdmin; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [rolesEditados, setRolesEditados] = useState<Rol[]>(socio.roles)
  const [confirmBaja, setConfirmBaja] = useState(false)
  const [confirmDevolucion, setConfirmDevolucion] = useState(false)
  const [confirmReactivar, setConfirmReactivar] = useState(false)
  const [abriendo, setAbriendo] = useState(false)

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['socios-gestion'] })
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

  const { mutate: devolverLlaves, isPending: devolviendo } = useMutation({
    mutationFn: () => sociosApi.devolverLlaves(socio.id),
    onSuccess: () => { toast.success('Llave devuelta correctamente'); invalidar() },
    onError: (err: Error) => toast.error(err.message),
  })

  const { mutate: aprobarLlaves, isPending: aprobandoLlaves } = useMutation({
    mutationFn: () => sociosApi.aprobarLlaves(socio.id),
    onSuccess: () => { toast.success('Llaves aprobadas correctamente'); invalidar() },
    onError: (err: Error) => toast.error(err.message),
  })

  const estadoLlaves = getEstadoLlaves(socio)

  const { mutate: guardarRoles, isPending: guardandoRoles } = useMutation({
    mutationFn: () => sociosApi.updateRoles(socio.id, rolesEditados),
    onSuccess: () => { toast.success('Roles actualizados'); invalidar() },
    onError: (err: Error) => toast.error(err.message),
  })

  const toggleRol = (rol: Rol) => {
    setRolesEditados((prev) =>
      prev.includes(rol) ? prev.filter((r) => r !== rol) : [...prev, rol],
    )
  }

  const rolesChanged = JSON.stringify([...rolesEditados].sort()) !== JSON.stringify([...socio.roles].sort())

  return (
    <>
      <div className="space-y-5 py-2">
        {/* Info básica */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground font-display">Estado</p>
            <Badge variant={estadoVariant[socio.estado]} className="mt-0.5 font-display capitalize">
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
                <p className="font-display font-bold text-sm">Comprobante de pago</p>
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

        {socio.telegram_chat_id && (
          <>
            <Separator />
            <TelegramSection socio={socio} />
          </>
        )}

        <Separator />

        {/* Llaves */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" />
            <p className="font-display font-bold text-sm">Llaves del club</p>
          </div>
          {estadoLlaves.tipo === 'titular' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-bold text-emerald-700">Tiene llaves</p>
                  <p className="text-xs text-emerald-600">Desde {formatDate(socio.fecha_aprobacion_llaves)}{estadoLlaves.aprobadoPor ? ` · Aprobado por ${estadoLlaves.aprobadoPor}` : ''}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setConfirmDevolucion(true)} disabled={devolviendo} className="font-display gap-2 text-amber-700 border-amber-300 hover:bg-amber-50">
                <Key className="h-3.5 w-3.5" />
                Registrar devolución
              </Button>
            </div>
          )}
          {estadoLlaves.tipo === 'pendiente' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-display font-bold text-amber-700">Solicitud pendiente</p>
                  <p className="text-xs text-amber-600">Solicitadas el {formatDate(socio.fecha_solicitud_llaves)}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => aprobarLlaves()} disabled={aprobandoLlaves} className="font-display gap-2 text-emerald-700 border-emerald-300 hover:bg-emerald-50">
                {aprobandoLlaves ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Aprobar llaves
              </Button>
            </div>
          )}
          {estadoLlaves.tipo === 'sin_llave' && (
            <p className="text-sm text-muted-foreground">Sin llaves asignadas</p>
          )}
        </div>

        <Separator />

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
        </div>

        <Separator />
        <div className="space-y-2">
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
        </div>
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
            <AlertDialogAction onClick={() => devolverLlaves()} disabled={devolviendo} className="font-display font-bold">
              {devolviendo ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirmar devolución'}
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

  const { data, isLoading } = useQuery({
    queryKey: ['socios-gestion', search, estadoFiltro, page],
    queryFn: () =>
      sociosApi.getAll({
        search: search || undefined,
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
              <SelectItem value="inactivo">Inactivos</SelectItem>
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
                          <Badge variant={estadoVariant[socio.estado]} className="text-xs font-display capitalize">
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
