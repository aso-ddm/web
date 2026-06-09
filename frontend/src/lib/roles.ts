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

export function getRolLabel(rol: Rol): string {
  return ROL_LABELS[rol] ?? rol
}
