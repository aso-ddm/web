import { z } from 'zod'
import { paginacion } from '../lib/paginacion'

export const crearLogManualSchema = z.object({
  texto: z.string().min(1).max(500),
})

export const filtrosLogsSchema = z.object({
  ...paginacion(20, 100),
})

export type FiltrosLogsInput    = z.infer<typeof filtrosLogsSchema>
