import { useState } from 'react'
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, UserCheck, Euro, Gift, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SEOHead } from '@/components/atoms/SEOHead'
import { visitasApi } from '@/services/api/visitas'
import { useConfigValor } from '@/hooks/useConfigValor'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import type { Visita } from '@/types/api'
import { formatDate } from '@/lib/format'
import { QK } from '@/lib/queryKeys'
import { VisitaConfirmada, ListadoVisitas } from './visita/VisitasPartes'

export function RegistroVisitaPage() {
  const [nombre, setNombre] = useState('')
  const [seleccionado, setSeleccionado] = useState<string>('')
  const [visitaRegistrada, setVisitaRegistrada] = useState<Visita | null>(null)
  const queryClient = useQueryClient()

  // Solo para el recuadro informativo: si se cobra o no lo decide el backend (siguiente_es_pago / nuevo)
  const visitasGratis = parseInt(useConfigValor('visitas_gratuitas', '3'), 10)
  const precioVisita = parseFloat(useConfigValor('precio_visita_pago', '4'))

  // useQuery descarta las respuestas viejas: una búsqueda lenta no pisa a la siguiente
  const nombreBuscado = useDebouncedValue(nombre.trim(), 350)
  const { data: busqueda, isFetching: buscando } = useQuery({
    queryKey: QK.VISITAS_BUSCAR_NOMBRE(nombreBuscado),
    queryFn: () => visitasApi.buscar(nombreBuscado),
    enabled: nombreBuscado.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 0, // el recuento de visitas decide si se cobra: siempre fresco
  })
  // Mientras se escribe o se busca, el recuento aún no corresponde al nombre escrito
  const recuentoPendiente = !seleccionado && (nombreBuscado !== nombre.trim() || buscando)

  const nombreFinal = seleccionado || nombre.trim()
  // Misma normalización que el backend al contar visitas: mayúsculas y espacios no cuentan
  const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()
  const sugerencias = busqueda?.data ?? []
  const infoSugerido = sugerencias.find((s) => norm(s.nombre_completo) === norm(nombreFinal))
  const visitasPrevias = infoSugerido?.total_visitas ?? 0
  const cobro = infoSugerido
    ? { es_pago: infoSugerido.siguiente_es_pago, importe: infoSugerido.importe_siguiente }
    : busqueda?.nuevo
  const seraGratis = !cobro?.es_pago
  const importe = cobro?.importe ?? precioVisita

  const { mutate: registrar, isPending } = useMutation({
    mutationFn: () => visitasApi.registrar(nombreFinal),
    onSuccess: ({ data }) => {
      setVisitaRegistrada(data)
      queryClient.invalidateQueries({ queryKey: QK.VISITAS })
      queryClient.invalidateQueries({ queryKey: QK.VISITAS_BUSCAR })
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleNueva = () => {
    setNombre('')
    setSeleccionado('')
    setVisitaRegistrada(null)
  }

  return (
    <>
      <SEOHead title="Registrar visita" description="Registro de visitas de no socios" path="/area/visita" noindex />

      <div className="space-y-8">
        <div className="max-w-md mx-auto space-y-6">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Registrar visita</h1>
            <p className="text-muted-foreground mt-1">
              {visitaRegistrada ? 'Visita registrada correctamente' : 'Registra la visita de un no socio al local'}
            </p>
          </div>

          {visitaRegistrada ? (
            <VisitaConfirmada visita={visitaRegistrada} onNueva={handleNueva} />
          ) : (
            <>
              <div className="flex gap-3">
                <div className="flex-1 rounded-lg border border-border bg-card p-3 text-center">
                  <p className="text-xs text-muted-foreground font-display">Visitas gratuitas</p>
                  <p className="text-2xl font-display font-bold text-primary">{visitasGratis}</p>
                </div>
                <div className="flex-1 rounded-lg border border-border bg-card p-3 text-center">
                  <p className="text-xs text-muted-foreground font-display">Precio visita</p>
                  <p className="text-2xl font-display font-bold text-secondary">{precioVisita}€</p>
                </div>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-base text-primary flex items-center gap-2">
                    <UserCheck className="h-4 w-4" />
                    Nombre del visitante
                  </CardTitle>
                  <CardDescription>
                    Introduce el nombre completo. Si ya ha venido antes, aparecerá en las sugerencias.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nombre y apellidos..."
                      value={seleccionado || nombre}
                      onChange={(e) => {
                        setSeleccionado('')
                        setNombre(e.target.value)
                      }}
                      className="pl-9"
                      autoFocus
                    />
                    {buscando && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {!seleccionado && nombre.trim().length >= 2 && sugerencias.length > 0 && (
                    <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
                      {sugerencias.map((s) => {
                        const gratisSiViene = !s.siguiente_es_pago
                        return (
                          <button
                            key={s.nombre_completo}
                            onClick={() => setSeleccionado(s.nombre_completo)}
                            className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-accent/30 transition-colors text-left"
                          >
                            <div>
                              <p className="font-display font-bold text-sm">{s.nombre_completo}</p>
                              <p className="text-xs text-muted-foreground">
                                {s.total_visitas} visita{s.total_visitas !== 1 ? 's' : ''} · última: {formatDate(s.ultima_visita)}
                              </p>
                            </div>
                            <Badge variant={gratisSiViene ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                              {gratisSiViene ? 'Gratis' : `${s.importe_siguiente}€`}
                            </Badge>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {nombreFinal.length >= 2 && (
                    <>
                      <Separator />
                      <div className={`rounded-lg p-4 space-y-2 ${
                        seraGratis ? 'bg-primary/5 border border-primary/20' : 'bg-secondary/5 border border-secondary/20'
                      }`}>
                        <div className="flex items-center justify-between">
                          <p className="font-display font-bold text-sm">{nombreFinal}</p>
                          {seraGratis ? (
                            <Badge variant="default" className="font-display gap-1">
                              <Gift className="h-3 w-3" /> Gratuita
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="font-display gap-1">
                              <Euro className="h-3 w-3" /> {importe}€
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {infoSugerido
                            ? `Visita número ${visitasPrevias + 1} · ha venido ${visitasPrevias} vez${visitasPrevias !== 1 ? 'es' : ''} antes`
                            : 'Primera visita registrada'}
                        </p>
                        {!seraGratis && (
                          <p className="text-xs text-secondary font-display font-bold">
                            Ha superado las {visitasGratis} visitas gratuitas
                          </p>
                        )}
                      </div>

                      <Button
                        onClick={() => registrar()}
                        disabled={isPending || recuentoPendiente}
                        className="w-full font-display font-bold text-base gap-2"
                        size="lg"
                      >
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : seraGratis ? (
                          <Gift className="h-4 w-4" />
                        ) : (
                          <Euro className="h-4 w-4" />
                        )}
                        {isPending ? 'Registrando...' : `Registrar visita${seraGratis ? ' (gratis)' : ` (${importe}€)`}`}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <>
          <Separator />
          <ListadoVisitas />
        </>
      </div>
    </>
  )
}
