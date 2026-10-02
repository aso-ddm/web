import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthService } from '../services/auth.service'
import { createPrismaMock } from './helpers/prisma.mock'
import type { PrismaClient } from '@prisma/client'

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
    password: 'Password123!',
    confirmPassword: 'Password123!',
  }

  it('email duplicado → throws', async () => {
    ;(prisma.usuario.findFirst as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ id: 'existing' })

    await expect(service.register(validInput)).rejects.toThrow(
      `Ya existe una cuenta con ese email: ${validInput.email}`,
    )
  })

  it('DNI duplicado → throws', async () => {
    ;(prisma.usuario.findFirst as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null)
    ;(prisma.usuario.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'existing' })

    await expect(service.register(validInput)).rejects.toThrow(
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

    const result = await service.register(validInput)

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
