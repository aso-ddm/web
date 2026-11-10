import { useSyncExternalStore } from 'react'

// Decisión sobre cookies de terceros (Google Maps y Calendar). Las nuestras son técnicas y no la necesitan
export type DecisionCookies = 'aceptadas' | 'rechazadas'

const KEY = 'dragon-cookies'
const avisar = new Set<() => void>()
// Sin localStorage (modo privado estricto) la decisión dura lo que la pestaña
let memoria: DecisionCookies | null = null

function leer(): DecisionCookies | null {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'aceptadas' || v === 'rechazadas' ? v : null
  } catch {
    return null
  }
}

export function decidirCookies(decision: DecisionCookies) {
  try { localStorage.setItem(KEY, decision) } catch { /* sin storage: vale para esta visita */ }
  memoria = decision
  avisar.forEach((f) => f())
}

export function useDecisionCookies(): DecisionCookies | null {
  return useSyncExternalStore(
    (f) => { avisar.add(f); return () => { avisar.delete(f) } },
    () => leer() ?? memoria,
  )
}
