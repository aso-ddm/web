import { api, buildQuery } from './client'
import type { PaginatedResponse } from '@/types/api'

export interface AnuncioResult {
  enviados: number
  errores: number
  total: number
}

export const telegramApi = {
  enviarAnuncio: (mensaje: string, destinatarios?: string[]) =>
    api.post<{ data: AnuncioResult }>('/telegram/anuncio', { mensaje, ...(destinatarios ? { destinatarios } : {}) }),
}

export interface TelegramLog {
  id: string
  direccion: 'envio' | 'recepcion'
  metodo: string
  contexto: string
  chat_id: string | null
  error: string
  payload: unknown
  reintentado_at: string | null
  created_at: string
}

type RespuestaBot = { ok: boolean; description?: string; result?: Record<string, unknown> }

export interface FiltrosLog {
  direccion?: 'envio' | 'recepcion'
  contexto?: string
  desde?: string
  hasta?: string
  page: number
}

export const telegramAdminApi = {
  getEstado: () => api.get<{ data: { me: RespuestaBot; webhook: RespuestaBot } }>('/telegram/estado'),
  getLogs: (f: FiltrosLog) => {
    const q = buildQuery({ ...f, hasta: f.hasta && `${f.hasta}T23:59:59` })
    return api.get<PaginatedResponse<TelegramLog> & { contextos: string[] }>(`/telegram/logs${q}`)
  },
  reintentar: (id: string) => api.post<{ data: TelegramLog }>(`/telegram/logs/${id}/reintentar`, {}),
}
