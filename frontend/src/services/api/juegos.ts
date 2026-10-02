import { api } from './client'
import type { Juego, PaginatedResponse } from '@/types/api'

export interface FiltrosJuegos {
  search?: string
  estado?: string
  page?: number
  limit?: number
}

function buildQuery(p: FiltrosJuegos): string {
  const q = new URLSearchParams(Object.entries(p).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])).toString()
  return q ? `?${q}` : ''
}

export const juegosApi = {
  getAll: (filtros: FiltrosJuegos = {}) =>
    api.get<PaginatedResponse<Juego>>(`/juegos${buildQuery(filtros)}`),

  create: (data: Record<string, unknown>) => api.post<{ data: Juego }>('/juegos', data),
  update: (id: string, data: Record<string, unknown>) => api.put<{ data: Juego }>(`/juegos/${id}`, data),
  delete: (id: string) => api.delete<void>(`/juegos/${id}`),
  exportCsv: () => api.getBlob('/juegos/export/csv'),

  retirar: (id: string) =>
    api.action<{ data: Juego }>(`/juegos/${id}/retirar`),

  reactivar: (id: string) =>
    api.put<{ data: Juego }>(`/juegos/${id}/reactivar`, {}),
}
