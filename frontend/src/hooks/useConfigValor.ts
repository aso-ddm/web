import { useQuery } from '@tanstack/react-query'
import { configuracionApi } from '@/services/api/configuracion'

/** Valor de una clave de configuración (endpoint público). Devuelve `fallback` mientras carga o si falla. */
export function useConfigValor(clave: string, fallback: string) {
  const { data } = useQuery({
    queryKey: ['config', clave],
    queryFn: () => configuracionApi.getOne(clave),
  })
  return data?.data.valor ?? fallback
}
