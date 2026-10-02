import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import express from 'express'
import 'express-async-errors'
import type { Server } from 'http'
import type { AddressInfo } from 'net'
import { Prisma } from '@prisma/client'
import { z } from 'zod'
import { errorHandler } from '../middleware/errorHandler'
import { HttpError } from '../lib/httpError'

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('x', { code, clientVersion: '5' })

let server: Server
let base: string

beforeAll(async () => {
  const app = express()
  app.use(express.json())
  app.get('/async-reject', async () => { throw new Error('boom') })
  app.get('/http', async () => { throw new HttpError(409, 'ya procesada') })
  app.get('/zod', async () => { z.object({ a: z.string() }).parse({}) })
  app.get('/p2002', async () => { throw prismaError('P2002') })
  app.get('/p2003', async () => { throw prismaError('P2003') })
  app.get('/p2025', async () => { throw prismaError('P2025') })
  app.post('/json', (_req, res) => { res.json({}) })
  app.use(errorHandler)
  await new Promise<void>((r) => { server = app.listen(0, r) })
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
})
afterAll(() => { server.close() })

describe('errorHandler', () => {
  it.each([
    ['/async-reject', 500],
    ['/http', 409],
    ['/zod', 400],
    ['/p2002', 409],
    ['/p2003', 409],
    ['/p2025', 404],
  ])('GET %s → %i', async (path, status) => {
    const res = await fetch(base + path)
    expect(res.status).toBe(status)
  })

  it('JSON malformado → 400', async () => {
    const res = await fetch(base + '/json', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{mal' })
    expect(res.status).toBe(400)
  })
})
