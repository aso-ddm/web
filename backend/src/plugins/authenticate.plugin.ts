import fp from 'fastify-plugin'
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { Rol } from '@prisma/client'

const authenticatePlugin: FastifyPluginAsync = async (fastify) => {
  // Decorador base: verifica JWT y carga req.user
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
    } catch {
      reply.status(401).send({ error: 'No autorizado' })
    }
  })
}

// Helper para proteger rutas con roles específicos
export function requireRoles(...allowedRoles: Rol[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()
    } catch {
      return reply.status(401).send({ error: 'No autorizado' })
    }

    const userRoles = request.user.roles as Rol[]
    const hasRole = allowedRoles.some((role) => userRoles.includes(role))

    if (!hasRole) {
      return reply.status(403).send({ error: 'No tienes permisos para esta acción' })
    }
  }
}

// Sets de roles predefinidos para reutilizar en las rutas
export const ROLES = {
  DIRECTIVA: [Rol.presidente, Rol.secretario, Rol.tesorero] as Rol[],
  DIRECTIVA_Y_VOCALES: [Rol.presidente, Rol.secretario, Rol.tesorero, Rol.vocal] as Rol[],
  DIRECTIVA_Y_LUDOTECARIO: [Rol.presidente, Rol.secretario, Rol.tesorero, Rol.ludotecario] as Rol[],
  TODOS_LOS_ROLES: [Rol.presidente, Rol.secretario, Rol.tesorero, Rol.vocal, Rol.ludotecario, Rol.socio_basico] as Rol[],
}

export default fp(authenticatePlugin, { name: 'authenticate', dependencies: ['@fastify/jwt'] })
