import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { telegram } from '../lib/telegram'
import { createPrismaMock } from './helpers/prisma.mock'

let prisma: PrismaClient

beforeEach(() => {
  prisma = createPrismaMock()
  vi.stubEnv('BOT_TOKEN', 'tok')
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })

describe('telegram()', () => {
  it('ok → no registra nada', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }))
    expect((await telegram(prisma, 'sendMessage', { chat_id: '7', text: 'hola' }, 'test')).ok).toBe(true)
    expect(prisma.telegramLog.create).not.toHaveBeenCalled()
  })

  it('ok:false → registra el error con el payload para reintentar', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: false, description: 'Forbidden: bot was blocked by the user' }, { status: 403 }))
    const r = await telegram(prisma, 'sendMessage', { chat_id: '7', text: 'hola' }, 'aviso_baja')
    expect(r).toEqual({ ok: false, description: 'Forbidden: bot was blocked by the user' })
    expect(vi.mocked(prisma.telegramLog.create).mock.calls[0][0].data).toMatchObject({
      direccion: 'envio', metodo: 'sendMessage', contexto: 'aviso_baja', chat_id: '7',
      error: 'Forbidden: bot was blocked by the user', payload: { params: { chat_id: '7', text: 'hola' } },
    })
    expect(prisma.telegramLog.deleteMany).toHaveBeenCalled() // purga de >90 días
  })

  it('error de red, sensible → no lanza y no guarda el mensaje', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('ECONNRESET'))
    const r = await telegram(prisma, 'sendMessage', { chat_id: '7', text: 'código 123456' }, 'reset_password', { sensible: true })
    expect(r.ok).toBe(false)
    expect(vi.mocked(prisma.telegramLog.create).mock.calls[0][0].data).toMatchObject({ error: 'ECONNRESET', payload: undefined })
  })

  it('si falla el propio log, no rompe el flujo', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('caído'))
    vi.mocked(prisma.telegramLog.create).mockRejectedValue(new Error('db caída'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    expect((await telegram(prisma, 'sendMessage', { chat_id: '7' }, 'test')).ok).toBe(false)
  })
})
