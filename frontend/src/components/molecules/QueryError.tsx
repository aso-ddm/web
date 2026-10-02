import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** Para listas cuya carga falló: que no parezca "no tienes nada" (el detalle ya sale en el toast global) */
export function QueryError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center gap-3 text-muted-foreground">
      <AlertTriangle className="h-8 w-8 text-destructive/60" />
      <p className="text-sm">No se ha podido cargar. Comprueba tu conexión.</p>
      <Button variant="outline" size="sm" onClick={onRetry} className="font-display">Reintentar</Button>
    </div>
  )
}
