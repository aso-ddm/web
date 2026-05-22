import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PrestamosService } from '../services/prestamos.service'
import { createPrismaMock } from './helpers/prisma.mock'
import type { PrismaClient } from '@prisma/client'
import type { LogsJuegoService } from '../services/logs_juego.service'

const mockLogsService = {
  crearSistema: vi.fn().mockResolvedValue({}),
  crearManual: vi.fn().mockResolvedValue({}),
  getByJuego: vi.fn().mockResolvedValue({ data: [], total: 0 }),
} as unknown as LogsJuegoService

let prisma: PrismaClient
let service: PrestamosService

beforeEach(() => {
  prisma = createPrismaMock()
  vi.clearAllMocks()
  service = new PrestamosService(prisma, mockLogsService)
})

const juegoDisponible = { id: 'g1', nombre: 'Catan', estado: 'en_estanteria' }
const prestamoActivo = {
  id: 'p1',
  socio_id: 'u1',
  juego_id: 'g1',
  estado: 'activo',
  renovaciones: 0,
  fecha_limite: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
}

describe('PrestamosService.solicitar', () => {
  it('juego no existe → throws', async () => {
    ;(prisma.juego.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await expect(service.solicitar('u1', { juego_id: 'g1' })).rejects.toThrow('Juego no encontrado')
  })

  it('juego prestado → throws "no está disponible"', async () => {
    ;(prisma.juego.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...juegoDisponible,
      estado: 'prestado',
    })

    await expect(service.solicitar('u1', { juego_id: 'g1' })).rejects.toThrow(
      'El juego no está disponible para préstamo',
    )
  })

  it('préstamo activo existente → throws', async () => {
    ;(prisma.juego.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(juegoDisponible)
    ;(prisma.prestamo.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(prestamoActivo)

    await expect(service.solicitar('u1', { juego_id: 'g1' })).rejects.toThrow(
      'Ya tienes un préstamo activo para este juego',
    )
  })

  it('éxito → transacción: préstamo activo + juego=prestado', async () => {
    ;(prisma.juego.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(juegoDisponible)
    ;(prisma.prestamo.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(prisma.configuracion.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      clave: 'dias_prestamo',
      valor: '14',
    })
    const txMock = {
      prestamo: { create: vi.fn().mockResolvedValue(prestamoActivo) },
      juego: { update: vi.fn().mockResolvedValue({ id: 'g1', estado: 'prestado' }) },
    }
    ;(prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation((fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock))

    await service.solicitar('u1', { juego_id: 'g1', notas: 'urgente' })

    expect(txMock.prestamo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          juego_id: 'g1',
          socio_id: 'u1',
          notas: 'urgente',
          estado: 'activo',
          fecha_limite: expect.any(Date),
        }),
      }),
    )
    expect(txMock.juego.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { estado: 'prestado' } }),
    )
  })
})

describe('PrestamosService.renovar', () => {
  it('no encontrado → throws', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await expect(service.renovar('p1', 'u1')).rejects.toThrow('Préstamo no encontrado')
  })

  it('otro socio → throws permiso', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...prestamoActivo,
      socio_id: 'otro',
    })

    await expect(service.renovar('p1', 'u1')).rejects.toThrow('No tienes permiso')
  })

  it('max renovaciones alcanzado → throws', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...prestamoActivo,
      renovaciones: 2,
    })
    ;(prisma.configuracion.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      clave: 'max_renovaciones',
      valor: '2',
    })

    await expect(service.renovar('p1', 'u1')).rejects.toThrow('Máximo de renovaciones alcanzado')
  })

  it('éxito → extiende fecha_limite e incrementa renovaciones', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(prestamoActivo)
    ;(prisma.configuracion.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(prisma.prestamo.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...prestamoActivo,
      renovaciones: 1,
    })

    await service.renovar('p1', 'u1')

    expect(prisma.prestamo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fecha_limite: expect.any(Date),
          renovaciones: { increment: 1 },
        }),
      }),
    )
  })
})

describe('PrestamosService.devolucion', () => {
  it('no encontrado → throws', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await expect(service.devolucion('p1', 'u1')).rejects.toThrow('Préstamo no encontrado')
  })

  it('otro socio sin admin → throws permiso', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...prestamoActivo,
      socio_id: 'otro',
    })

    await expect(service.devolucion('p1', 'u1', false)).rejects.toThrow('No tienes permiso')
  })

  it('admin puede devolver préstamo de otro socio', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...prestamoActivo,
      socio_id: 'otro',
    })
    ;(prisma.juego.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ nombre: 'Catan' })
    const txMock = {
      prestamo: { update: vi.fn().mockResolvedValue({ ...prestamoActivo, estado: 'devuelto' }) },
      juego: { update: vi.fn().mockResolvedValue({ id: 'g1', estado: 'en_estanteria' }) },
    }
    ;(prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation((fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock))

    await service.devolucion('p1', 'admin1', true)

    expect(txMock.juego.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { estado: 'en_estanteria' } }),
    )
  })

  it('éxito socio → préstamo=devuelto + juego=en_estanteria', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(prestamoActivo)
    ;(prisma.juego.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ nombre: 'Catan' })
    const txMock = {
      prestamo: { update: vi.fn().mockResolvedValue({ ...prestamoActivo, estado: 'devuelto' }) },
      juego: { update: vi.fn().mockResolvedValue({ id: 'g1', estado: 'en_estanteria' }) },
    }
    ;(prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation((fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock))

    await service.devolucion('p1', 'u1')

    expect(txMock.prestamo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: 'devuelto',
          fecha_devolucion: expect.any(Date),
          usuario_confirmo_dev_id: 'u1',
        }),
      }),
    )
    expect(txMock.juego.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { estado: 'en_estanteria' } }),
    )
  })
})
