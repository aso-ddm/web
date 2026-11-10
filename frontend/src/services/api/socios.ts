import { api, buildQuery } from './client'
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

export interface ContactoDirectiva {
  id: string
  nombre: string
  apellidos: string
  apodo: string | null
  cargos: Rol[]
  alias_telegram: string | null
  email: string
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
  // Solo en la ficha (getById): lo que hace falta para decidir la baja
  juegos_en_propiedad?: { id: string; nombre: string; estado: 'en_estanteria' | 'prestado' }[]
  _count?: { prestamos: number } // préstamos activos
  anotaciones?: string | null // solo llega a la directiva
}

// Socio de los listados: sin historial ni trazabilidad (están en la ficha, getById)
export type SocioListado = Omit<SocioAdmin, 'aprobado_por' | 'baja_por' | 'historial_estado' | 'solicitud_grupal'> & {
  solicitud_grupal: { id: string } | null
}

// GET /socios?completo=true: todos los datos del socio, para exportar a CSV
export type SocioExport = SocioListado & {
  direccion: string | null
  consentimiento_tiendas: boolean
  telegram_linked_at: string | null
  llaves_solicitadas_at: string | null
  updated_at: string
  solicitud_grupal: { id: string; miembros: { nombre: string; apellidos: string }[] } | null
  aprobado_por: { nombre: string; apellidos: string } | null
  baja_por: { nombre: string; apellidos: string } | null
}

export interface GetSociosParams {
  estado?: EstadoSocio
  search?: string
  tiene_llaves?: boolean
  con_telegram?: boolean
  completo?: boolean // todos los campos (exportación CSV): ver SocioExport
  page?: number
  limit?: number
}

export const sociosApi = {
  update: (id: string, payload: UpdateSocioPayload) =>
    api.put<{ data: Usuario }>(`/socios/${id}`, payload),

  // Directiva — gestión
  getAll: (params: GetSociosParams = {}) =>
    api.get<PaginatedResponse<SocioListado>>(`/socios${buildQuery({ ...params })}`),

  getAllCompleto: (params: Omit<GetSociosParams, 'completo'> = {}) =>
    api.get<PaginatedResponse<SocioExport>>(`/socios${buildQuery({ ...params, completo: true })}`),

  getById: (id: string) => api.get<{ data: SocioAdmin }>(`/socios/${id}`),

  getDirectiva: () => api.get<{ data: ContactoDirectiva[] }>('/socios/directiva'),
  getOpciones: () => api.get<{ data: { id: string; nombre: string; apellidos: string; apodo: string | null }[] }>('/socios/opciones'),

  getPendientes: () => api.get<{ data: { individuales: SocioListado[]; grupos: SolicitudGrupal[] } }>('/socios/pendientes'),

  aprobar: (id: string) => api.action<{ data: SocioAdmin }>(`/socios/${id}/aprobar`),
  rechazar: (id: string) => api.action(`/socios/${id}/rechazar`),
  // juegos: qué pasa con cada juego que cedió (obligatorio para todos los que tenga)
  darDeBaja: (id: string, juegos: { juego_id: string; destino: 'se_lo_lleva' | 'club' }[] = []) =>
    api.post<{ data: SocioAdmin }>(`/socios/${id}/baja`, { juegos }),
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

  setAnotaciones: (id: string, anotaciones: string) =>
    api.put<{ data: { anotaciones: string | null } }>(`/socios/${id}/anotaciones`, { anotaciones }),

  setLlaves: (id: string, tiene_llaves: boolean) =>
    api.put<{ data: SocioAdmin }>(`/socios/${id}/llaves`, { tiene_llaves }),
}
