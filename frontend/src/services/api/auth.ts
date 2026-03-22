import { api } from './client'
import type { LoginPayload, LoginResponse, RegisterPayload, Usuario } from '@/types/api'

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<LoginResponse>('/auth/login', payload),

  register: (payload: RegisterPayload) =>
    api.post<{ message: string; data: Pick<Usuario, 'id' | 'email' | 'nombre' | 'apellidos'> }>(
      '/auth/register',
      payload,
    ),

  me: () => api.get<{ data: Usuario }>('/auth/me'),
}
