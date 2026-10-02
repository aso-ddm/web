import { QueryCache, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ApiRequestError } from '@/services/api/client'
import { useAuthStore } from '@/store/authStore'

// El logout por sesión caducada lo hace client.ts al recibir 401
export const queryClient = new QueryClient({
  // Un fallo de carga no debe parecer una lista vacía: se avisa siempre (un toast por mensaje)
  queryCache: new QueryCache({
    onError: (error) => {
      // 404: claves de config opcionales; 401: ya cierra sesión client.ts
      if (error instanceof ApiRequestError && (error.status === 404 || error.status === 401)) return
      toast.error(error.message, { id: error.message })
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      // Un reintento solo para red caída o 5xx: un 4xx (404 de config opcional, 403) no cambia al repetir
      retry: (fallos, error) => fallos < 1 && !(error instanceof ApiRequestError && error.status < 500),
    },
  },
})

// Cambio de sesión (logout, 401, otra cuenta, otra pestaña): nada cacheado del usuario anterior se reutiliza
useAuthStore.subscribe((s, prev) => {
  if (s.token !== prev.token) queryClient.clear()
})
