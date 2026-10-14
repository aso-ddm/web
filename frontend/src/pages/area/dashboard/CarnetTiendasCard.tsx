import { useQuery } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { Store } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { carnetApi } from '@/services/api/carnet'
import { QK } from '@/lib/queryKeys'

// El token caduca a los 5 min (backend): se pide uno nuevo antes, y al volver a la pestaña
const RENOVAR_MS = 4 * 60 * 1000

/** QR que el socio enseña en las tiendas colaboradoras; la tienda lo escanea y ve /verificar/:token */
export function CarnetTiendasCard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: QK.CARNET,
    queryFn: carnetApi.emitir,
    staleTime: RENOVAR_MS,
    refetchInterval: RENOVAR_MS,
    refetchOnWindowFocus: 'always',
  })
  const token = data?.data.token

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="font-display text-lg text-primary flex items-center gap-2">
          <Store className="h-5 w-5" />
          Carnet para tiendas
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row items-center gap-4">
        {/* Fondo blanco siempre: los lectores no leen bien un QR invertido en modo oscuro */}
        <div className="rounded-xl bg-white p-3 flex-shrink-0 border-4 border-secondary">
          {isLoading ? (
            <Skeleton className="h-[180px] w-[180px]" />
          ) : token ? (
            <QRCodeSVG
              value={`${window.location.origin}/verificar/${token}`}
              size={180}
              title="Carnet de socio"
              // Verde corporativo (--primary): oscuro de sobra para que lo lea cualquier móvil
              fgColor="rgb(0, 76, 72)"
              // Nivel H: el logo tapa parte del código y aun así se lee (aguanta ~30% de módulos perdidos)
              level="H"
              imageSettings={{ src: '/logo-dragon-de-madera.svg', width: 44, height: 36, excavate: true }}
            />
          ) : null}
        </div>
        <div className="text-sm text-muted-foreground space-y-2">
          {isError ? (
            <p className="text-destructive">No se pudo generar el carnet. Recarga la página.</p>
          ) : (
            <>
              <p>Enséñalo en las tiendas colaboradoras para obtener tu descuento.</p>
              <p className="text-xs">
                La tienda solo verá tu nombre y apellidos. El código cambia cada pocos minutos: una captura de pantalla
                no sirve, ábrelo desde aquí.
              </p>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
