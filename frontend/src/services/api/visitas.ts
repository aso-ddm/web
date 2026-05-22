import { api } from './client'
import type { Visita, VisitanteSugerido, PaginatedResponse } from '@/types/api'

export const visitasApi = {
  buscar: (nombre: string) =>
    api.get<{ data: VisitanteSugerido[] }>(`/visitas/buscar?nombre=${encodeURIComponent(nombre)}`),

  registrar: (nombre_completo: string) =>
    api.post<{ data: Visita }>('/visitas', { nombre_completo }),

  getAll: (params: { page?: number; limit?: number; search?: string } = {}) => {
    const q = new URLSearchParams()
    if (params.page)   q.set('page',   String(params.page))
    if (params.limit)  q.set('limit',  String(params.limit))
    if (params.search) q.set('search', params.search)
    return api.get<PaginatedResponse<Visita>>(`/visitas?${q.toString()}`)
  },
}
