import { FastifyPluginAsync } from 'fastify'

// Sprint 3 — Gestión de Préstamos
const prestamosRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { preHandler: fastify.authenticate }, async (_request, reply) => {
    return reply.send({ message: 'TODO: Sprint 3 — Gestión de préstamos' })
  })
}

export default prestamosRoutes
