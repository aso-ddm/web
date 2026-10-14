import { Router } from 'express'
import multer from 'multer'
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { AuthService } from '../services/auth.service'
import { registerSchema, loginSchema, solicitudSchema, resetRequestSchema, resetConfirmSchema } from '../schemas/auth.schema'
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

  // Cualquier fallo (datos, duplicado, BD) borra el comprobante subido y sigue al errorHandler
  try {
    if (!req.body?.data) throw new HttpError(400, 'Datos del formulario no recibidos')
    const data = registerSchema.parse(JSON.parse(req.body.data))
    const usuario = await authService.register(data, req.file.filename)
    res.status(201).json({
      message: 'Solicitud de alta enviada correctamente. La directiva revisará tu solicitud.',
      data: usuario,
    })
  } catch (err) {
    fs.promises.unlink(req.file.path).catch(() => {})
    if (err instanceof SyntaxError) throw new HttpError(400, 'Datos del formulario con formato inválido')
    throw err
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

  const usuario = await authService.login(parsed.data)
  const token = signToken({ id: usuario.id, email: usuario.email, roles: usuario.roles })
  res.json({ data: { usuario, token } })
})

// POST /api/auth/telegram — login con los datos firmados del widget (solo cuentas ya vinculadas)
router.post('/telegram', loginLimit, async (req, res) => {
  const parsed = telegramAuthSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }

  const usuario = await authService.loginTelegram(parsed.data)
  const token = signToken({ id: usuario.id, email: usuario.email, roles: usuario.roles })
  res.json({ data: { usuario, token } })
})

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  const usuario = await authService.getMe(req.user.id)
  res.json({ data: usuario })
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

  const result = await authService.linkTelegram(req.user.id, parsed.data)
  res.json({ data: result })
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

// POST /api/auth/reset-password/request — público
router.post('/reset-password/request', resetRequestLimit, async (req, res) => {
  const { email } = resetRequestSchema.parse(req.body)
  await authService.requestPasswordReset(email)
  res.json({ data: { ok: true } })
})

// POST /api/auth/reset-password/confirm — público
router.post('/reset-password/confirm', resetConfirmLimit, async (req, res) => {
  const { email, token, password } = resetConfirmSchema.parse(req.body)
  await authService.confirmPasswordReset(email, token, password)
  res.json({ data: { ok: true } })
})

export default router
