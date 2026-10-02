import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'
import { queryClient } from '@/lib/queryClient'
import type { Usuario } from '@/types/api'

const jwt = (exp: number) => `x.${btoa(JSON.stringify({ exp }))}.y`
const usuario = { id: 'u1', roles: ['socio_basico'] } as unknown as Usuario
const guardar = (token: string) =>
  localStorage.setItem('dragon-auth', JSON.stringify({ state: { usuario, token, isAuthenticated: true }, version: 0 }))

beforeEach(() => {
  localStorage.clear()
  useAuthStore.setState({ usuario: null, token: null, isAuthenticated: false })
})

describe('authStore', () => {
  it('token caducado en localStorage → la sesión no se da por buena', async () => {
    guardar(jwt(Date.now() / 1000 - 60))
    await useAuthStore.persist.rehydrate()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('token vigente → se mantiene', async () => {
    guardar(jwt(Date.now() / 1000 + 3600))
    await useAuthStore.persist.rehydrate()
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('logout en otra pestaña → esta también cierra sesión y vacía la caché', async () => {
    useAuthStore.getState().login(usuario, jwt(Date.now() / 1000 + 3600))
    queryClient.setQueryData(['me'], { data: usuario })

    // la otra pestaña escribe su logout en localStorage y el navegador avisa con 'storage'
    localStorage.setItem('dragon-auth', JSON.stringify({ state: { usuario: null, token: null, isAuthenticated: false }, version: 0 }))
    window.dispatchEvent(new StorageEvent('storage', { key: 'dragon-auth', newValue: localStorage.getItem('dragon-auth') }))
    await Promise.resolve()

    expect(useAuthStore.getState().isAuthenticated).toBe(false)
    expect(queryClient.getQueryData(['me'])).toBeUndefined()
  })
})
