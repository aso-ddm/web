import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { CarnetService, CARNET_VIGENCIA_MS } from '../services/carnet.service'
import { createPrismaMock } from './helpers/prisma.mock'

const socio = { nombre: 'Ana', apellidos: 'Pérez', estado: 'activo', consentimiento_tiendas: true }

describe('CarnetService', () => {
  let db: PrismaClient
  let service: CarnetService
  const findUnique = () => db.usuario.findUnique as ReturnType<typeof vi.fn>

  beforeEach(() => {
    db = createPrismaMock()
    service = new CarnetService(db)
  })

  it('emite un token que la tienda verifica y solo devuelve nombre y apellidos', async () => {
    findUnique().mockResolvedValue(socio)
    const { token } = await service.emitir('u1')
    const data = await service.verificar(token)
    expect(data).toEqual({ nombre: 'Ana', apellidos: 'Pérez', verificado_en: expect.any(String) })
    expect(findUnique()).toHaveBeenLastCalledWith(expect.objectContaining({ where: { id: 'u1' } }))
  })

  it('no emite carnet sin consentimiento', async () => {
    findUnique().mockResolvedValue({ consentimiento_tiendas: false })
    await expect(service.emitir('u1')).rejects.toMatchObject({ status: 403 })
  })

  it('rechaza token manipulado o caducado sin consultar la base', async () => {
    findUnique().mockResolvedValue(socio)
    const { token } = await service.emitir('u1')
    findUnique().mockClear()

    await expect(service.verificar(token.replace('u1', 'u2'))).rejects.toMatchObject({ status: 404 })
    await expect(service.verificar('basura')).rejects.toMatchObject({ status: 404 })
    vi.useFakeTimers({ now: Date.now() + CARNET_VIGENCIA_MS + 1 })
    await expect(service.verificar(token)).rejects.toMatchObject({ status: 404 })
    vi.useRealTimers()
    expect(findUnique()).not.toHaveBeenCalled()
  })

  it('rechaza si el socio se dio de baja o retiró el consentimiento después de emitirlo', async () => {
    findUnique().mockResolvedValue(socio)
    const { token } = await service.emitir('u1')
    findUnique().mockResolvedValueOnce({ ...socio, estado: 'baja' })
    await expect(service.verificar(token)).rejects.toMatchObject({ status: 404 })
    findUnique().mockResolvedValueOnce({ ...socio, consentimiento_tiendas: false })
    await expect(service.verificar(token)).rejects.toMatchObject({ status: 404 })
  })
})
