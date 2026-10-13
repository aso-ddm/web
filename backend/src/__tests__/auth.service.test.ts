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
    telegram: firmarTelegram({ id: 42, first_name: 'Ana', username: 'ana_g' }),
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

  it('firma de Telegram falsa → throws', async () => {
    ;(prisma.usuario.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)

    await expect(service.register({ ...validInput, telegram: { ...validInput.telegram, id: 43 } }, 'c.pdf')).rejects.toThrow('Firma de Telegram inválida')
  })

  it('Telegram ya vinculado a otro socio → throws', async () => {
    ;(prisma.usuario.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'otro' })

    await expect(service.register(validInput, 'c.pdf')).rejects.toThrow('ya está vinculada a otro socio')
  })

  it('éxito → devuelve usuario con estado=pendiente y guarda el Telegram', async () => {
    ;(prisma.usuario.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null).mockResolvedValueOnce(null)

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

    expect(prisma.usuario.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ telegram_chat_id: BigInt(42), alias_telegram: '@ana_g', estado: 'pendiente' }),
    }))
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

  it('estado=pendiente → throws', async () => {
    ;(prisma.usuario.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...BASE_USER,
      estado: 'pendiente',
    })
    mockCompare.mockResolvedValue(true)

    await expect(service.login({ email: BASE_USER.email, password: 'pw' })).rejects.toThrow(
      'Tu solicitud está pendiente de aprobación por la directiva',
    )
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

describe('AuthService.login sin contraseña', () => {
  it('cuenta creada con Telegram (password_hash null) → "Credenciales incorrectas"', async () => {
    ;(prisma.usuario.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ ...BASE_USER, password_hash: null })

    await expect(service.login({ email: BASE_USER.email, password: 'pw' })).rejects.toThrow('Credenciales incorrectas')
  })
})

describe('AuthService.loginTelegram', () => {
  const findUnique = () => prisma.usuario.findUnique as ReturnType<typeof vi.fn>
  const findFirst = () => prisma.usuario.findFirst as ReturnType<typeof vi.fn>
  const tg = (id = 42, username?: string) => firmarTelegram({ id, first_name: 'Ana', ...(username ? { username } : {}) })

  it('Telegram vinculado → devuelve el usuario', async () => {
    findUnique().mockResolvedValue(BASE_USER)
    await expect(service.loginTelegram({ telegram: tg() })).resolves.toMatchObject({ id: 'u1' })
  })

  it('firma inválida → throws', async () => {
    await expect(service.loginTelegram({ telegram: { ...tg(), id: 1 } })).rejects.toThrow('Firma de Telegram inválida')
  })

  it('autenticación de hace más de 24h → throws', async () => {
    const viejo = firmarTelegram({ id: 42, first_name: 'Ana' }, Math.floor(Date.now() / 1000) - 90000)
    await expect(service.loginTelegram({ telegram: viejo })).rejects.toThrow('ha expirado')
  })

  it('sin vincular y sin email/DNI → 404 para que el front los pida', async () => {
    findUnique().mockResolvedValue(null)
    await expect(service.loginTelegram({ telegram: tg() })).rejects.toMatchObject({ status: 404 })
  })

  it('primer acceso con email + DNI → busca solo cuentas sin Telegram ni contraseña y la vincula', async () => {
    findUnique().mockResolvedValue(null)
    findFirst().mockResolvedValue({ id: 'u2', estado: 'activo' })
    ;(prisma.usuario.update as ReturnType<typeof vi.fn>).mockResolvedValue({ ...BASE_USER, id: 'u2' })

    await expect(service.loginTelegram({ telegram: tg(7, 'Luis_M'), email: 'luis@x.com', dni: '12345678Z' })).resolves.toMatchObject({ id: 'u2' })
    expect(findFirst()).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ dni: '12345678Z', telegram_chat_id: null, password_hash: null }),
    }))
    expect(prisma.usuario.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'u2' },
      data: expect.objectContaining({ telegram_chat_id: BigInt(7), alias_telegram: '@Luis_M' }),
    }))
  })

  it('email + DNI sin cuenta pendiente de vincular → throws y no vincula', async () => {
    findUnique().mockResolvedValue(null)
    findFirst().mockResolvedValue(null)

    await expect(service.loginTelegram({ telegram: tg(), email: 'x@x.com', dni: '12345678Z' })).rejects.toThrow('No hay ninguna cuenta pendiente')
    expect(prisma.usuario.update).not.toHaveBeenCalled()
  })

  it('primer acceso de una cuenta aún pendiente de aprobar → throws y no vincula', async () => {
    findUnique().mockResolvedValue(null)
    findFirst().mockResolvedValue({ id: 'u2', estado: 'pendiente' })

    await expect(service.loginTelegram({ telegram: tg(), email: 'x@x.com', dni: '12345678Z' })).rejects.toThrow('pendiente de aprobación')
    expect(prisma.usuario.update).not.toHaveBeenCalled()
  })

  it('vinculado pero pendiente → throws', async () => {
    findUnique().mockResolvedValue({ ...BASE_USER, estado: 'pendiente' })
    await expect(service.loginTelegram({ telegram: tg() })).rejects.toThrow('pendiente de aprobación')
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
