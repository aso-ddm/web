import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthService } from '../services/auth.service'
import { createPrismaMock } from './helpers/prisma.mock'
import type { PrismaClient } from '@prisma/client'
import crypto from 'node:crypto'

// Datos del widget firmados como lo haría Telegram con BOT_TOKEN='x'
function firmarTelegram(user: { id: number; first_name: string; username?: string }, auth_date = Math.floor(Date.now() / 1000)) {
  const data = { ...user, auth_date }
  const check = Object.keys(data).sort().map((k) => `${k}=${data[k as keyof typeof data]}`).join('\n')
  const secret = crypto.createHash('sha256').update('x').digest()
  return { ...data, hash: crypto.createHmac('sha256', secret).update(check).digest('hex') }
}

const { mockHash, mockCompare } = vi.hoisted(() => ({
  mockHash: vi.fn().mockResolvedValue('$2b$12$hashed'),
  mockCompare: vi.fn(),
}))

vi.mock('bcryptjs', () => ({
  default: { hash: mockHash, compare: mockCompare },
}))

const BASE_USER = {
  id: 'u1',
  email: 'test@example.com',
  nombre: 'Ana',
  apellidos: 'García',
  roles: ['socio_basico'],
  estado: 'activo',
  password_hash: '$2b$12$hashed',
}

let prisma: PrismaClient
let service: AuthService

beforeEach(() => {
  vi.stubEnv('BOT_TOKEN', 'x')
  prisma = createPrismaMock()
  service = new AuthService(prisma)
})

describe('AuthService.register (individual)', () => {
  const validInput = {
    tipo_cuota: 'individual' as const,
    email: 'nuevo@example.com',
    dni: '12345678A',
    nombre: 'Ana',
    apellidos: 'García',
    apodo: 'Anita',
    consentimiento_tiendas: false,
    password: 'Password123!',
  }

  it('email duplicado → throws', async () => {
    ;(prisma.usuario.findFirst as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: 'existing' })

    await expect(service.register(validInput, 'c.pdf')).rejects.toThrow(
      `Ya existe una cuenta con ese email: ${validInput.email}`,
    )
  })

  it('DNI duplicado → throws', async () => {
    ;(prisma.usuario.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'existing' })

    await expect(service.register(validInput, 'c.pdf')).rejects.toThrow(
      `Ya existe una cuenta con ese DNI: ${validInput.dni}`,
    )
  })

  it('éxito → devuelve usuario con estado=pendiente, sin password_hash', async () => {
    ;(prisma.usuario.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)

    const created = {
      id: 'u1',
      email: validInput.email,
      nombre: validInput.nombre,
      apellidos: validInput.apellidos,
      roles: ['socio_basico'],
      estado: 'pendiente',
      created_at: new Date(),
    }
    ;(prisma.usuario.create as ReturnType<typeof vi.fn>).mockResolvedValue(created)

    const result = await service.register(validInput, 'c.pdf')

    expect(result).toEqual(created)
    expect(result).not.toHaveProperty('password_hash')
    expect(result).toMatchObject({ estado: 'pendiente', roles: ['socio_basico'] })
  })
})

describe('AuthService.login', () => {
  it('usuario no existe → throws "Credenciales incorrectas"', async () => {
    ;(prisma.usuario.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await expect(service.login({ email: 'x@x.com', password: 'pw' })).rejects.toThrow(
      'Credenciales incorrectas',
    )
  })

  it('estado=baja → throws', async () => {
    ;(prisma.usuario.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...BASE_USER,
      estado: 'baja',
    })
    mockCompare.mockResolvedValue(true)

    await expect(service.login({ email: BASE_USER.email, password: 'pw' })).rejects.toThrow(
      'Esta cuenta ha sido dada de baja',
    )
  })

  it('estado=pendiente → entra (solo para editar su solicitud)', async () => {
    ;(prisma.usuario.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...BASE_USER,
      estado: 'pendiente',
    })
    mockCompare.mockResolvedValue(true)

    await expect(service.login({ email: BASE_USER.email, password: 'pw' })).resolves.toMatchObject({ estado: 'pendiente' })
  })

  it('cuenta de baja con contraseña incorrecta → no revela el estado', async () => {
    ;(prisma.usuario.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ ...BASE_USER, estado: 'baja' })
    mockCompare.mockResolvedValue(false)

    await expect(service.login({ email: BASE_USER.email, password: 'wrong' })).rejects.toThrow(
      'Credenciales incorrectas',
    )
  })

  it('contraseña incorrecta → throws "Credenciales incorrectas"', async () => {
    ;(prisma.usuario.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(BASE_USER)
    mockCompare.mockResolvedValue(false)

    await expect(service.login({ email: BASE_USER.email, password: 'wrong' })).rejects.toThrow(
      'Credenciales incorrectas',
    )
  })

  it('éxito → devuelve usuario sin password_hash', async () => {
    ;(prisma.usuario.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(BASE_USER)
    mockCompare.mockResolvedValue(true)

    const result = await service.login({ email: BASE_USER.email, password: 'correct' })

    expect(result).not.toHaveProperty('password_hash')
    expect(result).toMatchObject({ id: 'u1', email: BASE_USER.email })
  })
})

