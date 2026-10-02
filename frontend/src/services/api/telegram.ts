import { api } from './client'

export interface AnuncioResult {
  enviados: number
  errores: number
  total: number
}

export const telegramApi = {
  enviarAnuncio: (mensaje: string, destinatarios?: string[]) =>
    api.post<{ data: AnuncioResult }>('/telegram/anuncio', { mensaje, ...(destinatarios ? { destinatarios } : {}) }),
}
