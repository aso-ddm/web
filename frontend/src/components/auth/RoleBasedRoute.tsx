import { Navigate, Outlet } from 'react-router-dom'
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

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const hasRole = allowedRoles.some((role) => usuario?.roles.includes(role))

  if (!hasRole) {
    return <Navigate to={redirectTo} replace />
  }

  return <Outlet />
}
