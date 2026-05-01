import { vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'

const makeModel = () => ({
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  delete: vi.fn(),
  count: vi.fn(),
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
    relacionSocio: makeModel(),
  }

  mock.$transaction = vi.fn().mockImplementation((ops: unknown) => {
    if (typeof ops === 'function') return ops(mock)
    return Promise.all(ops as Promise<unknown>[])
  })

  return mock as unknown as PrismaClient
}
