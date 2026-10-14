import { api } from './client'
import type { Usuario, Rol, EstadoSocio, SolicitudGrupal } from '@/types/api'

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
  baja_por?: { id: string; nombre: string; apellidos: string } | null
  historial_estado?: {
    id: string
    tipo: 'alta' | 'baja' | 'cuota_conjunta' | 'cuota_individual' | 'llaves_entregadas' | 'llaves_devueltas'
    detalle: string | null
    created_at: string
    por: { id: string; nombre: string; apellidos: string } | null
  }[]
  // null = cuota individual
  solicitud_grupal?: {
    id: string
    miembros: { id: string; nombre: string; apellidos: string; estado: EstadoSocio }[]
  } | null
}

// Socio del listado (paginado)
export interface GetSociosParams {
  estado?: EstadoSocio
  search?: string
  page?: number
  limit?: number
}

export const sociosApi = {
  update: (id: string, payload: UpdateSocioPayload) =>
    api.put<{ data: Usuario }>(`/socios/${id}`, payload),

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

  getById: (id: string) => api.get<{ data: SocioAdmin }>(`/socios/${id}`),

  getOpciones: () => api.get<{ data: { id: string; nombre: string; apellidos: string; apodo: string | null }[] }>('/socios/opciones'),

  getPendientes: () => api.get<{ data: { individuales: SocioAdmin[]; grupos: SolicitudGrupal[] } }>('/socios/pendientes'),

  aprobar: (id: string, rol: Rol) => api.post<{ data: SocioAdmin }>(`/socios/${id}/aprobar`, { rol }),
  rechazar: (id: string) => api.action(`/socios/${id}/rechazar`),
  darDeBaja: (id: string) => api.action<{ data: SocioAdmin }>(`/socios/${id}/baja`),
  reactivar: (id: string) => api.action<{ data: SocioAdmin }>(`/socios/${id}/reactivar`),

  getComprobante: async (id: string): Promise<void> => {
    // Abrir la pestaña antes del await: tras una espera los bloqueadores de popups la cancelan
    const win = window.open('', '_blank')
    try {
      const { blob, contentType } = await api.getBlob(`/socios/${id}/comprobante`)
      const url = URL.createObjectURL(new Blob([blob], { type: contentType }))
      if (win) win.location.href = url
      else window.open(url, '_blank')
      setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch (err) {
      win?.close()
      throw err
    }
  },

  aprobarGrupo: (grupoId: string) => api.action(`/socios/grupos/${grupoId}/aprobar`),
  rechazarGrupo: (grupoId: string) => api.action(`/socios/grupos/${grupoId}/rechazar`),

  updateRoles: (id: string, roles: Rol[]) =>
    api.put<{ data: SocioAdmin }>(`/socios/${id}/roles`, { roles }),

  // Une a la cuota conjunta de otro socio (si es individual, se crea una con los dos)
  unirCuotaConjunta: (id: string, socio_id: string) =>
    api.post<{ data: SocioAdmin }>(`/socios/${id}/cuota-conjunta`, { socio_id }),
  salirCuotaConjunta: (id: string) => api.delete<{ data: SocioAdmin }>(`/socios/${id}/cuota-conjunta`),

  setLlaves: (id: string, tiene_llaves: boolean) =>
    api.put<{ data: SocioAdmin }>(`/socios/${id}/llaves`, { tiene_llaves }),
}
