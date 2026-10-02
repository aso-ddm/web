import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Wallet, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SEOHead } from '@/components/atoms/SEOHead'
import { cuotasApi, type SocioCuotas } from '@/services/api/cuotas'
import { esMoroso, mesEnPeriodo, type EstadoPago } from '@/lib/cuotas'
import { cn } from '@/lib/utils'
import { QK } from '@/lib/queryKeys'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
type Tab = 'todos' | 'morosos'
const ETIQUETA = { pagado: 'Pago realizado', sin_pagar: 'Pago no realizado', sin_revisar: 'Pendiente de revisar' }
// Clic en una celda: pendiente de revisar → pago realizado → pago no realizado → pendiente de revisar
const SIGUIENTE = (e: EstadoPago | undefined): EstadoPago | null =>
  e === undefined ? 'pagado' : e === 'pagado' ? 'sin_pagar' : null


export function CuotasPage() {
  const qc = useQueryClient()
  const hoy = new Date()
  const [tab, setTab] = useState<Tab>('todos')
  const [anio, setAnio] = useState(hoy.getFullYear())
  // Morosos tocados en la pestaña: siguen visibles aunque se pongan al día, para poder seguir marcando
  const [fijados, setFijados] = useState<Set<string>>(new Set())

  const { data, isLoading } = useQuery({ queryKey: QK.CUOTAS, queryFn: cuotasApi.getAll })
  const socios = data?.data ?? []

  const { mutate: marcar } = useMutation({
    mutationFn: (v: { socioId: string; mes: number; estado: EstadoPago | null }) =>
      cuotasApi.marcar(v.socioId, anio, v.mes, v.estado),
    // En serie: con clics rápidos los PUT podrían llegar desordenados y dejar otro estado en el servidor
    scope: { id: 'cuotas' },
    onMutate: async ({ socioId, mes, estado }) => {
      await qc.cancelQueries({ queryKey: QK.CUOTAS })
      setFijados((s) => new Set(s).add(socioId))
      qc.setQueryData<{ data: SocioCuotas[] }>(QK.CUOTAS, (old) => old && {
        data: old.data.map((s) => {
          if (s.id !== socioId) return s
          const resto = s.pagos_cuota.filter((p) => !(p.anio === anio && p.mes === mes))
          return { ...s, pagos_cuota: estado ? [...resto, { anio, mes, estado }] : resto }
        }),
      })
    },
    onError: (err: Error) => {
      toast.error(err.message)
      qc.invalidateQueries({ queryKey: QK.CUOTAS })
    },
  })

  const morosos = socios.filter((s) => esMoroso(s.fecha_alta, s.pagos_cuota, hoy))
  const visibles = tab === 'todos' ? socios : socios.filter((s) => fijados.has(s.id) || morosos.includes(s))

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
              Pulsa un mes para cambiar su estado: pendiente de revisar → pago realizado → pago no realizado.
            </p>
          </div>
          <Select value={String(anio)} onValueChange={(v) => setAnio(Number(v))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {anios.map((a) => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={tab} onValueChange={(v) => { setTab(v as Tab); setFijados(new Set()) }}>
          <TabsList>
            <TabsTrigger value="todos" className="font-display font-bold">
              Todos ({isLoading ? '…' : socios.length})
            </TabsTrigger>
            <TabsTrigger value="morosos" className="font-display font-bold">
              Morosos ({isLoading ? '…' : morosos.length})
            </TabsTrigger>
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
                <p className="text-sm text-muted-foreground">{tab === 'morosos' ? 'No hay socios morosos' : 'No hay socios'}</p>
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
                            const etiqueta = ETIQUETA[estado ?? 'sin_revisar']
                            return (
                              <td key={mes} className="px-1 py-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => marcar({ socioId: s.id, mes, estado: SIGUIENTE(estado) })}
                                  title={`${nombreMes} ${anio}: ${etiqueta}`}
                                  aria-label={`${s.nombre} ${s.apellidos}, ${nombreMes} ${anio}: ${etiqueta}`}
                                  className={cn(
                                    'w-24 min-h-10 px-1.5 py-1 rounded-md inline-flex items-center justify-center border text-xs leading-tight font-medium transition-colors',
                                    estado === 'pagado' && 'bg-emerald-600/15 border-emerald-600/40 text-emerald-700',
                                    estado === 'sin_pagar' && 'bg-destructive/15 border-destructive/40 text-destructive',
                                    !estado && 'border-dashed border-border text-muted-foreground hover:bg-accent',
                                  )}
                                >
                                  {etiqueta}
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
