import { vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'

const makeModel = () => ({
  findUnique: vi.fn(),
  findUniqueOrThrow: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn().mockResolvedValue([]), // por defecto sin filas, como una tabla vacía
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  deleteMany: vi.fn(),
  createMany: vi.fn(),
  delete: vi.fn(),
  count: vi.fn().mockResolvedValue(0),
  upsert: vi.fn(),
})

export function createPrismaMock() {
  const mock: Record<string, unknown> = {
    usuario: makeModel(),
    solicitudGrupal: makeModel(),
    juego: makeModel(),
    prestamo: makeModel(),
    visita: makeModel(),
    configuracion: makeModel(),
    logJuego: makeModel(),
    solicitudJuego: makeModel(),
    pagoCuota: makeModel(),
    telegramLog: makeModel(),
    historialEstadoSocio: makeModel(),
  }

  mock.$queryRaw = vi.fn()
  mock.$transaction = vi.fn().mockImplementation((ops: unknown) => {
    if (typeof ops === 'function') return ops(mock)
    return Promise.all(ops as Promise<unknown>[])
  })

  return mock as unknown as PrismaClient
}
