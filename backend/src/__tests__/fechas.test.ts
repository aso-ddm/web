import { describe, it, expect } from 'vitest'
import { finDelDiaMadrid } from '../lib/fechas'

describe('finDelDiaMadrid', () => {
  it('verano (UTC+2): 2 oct 18:30 + 14 días → 16 oct 23:59:59.999 Madrid', () => {
    expect(finDelDiaMadrid(new Date('2026-10-02T16:30:00Z'), 14).toISOString()).toBe('2026-10-16T21:59:59.999Z')
  })

  it('cruza el cambio de hora (25 oct 2026) → 23:59 en horario de invierno (UTC+1)', () => {
    expect(finDelDiaMadrid(new Date('2026-10-20T10:00:00Z'), 7).toISOString()).toBe('2026-10-27T22:59:59.999Z')
  })

  it('pasada la medianoche de Madrid (23:30Z = 00:30 del día siguiente) cuenta como el día siguiente', () => {
    expect(finDelDiaMadrid(new Date('2026-01-14T23:30:00Z')).toISOString()).toBe('2026-01-15T22:59:59.999Z')
  })
})
