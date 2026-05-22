import { api } from './client'
import type { LogJuego, PaginatedResponse } from '@/types/api'

export const logsJuegoApi = {
  getByJuego: (juegoId: string, page = 1) =>
    api.get<PaginatedResponse<LogJuego>>(`/juegos/${juegoId}/logs?page=${page}&limit=20`),

  crearManual: (juegoId: string, texto: string) =>
    api.post<LogJuego>(`/juegos/${juegoId}/logs`, { texto }),
}
