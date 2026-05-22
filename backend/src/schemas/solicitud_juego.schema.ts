import { z } from 'zod'

export const crearSolicitudJuegoSchema = z.object({
  nombre: z.string().min(1).max(200),
  notas:  z.string().max(1000).optional(),
})

export const rechazarSolicitudJuegoSchema = z.object({
  motivo_rechazo: z.string().max(500).optional(),
})

export const filtrosSolicitudesJuegoSchema = z.object({
  estado: z.enum(['pendiente', 'aprobada', 'rechazada']).optional(),
  page:   z.coerce.number().int().positive().default(1),
  limit:  z.coerce.number().int().positive().max(100).default(20),
})

export type CrearSolicitudJuegoInput      = z.infer<typeof crearSolicitudJuegoSchema>
export type RechazarSolicitudJuegoInput   = z.infer<typeof rechazarSolicitudJuegoSchema>
export type FiltrosSolicitudesJuegoInput  = z.infer<typeof filtrosSolicitudesJuegoSchema>
