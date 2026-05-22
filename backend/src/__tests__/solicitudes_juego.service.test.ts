import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SolicitudesJuegoService } from '../services/solicitudes_juego.service'
import { createPrismaMock } from './helpers/prisma.mock'
import type { PrismaClient } from '@prisma/client'

let prisma: PrismaClient
let service: SolicitudesJuegoService

const filtros = { page: 1, limit: 20 }

const solicitudPendiente = {
  id: 's1',
  socio_id: 'u1',
  nombre: 'Wingspan',
  notas: null,
  estado: 'pendiente' as const,
  motivo_rechazo: null,
  juego_id: null,
  created_at: new Date(),
  updated_at: new Date(),
}

beforeEach(() => {
  prisma = createPrismaMock()
  vi.clearAllMocks()
  service = new SolicitudesJuegoService(prisma)
})

describe('SolicitudesJuegoService.getAll', () => {
  it('sin filtro de estado devuelve todos', async () => {
    ;(prisma.solicitudJuego.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([solicitudPendiente])
    ;(prisma.solicitudJuego.count as ReturnType<typeof vi.fn>).mockResolvedValue(1)

    const result = await service.getAll(filtros)

    expect(result.data).toHaveLength(1)
    expect(result.total).toBe(1)
    expect(prisma.solicitudJuego.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    )
  })

  it('con estado filtra correctamente', async () => {
    ;(prisma.solicitudJuego.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])
    ;(prisma.solicitudJuego.count as ReturnType<typeof vi.fn>).mockResolvedValue(0)

    await service.getAll({ ...filtros, estado: 'pendiente' })

    expect(prisma.solicitudJuego.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { estado: 'pendiente' } }),
    )
  })
})

describe('SolicitudesJuegoService.getMias', () => {
  it('filtra por socio_id', async () => {
    ;(prisma.solicitudJuego.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([solicitudPendiente])
    ;(prisma.solicitudJuego.count as ReturnType<typeof vi.fn>).mockResolvedValue(1)

    await service.getMias('u1', filtros)

    expect(prisma.solicitudJuego.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ socio_id: 'u1' }) }),
    )
  })
})

describe('SolicitudesJuegoService.crear', () => {
  it('crea solicitud con estado pendiente por defecto', async () => {
    ;(prisma.solicitudJuego.create as ReturnType<typeof vi.fn>).mockResolvedValue(solicitudPendiente)

    await service.crear('u1', { nombre: 'Wingspan' })

    expect(prisma.solicitudJuego.create).toHaveBeenCalledWith({
      data: { socio_id: 'u1', nombre: 'Wingspan' },
    })
  })
})

describe('SolicitudesJuegoService.aprobar', () => {
  it('solicitud no encontrada → throws', async () => {
    ;(prisma.solicitudJuego.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await expect(service.aprobar('s1', 'staff1')).rejects.toThrow('Solicitud no encontrada')
  })

  it('solicitud ya procesada → throws', async () => {
    ;(prisma.solicitudJuego.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...solicitudPendiente,
      estado: 'aprobada',
    })

    await expect(service.aprobar('s1', 'staff1')).rejects.toThrow('La solicitud ya fue procesada')
  })

  it('éxito → transacción crea juego + log + actualiza solicitud', async () => {
    ;(prisma.solicitudJuego.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(solicitudPendiente)
    const juegoCreado = { id: 'g99', nombre: 'Wingspan' }
    const txMock = {
      juego: { create: vi.fn().mockResolvedValue(juegoCreado) },
      logJuego: { create: vi.fn().mockResolvedValue({}) },
      solicitudJuego: {
        update: vi.fn().mockResolvedValue({ ...solicitudPendiente, estado: 'aprobada', juego_id: 'g99' }),
      },
    }
    ;(prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
      (fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock),
    )

    const result = await service.aprobar('s1', 'staff1')

    expect(txMock.juego.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ nombre: 'Wingspan', propietario_id: 'u1' }),
      }),
    )
    expect(txMock.logJuego.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          juego_id: 'g99',
          tipo: 'donado',
          usuario_id: 'staff1',
        }),
      }),
    )
    expect(txMock.solicitudJuego.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 's1' },
        data: expect.objectContaining({ estado: 'aprobada', juego_id: 'g99' }),
      }),
    )
    expect(result).toMatchObject({ estado: 'aprobada' })
  })
})

describe('SolicitudesJuegoService.rechazar', () => {
  it('solicitud no encontrada → throws', async () => {
    ;(prisma.solicitudJuego.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await expect(service.rechazar('s1', {})).rejects.toThrow('Solicitud no encontrada')
  })

  it('solicitud ya procesada → throws', async () => {
    ;(prisma.solicitudJuego.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...solicitudPendiente,
      estado: 'rechazada',
    })

    await expect(service.rechazar('s1', {})).rejects.toThrow('La solicitud ya fue procesada')
  })

  it('éxito sin motivo → actualiza a rechazada con motivo null', async () => {
    ;(prisma.solicitudJuego.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(solicitudPendiente)
    ;(prisma.solicitudJuego.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...solicitudPendiente,
      estado: 'rechazada',
      motivo_rechazo: null,
    })

    await service.rechazar('s1', {})

    expect(prisma.solicitudJuego.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estado: 'rechazada', motivo_rechazo: null }),
      }),
    )
  })

  it('éxito con motivo → guarda motivo_rechazo', async () => {
    ;(prisma.solicitudJuego.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(solicitudPendiente)
    ;(prisma.solicitudJuego.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...solicitudPendiente,
      estado: 'rechazada',
      motivo_rechazo: 'ya existe',
    })

    await service.rechazar('s1', { motivo_rechazo: 'ya existe' })

    expect(prisma.solicitudJuego.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ motivo_rechazo: 'ya existe' }),
      }),
    )
  })
})
