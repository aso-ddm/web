import { Router } from 'express'
import { z } from 'zod'
import { Prisma, Rol } from '@prisma/client'
import { prisma } from '../lib/prisma'
import { requireRoles, ROLES } from '../middleware/auth'
import { HttpError } from '../lib/httpError'
import { registrarErrorTelegram, telegram } from '../lib/telegram'
import { igualesSeguro } from '../lib/seguridad'
import { paginacion, paginado } from '../lib/paginacion'

const router = Router()
// Telegram admite ~30 mensajes/s a chats distintos: lotes de 25 con 1 s entre lotes
const BATCH_SIZE = 25
const PAUSA_ENTRE_LOTES_MS = 1000
const BOT_TOKEN = process.env.BOT_TOKEN

async function sendBatch(
  mensajes: Array<{ chat_id: string; text: string; parse_mode?: string }>,
): Promise<{ enviados: number; errores: number }> {
  let enviados = 0
  let errores = 0
  for (let i = 0; i < mensajes.length; i += BATCH_SIZE) {
    if (i > 0) await new Promise((r) => setTimeout(r, PAUSA_ENTRE_LOTES_MS))
    const batch = mensajes.slice(i, i + BATCH_SIZE)
    const results = await Promise.all(batch.map((msg) => telegram(prisma, 'sendMessage', msg, 'anuncio')))
    for (const r of results) {
      if (r.ok) enviados++
      else errores++
    }
  }
  return { enviados, errores }
}

const anuncioSchema = z.object({
  mensaje: z.string().trim().min(1, 'El mensaje no puede estar vacío').max(4000, 'El mensaje no puede superar los 4000 caracteres'),
  destinatarios: z.array(z.string().uuid()).optional(),
})

// POST /api/telegram/anuncio — envía mensaje a socios con Telegram (todos o lista concreta)
// ponytail: se envía dentro de la petición para devolver enviados/errores; con la pausa entre lotes caben
// ~1.400 destinatarios en el timeout de 60 s de nginx. Por encima, pasar a envío en segundo plano.
router.post('/anuncio', requireRoles(...ROLES.DIRECTIVA_Y_VOCALES), async (req, res) => {
  const { mensaje, destinatarios } = anuncioSchema.parse(req.body)
  if (!BOT_TOKEN) throw new HttpError(500, 'BOT_TOKEN no configurado')

  const idsFiltro = destinatarios?.length ? destinatarios : undefined

  const socios = await prisma.usuario.findMany({
    where: {
      telegram_chat_id: { not: null },
      estado: 'activo',
      ...(idsFiltro ? { id: { in: idsFiltro } } : {}),
    },
    select: { telegram_chat_id: true },
  })

  const mensajes = socios
    .filter((s) => s.telegram_chat_id)
    .map((s) => ({ chat_id: s.telegram_chat_id!.toString(), text: mensaje, parse_mode: 'HTML' }))

  const { enviados, errores } = await sendBatch(mensajes)
  res.json({ data: { enviados, errores, total: socios.length } })
})

// POST /api/telegram/bienvenida/:socioId — envía bienvenida Telegram a un socio (directiva)
router.post('/bienvenida/:socioId', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const socio = await prisma.usuario.findUnique({
    where: { id: req.params.socioId },
    select: { telegram_chat_id: true, nombre: true },
  })
  if (!socio) { res.status(404).json({ error: 'Socio no encontrado' }); return }
  if (!socio.telegram_chat_id) { res.status(400).json({ error: 'Este socio no tiene Telegram vinculado' }); return }
  if (!BOT_TOKEN) { res.status(500).json({ error: 'BOT_TOKEN no configurado' }); return }
  const texto = `¡Hola, ${socio.nombre}! 👋\n\nGracias por vincular tu cuenta de Telegram con tu perfil de Dragón de Madera.\n\n¿Confirmas que deseas recibir los avisos del club por aquí? 🐉`
  const data = await telegram(prisma, 'sendMessage', {
    chat_id: socio.telegram_chat_id.toString(),
    text: texto,
    reply_markup: { inline_keyboard: [[
      { text: '✅ Confirmar', callback_data: `confirm_avisos:${req.params.socioId}` },
      { text: '❌ Cancelar', callback_data: `cancel_avisos:${req.params.socioId}` },
    ]] },
  }, 'bienvenida')
  if (!data.ok) { res.status(502).json({ error: `Error de Telegram: ${data.description ?? 'desconocido'}` }); return }
  res.json({ message: 'Mensaje enviado correctamente' })
})

