import { Router } from 'express'
import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { AuthService } from '../services/auth.service'
import { registerSchema, loginSchema } from '../schemas/auth.schema'
import { telegramAuthSchema } from '../schemas/telegram.schema'
import { authenticate, signToken } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads/transferencias')
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.jpg', '.jpeg', '.png', '.webp'])

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true })
    cb(null, UPLOADS_DIR)
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    cb(null, `${randomUUID()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ALLOWED_EXTENSIONS.has(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Formato de archivo no permitido. Usa PDF, JPG o PNG.'))
    }
  },
})

const router = Router()
const authService = new AuthService(prisma)

// POST /api/auth/register — multipart/form-data
router.post('/register', upload.single('comprobante'), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Debes adjuntar el comprobante de transferencia' })
    return
  }

  const dataRaw = req.body?.data
  if (!dataRaw) {
    fs.unlinkSync(req.file.path)
    res.status(400).json({ error: 'Datos del formulario no recibidos' })
    return
  }

  let body: unknown
  try {
    body = JSON.parse(dataRaw)
  } catch {
    fs.unlinkSync(req.file.path)
    res.status(400).json({ error: 'Datos del formulario con formato inválido' })
    return
  }

  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) {
    fs.unlinkSync(req.file.path)
    res.status(400).json({
      error: 'Datos inválidos',
      details: parsed.error.flatten().fieldErrors,
    })
    return
  }

  try {
    const usuario = await authService.register(parsed.data, req.file.filename)
    res.status(201).json({
      message: 'Solicitud de alta enviada correctamente. La directiva revisará tu solicitud.',
      data: usuario,
    })
  } catch (err) {
    fs.unlinkSync(req.file.path)
    const message = err instanceof Error ? err.message : 'Error al registrar'
    res.status(409).json({ error: message })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({
      error: 'Datos inválidos',
      details: parsed.error.flatten().fieldErrors,
    })
    return
  }

  try {
    const usuario = await authService.login(parsed.data)
    const token = signToken({ id: usuario.id, email: usuario.email, roles: usuario.roles })
    res.json({ data: { usuario, token } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al iniciar sesión'
    res.status(401).json({ error: message })
  }
})

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const usuario = await authService.getMe(req.user.id)
    res.json({ data: usuario })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    res.status(404).json({ error: message })
  }
})

// POST /api/auth/link-telegram
router.post('/link-telegram', authenticate, async (req, res) => {
  const parsed = telegramAuthSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }

  try {
    const result = await authService.linkTelegram(req.user.id, parsed.data)
    res.json({ data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al vincular Telegram'
    res.status(400).json({ error: message })
  }
})

// DELETE /api/auth/link-telegram
router.delete('/link-telegram', authenticate, async (req, res) => {
  try {
    await authService.unlinkTelegram(req.user.id)
    res.json({ data: { ok: true } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al desvincular Telegram'
    res.status(400).json({ error: message })
  }
})

// POST /api/auth/reset-password/request — público
router.post('/reset-password/request', async (req, res) => {
  const { email } = req.body
  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Email requerido' })
    return
  }
  try {
    const result = await authService.requestPasswordReset(email.toLowerCase().trim())
    res.json({ data: result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    res.status(500).json({ error: message })
  }
})

// POST /api/auth/reset-password/confirm — público
router.post('/reset-password/confirm', async (req, res) => {
  const { email, token, password } = req.body
  if (!email || !token || !password) {
    res.status(400).json({ error: 'Email, código y contraseña son obligatorios' })
    return
  }
  if (typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' })
    return
  }
  try {
    await authService.confirmPasswordReset(
      email.toLowerCase().trim(),
      String(token).trim(),
      password,
    )
    res.json({ data: { ok: true } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    res.status(400).json({ error: message })
  }
})

export default router
