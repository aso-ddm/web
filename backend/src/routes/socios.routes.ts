import { Router } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { SociosService } from '../services/socios.service'
import {
  updateSocioSchema,
  updateRolesSchema,
  filtrosSociosSchema,
} from '../schemas/socio.schema'
import { authenticate, requireRoles, ROLES } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads/transferencias')

const router = Router()
const sociosService = new SociosService(prisma)

// GET /api/socios — listado con filtros (directiva + vocales)
router.get('/', requireRoles(...ROLES.DIRECTIVA_Y_VOCALES), async (req, res) => {
  const parsed = filtrosSociosSchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ error: 'Parámetros inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  const result = await sociosService.getAll(parsed.data)
  res.json(result)
})

// GET /api/socios/pendientes — solo directiva
router.get('/pendientes', requireRoles(...ROLES.DIRECTIVA), async (_req, res) => {
  const pendientes = await sociosService.getPendientes()
  res.json({ data: pendientes })
})

// GET /api/socios/me — perfil propio
router.get('/me', authenticate, async (req, res) => {
  try {
    const socio = await sociosService.getById(req.user.id)
    res.json({ data: socio })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    res.status(404).json({ error: message })
  }
})

// GET /api/socios/:id/comprobante — directiva descarga comprobante
router.get('/:id/comprobante', requireRoles(...ROLES.DIRECTIVA_Y_VOCALES), async (req, res) => {
  const { id } = req.params
  const socio = await prisma.usuario.findUnique({
    where: { id },
    select: { comprobante_transferencia: true, nombre: true, apellidos: true },
  })
  if (!socio) {
    res.status(404).json({ error: 'Socio no encontrado' })
    return
  }
  if (!socio.comprobante_transferencia) {
    res.status(404).json({ error: 'Este socio no tiene comprobante adjunto' })
    return
  }
  const filePath = path.join(UPLOADS_DIR, socio.comprobante_transferencia)
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Archivo no encontrado en el servidor' })
    return
  }
  const ext = path.extname(socio.comprobante_transferencia).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
  }
  const contentType = mimeTypes[ext] ?? 'application/octet-stream'
  const nombreArchivo = `comprobante_${socio.nombre}_${socio.apellidos}${ext}`.replace(/\s+/g, '_')
  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Disposition', `inline; filename="${nombreArchivo}"`)
  fs.createReadStream(filePath).pipe(res)
})

// GET /api/socios/:id — ver socio (directiva ve cualquiera; socio solo el suyo)
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params
  const isDirectivaOVocal = ROLES.DIRECTIVA_Y_VOCALES.some(r => req.user.roles.includes(r))
  if (!isDirectivaOVocal && req.user.id !== id) {
    res.status(403).json({ error: 'No tienes permisos para ver este perfil' })
    return
  }
  try {
    const socio = await sociosService.getById(id)
    res.json({ data: socio })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    res.status(404).json({ error: message })
  }
})

// PUT /api/socios/:id — editar socio
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params
  const isDirectiva = ROLES.DIRECTIVA.some(r => req.user.roles.includes(r))
  if (!isDirectiva && req.user.id !== id) {
    res.status(403).json({ error: 'No puedes editar este perfil' })
    return
  }
  const parsed = updateSocioSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    const socio = await sociosService.update(id, parsed.data)
    res.json({ data: socio })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    res.status(404).json({ error: message })
  }
})

// PUT /api/socios/:id/roles — solo directiva
router.put('/:id/roles', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const { id } = req.params
  const parsed = updateRolesSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    const socio = await sociosService.updateRoles(id, parsed.data.roles)
    res.json({ data: socio })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    res.status(404).json({ error: message })
  }
})

// POST /api/socios/:id/aprobar
router.post('/:id/aprobar', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const { id } = req.params
  try {
    const socio = await sociosService.aprobar(id, req.user.id)
    res.json({ message: 'Socio aprobado correctamente', data: socio })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    res.status(400).json({ error: message })
  }
})

