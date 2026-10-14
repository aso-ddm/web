import { api, buildQuery } from './client'
import type { Prestamo, EstadoPrestamo, PaginatedResponse } from '@/types/api'

export const prestamosApi = {
  // Socio
  // Activos e historial por separado: el historial se pagina ("Cargar más") en vez de cortarse
  misPrestamos: (params: { estado?: EstadoPrestamo; page?: number; limit?: number } = {}) =>
    api.get<PaginatedResponse<Prestamo>>(`/prestamos/mis-prestamos${buildQuery(params)}`),

  solicitar: (juego_id: string, notas?: string) =>
    api.post<{ data: Prestamo }>('/prestamos', { juego_id, notas }),

  renovar: (id: string) =>
    api.action<{ data: Prestamo }>(`/prestamos/${id}/renovar`),

  devolucion: (id: string) =>
    api.action<{ data: Prestamo }>(`/prestamos/${id}/devolucion`),

  // Ludotecario / Directiva
  getAll: (params: { estado?: EstadoPrestamo; vencidos?: boolean; page?: number; limit?: number } = {}) =>
    api.get<PaginatedResponse<Prestamo>>(`/prestamos${buildQuery({ limit: 30, ...params, vencidos: params.vencidos || undefined })}`),
}
