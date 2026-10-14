import type { SocioAdmin } from '@/services/api/socios'

export type DestinoJuego = 'se_lo_lleva' | 'club'

/**
 * En la baja: para cada juego que el socio cedió al club, ¿se lo lleva o se queda en el club?
 * El backend rechaza la baja si falta alguna decisión, y "se lo lleva" con un juego prestado a otro socio.
 */
export function JuegosCedidosBaja({ juegos, decisiones, onChange }: {
  juegos: NonNullable<SocioAdmin['juegos_en_propiedad']>
  decisiones: Record<string, DestinoJuego>
  onChange: (juegoId: string, destino: DestinoJuego) => void
}) {
  if (!juegos.length) return null
  return (
    <div className="space-y-2 pt-2 text-foreground">
      <p className="text-sm font-display font-bold">Juegos que cedió al club</p>
      {juegos.map((j) => (
        <fieldset key={j.id} className="rounded-md border border-border p-2">
          <legend className="px-1 text-sm font-medium">{j.nombre}</legend>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <label className="flex items-center gap-1.5">
              <input
                type="radio"
                name={`juego-${j.id}`}
                checked={decisiones[j.id] === 'se_lo_lleva'}
                onChange={() => onChange(j.id, 'se_lo_lleva')}
                disabled={j.estado === 'prestado'}
              />
              Se lo lleva {j.estado === 'prestado' && <span className="text-xs text-muted-foreground">(ahora está prestado)</span>}
            </label>
            <label className="flex items-center gap-1.5">
              <input type="radio" name={`juego-${j.id}`} checked={decisiones[j.id] === 'club'} onChange={() => onChange(j.id, 'club')} />
              Se queda en el club
            </label>
          </div>
        </fieldset>
      ))}
    </div>
  )
}
