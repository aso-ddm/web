import { expect, it } from 'vitest'
import { dniSchema } from './schema'

it('dniSchema: DNI y NIE con letra de control', () => {
  for (const ok of ['12345678Z', 'x1234567l', 'Y1234567X', 'Z1234567R']) expect(dniSchema.safeParse(ok).success, ok).toBe(true)
  for (const mal of ['12345678A', 'X1234567A', 'W1234567L', '1234567Z']) expect(dniSchema.safeParse(mal).success, mal).toBe(false)
})
