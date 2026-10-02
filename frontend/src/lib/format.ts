const DIA_MS = 1000 * 60 * 60 * 24

/** "12 mar 2026" (o "12 de marzo de 2026" con month='long'); '—' si no hay fecha */
export function formatDate(date?: string | null, month: 'short' | 'long' = 'short') {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month, year: 'numeric' })
}

/** Días hasta la fecha límite (negativo si ya pasó) */
export function diasRestantes(fechaLimite: string) {
  return Math.ceil((new Date(fechaLimite).getTime() - Date.now()) / DIA_MS)
}
