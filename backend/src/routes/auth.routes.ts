import { FastifyPluginAsync } from 'fastify'
import { AuthService } from '../services/auth.service.js'
import { registerSchema, loginSchema } from '../schemas/auth.schema.js'

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify.prisma)

  // POST /api/auth/register
  fastify.post('/register', async (request, reply) => {
    const parsed = registerSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Datos inválidos',
        details: parsed.error.flatten().fieldErrors,
      })
    }

    try {
      const usuario = await authService.register(parsed.data)
      return reply.status(201).send({
        message: 'Solicitud de alta enviada correctamente. La directiva revisará tu solicitud.',
        data: usuario,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al registrar'
      return reply.status(409).send({ error: message })
    }
  })

  // POST /api/auth/login
  fastify.post('/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.status(400).send({
        error: 'Datos inválidos',
        details: parsed.error.flatten().fieldErrors,
      })
    }

    try {
      const usuario = await authService.login(parsed.data)
      const token = fastify.jwt.sign({
        id: usuario.id,
        email: usuario.email,
        roles: usuario.roles,
      })

      return reply.send({
        data: { usuario, token },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
      return reply.status(401).send({ error: message })
    }
  })

  // GET /api/auth/me
  fastify.get('/me', { preHandler: fastify.authenticate }, async (request, reply) => {
    try {
      const usuario = await authService.getMe(request.user.id)
      return reply.send({ data: usuario })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error'
      return reply.status(404).send({ error: message })
    }
  })
}

export default authRoutes
