import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { CuotasService } from '../services/cuotas.service'
import { createPrismaMock } from './helpers/prisma.mock'

let prisma: PrismaClient
let service: CuotasService
const findSocio = () => prisma.usuario.findUnique as ReturnType<typeof vi.fn>

beforeEach(() => {
  prisma = createPrismaMock()
  service = new CuotasService(prisma)
})

describe('CuotasService.marcar', () => {
  it('cuota individual → upsert por socio', async () => {
    findSocio().mockResolvedValue({ id: 's1', solicitud_grupal_id: null })
    await service.marcar('s1', { anio: 2026, mes: 3, estado: 'pagado' }, 'dir1')
    expect(prisma.pagoCuota.upsert).toHaveBeenCalledWith({
      where: { socio_id_anio_mes: { socio_id: 's1', anio: 2026, mes: 3 } },
      create: { socio_id: 's1', anio: 2026, mes: 3, estado: 'pagado', revisado_por_id: 'dir1' },
      update: { estado: 'pagado', revisado_por_id: 'dir1' },
    })
  })

  it('cuota conjunta → el pago se apunta en el grupo (vale para todos)', async () => {
    findSocio().mockResolvedValue({ id: 's1', solicitud_grupal_id: 'g1' })
    const r = await service.marcar('s1', { anio: 2026, mes: 3, estado: 'pagado' }, 'dir1')
    expect(prisma.pagoCuota.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { grupo_id_anio_mes: { grupo_id: 'g1', anio: 2026, mes: 3 } },
      create: expect.objectContaining({ grupo_id: 'g1' }),
    }))
    expect(r).toEqual({ grupo_id: 'g1', anio: 2026, mes: 3, estado: 'pagado' })
  })

  it('estado null → borra el registro (vuelve a "sin revisar")', async () => {
    findSocio().mockResolvedValue({ id: 's1', solicitud_grupal_id: 'g1' })
    await service.marcar('s1', { anio: 2026, mes: 3, estado: null }, 'dir1')
    expect(prisma.pagoCuota.deleteMany).toHaveBeenCalledWith({ where: { grupo_id: 'g1', anio: 2026, mes: 3 } })
    expect(prisma.pagoCuota.upsert).not.toHaveBeenCalled()
  })

  it('socio inexistente → 404', async () => {
    findSocio().mockResolvedValue(null)
    await expect(service.marcar('x', { anio: 2026, mes: 3, estado: 'pagado' }, 'dir1')).rejects.toMatchObject({ status: 404 })
  })
})

describe('CuotasService.adelantar', () => {
  it('marca como pagados los meses seguidos, cruzando de año, en una transacción', async () => {
    findSocio().mockResolvedValue({ id: 's1', solicitud_grupal_id: null })
    const r = await service.adelantar('s1', { anio: 2026, mes: 11, meses: 3 }, 'dir1')
    expect(r.meses).toEqual([{ anio: 2026, mes: 11 }, { anio: 2026, mes: 12 }, { anio: 2027, mes: 1 }])
    expect(prisma.$transaction).toHaveBeenCalledTimes(1)
    expect(prisma.pagoCuota.upsert).toHaveBeenCalledTimes(3)
    expect(prisma.pagoCuota.upsert).toHaveBeenLastCalledWith({
      where: { socio_id_anio_mes: { socio_id: 's1', anio: 2027, mes: 1 } },
      create: { socio_id: 's1', anio: 2027, mes: 1, estado: 'pagado', revisado_por_id: 'dir1' },
      update: { estado: 'pagado', revisado_por_id: 'dir1' },
    })
  })

  it('cuota conjunta → se apunta en el grupo', async () => {
    findSocio().mockResolvedValue({ id: 's1', solicitud_grupal_id: 'g1' })
    await service.adelantar('s1', { anio: 2026, mes: 1, meses: 12 }, 'dir1')
    expect(prisma.pagoCuota.upsert).toHaveBeenCalledTimes(12)
    expect(prisma.pagoCuota.upsert).toHaveBeenLastCalledWith(expect.objectContaining({
      where: { grupo_id_anio_mes: { grupo_id: 'g1', anio: 2026, mes: 12 } },
    }))
  })

  it('socio inexistente → 404', async () => {
    findSocio().mockResolvedValue(null)
    await expect(service.adelantar('x', { anio: 2026, mes: 1, meses: 3 }, 'dir1')).rejects.toMatchObject({ status: 404 })
  })
})
