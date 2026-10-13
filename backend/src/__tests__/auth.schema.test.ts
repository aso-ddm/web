import { describe, it, expect, vi, afterEach } from 'vitest'
import { dniRegistroSchema, fechaNacimientoSchema } from '../schemas/auth.schema'

describe('dniRegistroSchema', () => {
  it('DNI y NIE con letra de control', () => {
    for (const ok of ['12345678Z', 'x1234567l', 'Y1234567X', 'Z1234567R']) expect(dniRegistroSchema.safeParse(ok).success, ok).toBe(true)
    for (const mal of ['12345678A', 'X1234567A', 'W1234567L', '1234567Z']) expect(dniRegistroSchema.safeParse(mal).success, mal).toBe(false)
  })
})

describe('fechaNacimientoSchema', () => {
  afterEach(() => vi.useRealTimers())
  const valida = (f: string) => fechaNacimientoSchema.safeParse(f).success

  it('mayor de edad: cumple 18 hoy sí, mañana no', () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 13, 12) }) // 13/10/2026
    expect(valida('2008-10-13')).toBe(true)
    expect(valida('2008-10-14')).toBe(false)
    expect(valida('1980-01-01')).toBe(true)
  })

  it('nacido un 29 de febrero cumple el 1 de marzo', () => {
    vi.useFakeTimers({ now: new Date(2026, 1, 28, 12) })
    expect(valida('2008-02-29')).toBe(false)
    vi.useFakeTimers({ now: new Date(2026, 2, 1, 12) })
    expect(valida('2008-02-29')).toBe(true)
  })

  it('hoy, futuro o fecha inválida → error', () => {
    vi.useFakeTimers({ now: new Date(2026, 9, 13, 12) })
    expect(valida('2026-10-13')).toBe(false)
    expect(valida('2030-01-01')).toBe(false)
    expect(valida('2000-02-30')).toBe(false)
    expect(valida('')).toBe(false)
  })
})
