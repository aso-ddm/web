import { FastifyPluginAsync } from 'fastify'
import { SociosService } from '../services/socios.service.js'
import {
  updateSocioSchema,
  updateRolesSchema,
  filtrosSociosSchema,
} from '../schemas/socio.schema.js'
import { requireRoles, ROLES } from '../plugins/authenticate.plugin.js'

const sociosRoutes: FastifyPluginAsync = async (fastify) => {
  const sociosService = new SociosService(fastify.prisma)

  // GET /api/socios — listado con filtros (directiva + vocales)
  fastify.get('/', {
    preHandler: requireRoles(...ROLES.DIRECTIVA_Y_VOCALES),
  }, async (request, reply) => {
    const parsed = filtrosSociosSchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Parámetros inválidos', details: parsed.error.flatten().fieldErrors })
    }
    const result = await sociosService.getAll(parsed.data)
    return reply.send(result)
  })

  // GET /api/socios/pendientes — solo directiva
  fastify.get('/pendientes', {
    preHandler: requireRoles(...ROLES.DIRECTIVA),
  }, async (_request, reply) => {
    const pendientes = await sociosService.getPendientes()
    return reply.send({ data: pendientes })
  })

  // GET /api/socios/me — perfil propio (cualquier socio autenticado)
  fastify.get('/me', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    try {
      const socio = await sociosService.getById(request.user.id)
      return reply.send({ data: socio })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      return reply.status(404).send({ error: message })
    }
  })

  // GET /api/socios/:id — directiva ve cualquiera; socio solo puede ver el suyo
  fastify.get('/:id', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const isDirectivaOVocal = ROLES.DIRECTIVA_Y_VOCALES.some(r => request.user.roles.includes(r))

    if (!isDirectivaOVocal && request.user.id !== id) {
      return reply.status(403).send({ error: 'No tienes permisos para ver este perfil' })
    }

    try {
      const socio = await sociosService.getById(id)
      return reply.send({ data: socio })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      return reply.status(404).send({ error: message })
    }
  })

  // PUT /api/socios/:id — directiva puede editar cualquiera; socio solo el suyo
  fastify.put('/:id', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const isDirectiva = ROLES.DIRECTIVA.some(r => request.user.roles.includes(r))

    if (!isDirectiva && request.user.id !== id) {
      return reply.status(403).send({ error: 'No puedes editar este perfil' })
    }

    const parsed = updateSocioSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    }

    try {
      const socio = await sociosService.update(id, parsed.data)
      return reply.send({ data: socio })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      return reply.status(404).send({ error: message })
    }
  })

  // PUT /api/socios/:id/roles — solo directiva
  fastify.put('/:id/roles', {
    preHandler: requireRoles(...ROLES.DIRECTIVA),
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const parsed = updateRolesSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    }

    try {
      const socio = await sociosService.updateRoles(id, parsed.data.roles)
      return reply.send({ data: socio })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      return reply.status(404).send({ error: message })
    }
  })

  // POST /api/socios/:id/aprobar — directiva aprueba solicitud de alta
  fastify.post('/:id/aprobar', {
    preHandler: requireRoles(...ROLES.DIRECTIVA),
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const socio = await sociosService.aprobar(id, request.user.id)
      return reply.send({ message: 'Socio aprobado correctamente', data: socio })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      return reply.status(400).send({ error: message })
    }
  })

  // POST /api/socios/:id/rechazar — directiva rechaza solicitud de alta
  fastify.post('/:id/rechazar', {
    preHandler: requireRoles(...ROLES.DIRECTIVA),
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const socio = await sociosService.rechazar(id, request.user.id)
      return reply.send({ message: 'Solicitud rechazada', data: socio })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      return reply.status(400).send({ error: message })
    }
  })

  // POST /api/socios/:id/baja — directiva da de baja a un socio activo
  fastify.post('/:id/baja', {
    preHandler: requireRoles(...ROLES.DIRECTIVA),
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const socio = await sociosService.darDeBaja(id, request.user.id)
      return reply.send({ message: 'Socio dado de baja correctamente', data: socio })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      return reply.status(400).send({ error: message })
    }
  })

  // POST /api/socios/:id/solicitar-llaves — el propio socio solicita llaves
  fastify.post('/:id/solicitar-llaves', {
    preHandler: fastify.authenticate,
  }, async (request, reply) => {
    const { id } = request.params as { id: string }

    if (request.user.id !== id) {
      return reply.status(403).send({ error: 'Solo puedes solicitar llaves para tu propia cuenta' })
    }

    try {
      const socio = await sociosService.solicitarLlaves(id)
      return reply.send({ message: 'Solicitud de llaves enviada', data: socio })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      return reply.status(400).send({ error: message })
    }
  })

  // POST /api/socios/:id/aprobar-llaves — directiva aprueba solicitud de llaves
  fastify.post('/:id/aprobar-llaves', {
    preHandler: requireRoles(...ROLES.DIRECTIVA),
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const socio = await sociosService.aprobarLlaves(id, request.user.id)
      return reply.send({ message: 'Llaves aprobadas correctamente', data: socio })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      return reply.status(400).send({ error: message })
    }
  })
  // POST /api/socios/:id/devolver-llaves — directiva registra devolución de llaves
  fastify.post('/:id/devolver-llaves', {
    preHandler: requireRoles(...ROLES.DIRECTIVA),
  }, async (request, reply) => {
    const { id } = request.params as { id: string }
    try {
      const socio = await sociosService.devolverLlaves(id, request.user.id)
      return reply.send({ message: 'Llave devuelta correctamente', data: socio })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      return reply.status(400).send({ error: message })
    }
  })

  // POST /api/socios/grupos/:grupoId/aprobar — directiva aprueba solicitud grupal
  fastify.post('/grupos/:grupoId/aprobar', {
    preHandler: requireRoles(...ROLES.DIRECTIVA),
  }, async (request, reply) => {
    const { grupoId } = request.params as { grupoId: string }
    try {
      const resultado = await sociosService.aprobarGrupo(grupoId, request.user.id)
      return reply.send({ message: 'Solicitud grupal aprobada correctamente', data: resultado })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      const status = message.includes('no encontrada') ? 404 : 400
      return reply.status(status).send({ error: message })
    }
  })

  // POST /api/socios/grupos/:grupoId/rechazar — directiva rechaza solicitud grupal
  fastify.post('/grupos/:grupoId/rechazar', {
    preHandler: requireRoles(...ROLES.DIRECTIVA),
  }, async (request, reply) => {
    const { grupoId } = request.params as { grupoId: string }
    try {
      const resultado = await sociosService.rechazarGrupo(grupoId, request.user.id)
      return reply.send({ message: 'Solicitud grupal rechazada', data: resultado })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      const status = message.includes('no encontrada') ? 404 : 400
      return reply.status(status).send({ error: message })
    }
  })
}

export default sociosRoutes
