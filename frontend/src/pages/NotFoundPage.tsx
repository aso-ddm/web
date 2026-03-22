import { Link } from 'react-router-dom'
import { Header, Footer } from '@/components/organisms'
import { Button } from '@/components/ui/button'
import { SEOHead } from '@/components/SEOHead'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <SEOHead title="Página no encontrada" noindex />
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold">404</h1>
          <p className="text-xl text-muted-foreground">Página no encontrada</p>
          <Button asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  )
}
