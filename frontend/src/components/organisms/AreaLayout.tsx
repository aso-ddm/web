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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import { DragonIcon } from '@/components/atoms/icons'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
}

function useSidebarItems(): NavItem[] {
  const { isDirectiva, isLudotecario, isDirectivaOVocal } = useAuthStore()

  const items: NavItem[] = [
    { label: 'Mi panel', to: '/area', icon: <LayoutDashboard className="h-4 w-4" /> },
    { label: 'Mi perfil', to: '/area/perfil', icon: <User className="h-4 w-4" /> },
    { label: 'Mis préstamos', to: '/area/prestamos', icon: <BookOpen className="h-4 w-4" /> },
    { label: 'Registrar visita', to: '/area/visita', icon: <UserCheck className="h-4 w-4" /> },
    { label: 'Llaves del club', to: '/area/llaves', icon: <Key className="h-4 w-4" /> },
  ]

  if (isDirectivaOVocal()) {
    items.push(
      { label: '──────────', to: '#', icon: <></> },
      { label: 'Gestión socios', to: '/directiva/socios', icon: <Users className="h-4 w-4" /> },
      { label: 'Solicitudes', to: '/directiva/solicitudes', icon: <ClipboardList className="h-4 w-4" /> },
    )
  }

  if (isDirectiva()) {
    items.push(
      { label: 'Configuración', to: '/directiva/configuracion', icon: <Settings className="h-4 w-4" /> },
    )
  }

  if (isLudotecario()) {
    items.push(
      { label: '──────────', to: '#', icon: <></> },
      { label: 'Gestión juegos', to: '/ludoteca/juegos', icon: <Library className="h-4 w-4" /> },
      { label: 'Préstamos', to: '/ludoteca/prestamos', icon: <Handshake className="h-4 w-4" /> },
    )
  }

  return items
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { usuario, logout } = useAuthStore()
  const navigate = useNavigate()
  const items = useSidebarItems()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <DragonIcon className="h-8 w-8 fill-primary flex-shrink-0" />
        <span className="font-display font-bold text-primary text-lg leading-tight">
          Área de socios
        </span>
      </div>

      {/* User info */}
      <div className="px-4 py-3 bg-accent/30 border-b border-border">
        <p className="font-display font-bold text-sm text-foreground">
          {usuario?.nombre} {usuario?.apellidos}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {usuario?.roles.join(', ').replace(/_/g, ' ')}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {items.map((item) =>
          item.to === '#' ? (
            <div key={item.label} className="px-4 py-1">
              <Separator className="my-1" />
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/area'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors rounded-none',
                  isActive
                    ? 'bg-primary text-primary-foreground font-display font-bold'
                    : 'text-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ),
        )}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  )
}

export function AreaLayout() {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card flex-shrink-0">
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar mobile */}
        <header className="lg:hidden flex items-center justify-between px-4 h-16 border-b border-border bg-card">
          <Link to="/area" className="flex items-center gap-2">
            <DragonIcon className="h-7 w-7 fill-primary" />
            <span className="font-display font-bold text-primary">Área de socios</span>
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

        {/* Contenido de la ruta activa */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
