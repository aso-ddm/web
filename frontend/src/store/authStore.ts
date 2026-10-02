import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Usuario, Rol } from '@/types/api'

const DIRECTIVA: Rol[] = ['administrador', 'presidente', 'secretario', 'tesorero']
const DIRECTIVA_Y_VOCALES: Rol[] = [...DIRECTIVA, 'vocal']
const DIRECTIVA_Y_LUDOTECARIO: Rol[] = [...DIRECTIVA, 'ludotecario']
const STORAGE_KEY = 'dragon-auth'

/** Lee exp del payload del JWT. No valida la firma (eso es cosa del backend): solo evita mostrar como
 *  activa una sesión que el backend ya va a rechazar. Un token ilegible cuenta como caducado. */
function tokenCaducado(token: string) {
  try {
    const { exp } = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof exp === 'number' && exp * 1000 < Date.now()
  } catch {
    return true
  }
}

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

      getRedirectPath: () => {
        const roles = get().usuario?.roles ?? []
        if (DIRECTIVA.some((r) => roles.includes(r))) return '/directiva'
        if (roles.includes('ludotecario')) return '/ludoteca'
        return '/area'
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({
        usuario: state.usuario,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token && tokenCaducado(state.token)) state.logout()
      },
    },
  ),
)

// Otra pestaña cambió la sesión (logout, otra cuenta): esta la relee en vez de seguir con la suya,
// que además volvería a escribirse en localStorage al primer cambio y "resucitaría" la sesión cerrada
window.addEventListener('storage', (e) => {
  if (e.key !== STORAGE_KEY && e.key !== null) return // null = localStorage.clear()
  if (e.newValue === null) useAuthStore.getState().logout()
  else useAuthStore.persist.rehydrate()
})