// POST /api/socios/:id/rechazar
router.post('/:id/rechazar', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const { id } = req.params
  try {
    const socio = await sociosService.rechazar(id, req.user.id)
    res.json({ message: 'Solicitud rechazada', data: socio })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    res.status(400).json({ error: message })
  }
})

// POST /api/socios/:id/baja
router.post('/:id/baja', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const { id } = req.params
  try {
    const socio = await sociosService.darDeBaja(id, req.user.id)
    res.json({ message: 'Socio dado de baja correctamente', data: socio })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    res.status(400).json({ error: message })
  }
})

// POST /api/socios/:id/solicitar-llaves
router.post('/:id/solicitar-llaves', authenticate, async (req, res) => {
  const { id } = req.params
  if (req.user.id !== id) {
    res.status(403).json({ error: 'Solo puedes solicitar llaves para tu propia cuenta' })
    return
  }
  try {
    const socio = await sociosService.solicitarLlaves(id)
    res.json({ message: 'Solicitud de llaves enviada', data: socio })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    res.status(400).json({ error: message })
  }
})

// POST /api/socios/:id/aprobar-llaves
router.post('/:id/aprobar-llaves', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const { id } = req.params
  try {
    const socio = await sociosService.aprobarLlaves(id, req.user.id)
    res.json({ message: 'Llaves aprobadas correctamente', data: socio })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    res.status(400).json({ error: message })
  }
})

// POST /api/socios/:id/devolver-llaves
router.post('/:id/devolver-llaves', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const { id } = req.params
  try {
    const socio = await sociosService.devolverLlaves(id, req.user.id)
    res.json({ message: 'Llave devuelta correctamente', data: socio })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    res.status(400).json({ error: message })
  }
})

// POST /api/socios/:id/telegram/bienvenida — envía mensaje de bienvenida por Telegram
router.post('/:id/telegram/bienvenida', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const { id } = req.params
  const socio = await prisma.usuario.findUnique({
    where: { id },
    select: { telegram_chat_id: true, nombre: true },
  })
  if (!socio) {
    res.status(404).json({ error: 'Socio no encontrado' })
    return
  }
  if (!socio.telegram_chat_id) {
    res.status(400).json({ error: 'Este socio no tiene Telegram vinculado' })
    return
  }
  const botToken = process.env.BOT_TOKEN
  if (!botToken) {
    res.status(500).json({ error: 'BOT_TOKEN no configurado' })
    return
  }
  const texto = `¡Hola, ${socio.nombre}! 👋\n\nGracias por vincular tu cuenta de Telegram con tu perfil de Dragón de Madera.\n\n¿Confirmas que deseas recibir los avisos del club por aquí? 🐉`
  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: socio.telegram_chat_id.toString(),
      text: texto,
      reply_markup: {
        inline_keyboard: [[
          { text: '✅ Confirmar', callback_data: `confirm_avisos:${id}` },
          { text: '❌ Cancelar', callback_data: `cancel_avisos:${id}` },
        ]],
      },
    }),
  })
  const data = await response.json() as { ok: boolean; description?: string }
  if (!data.ok) {
    res.status(502).json({ error: `Error de Telegram: ${data.description ?? 'desconocido'}` })
    return
  }
  res.json({ message: 'Mensaje enviado correctamente' })
})

// POST /api/socios/grupos/:grupoId/aprobar
router.post('/grupos/:grupoId/aprobar', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const { grupoId } = req.params
  try {
    const resultado = await sociosService.aprobarGrupo(grupoId, req.user.id)
    res.json({ message: 'Solicitud grupal aprobada correctamente', data: resultado })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    const status = message.includes('no encontrada') ? 404 : 400
    res.status(status).json({ error: message })
  }
})

// POST /api/socios/grupos/:grupoId/rechazar
router.post('/grupos/:grupoId/rechazar', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const { grupoId } = req.params
  try {
    const resultado = await sociosService.rechazarGrupo(grupoId, req.user.id)
    res.json({ message: 'Solicitud grupal rechazada', data: resultado })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    const status = message.includes('no encontrada') ? 404 : 400
    res.status(status).json({ error: message })
  }
})

export default router
