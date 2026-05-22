import { api } from './client'
import type { LoginPayload, LoginResponse, RegisterPayload, Usuario } from '@/types/api'

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>('/auth/login', payload),

  register: (payload: RegisterPayload, comprobante: File) => {
    const fd = new FormData()
    fd.append('data', JSON.stringify(payload))
    fd.append('comprobante', comprobante, comprobante.name)
    return api.postForm<{ message: string; data: Pick<Usuario, 'id' | 'email' | 'nombre' | 'apellidos'> }>(
      '/auth/register',
      fd,
    )
  },

  me: () => api.get<{ data: Usuario }>('/auth/me'),

  linkTelegram: (payload: TelegramUser) =>
    api.post<{ data: Pick<Usuario, 'alias_telegram' | 'telegram_chat_id' | 'telegram_linked_at'> }>(
      '/auth/link-telegram',
      payload,
    ),

  unlinkTelegram: () => api.delete<{ data: { ok: boolean } }>('/auth/link-telegram'),
}
