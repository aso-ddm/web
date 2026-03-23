import { useAuthStore } from '@/store/authStore'
import type { ApiError } from '@/types/api'

const BASE_URL = '/api'

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = useAuthStore.getState().token
  const hasBody = options.body !== undefined

  const headers: HeadersInit = {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      error: 'Error de red',
    }))

    // Token expirado o inválido → cerrar sesión
    if (response.status === 401) {
      useAuthStore.getState().logout()
    }

    throw new Error(errorData.error || `Error ${response.status}`)
  }

  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  action: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'POST' }),
  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
}
