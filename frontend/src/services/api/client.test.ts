import { describe, it, expect, vi, afterEach } from 'vitest'
import { api, ApiRequestError } from './client'
import { useAuthStore } from '@/store/authStore'

afterEach(() => vi.restoreAllMocks())

describe('api client', () => {
  it('red caída → mensaje en español', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(api.get('/x')).rejects.toThrow('No se pudo conectar con el servidor')
  })

  it('502 con HTML de nginx → mensaje de servidor caído y status', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 502 }))
    const err = (await api.get('/x').catch((e: unknown) => e)) as ApiRequestError
    expect(err).toBeInstanceOf(ApiRequestError)
    expect(err.status).toBe(502)
    expect(err.message).toContain('servidor no está disponible')
  })

  it('401 → cierra sesión y propaga el mensaje del backend', async () => {
    const logout = vi.fn()
    useAuthStore.setState({ logout })
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ error: 'Token inválido' }, { status: 401 }))
    await expect(api.get('/x')).rejects.toThrow('Token inválido')
    expect(logout).toHaveBeenCalled()
  })

  it('204 → undefined', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))
    await expect(api.delete('/x')).resolves.toBeUndefined()
  })
})
