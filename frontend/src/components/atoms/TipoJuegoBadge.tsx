import { Badge } from '@/components/ui/badge'
import type { TipoJuego } from '@/types/api'

// ponytail: solo se marca el libro/cómic; "juego" es lo normal y etiquetarlo en cada fila sería ruido
export function TipoJuegoBadge({ tipo }: { tipo?: TipoJuego }) {
  if (tipo !== 'libro') return null
  return <Badge variant="outline" className="font-display text-[10px] ml-1.5 align-middle">Libro/cómic</Badge>
}
