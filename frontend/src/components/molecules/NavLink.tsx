import type { ReactNode, MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { useScrollNavigation } from '@/hooks/useScrollNavigation'
import { cn } from '@/lib/utils'

interface NavLinkProps {
  to: string
  children: ReactNode
  scrollTo?: 'top' | string
  className?: string
  onClick?: () => void
}

export function NavLink({ to, children, scrollTo, className, onClick }: NavLinkProps) {
  const { handleNavigation } = useScrollNavigation()

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (scrollTo) {
      e.preventDefault()
      handleNavigation(to, scrollTo)
    }
    onClick?.()
  }

  return (
    <Link
      to={to}
      onClick={handleClick}
      className={cn(
        'text-base xl:text-lg font-medium text-card hover:text-accent transition-colors px-3 xl:px-4 py-2',
        className
      )}
    >
      {children}
    </Link>
  )
}
