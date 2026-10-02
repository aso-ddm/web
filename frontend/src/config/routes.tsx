import { lazy, Suspense, type ComponentType } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { PageLoader } from '@/components/atoms/PageLoader'

// Layouts y guards
import { AreaLayout } from '@/components/organisms/AreaLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RoleBasedRoute } from '@/components/auth/RoleBasedRoute'

// Páginas públicas: van en el bundle inicial
import { HomePage } from '@/pages/HomePage'
import { ClubPage } from '@/pages/ClubPage'
import { SocioPage } from '@/pages/SocioPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { LoginPage } from '@/pages/LoginPage'

// El resto se descarga al entrar en la página
function lazyPage<K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) {
  return lazy(() => load().then((m) => ({ default: m[name] })))
}

const RegistroPage = lazyPage(() => import('@/pages/RegistroPage'), 'RegistroPage')
const RgpdPage = lazyPage(() => import('@/pages/RgpdPage'), 'RgpdPage')
const RecuperarPasswordPage = lazyPage(() => import('@/pages/RecuperarPasswordPage'), 'RecuperarPasswordPage')

// Área de socio
const DashboardPage = lazyPage(() => import('@/pages/area/DashboardPage'), 'DashboardPage')
const PerfilPage = lazyPage(() => import('@/pages/area/PerfilPage'), 'PerfilPage')
const PrestamosPage = lazyPage(() => import('@/pages/area/PrestamosPage'), 'PrestamosPage')
const LudotecaPage = lazyPage(() => import('@/pages/area/LudotecaPage'), 'LudotecaPage')
const RegistroVisitaPage = lazyPage(() => import('@/pages/area/RegistroVisitaPage'), 'RegistroVisitaPage')

// Panel ludotecario
const GestionJuegosPage = lazyPage(() => import('@/pages/ludoteca/GestionJuegosPage'), 'GestionJuegosPage')
const GestionPrestamosPage = lazyPage(() => import('@/pages/ludoteca/GestionPrestamosPage'), 'GestionPrestamosPage')

// Panel directiva y administración
const SolicitudesPage = lazyPage(() => import('@/pages/directiva/SolicitudesPage'), 'SolicitudesPage')
const GestionSociosPage = lazyPage(() => import('@/pages/directiva/GestionSociosPage'), 'GestionSociosPage')
const ConfiguracionPage = lazyPage(() => import('@/pages/directiva/ConfiguracionPage'), 'ConfiguracionPage')
const LlavesPage = lazyPage(() => import('@/pages/directiva/LlavesPage'), 'LlavesPage')
const CuotasPage = lazyPage(() => import('@/pages/directiva/CuotasPage'), 'CuotasPage')
const AnunciosPage = lazyPage(() => import('@/pages/directiva/AnunciosPage'), 'AnunciosPage')
const AdminUsuariosPage = lazyPage(() => import('@/pages/admin/AdminUsuariosPage'), 'AdminUsuariosPage')

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* ── Rutas públicas ──────────────────────────────────────────── */}
      <Route path="/" element={<HomePage />} />
      <Route path="/club" element={<ClubPage />} />
      <Route path="/socio" element={<SocioPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroPage />} />
      <Route path="/rgpd" element={<RgpdPage />} />
      <Route path="/recuperar-password" element={<RecuperarPasswordPage />} />

      {/* ── Área de socio (cualquier autenticado) ───────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AreaLayout />}>
          <Route path="/area" element={<DashboardPage />} />
          <Route path="/area/perfil" element={<PerfilPage />} />
          <Route path="/area/prestamos" element={<PrestamosPage />} />
          <Route path="/area/ludoteca" element={<LudotecaPage />} />
          <Route path="/area/visita" element={<RegistroVisitaPage />} />
        </Route>
      </Route>

      {/* ── Panel directiva ─────────────────────────────────────────── */}
      <Route
        element={
          <RoleBasedRoute
            allowedRoles={['administrador', 'presidente', 'secretario', 'tesorero', 'vocal']}
          />
        }
      >
        <Route element={<AreaLayout />}>
          <Route path="/directiva" element={<Navigate to="/directiva/solicitudes" replace />} />
          <Route path="/directiva/socios" element={<GestionSociosPage />} />
          <Route path="/directiva/solicitudes" element={<SolicitudesPage />} />
          <Route path="/directiva/llaves" element={<LlavesPage />} />
          <Route path="/directiva/anuncios" element={<AnunciosPage />} />
          {/* Cuotas y configuración: solo directiva (el backend da 403 a vocales) */}
          <Route
            element={
              <RoleBasedRoute
                allowedRoles={['administrador', 'presidente', 'secretario', 'tesorero']}
                redirectTo="/directiva"
              />
            }
          >
            <Route path="/directiva/configuracion" element={<ConfiguracionPage />} />
            <Route path="/directiva/cuotas" element={<CuotasPage />} />
          </Route>
        </Route>
      </Route>

      {/* ── Panel ludotecario ────────────────────────────────────────── */}
      <Route
        element={
          <RoleBasedRoute
            allowedRoles={['administrador', 'presidente', 'secretario', 'tesorero', 'ludotecario']}
          />
        }
      >
        <Route element={<AreaLayout />}>
          <Route path="/ludoteca" element={<Navigate to="/ludoteca/prestamos" replace />} />
          <Route path="/ludoteca/juegos" element={<GestionJuegosPage />} />
          <Route path="/ludoteca/prestamos" element={<GestionPrestamosPage />} />
        </Route>
      </Route>

      {/* ── Panel administrador ─────────────────────────────────────── */}
      <Route
        element={
          <RoleBasedRoute allowedRoles={['administrador']} />
        }
      >
        <Route element={<AreaLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/usuarios" replace />} />
          <Route path="/admin/usuarios" element={<AdminUsuariosPage />} />
        </Route>
      </Route>

      {/* ── 404 ─────────────────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
  )
}
