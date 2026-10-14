import { useQuery } from '@tanstack/react-query'
import { QRCodeSVG } from 'qrcode.react'
import { Store } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DragonIcon } from '@/components/atoms/icons'
import { carnetApi } from '@/services/api/carnet'
import { QK } from '@/lib/queryKeys'

// El token caduca a los 5 min (backend): se pide uno nuevo antes, y al volver a la pestaña
const RENOVAR_MS = 4 * 60 * 1000
// Píxel transparente: la librería solo vacía el centro (excavate) si hay imagen; el logo va encima como DragonIcon
const HUECO_LOGO = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='

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
      <CardContent className="flex flex-col items-center gap-4 text-center">
        {/* Fondo blanco siempre: los lectores no leen bien un QR invertido en modo oscuro */}
        <div className="relative rounded-xl bg-white p-3 flex-shrink-0 border-4 border-secondary">
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
              imageSettings={{ src: HUECO_LOGO, width: 44, height: 36, excavate: true }}
            />
          ) : null}
          {/* El SVG del logo como <image> sale negro: DragonIcon admite el color del club, como en la cabecera */}
          {token && (
            <DragonIcon className="absolute left-1/2 top-1/2 h-9 w-11 -translate-x-1/2 -translate-y-1/2 fill-primary" />
          )}
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
