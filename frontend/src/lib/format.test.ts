import { afterEach, expect, it, vi } from 'vitest'
import { diasRestantes } from './format'

afterEach(() => vi.useRealTimers())

it('diasRestantes: 0 el día límite, -1 desde el día siguiente (nunca -0)', () => {
  const limite = '2026-10-16T21:59:59.999Z' // 16 oct 23:59:59 Madrid
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-10-14T08:00:00Z'))
  expect(diasRestantes(limite)).toBe(2)
  vi.setSystemTime(new Date('2026-10-16T08:00:00Z'))
  expect(diasRestantes(limite)).toBe(0)
  vi.setSystemTime(new Date('2026-10-17T08:00:00Z'))
  expect(diasRestantes(limite)).toBe(-1)
  vi.setSystemTime(new Date('2026-10-19T08:00:00Z'))
  expect(diasRestantes(limite)).toBe(-3)
})
