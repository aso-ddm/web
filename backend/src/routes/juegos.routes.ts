import { FastifyPluginAsync } from 'fastify'
import { JuegosService } from '../services/juegos.service.js'
import { crearJuegoSchema, updateJuegoSchema, filtrosJuegosSchema } from '../schemas/juego.schema.js'
import { requireRoles, ROLES } from '../plugins/authenticate.plugin.js'

const juegosRoutes: FastifyPluginAsync = async (fastify) => {
  const juegosService = new JuegosService(fastify.prisma)

  // GET /api/juegos — catálogo público con filtros
  fastify.get('/', async (request, reply) => {
    const parsed = filtrosJuegosSchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parámetros inválidos', details: parsed.error.flatten().fieldErrors })
    }
    const result = await juegosService.getAll(parsed.data)
    return reply.send(result)
  })

  // GET /api/juegos/:id — detalle público
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const juego = await juegosService.getById(id)
      return reply.send({ data: juego })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      return reply.status(404).send({ error: message })
    }
  })

  // POST /api/juegos — crear juego (ludotecario / directiva)
  fastify.post('/', {
    preHandler: requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO),
  }, async (request, reply) => {
    const parsed = crearJuegoSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    }
    const juego = await juegosService.crear(parsed.data)
    return reply.status(201).send({ data: juego })
  })

  // PUT /api/juegos/:id — actualizar juego (ludotecario / directiva)
  fastify.put('/:id', {
    preHandler: requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO),
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = updateJuegoSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    }
    try {
      const juego = await juegosService.update(id, parsed.data)
      return reply.send({ data: juego })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      return reply.status(404).send({ error: message })
    }
  })

  // DELETE /api/juegos/:id — eliminar (solo directiva)
  fastify.delete('/:id', {
    preHandler: requireRoles(...ROLES.DIRECTIVA),
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      await juegosService.delete(id)
      return reply.status(204).send()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      const status = message.includes('no encontrado') ? 404 : 409
      return reply.status(status).send({ error: message })
    }
  })
}

export default juegosRoutes
