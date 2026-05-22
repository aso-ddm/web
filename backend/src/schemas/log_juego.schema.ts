import { z } from 'zod'

export const crearLogManualSchema = z.object({
  texto: z.string().min(1).max(500),
})

export const filtrosLogsSchema = z.object({
  page:  z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
})

export type CrearLogManualInput = z.infer<typeof crearLogManualSchema>
export type FiltrosLogsInput    = z.infer<typeof filtrosLogsSchema>
