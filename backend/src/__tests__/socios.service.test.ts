import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SociosService } from '../services/socios.service.js'
import { createPrismaMock } from './helpers/prisma.mock.js'
import type { PrismaClient } from '@prisma/client'

let prisma: PrismaClient
let service: SociosService

beforeEach(() => {
  prisma = createPrismaMock()
  service = new SociosService(prisma)
})

const socioActivo = {
  id: 'u1',
  nombre: 'Ana',
  estado: 'activo',
  roles: ['socio_basico'],
  tiene_llaves: false,
  fecha_solicitud_llaves: null,
  fecha_aprobacion_llaves: null,
  fecha_alta: new Date('2020-01-01'),
}

describe('SociosService.solicitarLlaves', () => {
  it('socio no encontrado → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await expect(service.solicitarLlaves('u1')).rejects.toThrow('Socio no encontrado')
  })

  it('estado !== activo → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'pendiente',
    })

    await expect(service.solicitarLlaves('u1')).rejects.toThrow(
      'Solo los socios activos pueden solicitar llaves',
    )
  })

  it('ya tiene llaves → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      tiene_llaves: true,
    })

    await expect(service.solicitarLlaves('u1')).rejects.toThrow('Ya tienes llaves del club')
  })

  it('solicitud pendiente sin aprobar → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      fecha_solicitud_llaves: new Date(),
      fecha_aprobacion_llaves: null,
    })

    await expect(service.solicitarLlaves('u1')).rejects.toThrow(
      'Ya tienes una solicitud de llaves pendiente',
    )
  })

  it('no admin con < 6 meses de antigüedad → throws con fecha', async () => {
    const reciente = new Date()
    reciente.setMonth(reciente.getMonth() - 2)

    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      fecha_alta: reciente,
    })

    await expect(service.solicitarLlaves('u1')).rejects.toThrow('Podrás solicitar llaves a partir del')
  })

  it('no admin con ≥ 6 meses → éxito', async () => {
    const antigua = new Date()
    antigua.setMonth(antigua.getMonth() - 7)

    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      fecha_alta: antigua,
    })
    ;(prisma.usuario.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      fecha_solicitud_llaves: new Date(),
    })

    const result = await service.solicitarLlaves('u1')

    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'u1' },
        data: { fecha_solicitud_llaves: expect.any(Date) },
      }),
    )
    expect(result).toHaveProperty('fecha_solicitud_llaves')
  })

  it('admin (presidente) exento del requisito de 6 meses', async () => {
    const reciente = new Date()
    reciente.setMonth(reciente.getMonth() - 1)

    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      roles: ['presidente'],
      fecha_alta: reciente,
    })
    ;(prisma.usuario.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      fecha_solicitud_llaves: new Date(),
    })

    await expect(service.solicitarLlaves('u1')).resolves.toBeDefined()
  })
})

describe('SociosService.aprobar', () => {
  it('no encontrado → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await expect(service.aprobar('u1', 'admin')).rejects.toThrow('Socio no encontrado')
  })

  it('estado !== pendiente → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'activo',
    })

    await expect(service.aprobar('u1', 'admin')).rejects.toThrow(
      'Solo se pueden aprobar solicitudes en estado pendiente',
    )
  })

  it('pendiente → actualiza a activo con fecha_alta y aprobado_por_id', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'pendiente',
    })
    ;(prisma.usuario.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'activo',
    })

    const result = await service.aprobar('u1', 'admin1')

    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: 'activo',
          fecha_alta: expect.any(Date),
          aprobado_por_id: 'admin1',
        }),
      }),
    )
    expect(result).toMatchObject({ estado: 'activo' })
  })
})

describe('SociosService.rechazar', () => {
  it('no encontrado → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await expect(service.rechazar('u1', 'admin')).rejects.toThrow('Socio no encontrado')
  })

  it('estado !== pendiente → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'activo',
    })

    await expect(service.rechazar('u1', 'admin')).rejects.toThrow(
      'Solo se pueden rechazar solicitudes en estado pendiente',
    )
  })

  it('pendiente → actualiza a baja', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'pendiente',
    })
    ;(prisma.usuario.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'baja',
    })

    await service.rechazar('u1', 'admin1')

    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: 'baja',
          fecha_baja: expect.any(Date),
          baja_por_id: 'admin1',
        }),
      }),
    )
  })
})

describe('SociosService.darDeBaja', () => {
  it('ya está de baja → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'baja',
    })

    await expect(service.darDeBaja('u1', 'admin')).rejects.toThrow('El socio ya está dado de baja')
  })

  it('activo → actualiza a baja', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(socioActivo)
    ;(prisma.usuario.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'baja',
    })

    await service.darDeBaja('u1', 'admin1')

    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estado: 'baja', baja_por_id: 'admin1' }),
      }),
    )
  })
})
