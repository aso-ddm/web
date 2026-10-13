import { afterEach, expect, it, vi } from 'vitest'
import { dniSchema, fechaNacimientoSchema } from './schema'

it('dniSchema: DNI y NIE con letra de control', () => {
  for (const ok of ['12345678Z', 'x1234567l', 'Y1234567X', 'Z1234567R']) expect(dniSchema.safeParse(ok).success, ok).toBe(true)
  for (const mal of ['12345678A', 'X1234567A', 'W1234567L', '1234567Z']) expect(dniSchema.safeParse(mal).success, mal).toBe(false)
})

it('fechaNacimientoSchema: anterior a hoy y mayor de edad', () => {
  vi.useFakeTimers({ now: new Date(2026, 9, 13, 12) }) // 13/10/2026
  const valida = (f: string) => fechaNacimientoSchema.safeParse(f).success
  expect(valida('2008-10-13')).toBe(true) // cumple 18 hoy
  expect(valida('2008-10-14')).toBe(false)
  expect(valida('2026-10-13')).toBe(false)
  expect(valida('2030-01-01')).toBe(false)
  expect(valida('')).toBe(false)
})

afterEach(() => vi.useRealTimers())
