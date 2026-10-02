import type { EstadoSocio } from '@/types/api'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

export const ESTADO_SOCIO_VARIANT: Record<EstadoSocio, BadgeVariant> = {
  activo: 'default',
  pendiente: 'secondary',
  baja: 'destructive',
}
