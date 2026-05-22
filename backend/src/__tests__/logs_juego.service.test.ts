import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LogsJuegoService } from '../services/logs_juego.service'
import { createPrismaMock } from './helpers/prisma.mock'
import type { PrismaClient } from '@prisma/client'

let prisma: PrismaClient
let service: LogsJuegoService

const filtros = { page: 1, limit: 20 }

const logBase = {
  id: 'l1',
  juego_id: 'g1',
  tipo: 'nota_manual' as const,
  texto: 'nota de prueba',
  usuario_id: 'u1',
  created_at: new Date(),
}

beforeEach(() => {
  prisma = createPrismaMock()
  vi.clearAllMocks()
  service = new LogsJuegoService(prisma)
})

describe('LogsJuegoService.getAll', () => {
  it('devuelve paginación con logs de todos los juegos', async () => {
    ;(prisma.logJuego.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([logBase])
    ;(prisma.logJuego.count as ReturnType<typeof vi.fn>).mockResolvedValue(1)

    const result = await service.getAll(filtros)

    expect(result.data).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(result.totalPages).toBe(1)
    expect(prisma.logJuego.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 20 }),
    )
  })

  it('calcula skip según página', async () => {
    ;(prisma.logJuego.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])
    ;(prisma.logJuego.count as ReturnType<typeof vi.fn>).mockResolvedValue(0)

    await service.getAll({ page: 3, limit: 10 })

    expect(prisma.logJuego.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 10 }),
    )
  })
})

describe('LogsJuegoService.getByJuego', () => {
  it('filtra por juego_id', async () => {
    ;(prisma.logJuego.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([logBase])
    ;(prisma.logJuego.count as ReturnType<typeof vi.fn>).mockResolvedValue(1)

    const result = await service.getByJuego('g1', filtros)

    expect(result.data).toHaveLength(1)
    expect(prisma.logJuego.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { juego_id: 'g1' } }),
    )
    expect(prisma.logJuego.count).toHaveBeenCalledWith({ where: { juego_id: 'g1' } })
  })
})

describe('LogsJuegoService.crearManual', () => {
  it('juego no existe → throws', async () => {
    ;(prisma.juego.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await expect(service.crearManual('g1', 'u1', 'nota')).rejects.toThrow('Juego no encontrado')
    expect(prisma.logJuego.create).not.toHaveBeenCalled()
  })

  it('éxito → crea log con tipo nota_manual', async () => {
    ;(prisma.juego.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'g1', nombre: 'Catan' })
    ;(prisma.logJuego.create as ReturnType<typeof vi.fn>).mockResolvedValue(logBase)

    await service.crearManual('g1', 'u1', 'nota de prueba')

    expect(prisma.logJuego.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          juego_id: 'g1',
          tipo: 'nota_manual',
          texto: 'nota de prueba',
          usuario_id: 'u1',
        }),
      }),
    )
  })
})

describe('LogsJuegoService.crearSistema', () => {
  it('crea log sin comprobar existencia del juego', async () => {
    ;(prisma.logJuego.create as ReturnType<typeof vi.fn>).mockResolvedValue(logBase)

    await service.crearSistema('g1', 'donado', 'Catan donado al Dragón', 'staff1')

    expect(prisma.juego.findUnique).not.toHaveBeenCalled()
    expect(prisma.logJuego.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          juego_id: 'g1',
          tipo: 'donado',
          texto: 'Catan donado al Dragón',
          usuario_id: 'staff1',
        }),
      }),
    )
  })

  it('usuario_id null cuando no se provee', async () => {
    ;(prisma.logJuego.create as ReturnType<typeof vi.fn>).mockResolvedValue(logBase)

    await service.crearSistema('g1', 'retirado', 'Catan retirado')

    expect(prisma.logJuego.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ usuario_id: null }),
      }),
    )
  })
})
