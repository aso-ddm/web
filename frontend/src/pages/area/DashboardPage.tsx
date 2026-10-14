import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { User, BookOpen, Key, CheckCircle2, AlertCircle, ExternalLink, FileText, MessageCircle, LogOut } from 'lucide-react'
import { ConfirmDialog } from '@/components/organisms/ConfirmDialog'
import { RichTextContent } from '@/components/molecules/RichTextContent'
import { useConfigValor } from '@/hooks/useConfigValor'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { SEOHead } from '@/components/atoms/SEOHead'
import { authApi } from '@/services/api/auth'
import { prestamosApi } from '@/services/api/prestamos'
import { configuracionApi, enlacesInteresApi } from '@/services/api/configuracion'
import { useAuthStore } from '@/store/authStore'
import type { EstadoSocio, EstadoPrestamo } from '@/types/api'
import { formatDate } from '@/lib/format'
import { ESTADO_SOCIO_VARIANT } from '@/lib/estados'

const estadoLabels: Record<EstadoSocio, string> = {
  activo: 'Activo',
  pendiente: 'Pendiente de aprobación',
  baja: 'Dado de baja',
}

const MESES_PARA_LLAVES = 6

function fechaPuedePedirLlaves(fechaAlta: string): Date {
  const d = new Date(fechaAlta)
  d.setMonth(d.getMonth() + MESES_PARA_LLAVES)
  return d
}

const DIAS_ENTRE_SOLICITUDES_LLAVES = 30

// Tras pedir llaves, el botón no vuelve hasta pasados 30 días exactos (el backend aplica la misma regla).
// Devuelve los días que faltan (0 = ya puede volver a pedirlas)
function diasParaRepetirSolicitudLlaves(solicitadas?: string | null): number {
  if (!solicitadas) return 0
  const disponible = new Date(solicitadas).getTime() + DIAS_ENTRE_SOLICITUDES_LLAVES * 86_400_000
  return Math.max(0, Math.ceil((disponible - Date.now()) / 86_400_000))
}

const prestamoEstadoIcon: Record<EstadoPrestamo, React.ReactNode> = {
  activo: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />,
  devuelto: <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />,
}

