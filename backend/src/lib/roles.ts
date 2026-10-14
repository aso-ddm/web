import { Rol } from '@prisma/client'
import { HttpError } from './httpError'

// El rol administrador no se asigna ni se retira desde la app (solo BD/seed).
export function comprobarCambioAdmin(actuales: Rol[], nuevos: Rol[]) {
  if (actuales.includes(Rol.administrador) !== nuevos.includes(Rol.administrador)) {
    throw new HttpError(403, 'El rol de administrador no se puede asignar ni retirar desde la aplicación')
  }
}

// Un único rol base por persona; ludotecario es el único que se acumula sobre cualquiera.
// Socio o vocal + ludotecario → gana los permisos de ludoteca. Presidente, secretario o
// tesorero + ludotecario → solo queda marcado (la directiva ya tiene esos permisos).
// Sin rol base → socio_basico. Orden: rol base primero, ludotecario al final.
const ROLES_BASE: Rol[] = [Rol.presidente, Rol.secretario, Rol.tesorero, Rol.vocal, Rol.socio_basico]
export function normalizarRoles(roles: Rol[]): Rol[] {
  const unicos = [...new Set(roles)]
  const base = unicos.filter((r) => ROLES_BASE.includes(r))
  if (base.length > 1) {
    throw new HttpError(400, 'Solo se puede tener un rol, además de ludotecario')
  }
  const esAdmin = unicos.includes(Rol.administrador)
  if (base.length === 0 && !esAdmin) base.push(Rol.socio_basico)
  return [
    ...(esAdmin ? [Rol.administrador] : []),
    ...base,
    ...(unicos.includes(Rol.ludotecario) ? [Rol.ludotecario] : []),
  ]
}
