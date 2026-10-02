import { api } from './client'
import type { SolicitudJuego, PaginatedResponse } from '@/types/api'

export const solicitudesJuegoApi = {
  getMias: (page = 1) =>
    api.get<PaginatedResponse<SolicitudJuego>>(`/solicitudes-juego?page=${page}&limit=20`),

  getPendientes: (page = 1) =>
    api.get<PaginatedResponse<SolicitudJuego>>(`/solicitudes-juego/pendientes?page=${page}&limit=50`),

  crear: (data: { nombre: string; notas?: string }) =>
    api.post<SolicitudJuego>('/solicitudes-juego', data),

  aprobar: (id: string) =>
    api.action<SolicitudJuego>(`/solicitudes-juego/${id}/aprobar`),

  rechazar: (id: string, motivo_rechazo?: string) =>
    api.post<SolicitudJuego>(`/solicitudes-juego/${id}/rechazar`, { motivo_rechazo }),
}
