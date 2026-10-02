import { it, expect } from 'vitest'
import { esMoroso, mesEnPeriodo } from './cuotas'

const hoy = new Date(2026, 2, 10) // marzo 2026
const alta = new Date(2026, 0, 20).toISOString() // enero 2026

it('detecta morosos dentro del periodo de socio', () => {
  const ene = { anio: 2026, mes: 1, estado: 'pagado' as const }
  expect(esMoroso(alta, [ene], hoy)).toBe(false)
  expect(esMoroso(alta, [ene, { anio: 2026, mes: 2, estado: 'sin_pagar' }], hoy)).toBe(true)
  // Meses fuera del periodo no cuentan
  expect(esMoroso(alta, [{ anio: 2025, mes: 12, estado: 'sin_pagar' }], hoy)).toBe(false)
  expect(mesEnPeriodo(alta, 2025, 12, hoy)).toBe(false)
  expect(mesEnPeriodo(alta, 2026, 4, hoy)).toBe(false)
})
