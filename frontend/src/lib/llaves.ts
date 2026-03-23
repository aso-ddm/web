import type { Usuario } from '@/types/api'

export type EstadoLlaves =
  | { tipo: 'sin_llave' }
  | { tipo: 'pendiente'; fecha: string }
  | { tipo: 'titular'; fecha: string; aprobadoPor?: string }

type SocioLlaves = Pick<
  Usuario,
  'tiene_llaves' | 'fecha_solicitud_llaves' | 'fecha_aprobacion_llaves'
> & {
  aprobado_llaves_por?: { nombre: string; apellidos: string } | null
}

export function getEstadoLlaves(socio: SocioLlaves): EstadoLlaves {
  if (socio.tiene_llaves && socio.fecha_aprobacion_llaves) {
    const aprobadoPor = socio.aprobado_llaves_por
      ? `${socio.aprobado_llaves_por.nombre} ${socio.aprobado_llaves_por.apellidos}`
      : undefined
    return { tipo: 'titular', fecha: socio.fecha_aprobacion_llaves, aprobadoPor }
  }

  if (socio.fecha_solicitud_llaves && !socio.tiene_llaves) {
    return { tipo: 'pendiente', fecha: socio.fecha_solicitud_llaves }
  }

  return { tipo: 'sin_llave' }
}
