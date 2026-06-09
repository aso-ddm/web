import { api } from './client'
import type { Usuario, Rol, EstadoSocio, SolicitudGrupal, PaginatedResponse } from '@/types/api'

export interface UpdateSocioPayload {
  nombre?: string
  apellidos?: string
  telefono?: string
  fecha_nacimiento?: string
  direccion?: string
  alias_telegram?: string
  apodo?: string
  consentimiento_tiendas?: boolean
}

// Socio con campos extra que devuelve la API de gestión
export type SocioAdmin = Usuario & {
  dni: string
  telefono?: string | null
  direccion?: string | null
  fecha_baja?: string | null
  created_at: string
  comprobante_transferencia?: string | null
  aprobado_por?: { id: string; nombre: string; apellidos: string } | null
  aprobado_llaves_por?: { id: string; nombre: string; apellidos: string } | null
  baja_por?: { id: string; nombre: string; apellidos: string } | null
}

// Socio del listado (paginado)
export interface GetSociosParams {
  estado?: EstadoSocio
  search?: string
  page?: number
  limit?: number
}

export const sociosApi = {
  // Socio — perfil propio
  getMe: () => api.get<{ data: Usuario }>('/socios/me'),
  update: (id: string, payload: UpdateSocioPayload) =>
    api.put<{ data: Usuario }>(`/socios/${id}`, payload),
  solicitarLlaves: (id: string) =>
    api.action<{ data: Usuario }>(`/socios/${id}/solicitar-llaves`),

  // Directiva — gestión
  getAll: (params: GetSociosParams = {}) => {
    const q = new URLSearchParams()
    if (params.estado) q.set('estado', params.estado)
    if (params.search) q.set('search', params.search)
    if (params.page) q.set('page', String(params.page))
    if (params.limit) q.set('limit', String(params.limit))
    return api.get<{ data: SocioAdmin[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
      `/socios?${q.toString()}`,
    )
  },

  getPendientes: () => api.get<{ data: { individuales: SocioAdmin[]; grupos: SolicitudGrupal[] } }>('/socios/pendientes'),

  getById: (id: string) => api.get<{ data: SocioAdmin }>(`/socios/${id}`),

  aprobar: (id: string) => api.action<{ data: SocioAdmin }>(`/socios/${id}/aprobar`),
  rechazar: (id: string) => api.action<{ data: SocioAdmin }>(`/socios/${id}/rechazar`),
  darDeBaja: (id: string) => api.action<{ data: SocioAdmin }>(`/socios/${id}/baja`),
  reactivar: (id: string) => api.action<{ data: SocioAdmin }>(`/socios/${id}/reactivar`),

  getComprobante: async (id: string): Promise<void> => {
    const { blob, contentType } = await api.getBlob(`/socios/${id}/comprobante`)
    const url = URL.createObjectURL(new Blob([blob], { type: contentType }))
    window.open(url, '_blank')
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  },

  aprobarGrupo: (grupoId: string) => api.action(`/socios/grupos/${grupoId}/aprobar`),
  rechazarGrupo: (grupoId: string) => api.action(`/socios/grupos/${grupoId}/rechazar`),

  updateRoles: (id: string, roles: Rol[]) =>
    api.put<{ data: SocioAdmin }>(`/socios/${id}/roles`, { roles }),

  aprobarLlaves: (id: string) =>
    api.action<{ data: SocioAdmin }>(`/socios/${id}/aprobar-llaves`),

  devolverLlaves: (id: string) =>
    api.action<{ data: SocioAdmin }>(`/socios/${id}/devolver-llaves`),

  enviarBienvenidaTelegram: (id: string) =>
    api.action<{ message: string }>(`/socios/${id}/telegram/bienvenida`),
}
