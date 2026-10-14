import { api, buildQuery } from './client'
import type { Visita, VisitanteSugerido, CobroVisita, PaginatedResponse } from '@/types/api'

export const visitasApi = {
  buscar: (nombre: string) =>
    // nuevo: lo que pagaría alguien que no ha venido nunca
    api.get<{ data: VisitanteSugerido[]; nuevo: CobroVisita }>(`/visitas/buscar${buildQuery({ nombre })}`),

  registrar: (nombre_completo: string) =>
    api.post<{ data: Visita }>('/visitas', { nombre_completo }),

  getAll: (params: { page?: number; limit?: number; search?: string } = {}) =>
    api.get<PaginatedResponse<Visita>>(`/visitas${buildQuery(params)}`),
}
