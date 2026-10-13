import { describe, it, expect, beforeEach, vi } from 'vitest'
import { JuegosService } from '../services/juegos.service'
import type { LogsJuegoService } from '../services/logs_juego.service'
import { createPrismaMock } from './helpers/prisma.mock'
import type { PrismaClient } from '@prisma/client'

let prisma: PrismaClient
let service: JuegosService

beforeEach(() => {
  prisma = createPrismaMock()
  vi.clearAllMocks()
  service = new JuegosService(prisma, { crearSistema: vi.fn() } as unknown as LogsJuegoService)
})

describe('JuegosService nº de jugadores', () => {
  it('crear con mínimo > máximo → 400', async () => {
    await expect(service.crear({ nombre: 'Catan', num_jugadores_min: 5, num_jugadores_max: 3 }))
      .rejects.toMatchObject({ status: 400 })
    expect(prisma.juego.create).not.toHaveBeenCalled()
  })

  it('update de solo el mínimo se compara con el máximo guardado', async () => {
    ;(prisma.juego.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'g1', num_jugadores_min: 2, num_jugadores_max: 4 })
    await expect(service.update('g1', { num_jugadores_min: 5 })).rejects.toMatchObject({ status: 400 })
    expect(prisma.juego.update).not.toHaveBeenCalled()
  })

  it('update vaciando el máximo permite cualquier mínimo', async () => {
    ;(prisma.juego.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'g1', num_jugadores_min: 2, num_jugadores_max: 4 })
    await service.update('g1', { num_jugadores_min: 5, num_jugadores_max: null })
    expect(prisma.juego.update).toHaveBeenCalled()
  })
})
