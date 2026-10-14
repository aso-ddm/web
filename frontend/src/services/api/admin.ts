import { api, buildQuery } from './client'
import type { SocioAdmin } from './socios'
import type { EstadoSocio, Rol } from '@/types/api'
import type { PaginatedResponse } from '@/types/api'

export const adminApi = {
  getUsuarios: (params: { search?: string; estado?: EstadoSocio; page: number; limit: number }) =>
    api.get<PaginatedResponse<SocioAdmin>>(`/admin/usuarios${buildQuery(params)}`),
  // Campos editables (mismos que updateUsuarioSchema del backend); null borra el campo
  updateUsuario: (id: string, data: Partial<Pick<SocioAdmin, 'nombre' | 'apellidos' | 'email' | 'dni' | 'estado' | 'tiene_llaves' | 'consentimiento_tiendas'>> & {
    roles?: Rol[]
    password?: string
    [campoOpcional: string]: unknown // telefono, direccion, fechas…: texto o null
  }) => api.put(`/admin/usuarios/${id}`, data),
  deleteUsuario: (id: string) => api.delete(`/admin/usuarios/${id}`),
}
