import type { Prisma } from '@prisma/client'

// Claves numéricas de Configuracion que usa el backend: un typo en la clave es error de compilación
export type ClaveNumero =
  | 'max_prestamos_activos'
  | 'dias_prestamo'
  | 'dias_renovacion'
  | 'max_renovaciones'
  | 'visitas_gratuitas'
  | 'precio_visita_pago'

/** Valor numérico de configuración; `fallback` si falta o no es un número. Vale con el cliente o una transacción. */
export async function configNumero(db: Prisma.TransactionClient, clave: ClaveNumero, fallback: number) {
  const config = await db.configuracion.findUnique({ where: { clave } })
  const n = config ? Number(config.valor) : NaN
  return Number.isNaN(n) ? fallback : n
}
