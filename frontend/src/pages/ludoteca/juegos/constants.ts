import type { EstadoJuego } from '@/types/api'

export const estadoConfig: Record<EstadoJuego, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  en_estanteria: { label: 'En estantería', variant: 'default' },
  prestado: { label: 'Prestado', variant: 'secondary' },
  retirado: { label: 'Retirado', variant: 'destructive' },
}

export const tipoLogLabel: Record<string, string> = {
  donado: '🎁 Donado',
  retirado: '📦 Retirado',
  prestamo_activo: '📤 Prestado',
  prestamo_devuelto: '📥 Devuelto',
  nota_manual: '📝 Nota',
}