// POST /api/telegram/webhook — recibe updates del bot de Telegram
router.post('/webhook', async (req, res) => {
  // Sin secreto configurado cualquiera podría enviar updates falsos: se rechaza todo
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  const recibido = req.headers['x-telegram-bot-api-secret-token']
  if (!secret || typeof recibido !== 'string' || !igualesSeguro(recibido, secret)) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const update = req.body as TelegramUpdate
  // Siempre 200: si Telegram recibe un error reintenta el mismo update una y otra vez
  try {
    await procesarUpdate(update)
  } catch (err) {
    await registrarErrorTelegram(prisma, {
      direccion: 'recepcion',
      metodo: 'webhook',
      contexto: update.callback_query?.data?.split(':')[0] ?? 'update',
      chat_id: update.callback_query?.message?.chat?.id?.toString() ?? null,
      error: err instanceof Error ? err.message : String(err),
      payload: update as Prisma.InputJsonValue,
    })
  }
  res.sendStatus(200)
})

async function procesarUpdate(update: TelegramUpdate) {
  if (!update.callback_query) return

  const { id: callbackId, data, message } = update.callback_query
  const chatId = message?.chat?.id
  const messageId = message?.message_id
  if (!data || !chatId) return

  // Botones de mensajes antiguos (la columna avisos_confirmado ya no existe)
  const texto = data.startsWith('confirm_avisos:') ? '✅ ¡Confirmado! Recibirás los avisos del club.'
    : data.startsWith('cancel_avisos:') ? '❌ Cancelado. Puedes confirmar más adelante desde tu perfil.'
    : ''
  await telegram(prisma, 'answerCallbackQuery', { callback_query_id: callbackId, text: texto }, 'webhook')

  if (messageId) {
    await telegram(prisma, 'editMessageReplyMarkup', { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } }, 'webhook')
  }
}

// ── Administración: estado del bot y log de errores ─────────────────────────

// GET /api/telegram/estado — lo que Telegram sabe del bot (token válido, webhook, último error)
router.get('/estado', requireRoles(Rol.administrador), async (_req, res) => {
  if (!BOT_TOKEN) throw new HttpError(500, 'BOT_TOKEN no configurado')
  // ponytail: sin pasar por telegram() para no llenar el log con las consultas del propio panel
  const llamar = (metodo: string) => fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${metodo}`)
    .then((r) => r.json() as Promise<{ ok: boolean; description?: string; result?: Record<string, unknown> }>)
    .catch((err: Error) => ({ ok: false, description: err.message, result: undefined }))
  const [me, webhook] = await Promise.all([llamar('getMe'), llamar('getWebhookInfo')])
  res.json({ data: { me, webhook } })
})

const filtrosLogSchema = z.object({
  direccion: z.enum(['envio', 'recepcion']).optional(),
  contexto: z.string().optional(),
  desde: z.coerce.date().optional(),
  hasta: z.coerce.date().optional(),
  ...paginacion(50, 200),
})

// GET /api/telegram/logs — errores registrados, más recientes primero
router.get('/logs', requireRoles(Rol.administrador), async (req, res) => {
  const filtros = filtrosLogSchema.parse(req.query)
  const { direccion, contexto, desde, hasta, page, limit } = filtros
  const where: Prisma.TelegramLogWhereInput = {
    direccion,
    contexto,
    created_at: desde || hasta ? { gte: desde, lte: hasta } : undefined,
  }
  const [data, total, contextos] = await Promise.all([
    prisma.telegramLog.findMany({ where, orderBy: { created_at: 'desc' }, skip: (page - 1) * limit, take: limit }),
    prisma.telegramLog.count({ where }),
    prisma.telegramLog.findMany({ distinct: ['contexto'], select: { contexto: true }, orderBy: { contexto: 'asc' } }),
  ])
  res.json({ ...paginado(data, total, filtros), contextos: contextos.map((c) => c.contexto) })
})

// POST /api/telegram/logs/:id/reintentar — vuelve a enviar un mensaje que falló (si falla otra vez, genera otro log)
router.post('/logs/:id/reintentar', requireRoles(Rol.administrador), async (req, res) => {
  const log = await prisma.telegramLog.findUniqueOrThrow({ where: { id: req.params.id } })
  const payload = log.payload as { params?: Record<string, unknown>; archivo?: string } | null
  if (log.direccion !== 'envio' || !payload?.params) throw new HttpError(400, 'Este error no se puede reintentar')

  const r = await telegram(prisma, log.metodo, payload.params, log.contexto, { archivo: payload.archivo })
  if (!r.ok) throw new HttpError(502, `Telegram sigue fallando: ${r.description ?? 'desconocido'}`)
  const actualizado = await prisma.telegramLog.update({ where: { id: log.id }, data: { reintentado_at: new Date() } })
  res.json({ data: actualizado })
})

interface TelegramUpdate {
  callback_query?: {
    id: string
    data?: string
    message?: {
      message_id: number
      chat?: { id: number }
    }
  }
}

export default router