describe('AuthService.updateSolicitud', () => {
  const datos = { nombre: 'Ana', apellidos: 'Pérez', dni: '12345678Z', fecha_nacimiento: '1990-01-01', apodo: 'Ana', consentimiento_tiendas: false }

  it('DNI de otra cuenta → 409', async () => {
    ;(prisma.usuario.findUniqueOrThrow as ReturnType<typeof vi.fn>).mockResolvedValue({ comprobante_transferencia: 'a.pdf', solicitud_grupal: null })
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'otro' })

    await expect(service.updateSolicitud('u1', datos)).rejects.toThrow('Ya existe una cuenta con ese DNI')
  })

  it('cuota conjunta → el comprobante nuevo va al grupo', async () => {
    ;(prisma.usuario.findUniqueOrThrow as ReturnType<typeof vi.fn>)
      .mockResolvedValue({ comprobante_transferencia: null, solicitud_grupal: { id: 'g1', comprobante_transferencia: null } })
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null)

    await service.updateSolicitud('u1', datos, 'b.pdf')

    expect(prisma.solicitudGrupal.update).toHaveBeenCalledWith({ where: { id: 'g1' }, data: { comprobante_transferencia: 'b.pdf' } })
  })
})

describe('AuthService.loginTelegram', () => {
  const findUnique = () => prisma.usuario.findUnique as ReturnType<typeof vi.fn>
  const tg = () => firmarTelegram({ id: 42, first_name: 'Ana' })

  it('Telegram vinculado → devuelve el usuario', async () => {
    findUnique().mockResolvedValue(BASE_USER)
    await expect(service.loginTelegram(tg())).resolves.toMatchObject({ id: 'u1' })
  })

  it('firma inválida → throws', async () => {
    await expect(service.loginTelegram({ ...tg(), id: 1 })).rejects.toThrow('Firma de Telegram inválida')
  })

  it('autenticación de hace más de 24h → throws', async () => {
    const viejo = firmarTelegram({ id: 42, first_name: 'Ana' }, Math.floor(Date.now() / 1000) - 90000)
    await expect(service.loginTelegram(viejo)).rejects.toThrow('ha expirado')
  })

  it('Telegram sin vincular → throws', async () => {
    findUnique().mockResolvedValue(null)
    await expect(service.loginTelegram(tg())).rejects.toThrow('no está vinculada')
  })

  it('vinculado pero pendiente → throws', async () => {
    findUnique().mockResolvedValue({ ...BASE_USER, estado: 'pendiente' })
    await expect(service.loginTelegram(tg())).rejects.toThrow('pendiente de aprobación')
  })
})

describe('AuthService.requestPasswordReset', () => {
  const socio = { id: 'u1', nombre: 'Ana', estado: 'activo', telegram_chat_id: BigInt(42) }

  beforeEach(() => {
    vi.stubEnv('BOT_TOKEN', 'x')
    ;(prisma.usuario.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(socio)
  })

  it('Telegram rechaza el envío (bot bloqueado) → error y el código se anula', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: false, description: 'Forbidden: bot was blocked by the user' }, { status: 403 }))

    await expect(service.requestPasswordReset('ana@x.com')).rejects.toThrow('No hemos podido enviarte el código')
    expect(prisma.usuario.update).toHaveBeenLastCalledWith({ where: { id: 'u1' }, data: { reset_token: null, reset_token_expiry: null } })
  })

  it('Telegram acepta → hasTelegram', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }))
    await expect(service.requestPasswordReset('ana@x.com')).resolves.toEqual({ hasTelegram: true })
  })
})

