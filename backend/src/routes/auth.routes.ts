import { Router } from 'express'
import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { AuthService } from '../services/auth.service'
import { registerSchema, loginSchema, passwordSchema, solicitudSchema } from '../schemas/auth.schema'
import { telegramAuthSchema } from '../schemas/telegram.schema'
import { authenticate, authenticatePendiente, signToken } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { HttpError } from '../lib/httpError'
import { rateLimit } from '../middleware/rateLimit'

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
      cb(new HttpError(400, 'Formato de archivo no permitido. Usa PDF, JPG, PNG o WebP.'))
    }
  },
})

const router = Router()

const MIN = 60 * 1000
// Login generoso: en el local del club muchos socios comparten IP
const loginLimit = rateLimit({ max: 30, windowMs: 15 * MIN })
const registerLimit = rateLimit({ max: 5, windowMs: 60 * MIN })
// Contadores separados: pedir, fallar, reenviar y confirmar ya agotaba un límite común de 5
// (y en el club varios socios comparten IP). Fuerza bruta no hay: el código se anula al primer fallo
const resetRequestLimit = rateLimit({ max: 5, windowMs: 15 * MIN })
const resetConfirmLimit = rateLimit({ max: 10, windowMs: 15 * MIN })
// Evita que un socio sature al secretario a avisos
const pedirLlavesLimit = rateLimit({ max: 3, windowMs: 60 * MIN })
const pedirBajaLimit = rateLimit({ max: 3, windowMs: 60 * MIN })
const authService = new AuthService(prisma)

// POST /api/auth/register — multipart/form-data
router.post('/register', registerLimit, upload.single('comprobante'), async (req, res) => {
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
router.post('/login', loginLimit, async (req, res) => {
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

// POST /api/auth/telegram — login con los datos firmados del widget (solo cuentas ya vinculadas)
router.post('/telegram', loginLimit, async (req, res) => {
  const parsed = telegramAuthSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }

  try {
    const usuario = await authService.loginTelegram(parsed.data)
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

// GET /api/auth/solicitud — la solicitud de alta propia, mientras está pendiente
router.get('/solicitud', authenticatePendiente, async (req, res) => {
  res.json({ data: await authService.getSolicitud(req.user.id) })
})

// PUT /api/auth/solicitud — multipart/form-data: data (JSON) + comprobante opcional
router.put('/solicitud', authenticatePendiente, upload.single('comprobante'), async (req, res) => {
  try {
    const data = solicitudSchema.parse(JSON.parse(req.body?.data ?? 'null'))
    res.json({ data: await authService.updateSolicitud(req.user.id, data, req.file?.filename) })
  } catch (err) {
    if (req.file) fs.promises.unlink(req.file.path).catch(() => {})
    if (err instanceof SyntaxError) throw new HttpError(400, 'Datos del formulario con formato inválido')
    throw err
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

// POST /api/auth/pedir-llaves — avisa al secretario por Telegram
router.post('/pedir-llaves', pedirLlavesLimit, authenticate, async (req, res) => {
  await authService.pedirLlaves(req.user.id)
  res.json({ data: { ok: true } })
})

// POST /api/auth/pedir-baja — avisa al secretario por Telegram
router.post('/pedir-baja', pedirBajaLimit, authenticate, async (req, res) => {
  await authService.pedirBaja(req.user.id)
  res.json({ data: { ok: true } })
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
router.post('/reset-password/request', resetRequestLimit, async (req, res) => {
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
router.post('/reset-password/confirm', resetConfirmLimit, async (req, res) => {
  const { email, token, password } = req.body
  if (!email || !token || !password) {
    res.status(400).json({ error: 'Email, código y contraseña son obligatorios' })
    return
  }
  const passwordCheck = passwordSchema.safeParse(password)
  if (!passwordCheck.success) {
    res.status(400).json({ error: passwordCheck.error.issues[0].message })
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
