import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { RotateCcw, Loader2, Clock, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { SEOHead } from '@/components/SEOHead'
import { prestamosApi } from '@/services/api/prestamos'
import type { Prestamo } from '@/types/api'

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function diasRestantes(fechaLimite: string): number {
  return Math.ceil((new Date(fechaLimite).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

function nombreSocio(p: Prestamo) {
  if (!p.socio) return 'Socio desconocido'
  return `${p.socio.nombre} ${p.socio.apellidos}${p.socio.apodo ? ` (${p.socio.apodo})` : ''}`
}

function PrestamoRow({ prestamo }: { prestamo: Prestamo }) {
  const queryClient = useQueryClient()
  const dias = diasRestantes(prestamo.fecha_limite)
  const vencido = dias < 0

  const { mutate: devolver, isPending } = useMutation({
    mutationFn: () => prestamosApi.devolucion(prestamo.id),
    onSuccess: () => {
      toast.success('Devolución confirmada')
      queryClient.invalidateQueries({ queryKey: ['prestamos-gestion'] })
      queryClient.invalidateQueries({ queryKey: ['juegos'] })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  return (
    <div className="py-3 border-b border-border last:border-0">
      <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-bold text-sm">{prestamo.juego?.nombre ?? '—'}</p>
            {vencido && (
              <Badge variant="destructive" className="font-display text-xs gap-1">
                <AlertTriangle className="h-3 w-3" /> Vencido
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {nombreSocio(prestamo)}
            {prestamo.socio?.email && <span className="text-muted-foreground/70"> · {prestamo.socio.email}</span>}
          </p>
          <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-1">
            <span>Desde: {formatDate(prestamo.fecha_prestamo)}</span>
            <span className={vencido ? 'text-destructive font-medium' : ''}>
              Límite: {formatDate(prestamo.fecha_limite)}
              {!vencido && dias <= 3 && <span className="text-amber-600"> ({dias}d)</span>}
              {vencido && <span> (hace {Math.abs(dias)}d)</span>}
            </span>
            {prestamo.renovaciones > 0 && <span>Renovaciones: {prestamo.renovaciones}</span>}
          </div>
          {prestamo.notas && (
            <p className="text-xs text-muted-foreground italic mt-1">"{prestamo.notas}"</p>
          )}
        </div>
        <Button
          size="sm"
          variant={vencido ? 'destructive' : 'outline'}
          onClick={() => devolver()}
          disabled={isPending}
          className="font-display font-bold h-8 gap-1 flex-shrink-0"
        >
          {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
          Confirmar devolución
        </Button>
      </div>
    </div>
  )
}

function PrestamosActivos() {
  const { data, isLoading } = useQuery({
    queryKey: ['prestamos-gestion', 'activo'],
    queryFn: () => prestamosApi.getAll({ estado: 'activo' }),
  })

  const prestamos = data?.data ?? []
  const vencidos = prestamos.filter((p) => diasRestantes(p.fecha_limite) < 0)
  const vigentes = prestamos.filter((p) => diasRestantes(p.fecha_limite) >= 0)

  if (isLoading) return (
    <div className="space-y-3 pt-4">
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
    </div>
  )

  if (prestamos.length === 0) return (
    <div className="text-center py-12 text-muted-foreground">
      <Clock className="h-8 w-8 mx-auto mb-2 opacity-30" />
      <p className="text-sm">No hay préstamos activos</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {vencidos.length > 0 && (
        <Card className="border-destructive/40">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-sm text-destructive flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> Vencidos ({vencidos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vencidos.map((p) => <PrestamoRow key={p.id} prestamo={p} />)}
          </CardContent>
        </Card>
      )}
      {vigentes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-sm text-primary flex items-center gap-2">
              <Clock className="h-4 w-4" /> En préstamo ({vigentes.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vigentes.map((p) => <PrestamoRow key={p.id} prestamo={p} />)}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function HistorialPrestamos() {
  const { data, isLoading } = useQuery({
    queryKey: ['prestamos-gestion', 'devuelto'],
    queryFn: () => prestamosApi.getAll({ estado: 'devuelto' }),
  })

  const prestamos = data?.data ?? []

  if (isLoading) return (
    <div className="space-y-3 pt-4">
      {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
    </div>
  )

  if (prestamos.length === 0) return (
    <div className="text-center py-12 text-muted-foreground">
      <p className="text-sm">Sin historial aún</p>
    </div>
  )

  return (
    <Card>
      <CardContent className="pt-4">
        {prestamos.map((p) => (
          <div key={p.id} className="py-2 border-b border-border last:border-0 flex items-center justify-between gap-3">
            <div>
              <p className="font-display font-bold text-sm">{p.juego?.nombre ?? '—'}</p>
              <p className="text-xs text-muted-foreground">
                {nombreSocio(p)} · {formatDate(p.fecha_prestamo)} → {formatDate(p.fecha_devolucion)}
              </p>
            </div>
            <Badge variant="outline" className="font-display text-xs">Devuelto</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function GestionPrestamosPage() {
  const { data: activoData } = useQuery({
    queryKey: ['prestamos-gestion', 'activo'],
    queryFn: () => prestamosApi.getAll({ estado: 'activo' }),
  })
  const vencidosCount = (activoData?.data ?? []).filter((p) => diasRestantes(p.fecha_limite) < 0).length

  return (
    <>
      <SEOHead title="Gestión de préstamos" description="Panel de préstamos de la ludoteca" path="/ludoteca/prestamos" noindex />

      <div className="space-y-6">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Gestión de préstamos</h1>
          <p className="text-muted-foreground mt-1">Supervisa préstamos activos y confirma devoluciones</p>
        </div>

        <Tabs defaultValue="activos">
          <TabsList className="mb-4">
            <TabsTrigger value="activos" className="font-display relative">
              Activos
              {vencidosCount > 0 && (
                <span className="ml-1.5 bg-destructive text-destructive-foreground text-xs rounded-full px-1.5 py-0.5 font-bold">
                  {vencidosCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="historial" className="font-display">Historial</TabsTrigger>
          </TabsList>

          <TabsContent value="activos"><PrestamosActivos /></TabsContent>
          <TabsContent value="historial"><HistorialPrestamos /></TabsContent>
        </Tabs>
      </div>
    </>
  )
}
