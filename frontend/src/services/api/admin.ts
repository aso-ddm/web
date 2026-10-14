import { api, buildQuery } from './client'
import type { SocioAdmin } from './socios'
import type { EstadoSocio, Rol } from '@/types/api'
import type { PaginatedResponse } from '@/types/api'

export const adminApi = {
  getUsuarios: (params: { search?: string; estado?: EstadoSocio; page: number; limit: number }) =>
    api.get<PaginatedResponse<SocioAdmin>>(`/admin/usuarios${buildQuery(params)}`),
  updateUsuario: (id: string, data: Partial<Record<keyof SocioAdmin | 'password', unknown>> & { roles?: Rol[] }) => api.put(`/admin/usuarios/${id}`, data),
  deleteUsuario: (id: string) => api.delete(`/admin/usuarios/${id}`),
}
