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

// Grupos de roles: deben coincidir con ROLES de backend/src/middleware/auth.ts (requireRoles)
export const DIRECTIVA: Rol[] = ['administrador', 'presidente', 'secretario', 'tesorero']
export const DIRECTIVA_Y_VOCALES: Rol[] = [...DIRECTIVA, 'vocal']
export const DIRECTIVA_Y_LUDOTECARIO: Rol[] = [...DIRECTIVA, 'ludotecario']

/** Roles que la directiva puede asignar (administrador solo por BD/seed).
 *  socio_basico no se ofrece: todos son socios; es el rol base cuando no hay cargo. */
export const ROLES_ASIGNABLES: Rol[] = ['presidente', 'secretario', 'tesorero', 'vocal', 'ludotecario']

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
  // Pulsar el cargo que ya tiene lo quita: vuelve a socio sin cargo
  return [actuales.includes(rol) ? 'socio_basico' : rol, ...conservados]
}
