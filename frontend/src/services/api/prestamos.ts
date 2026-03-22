import { api } from './client'
import type { Prestamo, PaginatedResponse } from '@/types/api'

export const prestamosApi = {
  misPrestamos: (page = 1) =>
    api.get<PaginatedResponse<Prestamo>>(`/prestamos/mis-prestamos?page=${page}&limit=20`),

  solicitar: (juego_id: string, notas?: string) =>
    api.post<{ data: Prestamo }>('/prestamos', { juego_id, notas }),

  cancelar: (id: string) =>
    api.delete<void>(`/prestamos/${id}`),
}
