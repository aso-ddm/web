import { api } from './client'
import type { SolicitudJuego, PaginatedResponse } from '@/types/api'

export const solicitudesJuegoApi = {
  getMias: (page = 1) =>
    api.get<PaginatedResponse<SolicitudJuego>>(`/solicitudes-juego?page=${page}&limit=20`),

  getPendientes: (page = 1) =>
    api.get<PaginatedResponse<SolicitudJuego>>(`/solicitudes-juego/pendientes?page=${page}&limit=50`),

  getTodas: (params: { estado?: string; page?: number } = {}) => {
    const q = new URLSearchParams()
    if (params.estado) q.set('estado', params.estado)
    if (params.page) q.set('page', String(params.page))
    q.set('limit', '30')
    return api.get<PaginatedResponse<SolicitudJuego>>(`/solicitudes-juego/todas?${q.toString()}`)
  },

  crear: (data: { nombre: string; notas?: string }) =>
    api.post<SolicitudJuego>('/solicitudes-juego', data),

  aprobar: (id: string) =>
    api.action<SolicitudJuego>(`/solicitudes-juego/${id}/aprobar`),

  rechazar: (id: string, motivo_rechazo?: string) =>
    api.post<SolicitudJuego>(`/solicitudes-juego/${id}/rechazar`, { motivo_rechazo }),
}
