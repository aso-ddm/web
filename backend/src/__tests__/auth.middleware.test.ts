import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Request, Response } from 'express'

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }))
vi.mock('../lib/prisma', () => ({ prisma: { usuario: { findUnique } } }))

import { requireRoles, signToken } from '../middleware/auth'

function run(roles: Parameters<typeof requireRoles>, tokenRoles: string[]) {
  const req = { headers: { authorization: `Bearer ${signToken({ id: 'u1', email: 'a@a.es', roles: tokenRoles })}` } } as unknown as Request
  const res = { statusCode: 200, status(c: number) { this.statusCode = c; return this }, json() { return this } }
  const next = vi.fn()
  return new Promise<{ status: number; next: boolean }>((resolve) => {
    requireRoles(...roles)(req, res as unknown as Response, (...a: unknown[]) => { next(...a); resolve({ status: res.statusCode, next: true }) })
    setTimeout(() => resolve({ status: res.statusCode, next: next.mock.calls.length > 0 }), 20)
  })
}

beforeEach(() => findUnique.mockReset())

describe('requireRoles con roles desde BD', () => {
  it('socio dado de baja con token válido → 401', async () => {
    findUnique.mockResolvedValue({ id: 'u1', email: 'a@a.es', roles: ['presidente'], estado: 'baja' })
    expect(await run(['presidente'], ['presidente'])).toEqual({ status: 401, next: false })
  })

  it('rol retirado en BD aunque siga en el token → 403', async () => {
    findUnique.mockResolvedValue({ id: 'u1', email: 'a@a.es', roles: ['socio_basico'], estado: 'activo' })
    expect(await run(['presidente'], ['presidente'])).toEqual({ status: 403, next: false })
  })

  it('rol presente en BD → pasa', async () => {
    findUnique.mockResolvedValue({ id: 'u1', email: 'a@a.es', roles: ['presidente'], estado: 'activo' })
    expect(await run(['presidente'], ['socio_basico'])).toEqual({ status: 200, next: true })
  })
})

describe('ludotecario como rol acumulable', () => {
  const LUDOTECA = ['administrador', 'presidente', 'secretario', 'tesorero', 'ludotecario'] as Parameters<typeof requireRoles>
  const VOCALIA = ['administrador', 'presidente', 'secretario', 'tesorero', 'vocal'] as Parameters<typeof requireRoles>
  const conRoles = (roles: string[]) =>
    findUnique.mockResolvedValue({ id: 'u1', email: 'a@a.es', roles, estado: 'activo' })

  it('socio sin ludotecario → sin permisos de ludoteca', async () => {
    conRoles(['socio_basico'])
    expect((await run(LUDOTECA, [])).status).toBe(403)
  })
  it('socio + ludotecario → permisos de ludoteca', async () => {
    conRoles(['socio_basico', 'ludotecario'])
    expect((await run(LUDOTECA, [])).next).toBe(true)
  })
  it('vocal + ludotecario → permisos de vocal y de ludoteca', async () => {
    conRoles(['vocal', 'ludotecario'])
    expect((await run(VOCALIA, [])).next).toBe(true)
    conRoles(['vocal', 'ludotecario'])
    expect((await run(LUDOTECA, [])).next).toBe(true)
  })
  it('vocal sin ludotecario → sin permisos de ludoteca', async () => {
    conRoles(['vocal'])
    expect((await run(LUDOTECA, [])).status).toBe(403)
  })
})
