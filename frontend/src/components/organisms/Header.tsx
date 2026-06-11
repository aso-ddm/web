import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DragonIcon, DragonTextLogo } from '@/components/atoms/icons'
import { NavLink } from '@/components/molecules/NavLink'
import { useScrollNavigation } from '@/hooks/useScrollNavigation'
import { navigationItems, memberAreaItem } from '@/config/navigation'
import { useAuthStore } from '@/store/authStore'
import { SPACING } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function Header() {
  const { handleNavigation } = useScrollNavigation()
  const { isAuthenticated, usuario, logout, getRedirectPath } = useAuthStore()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    handleNavigation('/', 'top')
  }

  const queryClient = useQueryClient()

  const handleLogout = () => {
    queryClient.clear()
    logout()
    navigate('/')
  }

  const areaPath = isAuthenticated ? getRedirectPath() : memberAreaItem.to

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/96 backdrop-blur-md shadow-sm"
          : "border-b border-transparent bg-background/60 backdrop-blur-sm"
      )}
    >
      <div className={SPACING.container}>
        <div className="flex h-20 sm:h-24 md:h-28 items-center justify-between">
          <Link to="/" onClick={handleLogoClick} className={`flex items-center ${SPACING.gapSm}`}>
            <DragonIcon className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 fill-primary flex-shrink-0" />
            <DragonTextLogo className="h-8 sm:h-10 md:h-12 w-2/3 fill-primary flex-shrink-0" />
          </Link>

          {/* Desktop Navigation */}
          <nav className={`hidden lg:flex items-center ${SPACING.gapXs}`}>
            {navigationItems.map((item) => (
              <NavLink key={item.label} to={item.to} scrollTo={item.scrollTo}>
                {item.label}
              </NavLink>
            ))}

            {isAuthenticated && usuario ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" className="ml-2 gap-1.5">
                    <span className="max-w-[120px] truncate">{usuario.nombre}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem asChild>
                    <Link to={areaPath} className="flex items-center gap-2 cursor-pointer">
                      <LayoutDashboard className="h-4 w-4" />
                      Mi área
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm" className="ml-2">
                <Link to={memberAreaItem.to}>{memberAreaItem.label}</Link>
              </Button>
            )}
          </nav>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="lg:hidden hover:text-primary">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className={`flex flex-col ${SPACING.gapSm} ${SPACING.marginTopMd} px-5 pb-6`}>
                {navigationItems.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    scrollTo={item.scrollTo}
                    className="text-xl font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {item.label}
                  </NavLink>
                ))}

                {isAuthenticated && usuario ? (
                  <>
                    <Button asChild className="mt-2">
                      <Link to={areaPath}>
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Mi área ({usuario.nombre})
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleLogout}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar sesión
                    </Button>
                  </>
                ) : (
                  <Button asChild className="mt-2">
                    <Link to={memberAreaItem.to}>{memberAreaItem.label}</Link>
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
