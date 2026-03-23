import { api } from './client'
import type { LoginPayload, LoginResponse, RegisterPayload, Usuario } from '@/types/api'

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
}
