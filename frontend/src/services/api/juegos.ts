import { api } from './client'
import type { Juego, PaginatedResponse } from '@/types/api'

export interface FiltrosJuegos {
  search?: string
  estado?: string
  categoria?: string
  page?: number
  limit?: number
}

function buildQuery(params: FiltrosJuegos): string {
  const q = new URLSearchParams()
  if (params.search) q.set('search', params.search)
  if (params.estado) q.set('estado', params.estado)
  if (params.categoria) q.set('categoria', params.categoria)
  if (params.page) q.set('page', String(params.page))
  if (params.limit) q.set('limit', String(params.limit))
  const str = q.toString()
  return str ? `?${str}` : ''
}

export const juegosApi = {
  getAll: (filtros: FiltrosJuegos = {}) =>
    api.get<PaginatedResponse<Juego>>(`/juegos${buildQuery(filtros)}`),

  getById: (id: string) =>
    api.get<{ data: Juego }>(`/juegos/${id}`),
}
