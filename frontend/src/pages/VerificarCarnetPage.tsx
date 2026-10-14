import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, XCircle } from 'lucide-react'
import { Header, Footer } from '@/components/organisms'
import { SEOHead } from '@/components/atoms/SEOHead'
import { Skeleton } from '@/components/ui/skeleton'
import { carnetApi } from '@/services/api/carnet'
import { QK } from '@/lib/queryKeys'

/** Pública: la abre la tienda al escanear el QR del socio. Cada token se consulta una vez */
export function VerificarCarnetPage() {
  const { token = '' } = useParams()
  const { data, isLoading, isError } = useQuery({
    queryKey: QK.CARNET_VERIFICAR(token),
    queryFn: () => carnetApi.verificar(token),
    retry: false,
    staleTime: Infinity,
  })
  const socio = data?.data

  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead title="Verificar socio" noindex />
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm rounded-xl border border-border p-6 text-center space-y-3">
          {isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : socio ? (
            <>
              <CheckCircle2 className="h-14 w-14 mx-auto text-emerald-700" />
              <p className="font-display font-bold text-xl text-emerald-700">Socio activo</p>
              <p className="font-display font-bold text-2xl">{socio.nombre} {socio.apellidos}</p>
              <p className="text-sm text-muted-foreground">
                Socio de Dragón de Madera. Comprobado el{' '}
                {new Date(socio.verificado_en).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}.
              </p>
              <p className="text-xs text-muted-foreground">Si tienes dudas, comprueba que coincide con su DNI.</p>
            </>
          ) : isError ? (
            <>
              <XCircle className="h-14 w-14 mx-auto text-destructive" />
              <p className="font-display font-bold text-xl text-destructive">Carnet no válido o caducado</p>
              <p className="text-sm text-muted-foreground">
                Pide al socio que abra de nuevo su carnet en su área de socio y vuelve a escanearlo.
              </p>
            </>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  )
}
