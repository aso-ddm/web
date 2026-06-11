import { QueryClient, QueryCache } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (_error, query) => {
      if (query.queryKey[0] === 'me') {
        useAuthStore.getState().logout()
        queryClient.clear()
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
})
