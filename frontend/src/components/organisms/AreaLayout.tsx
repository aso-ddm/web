import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import {
  User,
  LogOut,
  LayoutDashboard,
  BookOpen,
  Key,
  Users,
  ClipboardList,
  Settings,
  Library,
  Handshake,
  UserCheck,
  Menu,
  CalendarDays,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { DragonIcon } from '@/components/atoms/icons'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

/* ── Tipos ───────────────────────────────────────────────────────── */
type NavItem    = { type: 'item';    label: string; to: string; icon: React.ReactNode }
type NavSection = { type: 'section'; label: string }
type NavEntry   = NavItem | NavSection

/* ── Hook de items ───────────────────────────────────────────────── */
function useSidebarItems(): NavEntry[] {
  const { isDirectiva, isLudotecario, isDirectivaOVocal } = useAuthStore()

  const items: NavEntry[] = [
    { type: 'section', label: 'Mi área' },
    { type: 'item', label: 'Mi panel',         to: '/area',          icon: <LayoutDashboard className="h-4 w-4" /> },
    { type: 'item', label: 'Mi perfil',        to: '/area/perfil',   icon: <User            className="h-4 w-4" /> },
    { type: 'item', label: 'Mis préstamos',    to: '/area/prestamos', icon: <BookOpen        className="h-4 w-4" /> },
    { type: 'item', label: 'Ludoteca',         to: '/area/ludoteca',  icon: <Library         className="h-4 w-4" /> },
    { type: 'item', label: 'Registrar visita', to: '/area/visita',    icon: <UserCheck       className="h-4 w-4" /> },
  ]

  if (isDirectivaOVocal()) {
    items.push(
      { type: 'section', label: 'Directiva' },
      { type: 'item', label: 'Gestión socios', to: '/directiva/socios',       icon: <Users        className="h-4 w-4" /> },
      { type: 'item', label: 'Solicitudes',    to: '/directiva/solicitudes',  icon: <ClipboardList className="h-4 w-4" /> },
      { type: 'item', label: 'Llaves',         to: '/directiva/llaves',       icon: <Key           className="h-4 w-4" /> },
      { type: 'item', label: 'Invitados',      to: '/directiva/visitas',      icon: <CalendarDays  className="h-4 w-4" /> },
    )
  }

  if (isDirectiva()) {
    items.push(
      { type: 'item', label: 'Configuración', to: '/directiva/configuracion', icon: <Settings className="h-4 w-4" /> },
    )
  }

  if (isLudotecario()) {
    items.push(
      { type: 'section', label: 'Ludoteca' },
      { type: 'item', label: 'Gestión juegos', to: '/ludoteca/juegos',    icon: <Library  className="h-4 w-4" /> },
      { type: 'item', label: 'Préstamos',      to: '/ludoteca/prestamos', icon: <Handshake className="h-4 w-4" /> },
    )
  }

  return items
}

/* ── Sidebar ─────────────────────────────────────────────────────── */
function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { usuario, logout } = useAuthStore()
  const navigate = useNavigate()
  const items = useSidebarItems()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // Iniciales del usuario para el avatar
  const initials = [usuario?.nombre?.[0], usuario?.apellidos?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase()

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <DragonIcon className="h-9 w-9 fill-primary flex-shrink-0" />
        <div className="min-w-0">
          <span className="font-display font-bold text-primary text-base leading-tight block">
            Dragón de Madera
          </span>
          <span className="text-xs text-muted-foreground">Área de socios</span>
        </div>
      </div>

      {/* Avatar + datos de usuario */}
      <div className="px-4 py-3 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 ring-1 ring-primary/20">
            <span className="font-display font-bold text-primary text-sm select-none">
              {initials || <User className="h-4 w-4 text-primary" />}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-sm text-foreground truncate leading-tight">
              {usuario?.nombre} {usuario?.apellidos}
            </p>
            <p className="text-xs text-muted-foreground capitalize truncate mt-0.5">
              {usuario?.roles?.[0]?.replace(/_/g, ' ') ?? 'Socio'}
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {items.map((entry, idx) =>
          entry.type === 'section' ? (
            <div key={`section-${idx}`} className="px-5 pt-4 pb-1.5">
              <p className="text-[10px] font-display font-bold uppercase tracking-widest text-muted-foreground/55 select-none">
                {entry.label}
              </p>
            </div>
          ) : (
            <NavLink
              key={entry.to}
              to={entry.to}
              end={entry.to === '/area'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 mx-2 px-3 py-2.5 text-sm rounded-md transition-all duration-150',
                  isActive
                    ? 'bg-primary text-primary-foreground font-display font-bold shadow-sm'
                    : 'text-foreground/75 hover:bg-accent hover:text-foreground',
                )
              }
            >
              {entry.icon}
              {entry.label}
            </NavLink>
          ),
        )}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}

/* ── Layout principal ────────────────────────────────────────────── */
export function AreaLayout() {
  return (
    <div className="min-h-screen flex bg-muted/20">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card flex-shrink-0">
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-border bg-card sticky top-0 z-40">
          <Link to="/area" className="flex items-center gap-2">
            <DragonIcon className="h-7 w-7 fill-primary" />
            <span className="font-display font-bold text-primary text-sm">Área de socios</span>
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </header>

        {/* Contenido */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
