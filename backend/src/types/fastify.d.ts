import { PrismaClient } from '@prisma/client'
import { FastifyRequest, FastifyReply } from 'fastify'

// Tipar el payload JWT para que request.user tenga los campos correctos
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { id: string; email: string; roles: string[] }
    user: { id: string; email: string; roles: string[] }
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}
