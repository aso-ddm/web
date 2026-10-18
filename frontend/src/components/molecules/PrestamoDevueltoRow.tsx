import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/format'
import type { Prestamo } from '@/types/api'

const DIA_MS = 1000 * 60 * 60 * 24

/** Fila del historial de préstamos (devueltos). conSocio: quién se lo llevó (gestión de la ludoteca). */
export function PrestamoDevueltoRow({ prestamo: p, conSocio = false }: { prestamo: Prestamo; conSocio?: boolean }) {
  // fecha_limite es el final del día (Madrid): cualquier devolución posterior ya es otro día
  const retraso = p.fecha_devolucion
    ? Math.ceil((new Date(p.fecha_devolucion).getTime() - new Date(p.fecha_limite).getTime()) / DIA_MS)
    : 0

  return (
    <div className="py-2.5 border-b border-border last:border-0 flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-sm">{p.juego?.nombre ?? '—'}</p>
        {conSocio && (
          <p className="text-xs text-muted-foreground truncate">
            {p.socio ? `${p.socio.nombre} ${p.socio.apellidos}${p.socio.apodo ? ` (${p.socio.apodo})` : ''} · ${p.socio.email}` : 'Socio desconocido'}
          </p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
          <span>Prestado: {formatDate(p.fecha_prestamo)}</span>
          <span>Límite: {formatDate(p.fecha_limite)}</span>
          <span className={retraso > 0 ? 'text-destructive font-medium' : ''}>
            Devuelto: {formatDate(p.fecha_devolucion)}{retraso > 0 && ` (${retraso}d tarde)`}
          </span>
          <span>Renovaciones: {p.renovaciones}</span>
        </div>
        {p.notas && <p className="text-xs text-muted-foreground italic mt-0.5">"{p.notas}"</p>}
      </div>
      <Badge variant={retraso > 0 ? 'destructive' : 'outline'} className="font-display text-xs flex-shrink-0">
        {retraso > 0 ? 'Con retraso' : 'Devuelto'}
      </Badge>
    </div>
  )
}
