import { Loader2 } from 'lucide-react'

/** Fallback de Suspense mientras se descarga el código de una página */
export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]" role="status" aria-label="Cargando">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  )
}
