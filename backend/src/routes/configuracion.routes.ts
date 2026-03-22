import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { ConfiguracionService } from '../services/configuracion.service.js'
import { requireRoles, ROLES } from '../plugins/authenticate.plugin.js'

const updateConfigSchema = z.object({
  valor: z.string().min(1, 'El valor es obligatorio'),
})

const configuracionRoutes: FastifyPluginAsync = async (fastify) => {
  const configService = new ConfiguracionService(fastify.prisma)

  // GET /api/config — listado (directiva)
  fastify.get('/', {
    preHandler: requireRoles(...ROLES.DIRECTIVA),
  }, async (_request, reply) => {
    const configs = await configService.getAll()
    return reply.send({ data: configs })
  })

  // PUT /api/config/:clave — actualizar valor (directiva)
  fastify.put('/:clave', {
    preHandler: requireRoles(...ROLES.DIRECTIVA),
  }, async (request, reply) => {
    const { clave } = request.params as { clave: string }
    const parsed = updateConfigSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    }
    try {
      const config = await configService.update(clave, parsed.data.valor)
      return reply.send({ data: config })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      return reply.status(404).send({ error: message })
    }
  })
}

export default configuracionRoutes
