import { useState } from 'react'
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

// Una fila por cuota: los miembros de una cuota conjunta comparten los pagos, así que van juntos.
// El periodo empieza con el alta más antigua del grupo.
function agruparCuotas(socios: SocioCuotas[]) {
  const cuotas = new Map<string, SocioCuotas & { miembros: SocioCuotas[] }>()
  for (const s of socios) {
    const c = cuotas.get(s.cuota_id)
    if (!c) cuotas.set(s.cuota_id, { ...s, miembros: [s] })
    else {
      c.miembros.push(s)
      if (s.fecha_alta < c.fecha_alta) c.fecha_alta = s.fecha_alta
    }
  }
  return [...cuotas.values()]
}


export function CuotasPage() {
  const qc = useQueryClient()
  const hoy = new Date()
  const [tab, setTab] = useState<Tab>('todos')
  const [anio, setAnio] = useState(hoy.getFullYear())
  // Morosos tocados en la pestaña: siguen visibles aunque se pongan al día, para poder seguir marcando
  const [fijados, setFijados] = useState<Set<string>>(new Set())

  const queryKey = [...QK.CUOTAS, anio]
  const { data, isLoading } = useQuery({ queryKey, queryFn: () => cuotasApi.getAll(anio), placeholderData: keepPreviousData })
  const cuotas = agruparCuotas(data?.data ?? [])

  const { mutate: marcar } = useMutation({
    // Basta un socio de la cuota: en una conjunta el backend lo apunta en el grupo
    mutationFn: (v: { cuotaId: string; socioId: string; mes: number; estado: EstadoPago | null }) =>
      cuotasApi.marcar(v.socioId, anio, v.mes, v.estado),
    // En serie: con clics rápidos los PUT podrían llegar desordenados y dejar otro estado en el servidor
    scope: { id: 'cuotas' },
    onMutate: async ({ cuotaId, mes, estado }) => {
      await qc.cancelQueries({ queryKey })
      setFijados((s) => new Set(s).add(cuotaId))
      qc.setQueryData<{ data: SocioCuotas[] }>(queryKey, (old) => old && {
        data: old.data.map((s) => {
          if (s.cuota_id !== cuotaId) return s
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

  const morosos = cuotas.filter((c) => esMoroso(c.fecha_alta, c.pagos_cuota, hoy))
  const visibles = tab === 'todos' ? cuotas : cuotas.filter((c) => fijados.has(c.cuota_id) || morosos.includes(c))

  const primerAnio = Math.min(hoy.getFullYear(), ...cuotas.map((c) => new Date(c.fecha_alta).getFullYear()))
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
              Todas ({isLoading ? '…' : cuotas.length})
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
                <p className="text-sm text-muted-foreground">{tab === 'morosos' ? 'No hay cuotas con impagos' : 'No hay socios'}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="sticky left-0 bg-card text-left px-4 py-3 font-display font-bold text-muted-foreground text-xs uppercase tracking-wide">
                        Cuota
                      </th>
                      {MESES.map((m) => (
                        <th key={m} className="px-1 py-3 font-display font-bold text-muted-foreground text-xs uppercase">{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visibles.map((s) => {
                      return (
                        <tr key={s.cuota_id} className="hover:bg-accent/30 transition-colors">
                          <td className="sticky left-0 bg-card px-4 py-2 whitespace-nowrap">
                            {s.conjunta ? (
                              <div className="border-l-2 border-secondary/50 pl-2">
                                <p className="text-xs font-display font-bold text-secondary uppercase tracking-wide flex items-center gap-1">
                                  <Users className="h-3 w-3" />Cuota conjunta
                                </p>
                                {s.miembros.map((m) => (
                                  <p key={m.id} className="font-display font-bold">{m.nombre} {m.apellidos}</p>
                                ))}
                              </div>
                            ) : (
                              <p className="font-display font-bold">{s.nombre} {s.apellidos}</p>
                            )}
                          </td>
                          {MESES.map((nombreMes, i) => {
                            const mes = i + 1
                            if (!mesEnPeriodo(s.fecha_alta, anio, mes, hoy)) {
                              return <td key={mes} className="text-center text-muted-foreground/70">—</td>
                            }
                            const estado = s.pagos_cuota.find((p) => p.anio === anio && p.mes === mes)?.estado
                            const etiqueta = ETIQUETA[estado ?? 'sin_revisar']
                            return (
                              <td key={mes} className="px-1 py-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => marcar({ cuotaId: s.cuota_id, socioId: s.id, mes, estado: SIGUIENTE(estado) })}
                                  title={`${nombreMes} ${anio}: ${etiqueta}`}
                                  aria-label={`${s.miembros.map((m) => `${m.nombre} ${m.apellidos}`).join(', ')}, ${nombreMes} ${anio}: ${etiqueta}`}
                                  className={cn(
                                    'w-24 min-h-10 px-1.5 py-1 rounded-md inline-flex items-center justify-center border text-xs leading-tight font-medium transition-colors',
                                    estado === 'pagado' && 'bg-emerald-700/15 border-emerald-600/40 text-emerald-800',
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
