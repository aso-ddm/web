import { ROL_LABELS } from '@/lib/roles'
import type { Rol } from '@/types/api'

export function RolBadge({ rol }: { rol: Rol }) {
  const colors: Record<Rol, string> = {
    administrador: 'bg-destructive text-destructive-foreground',
    presidente: 'bg-primary text-primary-foreground',
    secretario: 'bg-primary/80 text-primary-foreground',
    tesorero: 'bg-primary/70 text-primary-foreground',
    vocal: 'bg-secondary/20 text-secondary-foreground',
    ludotecario: 'bg-accent text-accent-foreground',
    socio_basico: 'bg-muted text-muted-foreground',
  }
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-display ${colors[rol]}`}>
      {ROL_LABELS[rol]}
    </span>
  )
}
