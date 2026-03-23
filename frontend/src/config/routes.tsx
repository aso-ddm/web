import { Routes, Route, Navigate } from 'react-router-dom'

// Páginas públicas
import { HomePage } from '@/pages/HomePage'
import { ClubPage } from '@/pages/ClubPage'
import { SocioPage } from '@/pages/SocioPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { LoginPage } from '@/pages/LoginPage'
import { RegistroPage } from '@/pages/RegistroPage'

// Layouts y guards
import { AreaLayout } from '@/components/organisms/AreaLayout'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { RoleBasedRoute } from '@/components/auth/RoleBasedRoute'

// Área de socio — Sprint 3
import { DashboardPage } from '@/pages/area/DashboardPage'
import { PerfilPage } from '@/pages/area/PerfilPage'
import { PrestamosPage } from '@/pages/area/PrestamosPage'

// Panel ludotecario — Sprint 4
import { GestionJuegosPage } from '@/pages/ludoteca/GestionJuegosPage'
import { GestionPrestamosPage } from '@/pages/ludoteca/GestionPrestamosPage'

// Panel directiva — Sprint 5
import { SolicitudesPage } from '@/pages/directiva/SolicitudesPage'
import { GestionSociosPage } from '@/pages/directiva/GestionSociosPage'
import { ConfiguracionPage } from '@/pages/directiva/ConfiguracionPage'
import { LlavesPage } from '@/pages/directiva/LlavesPage'

// Visitas — Sprint 6
import { RegistroVisitaPage } from '@/pages/area/RegistroVisitaPage'

// Placeholder para sprints futuros
function ComingSoon({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
      <p className="text-5xl">🐉</p>
      <h2 className="font-display font-bold text-2xl text-primary">{label}</h2>
      <p className="text-muted-foreground">Esta sección se implementa en el próximo sprint</p>
    </div>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      {/* ── Rutas públicas ──────────────────────────────────────────── */}
      <Route path="/" element={<HomePage />} />
      <Route path="/club" element={<ClubPage />} />
      <Route path="/socio" element={<SocioPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroPage />} />

      {/* ── Área de socio (cualquier autenticado) ───────────────────── */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AreaLayout />}>
          <Route path="/area" element={<DashboardPage />} />
          <Route path="/area/perfil" element={<PerfilPage />} />
          <Route path="/area/prestamos" element={<PrestamosPage />} />
          <Route path="/area/visita" element={<RegistroVisitaPage />} />
          <Route path="/area/llaves" element={<ComingSoon label="Solicitar llaves" />} />
        </Route>
      </Route>

      {/* ── Panel directiva ─────────────────────────────────────────── */}
      <Route
        element={
          <RoleBasedRoute
            allowedRoles={['presidente', 'secretario', 'tesorero', 'vocal']}
          />
        }
      >
        <Route element={<AreaLayout />}>
          <Route path="/directiva" element={<Navigate to="/directiva/solicitudes" replace />} />
          <Route path="/directiva/socios" element={<GestionSociosPage />} />
          <Route path="/directiva/solicitudes" element={<SolicitudesPage />} />
          <Route path="/directiva/llaves" element={<LlavesPage />} />
          <Route path="/directiva/configuracion" element={<ConfiguracionPage />} />
        </Route>
      </Route>

      {/* ── Panel ludotecario ────────────────────────────────────────── */}
      <Route
        element={
          <RoleBasedRoute
            allowedRoles={['presidente', 'secretario', 'tesorero', 'ludotecario']}
          />
        }
      >
        <Route element={<AreaLayout />}>
          <Route path="/ludoteca" element={<Navigate to="/ludoteca/prestamos" replace />} />
          <Route path="/ludoteca/juegos" element={<GestionJuegosPage />} />
          <Route path="/ludoteca/prestamos" element={<GestionPrestamosPage />} />
        </Route>
      </Route>

      {/* ── 404 ─────────────────────────────────────────────────────── */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