describe('AuthService.pedirLlaves', () => {
  const haceMeses = (m: number) => { const d = new Date(); d.setMonth(d.getMonth() - m); return d }
  const socio = (fecha_alta: Date) => ({ nombre: 'Ana', apellidos: 'García', apodo: null, email: 'a@x.com', alias_telegram: null, estado: 'activo', tiene_llaves: false, fecha_alta })

  it('menos de 6 meses → 403 sin avisar', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(socio(haceMeses(5)))
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    await expect(service.pedirLlaves('u1')).rejects.toThrow('6 meses')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('6 meses → avisa al secretario por Telegram', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(socio(haceMeses(6)))
    ;(prisma.usuario.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ telegram_chat_id: BigInt(7) }])
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }))
    await expect(service.pedirLlaves('u1')).resolves.toBeUndefined()
    expect(JSON.parse(fetchSpy.mock.calls[0][1]!.body as string).chat_id).toBe('7')
    expect(prisma.usuario.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { llaves_solicitadas_at: expect.any(Date) } })
  })

  it('ya pidió hace menos de 1 mes → 409 sin avisar', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ ...socio(haceMeses(8)), llaves_solicitadas_at: new Date() })
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    await expect(service.pedirLlaves('u1')).rejects.toThrow('Ya has pedido las llaves')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('ningún secretario recibe el aviso → error', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(socio(haceMeses(7)))
    ;(prisma.usuario.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([])
    await expect(service.pedirLlaves('u1')).rejects.toThrow('No hemos podido avisar')
  })
})

describe('AuthService.pedirBaja', () => {
  const socio = { nombre: 'Ana', apellidos: 'García', apodo: null, email: 'a@x.com', alias_telegram: '@ana', estado: 'activo', tipo_cuota: 'individual' }

  it('socio activo → avisa al secretario por Telegram', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(socio)
    ;(prisma.usuario.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([{ telegram_chat_id: BigInt(7) }])
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }))
    await expect(service.pedirBaja('u1')).resolves.toBeUndefined()
    expect(JSON.parse(fetchSpy.mock.calls[0][1]!.body as string).text).toContain('Ana García quiere darse de baja')
  })

  it('socio no activo → 403 sin avisar', async () => {
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({ ...socio, estado: 'baja' })
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    await expect(service.pedirBaja('u1')).rejects.toThrow('socios activos')
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})

describe('AuthService.register (conjunta)', () => {
  const persona = (n: number) => ({
    email: `p${n}@example.com`, dni: `1234567${n}A`, nombre: `P${n}`, apellidos: 'X',
    password: 'Password123!', fecha_nacimiento: '1990-01-01',
  })
  const input = {
    ...persona(1), tipo_cuota: 'conjunta' as const, consentimiento_tiendas: false,
    miembros_adicionales: [persona(2), persona(3)],
  }
  const findMany = () => prisma.usuario.findMany as ReturnType<typeof vi.fn>

  it('email repetido dentro del formulario → 409 sin consultar la BD', async () => {
    const dup = { ...input, miembros_adicionales: [{ ...persona(2), email: input.email }] }
    await expect(service.register(dup as never, 'c.pdf')).rejects.toMatchObject({ status: 409 })
    expect(findMany()).not.toHaveBeenCalled()
  })

  it('DNI ya registrado → 409 con una sola consulta para todo el grupo', async () => {
    findMany().mockResolvedValueOnce([{ email: 'otro@example.com', dni: persona(3).dni }])
    await expect(service.register(input as never, 'c.pdf')).rejects.toThrow(`DNI: ${persona(3).dni}`)
    expect(findMany()).toHaveBeenCalledTimes(1)
  })

  it('éxito → contraseñas cifradas antes de la transacción, un usuario pendiente por persona', async () => {
    findMany().mockResolvedValueOnce([])
    ;(prisma.solicitudGrupal.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'g1' })
    ;(prisma.usuario.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: 'u' })
    const hashesAlAbrir: number[] = []
    ;(prisma.$transaction as ReturnType<typeof vi.fn>).mockImplementation((fn: (tx: PrismaClient) => unknown) => {
      hashesAlAbrir.push(mockHash.mock.calls.length)
      return fn(prisma)
    })
    mockHash.mockClear()

    const r = await service.register(input as never, 'c.pdf')

    expect(r).toEqual({ grupo_id: 'g1', miembros: 3 })
    expect(hashesAlAbrir).toEqual([3])
    expect(prisma.usuario.create).toHaveBeenCalledTimes(3)
    expect(prisma.usuario.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ estado: 'pendiente', solicitud_grupal_id: 'g1', password_hash: '$2b$12$hashed' }),
    }))
  })
})
