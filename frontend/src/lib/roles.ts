import type { Rol } from '@/types/api'

export const ROL_LABELS: Record<Rol, string> = {
  administrador: 'Administrador',
  presidente: 'Presidente',
  secretario: 'Secretario',
  tesorero: 'Tesorero',
  vocal: 'Vocal',
  ludotecario: 'Ludotecario',
  socio_basico: 'Socio/a',
}

/** Roles que la directiva puede asignar (administrador solo por BD/seed) */
export const ROLES_ASIGNABLES: Rol[] = ['presidente', 'secretario', 'tesorero', 'vocal', 'ludotecario', 'socio_basico']

export function getRolLabel(rol: Rol): string {
  return ROL_LABELS[rol] ?? rol
}

// Un único rol base; ludotecario se acumula. Debe coincidir con normalizarRoles del backend.
export function toggleRol(actuales: Rol[], rol: Rol): Rol[] {
  if (rol === 'ludotecario') {
    return actuales.includes(rol) ? actuales.filter((r) => r !== rol) : [...actuales, rol]
  }
  // Rol base primero: se lee "Vocal · Ludotecario"
  const conservados = actuales.filter((r) => r === 'ludotecario' || r === 'administrador')
  return [rol, ...conservados]
}
