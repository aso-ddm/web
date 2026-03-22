import { FastifyPluginAsync } from 'fastify'

// Sprint 4 — Registro de Visitas de No Socios
const visitasRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { preHandler: fastify.authenticate }, async (_request, reply) => {
    return reply.send({ message: 'TODO: Sprint 4 — Registro de visitas' })
  })
}

export default visitasRoutes
