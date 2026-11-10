import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { createPrismaMock } from './helpers/prisma.mock'
import { alertar, leerAlerta, rellenar } from '../lib/alertas'
import { ConfiguracionService } from '../services/configuracion.service'

let prisma: PrismaClient
const mock = (fn: unknown) => fn as ReturnType<typeof vi.fn>

beforeEach(() => {
  prisma = createPrismaMock()
  vi.clearAllMocks()
})

describe('alertas', () => {
  it('rellena las variables conocidas y deja las desconocidas', () => {
    expect(rellenar('{socio} tiene {juego} {otra}', { socio: 'Ana', juego: 'Catan' })).toBe('Ana tiene Catan {otra}')
  })

  it('valor roto o sin fila → por defecto y activa', () => {
    expect(leerAlerta('alerta_prestamo', undefined)).toMatchObject({ activa: true })
    expect(leerAlerta('alerta_prestamo', '0').texto).toContain('{juego}')
  })

  it('desactivada → no consulta destinatarios ni envía', async () => {
    mock(prisma.configuracion.findUnique).mockResolvedValue({ valor: JSON.stringify({ activa: false, texto: 'x' }) })
    expect(await alertar(prisma, 'alerta_devolucion', {})).toBeNull()
    expect(prisma.usuario.findMany).not.toHaveBeenCalled()
  })

  it('activa → busca el cargo de la alerta', async () => {
    mock(prisma.configuracion.findUnique).mockResolvedValue({ valor: JSON.stringify({ activa: true, texto: 'Hola {nombre}' }) })
    expect(await alertar(prisma, 'alerta_llaves', { nombre: 'Ana' })).toBe(false) // sin secretarios con Telegram
    expect(prisma.usuario.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ roles: { has: 'secretario' } }),
    }))
  })
})

describe('ConfiguracionService con alertas', () => {
  it('getAll añade las alertas que no están en la base', async () => {
    mock(prisma.configuracion.findMany).mockResolvedValue([])
    const claves = (await new ConfiguracionService(prisma).getAll()).map((c) => c.clave)
    expect(claves).toEqual(expect.arrayContaining(['alerta_alta', 'alerta_prestamo', 'alerta_devolucion']))
  })

  it('update valida y hace upsert', async () => {
    const service = new ConfiguracionService(prisma)
    await expect(service.update('alerta_baja', JSON.stringify({ activa: true, texto: '  ' }))).rejects.toThrow()
    await service.update('alerta_baja', JSON.stringify({ activa: false, texto: 'Baja de {nombre}' }))
    expect(prisma.configuracion.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { clave: 'alerta_baja' },
      create: expect.objectContaining({ tipo: 'alerta' }),
    }))
  })
})
