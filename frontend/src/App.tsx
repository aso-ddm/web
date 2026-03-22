import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { AppRoutes } from '@/config/routes'
import { scrollToElement, scrollToTop } from '@/lib/scroll'

function ScrollToHashElement() {
  const { pathname, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const elementId = hash.replace('#', '')
      setTimeout(() => scrollToElement(elementId), 100)
    } else {
      scrollToTop(false)
    }
  }, [pathname, hash])

  return null
}

export default function App() {
  return (
    <>
      <ScrollToHashElement />
      <AppRoutes />
    </>
  )
}
