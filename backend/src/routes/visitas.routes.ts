import { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { VisitasService } from '../services/visitas.service.js'
import { requireRoles, ROLES } from '../plugins/authenticate.plugin.js'

const buscarSchema = z.object({
  nombre: z.string().min(2, 'Introduce al menos 2 caracteres'),
})

const registrarSchema = z.object({
  nombre_completo: z.string().min(2, 'El nombre es obligatorio'),
})

const visitasRoutes: FastifyPluginAsync = async (fastify) => {
  const visitasService = new VisitasService(fastify.prisma)

  // GET /api/visitas/buscar?nombre=... — autocompletar visitante (cualquier socio autenticado)
  fastify.get('/buscar', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const parsed = buscarSchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten().fieldErrors.nombre?.[0] ?? 'Nombre inválido' })
    }
    const resultados = await visitasService.buscar(parsed.data.nombre)
    return reply.send({ data: resultados })
  })

  // POST /api/visitas — registrar visita (cualquier socio autenticado)
  fastify.post('/', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const parsed = registrarSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    }
    try {
      const visita = await visitasService.registrar({
        nombre_completo: parsed.data.nombre_completo,
        socio_registro_id: request.user.id,
      })
      return reply.status(201).send({ data: visita })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      return reply.status(400).send({ error: message })
    }
  })

  // GET /api/visitas — historial reciente (directiva)
  fastify.get('/', {
    preHandler: requireRoles(...ROLES.DIRECTIVA),
  }, async (_request, reply) => {
    const visitas = await visitasService.getRecientes(100)
    return reply.send({ data: visitas })
  })
}

export default visitasRoutes
