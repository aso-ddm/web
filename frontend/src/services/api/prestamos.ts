import { api } from './client'
import type { Prestamo, EstadoPrestamo, PaginatedResponse } from '@/types/api'

export const prestamosApi = {
  // Socio
  misPrestamos: (page = 1) =>
    api.get<PaginatedResponse<Prestamo>>(`/prestamos/mis-prestamos?page=${page}&limit=20`),

  solicitar: (juego_id: string, notas?: string) =>
    api.post<{ data: Prestamo }>('/prestamos', { juego_id, notas }),

  cancelar: (id: string) =>
    api.delete<void>(`/prestamos/${id}`),

  // Ludotecario / Directiva
  getAll: (params: { estado?: EstadoPrestamo; page?: number } = {}) => {
    const q = new URLSearchParams()
    if (params.estado) q.set('estado', params.estado)
    if (params.page) q.set('page', String(params.page))
    q.set('limit', '30')
    return api.get<PaginatedResponse<Prestamo>>(`/prestamos?${q.toString()}`)
  },

  aprobar: (id: string) => api.action<{ data: Prestamo }>(`/prestamos/${id}/aprobar`),
  activar: (id: string) => api.action<{ data: Prestamo }>(`/prestamos/${id}/activar`),
  rechazar: (id: string, motivo?: string) =>
    api.post<{ data: Prestamo }>(`/prestamos/${id}/rechazar`, { motivo }),
  confirmarDevolucion: (id: string) =>
    api.action<{ data: Prestamo }>(`/prestamos/${id}/devolucion`),
}
