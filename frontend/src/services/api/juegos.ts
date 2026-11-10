import { api, buildQuery } from './client'
import type { Juego, PaginatedResponse, TipoJuego } from '@/types/api'

export interface FiltrosJuegos {
  search?: string
  estado?: string
  tipo?: TipoJuego
  page?: number
  limit?: number
}

/** Alta o edición: al editar, null borra el campo */
export type JuegoPayload = {
  nombre?: string
  tipo?: TipoJuego
  localizacion?: string | null
  num_jugadores_min?: number | null
  num_jugadores_max?: number | null
  notas?: string | null
  propietario_id?: string | null
}

export const juegosApi = {
  getAll: (filtros: FiltrosJuegos = {}) =>
    api.get<PaginatedResponse<Juego>>(`/juegos${buildQuery({ ...filtros })}`),

  /** Web pública, sin login: nombre y tipo de lo que no está retirado */
  publico: () => api.get<{ data: Pick<Juego, 'nombre' | 'tipo'>[] }>('/juegos/publico'),

  /** Juegos de los que el socio autenticado es propietario */
  mios: () => api.get<{ data: Juego[] }>('/juegos/mios'),

  create: (data: JuegoPayload) => api.post<{ data: Juego }>('/juegos', data),
  update: (id: string, data: JuegoPayload) => api.put<{ data: Juego }>(`/juegos/${id}`, data),
  delete: (id: string) => api.delete<void>(`/juegos/${id}`),
  exportCsv: () => api.getBlob('/juegos/export/csv'),

  retirar: (id: string) =>
    api.action<{ data: Juego }>(`/juegos/${id}/retirar`),

  reactivar: (id: string) =>
    api.put<{ data: Juego }>(`/juegos/${id}/reactivar`, {}),
}
