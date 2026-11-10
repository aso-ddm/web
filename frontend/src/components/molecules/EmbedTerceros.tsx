import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { decidirCookies, useDecisionCookies } from '@/lib/cookies'

// Contenido de terceros que pone cookies: no se carga hasta que se aceptan
export function EmbedTerceros({ servicio, enlace, className = '', children }: {
  servicio: string
  enlace: string // para verlo en su web sin aceptar las cookies aquí
  className?: string
  children: ReactNode
}) {
  if (useDecisionCookies() === 'aceptadas') return <>{children}</>
  return (
    <div className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-muted p-6 text-center text-foreground ${className}`}>
      <p className="text-sm max-w-md">
        {servicio} usa cookies de Google. Para verlo aquí, acepta las cookies de terceros (<Link to="/cookies" className="underline">más información</Link>).
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button size="sm" onClick={() => decidirCookies('aceptadas')}>Aceptar y mostrar</Button>
        <Button size="sm" variant="outline" asChild>
          <a href={enlace} target="_blank" rel="noopener noreferrer">Abrir en Google</a>
        </Button>
      </div>
    </div>
  )
}
