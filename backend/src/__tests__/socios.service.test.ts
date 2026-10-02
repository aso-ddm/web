import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Rol } from '@prisma/client'
import { SociosService } from '../services/socios.service'
import { createPrismaMock } from './helpers/prisma.mock'
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
  fecha_alta: new Date('2020-01-01'),
}

describe('SociosService.setLlaves', () => {
  it('socio no encontrado → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await expect(service.setLlaves('u1', true)).rejects.toThrow('Socio no encontrado')
  })

  it('asignar a socio no activo → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'baja',
    })

    await expect(service.setLlaves('u1', true)).rejects.toThrow(
      'Solo se pueden asignar llaves a socios activos',
    )
  })

  it('activo → asigna llaves', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(socioActivo)
    ;(prisma.usuario.update as ReturnType<typeof vi.fn>).mockResolvedValue({ ...socioActivo, tiene_llaves: true })

    await service.setLlaves('u1', true)

    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'u1' }, data: { tiene_llaves: true } }),
    )
  })

  it('socio de baja → se le pueden retirar las llaves', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'baja',
      tiene_llaves: true,
    })
    ;(prisma.usuario.update as ReturnType<typeof vi.fn>).mockResolvedValue(socioActivo)

    await expect(service.setLlaves('u1', false)).resolves.toBeDefined()
  })
})

describe('SociosService.aprobar', () => {
  it('no encontrado → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await expect(service.aprobar('u1', 'admin', Rol.socio_basico)).rejects.toThrow('Socio no encontrado')
  })

  it('estado !== pendiente → throws', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'activo',
    })

    await expect(service.aprobar('u1', 'admin', Rol.socio_basico)).rejects.toThrow(
      'Solo se pueden aprobar solicitudes en estado pendiente',
    )
  })

  it('pendiente → actualiza a activo con fecha_alta, aprobado_por_id y rol', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'pendiente',
    })
    ;(prisma.usuario.update as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...socioActivo,
      estado: 'activo',
      roles: [Rol.socio_basico],
    })

    const result = await service.aprobar('u1', 'admin1', Rol.socio_basico)

    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          estado: 'activo',
          fecha_alta: expect.any(Date),
          aprobado_por_id: 'admin1',
          roles: [Rol.socio_basico],
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
