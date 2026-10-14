import { z } from 'zod'
import { EstadoPago } from '@prisma/client'

export const marcarCuotaSchema = z.object({
  anio: z.coerce.number().int().min(2000).max(2100),
  mes: z.coerce.number().int().min(1).max(12),
  // null = volver a "sin revisar"
  estado: z.nativeEnum(EstadoPago).nullable(),
})

export const listarCuotasSchema = z.object({
  anio: z.coerce.number().int().min(2000).max(2100).default(() => new Date().getFullYear()),
})

export type MarcarCuotaInput = z.infer<typeof marcarCuotaSchema>
