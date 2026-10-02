import { useAuthStore } from '@/store/authStore'
import { queryClient } from '@/lib/queryClient'
import type { ApiError } from '@/types/api'

const BASE_URL = '/api'

export class ApiRequestError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

/** fetch con errores legibles: red caída, 502 de nginx (HTML) y 401 → logout */
async function send(endpoint: string, init: RequestInit): Promise<Response> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, init)
  } catch {
    throw new Error('No se pudo conectar con el servidor. Revisa tu conexión.')
  }
  if (response.ok) return response

  const errorData: Partial<ApiError> = await response.json().catch(() => ({}))
  // Token expirado o inválido → cerrar sesión
  if (response.status === 401) {
    useAuthStore.getState().logout()
    queryClient.clear()
  }
  const mensaje = errorData.error || (response.status >= 500 ? 'El servidor no está disponible. Inténtalo en unos minutos.' : `Error ${response.status}`)
  // 400 de Zod: { error: 'Datos inválidos', details: { campo: ['mensaje'] } } → se añade el primero para saber qué corregir
  const detalle = Object.values(errorData.details ?? {}).flat()[0]
  throw new ApiRequestError(detalle ? `${mensaje}: ${detalle}` : mensaje, response.status)
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = useAuthStore.getState().token
  const hasBody = options.body !== undefined
  const isFormData = options.body instanceof FormData

  const headers: HeadersInit = {
    // No establecer Content-Type para FormData — el navegador lo pone con el boundary correcto
    ...(hasBody && !isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const response = await send(endpoint, { ...options, headers })
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  get: <T>(endpoint: string) => request<T>(endpoint),
  post: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  postForm: <T>(endpoint: string, formData: FormData) =>
    request<T>(endpoint, { method: 'POST', body: formData }),
  action: <T>(endpoint: string) =>
    request<T>(endpoint, { method: 'POST' }),
  put: <T>(endpoint: string, body: unknown) =>
    request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(endpoint: string) => request<T>(endpoint, { method: 'DELETE' }),
  getBlob: async (endpoint: string): Promise<{ blob: Blob; contentType: string }> => {
    const token = useAuthStore.getState().token
    const response = await send(endpoint, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const blob = await response.blob()
    return { blob, contentType: response.headers.get('Content-Type') ?? 'application/octet-stream' }
  },
}
