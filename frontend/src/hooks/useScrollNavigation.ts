import { useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { scrollToTop, scrollToElement, updateUrlHash } from '@/lib/scroll'

export function useScrollNavigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname

  const handleNavigation = useCallback(
    (to: string, scrollTo?: 'top' | string) => {
      const isCurrentPath = pathname === to || (to === '/' && pathname === '/')

      if (scrollTo === 'top') {
        if (isCurrentPath) {
          updateUrlHash(to)
          scrollToTop()
        } else {
          navigate(to)
          setTimeout(() => scrollToTop(), 100)
        }
        return
      }

      if (scrollTo) {
        const targetPath = to.split('#')[0] || '/'
        const isOnTargetPath = pathname === targetPath

        if (isOnTargetPath) {
          updateUrlHash(`${targetPath}#${scrollTo}`)
          scrollToElement(scrollTo)
        } else {
          navigate(`${targetPath}#${scrollTo}`)
          setTimeout(() => scrollToElement(scrollTo), 100)
        }
        return
      }

      navigate(to)
    },
    [navigate, pathname]
  )

  return { handleNavigation, pathname }
}
