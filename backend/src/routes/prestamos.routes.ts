import { FastifyPluginAsync } from 'fastify'
import { PrestamosService } from '../services/prestamos.service.js'
import { solicitarPrestamoSchema, filtrosPrestamosSchema } from '../schemas/prestamo.schema.js'

const prestamosRoutes: FastifyPluginAsync = async (fastify) => {
  const prestamosService = new PrestamosService(fastify.prisma)

  // GET /api/prestamos/mis-prestamos — historial propio
  fastify.get('/mis-prestamos', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const parsed = filtrosPrestamosSchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parámetros inválidos' })
    }
    const result = await prestamosService.misPrestamos(request.user.id, parsed.data)
    return reply.send(result)
  })

  // POST /api/prestamos — solicitar préstamo
  fastify.post('/', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const parsed = solicitarPrestamoSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    }
    try {
      const prestamo = await prestamosService.solicitar(request.user.id, parsed.data)
      return reply.status(201).send({ data: prestamo })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      return reply.status(400).send({ error: message })
    }
  })

  // DELETE /api/prestamos/:id — cancelar préstamo propio (pendiente)
  fastify.delete('/:id', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      await prestamosService.cancelar(id, request.user.id)
      return reply.status(204).send()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      const status = message.includes('permiso') ? 403 : 400
      return reply.status(status).send({ error: message })
    }
  })
}

export default prestamosRoutes
