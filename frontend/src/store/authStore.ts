import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Usuario, Rol } from '@/types/api'

const DIRECTIVA: Rol[] = ['administrador', 'presidente', 'secretario', 'tesorero']
const DIRECTIVA_Y_VOCALES: Rol[] = [...DIRECTIVA, 'vocal']
const DIRECTIVA_Y_LUDOTECARIO: Rol[] = [...DIRECTIVA, 'ludotecario']

interface AuthState {
  usuario: Usuario | null
  token: string | null
  isAuthenticated: boolean

  // Acciones
  login: (usuario: Usuario, token: string) => void
  logout: () => void
  updateUsuario: (data: Partial<Usuario>) => void

  // Helpers de rol
  hasRole: (role: Rol) => boolean
  isDirectiva: () => boolean
  isDirectivaOVocal: () => boolean
  isLudotecario: () => boolean
  canManageGames: () => boolean

  // Redirect destino por rol tras login
  getRedirectPath: () => string
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      usuario: null,
      token: null,
      isAuthenticated: false,

      login: (usuario, token) =>
        set({ usuario, token, isAuthenticated: true }),

      logout: () =>
        set({ usuario: null, token: null, isAuthenticated: false }),

      updateUsuario: (data) =>
        set((state) => ({
          usuario: state.usuario ? { ...state.usuario, ...data } : null,
        })),

      hasRole: (role) => get().usuario?.roles.includes(role) ?? false,

      isDirectiva: () =>
        DIRECTIVA.some((r) => get().usuario?.roles.includes(r)),

      isDirectivaOVocal: () =>
        DIRECTIVA_Y_VOCALES.some((r) => get().usuario?.roles.includes(r)),

      isLudotecario: () =>
        DIRECTIVA_Y_LUDOTECARIO.some((r) => get().usuario?.roles.includes(r)),

      canManageGames: () =>
        DIRECTIVA_Y_LUDOTECARIO.some((r) => get().usuario?.roles.includes(r)),

      getRedirectPath: () => {
        const roles = get().usuario?.roles ?? []
        if (DIRECTIVA.some((r) => roles.includes(r))) return '/directiva'
        if (roles.includes('ludotecario')) return '/ludoteca'
        return '/area'
      },
    }),
    {
      name: 'dragon-auth',
      partialize: (state) => ({
        usuario: state.usuario,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
