import type { ReactNode, MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { useScrollNavigation } from '@/hooks/useScrollNavigation'
import { cn } from '@/lib/utils'
import { SPACING } from '@/lib/constants'

interface NavLinkProps {
  to: string
  children: ReactNode
  scrollTo?: 'top' | string
  className?: string
  onClick?: () => void
}

export function NavLink({ to, children, scrollTo, className, onClick }: NavLinkProps) {
  const { handleNavigation } = useScrollNavigation()

  // El href lleva el ancla para que Ctrl/Cmd+clic abra la pestaña nueva en la sección
  const href = scrollTo && scrollTo !== 'top' ? `${to.split('#')[0] || '/'}#${scrollTo}` : to

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Pestaña o ventana nueva: que actúe el navegador
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    if (scrollTo) {
      e.preventDefault()
      handleNavigation(to, scrollTo)
    }
    onClick?.()
  }

  return (
    <Link
      to={href}
      onClick={handleClick}
      className={cn(
        `text-lg xl:text-xl font-medium text-foreground hover:text-primary transition-colors ${SPACING.padXSm} py-2`,
        className
      )}
    >
      {children}
    </Link>
  )
}
