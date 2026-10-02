import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Wallet, Check, X, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SEOHead } from '@/components/SEOHead'
import { cuotasApi, type SocioCuotas } from '@/services/api/cuotas'
import { situacion, mesEnPeriodo, type EstadoPago, type Situacion } from '@/lib/cuotas'
import { cn } from '@/lib/utils'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const TABS: { value: Situacion; label: string }[] = [
  { value: 'moroso', label: 'Morosos' },
  { value: 'pendiente', label: 'Pendientes de revisar' },
  { value: 'al_corriente', label: 'Al corriente' },
]
// Clic en una celda: sin revisar → pagado → sin pagar → sin revisar
const SIGUIENTE = (e: EstadoPago | undefined): EstadoPago | null =>
  e === undefined ? 'pagado' : e === 'pagado' ? 'sin_pagar' : null

const QK_CUOTAS = ['cuotas']

export function CuotasPage() {
  const qc = useQueryClient()
  const hoy = new Date()
  const [tab, setTab] = useState<Situacion>('pendiente')
  const [anio, setAnio] = useState(hoy.getFullYear())
  // Socios tocados en esta pestaña: siguen visibles aunque cambie su situación, para poder seguir marcando
  const [fijados, setFijados] = useState<Set<string>>(new Set())

  const { data, isLoading } = useQuery({ queryKey: QK_CUOTAS, queryFn: cuotasApi.getAll })
  const socios = data?.data ?? []

  const { mutate: marcar } = useMutation({
    mutationFn: (v: { socioId: string; mes: number; estado: EstadoPago | null }) =>
      cuotasApi.marcar(v.socioId, anio, v.mes, v.estado),
    onMutate: ({ socioId, mes, estado }) => {
      setFijados((s) => new Set(s).add(socioId))
      qc.setQueryData<{ data: SocioCuotas[] }>(QK_CUOTAS, (old) => old && {
        data: old.data.map((s) => {
          if (s.id !== socioId) return s
          const resto = s.pagos_cuota.filter((p) => !(p.anio === anio && p.mes === mes))
          return { ...s, pagos_cuota: estado ? [...resto, { anio, mes, estado }] : resto }
        }),
      })
    },
    onError: (err: Error) => {
      toast.error(err.message)
      qc.invalidateQueries({ queryKey: QK_CUOTAS })
    },
  })

  const conSituacion = socios.map((s) => ({ ...s, situacion: situacion(s.fecha_alta, s.pagos_cuota, hoy) }))
  const contar = (t: Situacion) => conSituacion.filter((s) => s.situacion === t).length
  const visibles = conSituacion.filter((s) => s.situacion === tab || fijados.has(s.id))

  const primerAnio = Math.min(hoy.getFullYear(), ...socios.map((s) => new Date(s.fecha_alta).getFullYear()))
  const anios = Array.from({ length: hoy.getFullYear() - primerAnio + 1 }, (_, i) => hoy.getFullYear() - i)

  return (
    <>
      <SEOHead title="Cuotas" description="Panel de directiva" path="/directiva/cuotas" noindex />

      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary flex items-center gap-2">
              <Wallet className="h-7 w-7" />
              Cuotas
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Pulsa un mes para cambiar su estado: sin revisar → pagado → sin pagar.
            </p>
          </div>
          <Select value={String(anio)} onValueChange={(v) => setAnio(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {anios.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={tab} onValueChange={(v) => { setTab(v as Situacion); setFijados(new Set()) }}>
          <TabsList className="flex-wrap h-auto">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="font-display font-bold">
                {t.label} ({isLoading ? '…' : contar(t.value)})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : visibles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-sm text-muted-foreground">No hay socios en esta categoría</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="sticky left-0 bg-card text-left px-4 py-3 font-display font-bold text-muted-foreground text-xs uppercase tracking-wide">
                        Socio
                      </th>
                      {MESES.map((m) => (
                        <th key={m} className="px-1 py-3 font-display font-bold text-muted-foreground text-xs uppercase">{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visibles.map((s) => {
                      const miembros = s.grupo_como_titular?._count.miembros ?? 0
                      return (
                        <tr key={s.id} className="hover:bg-accent/30 transition-colors">
                          <td className="sticky left-0 bg-card px-4 py-2 whitespace-nowrap">
                            <p className="font-display font-bold">
                              {s.nombre} {s.apellidos}
                              {miembros > 1 && <span className="text-xs text-muted-foreground font-normal"> (+{miembros - 1})</span>}
                            </p>
                          </td>
                          {MESES.map((nombreMes, i) => {
                            const mes = i + 1
                            if (!mesEnPeriodo(s.fecha_alta, anio, mes, hoy)) {
                              return <td key={mes} className="text-center text-muted-foreground/40">—</td>
                            }
                            const estado = s.pagos_cuota.find((p) => p.anio === anio && p.mes === mes)?.estado
                            const etiqueta = estado === 'pagado' ? 'pagado' : estado === 'sin_pagar' ? 'sin pagar' : 'sin revisar'
                            return (
                              <td key={mes} className="px-1 py-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => marcar({ socioId: s.id, mes, estado: SIGUIENTE(estado) })}
                                  title={`${nombreMes} ${anio}: ${etiqueta}`}
                                  aria-label={`${s.nombre} ${s.apellidos}, ${nombreMes} ${anio}: ${etiqueta}`}
                                  className={cn(
                                    'h-8 w-8 rounded-md inline-flex items-center justify-center border transition-colors',
                                    estado === 'pagado' && 'bg-emerald-600/15 border-emerald-600/40 text-emerald-700',
                                    estado === 'sin_pagar' && 'bg-destructive/15 border-destructive/40 text-destructive',
                                    !estado && 'border-dashed border-border text-muted-foreground hover:bg-accent',
                                  )}
                                >
                                  {estado === 'pagado' ? <Check className="h-4 w-4" /> : estado === 'sin_pagar' ? <X className="h-4 w-4" /> : '·'}
                                </button>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
