import { describe, it, expect, beforeEach, vi } from 'vitest'
import { VisitasService } from '../services/visitas.service'
import { createPrismaMock } from './helpers/prisma.mock'
import type { PrismaClient } from '@prisma/client'

let prisma: PrismaClient
let service: VisitasService

beforeEach(() => {
  prisma = createPrismaMock()
  service = new VisitasService(prisma)
})

const mockConfig = (gratuitas: string, precio: string) => {
  ;(prisma.configuracion.findUnique as ReturnType<typeof vi.fn>)
    .mockResolvedValueOnce({ clave: 'visitas_gratuitas', valor: gratuitas })
    .mockResolvedValueOnce({ clave: 'precio_visita_pago', valor: precio })
}

describe('VisitasService.registrar', () => {
  it('primera visita (0 previas, 3 gratuitas) → es_pago=false, sin importe', async () => {
    mockConfig('3', '4')
    ;(prisma.visita.count as ReturnType<typeof vi.fn>).mockResolvedValue(0)
    ;(prisma.visita.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'v1',
      nombre_completo: 'Pepe',
      numero_visita: 1,
      es_pago: false,
      importe: null,
    })

    await service.registrar({ nombre_completo: 'Pepe', socio_registro_id: 'u1' })

    expect(prisma.visita.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          numero_visita: 1,
          es_pago: false,
          importe: null,
        }),
      }),
    )
  })

  it('tercera visita (2 previas, 3 gratuitas) → es_pago=false', async () => {
    mockConfig('3', '4')
    ;(prisma.visita.count as ReturnType<typeof vi.fn>).mockResolvedValue(2)
    ;(prisma.visita.create as ReturnType<typeof vi.fn>).mockResolvedValue({})

    await service.registrar({ nombre_completo: 'Pepe', socio_registro_id: 'u1' })

    expect(prisma.visita.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          numero_visita: 3,
          es_pago: false,
          importe: null,
        }),
      }),
    )
  })

  it('cuarta visita (3 previas, 3 gratuitas) → es_pago=true, importe=4', async () => {
    mockConfig('3', '4')
    ;(prisma.visita.count as ReturnType<typeof vi.fn>).mockResolvedValue(3)
    ;(prisma.visita.create as ReturnType<typeof vi.fn>).mockResolvedValue({})

    await service.registrar({ nombre_completo: 'Pepe', socio_registro_id: 'u1' })

    expect(prisma.visita.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          numero_visita: 4,
          es_pago: true,
          importe: 4,
        }),
      }),
    )
  })

  it('config personalizada (2 gratuitas, €5) → tercera visita es de pago', async () => {
    mockConfig('2', '5')
    ;(prisma.visita.count as ReturnType<typeof vi.fn>).mockResolvedValue(2)
    ;(prisma.visita.create as ReturnType<typeof vi.fn>).mockResolvedValue({})

    await service.registrar({ nombre_completo: 'Pepe', socio_registro_id: 'u1' })

    expect(prisma.visita.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          es_pago: true,
          importe: 5,
        }),
      }),
    )
  })

  it('sin config en BD → usa defaults (3 gratuitas, €4)', async () => {
    ;(prisma.configuracion.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    ;(prisma.visita.count as ReturnType<typeof vi.fn>).mockResolvedValue(5)
    ;(prisma.visita.create as ReturnType<typeof vi.fn>).mockResolvedValue({})

    await service.registrar({ nombre_completo: 'Pepe', socio_registro_id: 'u1' })

    expect(prisma.visita.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ es_pago: true, importe: 4 }),
      }),
    )
  })
})

describe('VisitasService.buscar', () => {
  it('query < 2 caracteres → devuelve []', async () => {
    const result = await service.buscar('A')

    expect(result).toEqual([])
    expect(prisma.visita.findMany).not.toHaveBeenCalled()
  })

  it('query vacía → devuelve []', async () => {
    const result = await service.buscar('')

    expect(result).toEqual([])
  })

  it('query válida → enriquece con total y última visita', async () => {
    ;(prisma.visita.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { nombre_completo: 'Ana López' },
    ])
    ;(prisma.visita.count as ReturnType<typeof vi.fn>).mockResolvedValue(3)
    ;(prisma.visita.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      fecha_visita: new Date('2025-01-15'),
      es_pago: false,
    })

    const result = await service.buscar('Ana')

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      nombre_completo: 'Ana López',
      total_visitas: 3,
      ultima_visita: expect.any(Date),
    })
  })
})
