import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { decidirCookies, useDecisionCookies } from '@/lib/cookies'

// Aceptar y rechazar con el mismo peso (guía de cookies de la AEPD). Se puede cambiar luego en /cookies
export function CookieBanner() {
  if (useDecisionCookies()) return null
  return (
    <div role="region" aria-label="Aviso de cookies" className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur p-4 shadow-lg">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-sm leading-relaxed flex-1">
          Usamos almacenamiento técnico para que la web funcione. El mapa y el calendario de Google ponen sus propias
          cookies y solo se cargan si las aceptas.{' '}
          <Link to="/cookies" className="text-primary underline">Más información</Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" onClick={() => decidirCookies('rechazadas')}>Rechazar</Button>
          <Button variant="outline" onClick={() => decidirCookies('aceptadas')}>Aceptar</Button>
        </div>
      </div>
    </div>
  )
}
