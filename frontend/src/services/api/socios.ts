import { api } from './client'
import type { Usuario } from '@/types/api'

export interface UpdateSocioPayload {
  nombre?: string
  apellidos?: string
  telefono?: string
  fecha_nacimiento?: string
  direccion?: string
  alias_telegram?: string
  usuario_bgg?: string
  apodo?: string
  consentimiento_tiendas?: boolean
}

export const sociosApi = {
  getMe: () => api.get<{ data: Usuario }>('/socios/me'),

  update: (id: string, payload: UpdateSocioPayload) =>
    api.put<{ data: Usuario }>(`/socios/${id}`, payload),

  solicitarLlaves: (id: string) =>
    api.post<{ data: Usuario }>(`/socios/${id}/solicitar-llaves`, {}),
}
