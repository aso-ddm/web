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
