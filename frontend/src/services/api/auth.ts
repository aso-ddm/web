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

export interface SolicitudAltaPayload {
  nombre: string
  apellidos: string
  dni: string
  telefono?: string
  fecha_nacimiento: string
  direccion?: string
  apodo: string
  consentimiento_tiendas: boolean
}

export interface SolicitudAlta extends Omit<SolicitudAltaPayload, 'fecha_nacimiento'> {
  email: string
  fecha_nacimiento: string | null
  tipo_cuota: Usuario['tipo_cuota']
}

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>('/auth/login', payload),

  // Solo cuentas con Telegram ya vinculado (se vincula tras el primer login con contraseña)
  loginTelegram: (payload: TelegramUser) =>
    api.post<LoginResponse>('/auth/telegram', payload),

  register: (payload: RegisterPayload, comprobante: File) => {
    const fd = new FormData()
    fd.append('data', JSON.stringify(payload))
    fd.append('comprobante', comprobante, comprobante.name)
    return api.postForm<{ message: string; data: Pick<Usuario, 'id' | 'email' | 'nombre' | 'apellidos'> }>(
      '/auth/register',
      fd,
    )
  },

  // Solo con la solicitud de alta pendiente
  getSolicitud: () => api.get<{ data: SolicitudAlta }>('/auth/solicitud'),

  updateSolicitud: (payload: SolicitudAltaPayload, comprobante?: File) => {
    const fd = new FormData()
    fd.append('data', JSON.stringify(payload))
    if (comprobante) fd.append('comprobante', comprobante, comprobante.name)
    return api.putForm<{ data: SolicitudAlta }>('/auth/solicitud', fd)
  },

  me: () => api.get<{ data: Usuario }>('/auth/me'),

  linkTelegram: (payload: TelegramUser) =>
    api.post<{ data: Pick<Usuario, 'alias_telegram' | 'telegram_chat_id' | 'telegram_linked_at'> }>(
      '/auth/link-telegram',
      payload,
    ),

  // Avisa al secretario por Telegram (requiere 6 meses como socio)
  pedirLlaves: () => api.post<{ data: { ok: boolean } }>('/auth/pedir-llaves', {}),
  pedirBaja: () => api.post<{ data: { ok: boolean } }>('/auth/pedir-baja', {}),

  requestPasswordReset: (email: string) =>
    api.post<{ data: { ok: true } }>('/auth/reset-password/request', { email }),

  confirmPasswordReset: (email: string, token: string, password: string) =>
    api.post<{ data: { ok: boolean } }>('/auth/reset-password/confirm', { email, token, password }),
}
