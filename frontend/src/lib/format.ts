const DIA_MS = 1000 * 60 * 60 * 24

/** "12 mar 2026" (o "12 de marzo de 2026" con month='long'); '—' si no hay fecha */
export function formatDate(date?: string | null, month: 'short' | 'long' = 'short') {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('es-ES', { day: '2-digit', month, year: 'numeric' })
}

/** Días hasta la fecha límite: 0 = vence hoy, negativo = vencido (-1 desde el día siguiente).
 *  El backend guarda la fecha límite a las 23:59:59 de Madrid, así que floor da días de calendario. */
export function diasRestantes(fechaLimite: string) {
  return Math.floor((new Date(fechaLimite).getTime() - Date.now()) / DIA_MS)
}

/** "2–4 jugadores", "3 jugadores" o "?–6 jugadores"; null si no hay datos */
export function formatJugadores(j: { num_jugadores_min?: number | null; num_jugadores_max?: number | null }) {
  const { num_jugadores_min: min, num_jugadores_max: max } = j
  if (!min && !max) return null
  return `${min ?? '?'}${max && max !== min ? `–${max}` : ''} jugadores`
}
