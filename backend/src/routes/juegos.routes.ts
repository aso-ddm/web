import { FastifyPluginAsync } from 'fastify'

// Sprint 3 — Gestión de Ludoteca
const juegosRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', { preHandler: fastify.authenticate }, async (_request, reply) => {
    return reply.send({ message: 'TODO: Sprint 3 — Catálogo de juegos' })
  })
}

export default juegosRoutes
