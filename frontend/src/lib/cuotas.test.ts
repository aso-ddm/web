import { it, expect } from 'vitest'
import { situacion, mesEnPeriodo } from './cuotas'

const hoy = new Date(2026, 2, 10) // marzo 2026
const alta = new Date(2026, 0, 20).toISOString() // enero 2026

it('clasifica la situación de pago', () => {
  const ene = { anio: 2026, mes: 1, estado: 'pagado' as const }
  const feb = { anio: 2026, mes: 2, estado: 'pagado' as const }
  const mar = { anio: 2026, mes: 3, estado: 'pagado' as const }
  expect(situacion(alta, [ene, feb, mar], hoy)).toBe('al_corriente')
  expect(situacion(alta, [ene, mar], hoy)).toBe('pendiente')
  expect(situacion(alta, [ene, { ...feb, estado: 'sin_pagar' }, mar], hoy)).toBe('moroso')
  // Meses fuera del periodo no cuentan
  expect(situacion(alta, [{ anio: 2025, mes: 12, estado: 'sin_pagar' }, ene, feb, mar], hoy)).toBe('al_corriente')
  expect(mesEnPeriodo(alta, 2025, 12, hoy)).toBe(false)
  expect(mesEnPeriodo(alta, 2026, 4, hoy)).toBe(false)
})
