import { useQuery } from '@tanstack/react-query'
import { configuracionApi, type EnlaceInteres } from '@/services/api/configuracion'
import { QK } from '@/lib/queryKeys'

// Todas las lecturas por clave comparten la caché QK.CONFIG(clave) con la respuesta cruda; cada hook la transforma con `select`
const configQuery = (clave: string) => ({ queryKey: QK.CONFIG(clave), queryFn: () => configuracionApi.getOne(clave) })

/** Valor (texto) de una clave de configuración del endpoint público. */
export function useConfig(clave: string, enabled = true) {
  return useQuery({ ...configQuery(clave), select: (r) => r.data.valor, enabled })
}

/** Valor de una clave de configuración. Devuelve `fallback` mientras carga o si falla. */
export function useConfigValor(clave: string, fallback: string) {
  return useConfig(clave).data ?? fallback
}

/** Valor numérico; `fallback` mientras carga, si falla o si no es un número. */
export function useConfigNumero(clave: string, fallback: number, enabled = true) {
  const valor = useConfig(clave, enabled).data?.trim()
  const n = valor ? Number(valor) : NaN
  return Number.isNaN(n) ? fallback : n
}

/** Enlaces de interés (solo socios autenticados). */
export function useEnlacesInteres() {
  return useQuery({
    ...configQuery('enlaces_interes'),
    select: (r) => JSON.parse(r.data.valor || '[]') as EnlaceInteres[],
  })
}
