import { Link } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { DragonIcon, DragonTextLogo } from '@/components/atoms/icons'
import { NavLink } from '@/components/molecules/NavLink'
import { useScrollNavigation } from '@/hooks/useScrollNavigation'
import { navigationItems } from '@/config/navigation'
import { SPACING } from '@/lib/constants'

export function Header() {
  const { handleNavigation } = useScrollNavigation()

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    handleNavigation('/', 'top')
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
          </nav>

          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className={`flex flex-col ${SPACING.gapSm} ${SPACING.marginTopMd}`}>
                {navigationItems.map((item) => (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    scrollTo={item.scrollTo}
                    className="text-xl font-medium text-card hover:text-accent transition-colors"
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
