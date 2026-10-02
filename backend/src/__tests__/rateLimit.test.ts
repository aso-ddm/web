import { describe, it, expect, vi } from 'vitest'
import type { Request, Response } from 'express'
import { rateLimit } from '../middleware/rateLimit'

const req = (ip: string) => ({ get: () => ip, ip }) as unknown as Request
const res = () => {
  const r = { status: vi.fn(), json: vi.fn(), set: vi.fn() }
  r.status.mockReturnValue(r)
  return r as unknown as Response & { status: ReturnType<typeof vi.fn> }
}

describe('rateLimit', () => {
  it('bloquea con 429 al pasar del máximo, por IP, y se reinicia con la ventana', () => {
    vi.useFakeTimers()
    const limit = rateLimit({ max: 2, windowMs: 1000 })
    const next = vi.fn()

    limit(req('a'), res(), next)
    limit(req('a'), res(), next)
    const blocked = res()
    limit(req('a'), blocked, next)
    limit(req('b'), res(), next)

    expect(next).toHaveBeenCalledTimes(3)
    expect(blocked.status).toHaveBeenCalledWith(429)

    vi.advanceTimersByTime(1001)
    limit(req('a'), res(), next)
    expect(next).toHaveBeenCalledTimes(4)
    vi.useRealTimers()
  })
})