const prestamoEstadoLabel: Record<EstadoPrestamo, string> = {
  activo: 'Activo',
  devuelto: 'Devuelto',
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

  const { data: clubLinks } = useQuery({
    queryKey: ['config-club-links'],
    queryFn: () => Promise.allSettled([
      configuracionApi.getOne('url_estatutos'),
      configuracionApi.getOne('url_reglamento_interno'),
    ]).then(([estatutos, reglamento]) => ({
      urlEstatutos: estatutos.status === 'fulfilled' ? estatutos.value?.data?.valor : '',
      urlReglamento: reglamento.status === 'fulfilled' ? reglamento.value?.data?.valor : '',
    })),
    staleTime: 5 * 60 * 1000,
  })

  const { data: enlacesInteres = [] } = useQuery({
    queryKey: ['config', 'enlaces_interes'],
    queryFn: () => enlacesInteresApi.getAll(),
    staleTime: 5 * 60 * 1000,
  })

  const queryClient = useQueryClient()
  const { mutate: pedirLlaves, isPending: pidiendoLlaves } = useMutation({
    mutationFn: () => authApi.pedirLlaves(),
    onSuccess: () => {
      toast.success('Ya hemos avisado al secretario. Espera a que se ponga en contacto contigo por Telegram.')
      // Devolver la promesa mantiene el botón en "Enviando…" hasta que llega el /me actualizado
      return queryClient.invalidateQueries({ queryKey: ['me'] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'No se pudo enviar la solicitud'),
  })

  const [bajaOpen, setBajaOpen] = useState(false)
  const textoBaja = useConfigValor('texto_baja_socio', '')
  const { mutate: pedirBaja, isPending: pidiendoBaja } = useMutation({
    mutationFn: () => authApi.pedirBaja(),
    onSuccess: () => {
      setBajaOpen(false)
      toast.success('Hemos avisado al secretario. Se pondrá en contacto contigo por Telegram para tramitar la baja.')
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : 'No se pudo enviar la solicitud'),
  })

  const usuario = meData?.data
  const fechaLlaves = usuario?.fecha_alta ? fechaPuedePedirLlaves(usuario.fecha_alta) : null
  const puedePedirLlaves = !!fechaLlaves && fechaLlaves <= new Date()
  const diasParaPedirLlaves = diasParaRepetirSolicitudLlaves(usuario?.llaves_solicitadas_at)
  const prestamosActivos = prestamosData?.data.filter(
    (p) => p.estado === 'activo',
  ) ?? []
  const ultimosPrestamos = prestamosData?.data.slice(0, 3) ?? []

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
                      variant={ESTADO_SOCIO_VARIANT[usuario?.estado ?? 'pendiente']}
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
                Los préstamos se aprueban automáticamente
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
                      <CheckCircle2 className="h-4 w-4 text-emerald-700 flex-shrink-0" />
                      <span className="text-sm font-display font-bold text-emerald-700">Tienes llaves</span>
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
              {!loadingMe && usuario && !usuario.tiene_llaves && usuario.estado === 'activo' && (
                puedePedirLlaves ? (
                  diasParaPedirLlaves > 0 ? (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-2">
                        <p className="text-sm font-display font-bold text-emerald-800 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                          Solicitud de llaves enviada
                        </p>
                        <p className="text-xs text-emerald-900/80">
                          El {formatDate(usuario.llaves_solicitadas_at, 'long')} avisamos al secretario del club de que
                          quieres las llaves. Se pondrá en contacto contigo por Telegram para acordar la entrega.
                        </p>
                        <p className="text-xs text-emerald-900/80 pt-2 border-t border-emerald-200">
                          Podrás volver a solicitarlas en{' '}
                          <span className="font-display font-bold text-emerald-800">
                            {diasParaPedirLlaves} {diasParaPedirLlaves === 1 ? 'día' : 'días'}
                          </span>
                          {' '}si no has tenido respuesta.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-emerald-700">Ya llevas {MESES_PARA_LLAVES} meses como socio: puedes pedir las llaves.</p>
                      <Button
                        size="sm"
                        className="w-full font-display gap-2"
                        onClick={() => pedirLlaves()}
                        disabled={pidiendoLlaves}
                      >
                        <Key className="h-3.5 w-3.5" />
                        {pidiendoLlaves ? 'Enviando…' : 'Pedir llaves'}
                      </Button>
                    </div>
                  )
                ) : (
                  <p className="text-xs text-muted-foreground mt-3">
                    No puedes pedir las llaves hasta llevar {MESES_PARA_LLAVES} meses como socio
                    {fechaLlaves && <> (a partir del {formatDate(fechaLlaves.toISOString())})</>}.
                  </p>
                )
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
              {usuario?.estado === 'activo' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-3 font-display gap-2 text-destructive hover:text-destructive"
                  onClick={() => setBajaOpen(true)}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Darme de baja
                </Button>
              )}
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
                  <p className="text-sm font-medium">Aún no tienes préstamos activos</p>
                  <p className="text-xs mt-1">Los préstamos se aprueban automáticamente al solicitarlos</p>
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
                          {p.juego?.nombre ?? 'Juego desconocido'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(p.fecha_prestamo)}
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

        {/* Enlaces de interés */}
        {enlacesInteres.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg text-primary">Enlaces de interés</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {enlacesInteres.map((e, i) => (
                <Button key={i} asChild variant="outline" className="justify-start gap-3 font-display">
                  <a href={e.url} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    <span className="truncate">{e.label}</span>
                    <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                  </a>
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Recursos del club */}
        {clubLinks && (clubLinks.urlEstatutos || clubLinks.urlReglamento) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-display text-lg text-primary">Recursos del club</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {clubLinks.urlEstatutos && (
                <Button asChild variant="outline" className="justify-start gap-3 font-display">
                  <a href={clubLinks.urlEstatutos} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4" />
                    Estatutos
                    <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                  </a>
                </Button>
              )}
              {clubLinks.urlReglamento && (
                <Button asChild variant="outline" className="justify-start gap-3 font-display">
                  <a href={clubLinks.urlReglamento} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4" />
                    Reglamento interno
                    <ExternalLink className="h-3 w-3 ml-auto opacity-50" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={bajaOpen}
        onOpenChange={setBajaOpen}
        title="¿Quieres darte de baja?"
        description={
          textoBaja
            ? <RichTextContent html={textoBaja} />
            : 'Vamos a avisar al secretario del club de que quieres darte de baja. Se pondrá en contacto contigo por Telegram.'
        }
        confirmLabel="Avisar al secretario"
        onConfirm={() => pedirBaja()}
        pending={pidiendoBaja}
        destructive
      />
    </>
  )
}
