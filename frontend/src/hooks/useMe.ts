import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/services/api/auth'
import { QK } from '@/lib/queryKeys'

/** Perfil del usuario autenticado (GET /auth/me). Una sola definición para toda la app. */
export function useMe() {
  return useQuery({ queryKey: QK.ME, queryFn: () => authApi.me() })
}
