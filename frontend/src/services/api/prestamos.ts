import { api } from './client'
import type { Prestamo, EstadoPrestamo, PaginatedResponse } from '@/types/api'

export const prestamosApi = {
  // Socio
  misPrestamos: (page = 1) =>
    api.get<PaginatedResponse<Prestamo>>(`/prestamos/mis-prestamos?page=${page}&limit=20`),

  solicitar: (juego_id: string, notas?: string) =>
    api.post<{ data: Prestamo }>('/prestamos', { juego_id, notas }),

  renovar: (id: string) =>
    api.action<{ data: Prestamo }>(`/prestamos/${id}/renovar`),

  devolucion: (id: string) =>
    api.action<{ data: Prestamo }>(`/prestamos/${id}/devolucion`),

  // Ludotecario / Directiva
  getAll: (params: { estado?: EstadoPrestamo; vencidos?: boolean; page?: number } = {}) => {
    const q = new URLSearchParams()
    if (params.estado) q.set('estado', params.estado)
    if (params.vencidos) q.set('vencidos', 'true')
    if (params.page) q.set('page', String(params.page))
    q.set('limit', '30')
    return api.get<PaginatedResponse<Prestamo>>(`/prestamos?${q.toString()}`)
  },
}
