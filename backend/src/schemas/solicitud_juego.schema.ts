import { z } from 'zod'
import { EstadoSolicitudJuego } from '@prisma/client'
import { paginacion } from '../lib/paginacion'

export const crearSolicitudJuegoSchema = z.object({
  nombre: z.string().min(1).max(200),
  notas:  z.string().max(1000).optional(),
})

export const rechazarSolicitudJuegoSchema = z.object({
  motivo_rechazo: z.string().max(500).optional(),
})

export const filtrosSolicitudesJuegoSchema = z.object({
  estado: z.nativeEnum(EstadoSolicitudJuego).optional(),
  ...paginacion(20, 100),
})

export type CrearSolicitudJuegoInput      = z.infer<typeof crearSolicitudJuegoSchema>
export type RechazarSolicitudJuegoInput   = z.infer<typeof rechazarSolicitudJuegoSchema>
export type FiltrosSolicitudesJuegoInput  = z.infer<typeof filtrosSolicitudesJuegoSchema>
