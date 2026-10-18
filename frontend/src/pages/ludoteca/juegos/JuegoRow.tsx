import { memo } from 'react'
import { Pencil, Trash2, MapPin, User, Users, StickyNote, Archive, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatJugadores } from '@/lib/format'
import type { Juego } from '@/types/api'
import { estadoConfig } from './constants'
import { LogsPanel } from './LogsPanel'

// memo: con cientos de juegos cargados, escribir en el buscador o abrir un diálogo no repinta todas las filas.
// Los callbacks deben ser estables (setters de useState o useCallback en la página).
export const JuegoRow = memo(function JuegoRow({
  juego,
  logsExpanded,
  puedeEliminar,
  onToggleLogs,
  onEditar,
  onRetirar,
  onReactivar,
  onEliminar,
}: {
  juego: Juego
  logsExpanded: boolean
  puedeEliminar: boolean
  onToggleLogs: (id: string) => void
  onEditar: (juego: Juego) => void
  onRetirar: (juego: Juego) => void
  onReactivar: (juego: Juego) => void
  onEliminar: (juego: Juego) => void
}) {
  const cfg = estadoConfig[juego.estado]
  return (
    <div className="border-b border-border last:border-0">
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-sm truncate" title={juego.nombre}>{juego.nombre}</p>
          {/* Celdas fijas con "—" si falta el dato: así las columnas se alinean entre juegos */}
          <div className="mt-1 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5 min-w-0" title="Ubicación">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{juego.localizacion || '—'}</span>
            </span>
            <span className="flex items-center gap-1.5 min-w-0" title="Propietario">
              <User className="h-3 w-3 shrink-0" />
              <span className="truncate">
                {juego.propietario ? `${juego.propietario.nombre} ${juego.propietario.apellidos}` : 'Club'}
              </span>
            </span>
            <span className="flex items-center gap-1.5 min-w-0" title="Nº de jugadores">
              <Users className="h-3 w-3 shrink-0" />
              <span className="truncate">{formatJugadores(juego) ?? '—'}</span>
            </span>
            <span className="flex items-center gap-1.5 min-w-0" title={juego.notas || 'Notas'}>
              <StickyNote className="h-3 w-3 shrink-0" />
              <span className="truncate">{juego.notas || '—'}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Ancho fijo: si cambiara con el estado, la rejilla de datos se movería de una fila a otra */}
          <Badge variant={cfg.variant} className="font-display text-xs w-28 justify-center">
            {cfg.label}
          </Badge>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            title="Ver historial"
            onClick={() => onToggleLogs(juego.id)}
          >
            {logsExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-primary"
            title="Editar"
            onClick={() => onEditar(juego)}
          >
            <Pencil className="h-4 w-4" />
          </Button>

          {juego.estado === 'retirado' ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-emerald-700"
              title="Reactivar juego"
              onClick={() => onReactivar(juego)}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-amber-700"
              title="Retirar juego"
              disabled={juego.estado === 'prestado'}
              onClick={() => onRetirar(juego)}
            >
              <Archive className="h-4 w-4" />
            </Button>
          )}

          {puedeEliminar && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              title="Eliminar"
              onClick={() => onEliminar(juego)}
              disabled={juego.estado === 'prestado'}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {logsExpanded && <LogsPanel juego={juego} />}
    </div>
  )
})
