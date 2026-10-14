import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useShallow } from 'zustand/react/shallow'

export function ProtectedRoute() {
  const { isAuthenticated, usuario } = useAuthStore(useShallow((s) => ({ isAuthenticated: s.isAuthenticated, usuario: s.usuario })))
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Hasta que la directiva la apruebe, una solicitud pendiente solo puede editar su formulario
  if (usuario?.estado === 'pendiente') return <Navigate to="/mi-solicitud" replace />

  return <Outlet />
}
