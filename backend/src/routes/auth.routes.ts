import { FastifyPluginAsync } from 'fastify'
import { pipeline } from 'node:stream/promises'
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { AuthService } from '../services/auth.service.js'
import { registerSchema, loginSchema } from '../schemas/auth.schema.js'

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads/transferencias')

// Extensiones permitidas para el comprobante
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp'])

async function saveComprobante(file: {
  filename: string
  mimetype: string
  file: NodeJS.ReadableStream
}): Promise<string> {
  const ext = path.extname(file.filename).toLowerCase()
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error('Formato de archivo no permitido. Usa PDF, JPG o PNG.')
  }
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
  const filename = `${randomUUID()}${ext}`
  const dest = path.join(UPLOADS_DIR, filename)
  await pipeline(file.file, fs.createWriteStream(dest))
  return filename
}

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authService = new AuthService(fastify.prisma)

  // POST /api/auth/register — multipart/form-data
  // Campos: data (JSON string con todos los campos), comprobante (archivo)
  fastify.post('/register', async (request, reply) => {
    let dataRaw: string | undefined
    let comprobanteFilename: string | undefined

    try {
      for await (const part of request.parts()) {
        if (part.type === 'file' && part.fieldname === 'comprobante') {
          comprobanteFilename = await saveComprobante(part)
        } else if (part.type === 'field' && part.fieldname === 'data') {
          dataRaw = part.value as string
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al procesar el archivo'
      return reply.status(400).send({ error: msg })
    }

    if (!comprobanteFilename) {
      return reply.status(400).send({ error: 'Debes adjuntar el comprobante de transferencia' })
    }
    if (!dataRaw) {
      return reply.status(400).send({ error: 'Datos del formulario no recibidos' })
    }

    let body: unknown
    try {
      body = JSON.parse(dataRaw)
    } catch {
      return reply.status(400).send({ error: 'Datos del formulario con formato inválido' })
    }

    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      // Limpiar archivo si la validación falla
      try { fs.unlinkSync(path.join(UPLOADS_DIR, comprobanteFilename)) } catch { /* ignore */ }
      return reply.status(400).send({
        error: 'Datos inválidos',
        details: parsed.error.flatten().fieldErrors,
      })
    }

    try {
      const usuario = await authService.register(parsed.data, comprobanteFilename)
      return reply.status(201).send({
        message: 'Solicitud de alta enviada correctamente. La directiva revisará tu solicitud.',
        data: usuario,
      })
    } catch (err) {
      // Limpiar archivo si el registro falla
      try { fs.unlinkSync(path.join(UPLOADS_DIR, comprobanteFilename)) } catch { /* ignore */ }
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
