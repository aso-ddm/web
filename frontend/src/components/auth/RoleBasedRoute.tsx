import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { Rol } from '@/types/api'

interface RoleBasedRouteProps {
  allowedRoles: Rol[]
  redirectTo?: string
}

export function RoleBasedRoute({
  allowedRoles,
  redirectTo = '/area',
}: RoleBasedRouteProps) {
  const { isAuthenticated, usuario } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const hasRole = allowedRoles.some((role) => usuario?.roles.includes(role))

  if (!hasRole) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
