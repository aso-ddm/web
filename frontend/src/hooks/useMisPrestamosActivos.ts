import { useQuery } from '@tanstack/react-query'
import { prestamosApi } from '@/services/api/prestamos'
import { QK } from '@/lib/queryKeys'

/** Préstamos activos del socio. Mi panel y Mis préstamos comparten caché. */
export function useMisPrestamosActivos() {
  return useQuery({
    queryKey: QK.MIS_PRESTAMOS_ACTIVOS,
    queryFn: () => prestamosApi.misPrestamos({ estado: 'activo', limit: 100 }),
    select: (r) => r.data,
  })
}
