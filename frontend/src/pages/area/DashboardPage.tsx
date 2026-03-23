import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { User, BookOpen, Key, Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SEOHead } from '@/components/SEOHead'
import { authApi } from '@/services/api/auth'
import { prestamosApi } from '@/services/api/prestamos'
import { useAuthStore } from '@/store/authStore'
import type { EstadoSocio, EstadoPrestamo } from '@/types/api'

const estadoLabels: Record<EstadoSocio, string> = {
  activo: 'Activo',
  pendiente: 'Pendiente de aprobación',
  inactivo: 'Inactivo',
  baja: 'Dado de baja',
}

const estadoVariants: Record<EstadoSocio, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  activo: 'default',
  pendiente: 'secondary',
  inactivo: 'outline',
  baja: 'destructive',
}

const prestamoEstadoIcon: Record<EstadoPrestamo, React.ReactNode> = {
  pendiente: <Clock className="h-3.5 w-3.5" />,
  aprobado: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />,
  activo: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />,
  devuelto: <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />,
  rechazado: <XCircle className="h-3.5 w-3.5 text-destructive" />,
}

const prestamoEstadoLabel: Record<EstadoPrestamo, string> = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  activo: 'Activo',
  devuelto: 'Devuelto',
  rechazado: 'Cancelado',
}

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function DashboardPage() {
  const { usuario: authUsuario } = useAuthStore()

  const { data: meData, isLoading: loadingMe } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me(),
  })

  const { data: prestamosData, isLoading: loadingPrestamos } = useQuery({
    queryKey: ['mis-prestamos', 1],
    queryFn: () => prestamosApi.misPrestamos(1),
  })

  const usuario = meData?.data
  const prestamosActivos = prestamosData?.data.filter(
    (p) => p.estado === 'activo' || p.estado === 'aprobado',
  ) ?? []
  const prestamosPendientes = prestamosData?.data.filter((p) => p.estado === 'pendiente') ?? []
  const ultimosPrestamos = prestamosData?.data.slice(0, 3) ?? []

  // Lógica de llaves
  const puedesolicitarLlaves =
    usuario?.estado === 'activo' &&
    !usuario.tiene_llaves &&
    !usuario.fecha_solicitud_llaves &&
    usuario.fecha_alta
      ? new Date().getTime() - new Date(usuario.fecha_alta).getTime() >= 180 * 24 * 60 * 60 * 1000
      : false

  return (
    <>
      <SEOHead title="Mi panel" description="Panel del socio" path="/area" noindex />

      <div className="space-y-6">
        {/* Cabecera */}
        <div>
          {loadingMe ? (
            <Skeleton className="h-8 w-64" />
          ) : (
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">
              Hola, {authUsuario?.nombre} 👋
            </h1>
          )}
          <p className="text-muted-foreground mt-1">Bienvenido a tu área de socio</p>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Estado */}
          <Card className="border-t-2 border-t-primary overflow-hidden">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-display mb-1">Estado</p>
                  {loadingMe ? (
                    <Skeleton className="h-6 w-20" />
                  ) : (
                    <Badge
                      variant={estadoVariants[usuario?.estado ?? 'pendiente']}
                      className="font-display"
                    >
                      {estadoLabels[usuario?.estado ?? 'pendiente']}
                    </Badge>
                  )}
                </div>
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-primary" />
                </div>
              </div>
              {usuario?.fecha_alta && (
                <p className="text-xs text-muted-foreground mt-3">
                  Socio desde {formatDate(usuario.fecha_alta)}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Préstamos activos */}
          <Card className="border-t-2 border-t-secondary overflow-hidden">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-display mb-1">Préstamos activos</p>
                  {loadingPrestamos ? (
                    <Skeleton className="h-8 w-10" />
                  ) : (
                    <p className="text-3xl font-display font-bold text-secondary leading-none">
                      {prestamosActivos.length}
                    </p>
                  )}
                </div>
                <div className="h-9 w-9 rounded-lg bg-secondary/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-4 w-4 text-secondary" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {prestamosPendientes.length > 0
                  ? `${prestamosPendientes.length} pendiente${prestamosPendientes.length > 1 ? 's' : ''} de aprobación`
                  : 'Sin solicitudes pendientes'}
              </p>
            </CardContent>
          </Card>

          {/* Llaves */}
          <Card className="border-t-2 border-t-primary/40 overflow-hidden">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-display mb-1">Llaves del club</p>
                  {loadingMe ? (
                    <Skeleton className="h-6 w-24" />
                  ) : usuario?.tiene_llaves ? (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-sm font-display font-bold text-emerald-600">Tienes llaves</span>
                    </div>
                  ) : usuario?.fecha_solicitud_llaves ? (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-amber-500 flex-shrink-0" />
                      <span className="text-sm font-display text-amber-600">Pendiente</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Sin llaves</span>
                    </div>
                  )}
                </div>
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Key className="h-4 w-4 text-primary" />
                </div>
              </div>
              {puedesolicitarLlaves && (
                <p className="text-xs text-secondary mt-3 font-display font-bold">¡Ya puedes solicitarlas!</p>
              )}
            </CardContent>
          </Card>

          {/* Cuota */}
          <Card className="border-t-2 border-t-muted-foreground/30 overflow-hidden">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground font-display mb-1">Cuota</p>
                  {loadingMe ? (
                    <Skeleton className="h-6 w-24" />
                  ) : (
                    <p className="text-sm font-display font-bold capitalize text-foreground leading-tight">
                      {usuario?.tipo_cuota ?? '—'}
                    </p>
                  )}
                </div>
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3 truncate">
                {usuario?.email ?? '—'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Acciones rápidas + últimos préstamos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Acciones rápidas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg text-primary">Acciones rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start gap-3 font-display">
                <Link to="/area/perfil">
                  <User className="h-4 w-4" />
                  Ver y editar mi perfil
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-3 font-display">
                <Link to="/area/prestamos">
                  <BookOpen className="h-4 w-4" />
                  Mis préstamos
                </Link>
              </Button>
              {(puedesolicitarLlaves || usuario?.fecha_solicitud_llaves) && (
                <Button asChild variant="outline" className="w-full justify-start gap-3 font-display">
                  <Link to="/area/perfil">
                    <Key className="h-4 w-4" />
                    {puedesolicitarLlaves ? 'Solicitar llaves del club' : 'Ver estado de llaves'}
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Últimos préstamos */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="font-display text-lg text-primary">Últimos préstamos</CardTitle>
              <Button asChild variant="ghost" size="sm" className="font-display text-xs text-muted-foreground">
                <Link to="/area/prestamos">Ver todos</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {loadingPrestamos ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : ultimosPrestamos.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Aún no tienes préstamos</p>
                  <Button asChild variant="link" size="sm" className="mt-1 font-display text-secondary">
                    <Link to="/area/prestamos">Solicitar un juego</Link>
                  </Button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {ultimosPrestamos.map((p) => (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                    >
                      <span className="flex-shrink-0">{prestamoEstadoIcon[p.estado]}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-display font-bold truncate">
                          {p.juego?.titulo ?? 'Juego desconocido'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(p.fecha_solicitud)}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {prestamoEstadoLabel[p.estado]}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
