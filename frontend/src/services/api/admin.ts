import { api } from './client'
import type { SocioAdmin } from './socios'
import type { EstadoSocio, Rol } from '@/types/api'

export const adminApi = {
  getUsuarios: (params: { search?: string; estado?: EstadoSocio; page: number; limit: number }) => {
    const q = new URLSearchParams({ page: String(params.page), limit: String(params.limit) })
    if (params.search) q.set('search', params.search)
    if (params.estado) q.set('estado', params.estado)
    return api.get<{ data: SocioAdmin[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
      `/admin/usuarios?${q.toString()}`,
    )
  },
  updateUsuario: (id: string, data: { roles?: Rol[]; password?: string }) => api.put(`/admin/usuarios/${id}`, data),
  deleteUsuario: (id: string) => api.delete(`/admin/usuarios/${id}`),
}
