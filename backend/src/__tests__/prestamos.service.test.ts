import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PrestamosService } from '../services/prestamos.service'
import { createPrismaMock } from './helpers/prisma.mock'
import type { PrismaClient } from '@prisma/client'

let prisma: PrismaClient
let service: PrestamosService

beforeEach(() => {
  prisma = createPrismaMock()
  service = new PrestamosService(prisma)
})

const juegoDisponible = { id: 'g1', titulo: 'Catan', estado: 'disponible', juego_id: 'g1' }
const prestamoPendiente = { id: 'p1', socio_id: 'u1', juego_id: 'g1', estado: 'pendiente' }
const prestamoAprobado = { id: 'p1', socio_id: 'u1', juego_id: 'g1', estado: 'aprobado' }
const prestamoActivo = { id: 'p1', socio_id: 'u1', juego_id: 'g1', estado: 'activo' }

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

  it('préstamo duplicado activo → throws', async () => {
    ;(prisma.juego.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(juegoDisponible)
    ;(prisma.prestamo.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(prestamoPendiente)

    await expect(service.solicitar('u1', { juego_id: 'g1' })).rejects.toThrow(
      'Ya tienes un préstamo activo o pendiente para este juego',
    )
  })

  it('éxito → crea préstamo con estado=pendiente', async () => {
    ;(prisma.juego.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(juegoDisponible)
    ;(prisma.prestamo.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(prisma.prestamo.create as ReturnType<typeof vi.fn>).mockResolvedValue(prestamoPendiente)

    const result = await service.solicitar('u1', { juego_id: 'g1', notas: 'urgente' })

    expect(prisma.prestamo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          juego_id: 'g1',
          socio_id: 'u1',
          notas: 'urgente',
          estado: 'pendiente',
        }),
      }),
    )
    expect(result).toMatchObject({ estado: 'pendiente' })
  })
})

describe('PrestamosService.aprobar', () => {
  it('no encontrado → throws', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await expect(service.aprobar('p1', 'admin')).rejects.toThrow('Préstamo no encontrado')
  })

  it('no está pendiente → throws', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(prestamoActivo)

    await expect(service.aprobar('p1', 'admin')).rejects.toThrow(
      'Solo se pueden aprobar préstamos en estado pendiente',
    )
  })

  it('pendiente → actualiza a aprobado con fecha y aprobadoPorId', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(prestamoPendiente)
    ;(prisma.prestamo.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...prestamoPendiente,
      estado: 'aprobado',
    })

    await service.aprobar('p1', 'admin1')

    expect(prisma.prestamo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: 'aprobado',
          fecha_aprobacion: expect.any(Date),
          usuario_aprobo_id: 'admin1',
        }),
      }),
    )
  })
})

describe('PrestamosService.activar', () => {
  it('no encontrado → throws', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await expect(service.activar('p1')).rejects.toThrow('Préstamo no encontrado')
  })

  it('no aprobado → throws', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(prestamoPendiente)

    await expect(service.activar('p1')).rejects.toThrow(
      'Solo se pueden activar préstamos en estado aprobado',
    )
  })

  it('aprobado → transacción: préstamo=activo y juego=prestado', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(prestamoAprobado)
    ;(prisma.prestamo.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...prestamoAprobado,
      estado: 'activo',
    })
    ;(prisma.juego.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'g1',
      estado: 'prestado',
    })

    await service.activar('p1')

    expect(prisma.prestamo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estado: 'activo', fecha_prestamo: expect.any(Date) }),
      }),
    )
    expect(prisma.juego.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'g1' },
        data: { estado: 'prestado' },
      }),
    )
  })
})

describe('PrestamosService.rechazar', () => {
  it('estado=activo → throws', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(prestamoActivo)

    await expect(service.rechazar('p1')).rejects.toThrow(
      'Solo se pueden rechazar préstamos pendientes o aprobados',
    )
  })

  it('pendiente → actualiza a rechazado con motivo', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(prestamoPendiente)
    ;(prisma.prestamo.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...prestamoPendiente,
      estado: 'rechazado',
    })

    await service.rechazar('p1', 'Sin stock')

    expect(prisma.prestamo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estado: 'rechazado', motivo_rechazo: 'Sin stock' }),
      }),
    )
  })

  it('sin motivo → motivo_rechazo = null', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(prestamoPendiente)
    ;(prisma.prestamo.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...prestamoPendiente,
      estado: 'rechazado',
    })

    await service.rechazar('p1')

    expect(prisma.prestamo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ motivo_rechazo: null }),
      }),
    )
  })
})

describe('PrestamosService.confirmarDevolucion', () => {
  it('no encontrado → throws', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await expect(service.confirmarDevolucion('p1', 'admin')).rejects.toThrow('Préstamo no encontrado')
  })

  it('no activo → throws', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(prestamoPendiente)

    await expect(service.confirmarDevolucion('p1', 'admin')).rejects.toThrow(
      'Solo se pueden devolver préstamos en estado activo',
    )
  })

  it('activo → transacción: préstamo=devuelto y juego=disponible', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(prestamoActivo)
    ;(prisma.prestamo.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...prestamoActivo,
      estado: 'devuelto',
    })
    ;(prisma.juego.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'g1',
      estado: 'disponible',
    })

    await service.confirmarDevolucion('p1', 'admin1')

    expect(prisma.prestamo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: 'devuelto',
          fecha_devolucion: expect.any(Date),
          usuario_confirmo_dev_id: 'admin1',
        }),
      }),
    )
    expect(prisma.juego.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'g1' },
        data: { estado: 'disponible' },
      }),
    )
  })
})

describe('PrestamosService.cancelar', () => {
  it('no encontrado → throws', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await expect(service.cancelar('p1', 'u1')).rejects.toThrow('Préstamo no encontrado')
  })

  it('otro socio → throws "No tienes permiso"', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...prestamoPendiente,
      socio_id: 'otro',
    })

    await expect(service.cancelar('p1', 'u1')).rejects.toThrow(
      'No tienes permiso para cancelar este préstamo',
    )
  })

  it('no está pendiente → throws', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(prestamoActivo)

    await expect(service.cancelar('p1', 'u1')).rejects.toThrow(
      'Solo se pueden cancelar préstamos en estado pendiente',
    )
  })

  it('propio + pendiente → cancela', async () => {
    ;(prisma.prestamo.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(prestamoPendiente)
    ;(prisma.prestamo.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...prestamoPendiente,
      estado: 'rechazado',
    })

    await service.cancelar('p1', 'u1')

    expect(prisma.prestamo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { estado: 'rechazado' },
      }),
    )
  })
})
