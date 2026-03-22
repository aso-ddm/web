import { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Search, UserCheck, Euro, Gift, Loader2, RotateCcw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SEOHead } from '@/components/SEOHead'
import { visitasApi } from '@/services/api/visitas'
import { configuracionApi } from '@/services/api/configuracion'
import { useQuery } from '@tanstack/react-query'
import type { VisitanteSugerido, Visita } from '@/types/api'

function formatDate(dateStr?: string | null) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
}

function VisitaConfirmada({ visita, onNueva }: { visita: Visita; onNueva: () => void }) {
  return (
    <div className="space-y-6">
      <div className={`rounded-xl border-2 p-6 text-center space-y-3 ${
        visita.es_pago
          ? 'border-secondary/40 bg-secondary/5'
          : 'border-primary/40 bg-primary/5'
      }`}>
        {visita.es_pago ? (
          <>
            <Euro className="h-12 w-12 mx-auto text-secondary" />
            <h2 className="font-display font-bold text-xl text-secondary">Visita de pago</h2>
            <p className="text-3xl font-display font-bold text-secondary">
              {visita.importe}€
            </p>
            <p className="text-muted-foreground text-sm">
              Es la visita número <strong>{visita.numero_visita}</strong> de{' '}
              <strong>{visita.nombre_completo}</strong>
            </p>
          </>
        ) : (
          <>
            <Gift className="h-12 w-12 mx-auto text-primary" />
            <h2 className="font-display font-bold text-xl text-primary">Visita gratuita</h2>
            <p className="text-muted-foreground text-sm">
              Es la visita número <strong>{visita.numero_visita}</strong> de{' '}
              <strong>{visita.nombre_completo}</strong>
            </p>
          </>
        )}
      </div>

      <Button
        onClick={onNueva}
        variant="outline"
        className="w-full font-display font-bold gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        Registrar otra visita
      </Button>
    </div>
  )
}

export function RegistroVisitaPage() {
  const [nombre, setNombre] = useState('')
  const [sugerencias, setSugerencias] = useState<VisitanteSugerido[]>([])
  const [buscando, setBuscando] = useState(false)
  const [seleccionado, setSeleccionado] = useState<string>('')
  const [visitaRegistrada, setVisitaRegistrada] = useState<Visita | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: configData } = useQuery({
    queryKey: ['configuracion'],
    queryFn: () => configuracionApi.getAll(),
  })

  const visitasGratis = parseInt(
    configData?.data.find((c) => c.clave === 'visitas_gratuitas')?.valor ?? '3',
    10,
  )
  const precioVisita = parseFloat(
    configData?.data.find((c) => c.clave === 'precio_visita_pago')?.valor ?? '4',
  )

  // Búsqueda con debounce
  useEffect(() => {
    if (seleccionado) return
    if (nombre.trim().length < 2) { setSugerencias([]); return }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setBuscando(true)
      try {
        const res = await visitasApi.buscar(nombre)
        setSugerencias(res.data)
      } catch {
        setSugerencias([])
      } finally {
        setBuscando(false)
      }
    }, 350)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [nombre, seleccionado])

  const nombreFinal = seleccionado || nombre.trim()

  // Calcular si será gratis o de pago
  const infoSugerido = sugerencias.find((s) => s.nombre_completo === nombreFinal)
  const visitasPrevias = infoSugerido?.total_visitas ?? 0
  const seraGratis = visitasPrevias < visitasGratis

  const { mutate: registrar, isPending } = useMutation({
    mutationFn: () => visitasApi.registrar(nombreFinal),
    onSuccess: ({ data }) => {
      setVisitaRegistrada(data)
    },
    onError: (err: Error) => toast.error(err.message),
  })

  const handleNueva = () => {
    setNombre('')
    setSugerencias([])
    setSeleccionado('')
    setVisitaRegistrada(null)
  }

  if (visitaRegistrada) {
    return (
      <>
        <SEOHead title="Registrar visita" description="Registro de visitas de no socios" path="/area/visita" noindex />
        <div className="max-w-md mx-auto space-y-6">
          <div>
            <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Registrar visita</h1>
            <p className="text-muted-foreground mt-1">Visita registrada correctamente</p>
          </div>
          <VisitaConfirmada visita={visitaRegistrada} onNueva={handleNueva} />
        </div>
      </>
    )
  }

  return (
    <>
      <SEOHead title="Registrar visita" description="Registro de visitas de no socios" path="/area/visita" noindex />

      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h1 className="font-display font-bold text-2xl sm:text-3xl text-primary">Registrar visita</h1>
          <p className="text-muted-foreground mt-1">Registra la visita de un no socio al local</p>
        </div>

        {/* Info de configuración */}
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
            {/* Input nombre */}
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

            {/* Sugerencias */}
            {!seleccionado && sugerencias.length > 0 && (
              <div className="border border-border rounded-lg divide-y divide-border overflow-hidden">
                {sugerencias.map((s) => {
                  const gratisSiViene = s.total_visitas < visitasGratis
                  return (
                    <button
                      key={s.nombre_completo}
                      onClick={() => { setSeleccionado(s.nombre_completo); setSugerencias([]) }}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-accent/30 transition-colors text-left"
                    >
                      <div>
                        <p className="font-display font-bold text-sm">{s.nombre_completo}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.total_visitas} visita{s.total_visitas !== 1 ? 's' : ''} · última: {formatDate(s.ultima_visita)}
                        </p>
                      </div>
                      <Badge variant={gratisSiViene ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                        {gratisSiViene ? 'Gratis' : `${precioVisita}€`}
                      </Badge>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Vista previa de la visita */}
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
                      <Badge variant="secondary" className="font-display gap-1 bg-secondary/20 text-secondary-foreground">
                        <Euro className="h-3 w-3" /> {precioVisita}€
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
                  disabled={isPending}
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
                  {isPending ? 'Registrando...' : `Registrar visita${seraGratis ? ' (gratis)' : ` (${precioVisita}€)`}`}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
