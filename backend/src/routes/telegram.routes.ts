import { Router } from 'express'
import { prisma } from '../lib/prisma'
import { requireRoles, ROLES } from '../middleware/auth'

const router = Router()
const BATCH_SIZE = 25

async function sendBatch(
  botToken: string,
  mensajes: Array<{ chat_id: string; text: string; parse_mode?: string }>,
): Promise<{ enviados: number; errores: number }> {
  let enviados = 0
  let errores = 0
  for (let i = 0; i < mensajes.length; i += BATCH_SIZE) {
    const batch = mensajes.slice(i, i + BATCH_SIZE)
    const results = await Promise.allSettled(
      batch.map((msg) =>
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(msg),
        }).then((r) => r.json() as Promise<{ ok: boolean }>),
      ),
    )
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value?.ok) enviados++
      else errores++
    }
  }
  return { enviados, errores }
}

// POST /api/telegram/anuncio — envía mensaje a socios con Telegram (todos o lista concreta)
router.post('/anuncio', requireRoles(...ROLES.DIRECTIVA_Y_VOCALES), async (req, res) => {
  const { mensaje, destinatarios } = req.body
  if (!mensaje || typeof mensaje !== 'string' || mensaje.trim().length === 0) {
    res.status(400).json({ error: 'El mensaje no puede estar vacío' })
    return
  }
  if (mensaje.trim().length > 4000) {
    res.status(400).json({ error: 'El mensaje no puede superar los 4000 caracteres' })
    return
  }
  const botToken = process.env.BOT_TOKEN
  if (!botToken) {
    res.status(500).json({ error: 'BOT_TOKEN no configurado' })
    return
  }

  const idsFiltro = Array.isArray(destinatarios) && destinatarios.length > 0 ? destinatarios : undefined

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
    .map((s) => ({ chat_id: s.telegram_chat_id!.toString(), text: mensaje.trim(), parse_mode: 'HTML' }))

  const { enviados, errores } = await sendBatch(botToken, mensajes)
  res.json({ data: { enviados, errores, total: socios.length } })
})

// POST /api/telegram/recordatorio-pago — envía recordatorio de cuota (tesorero)
router.post('/recordatorio-pago', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const botToken = process.env.BOT_TOKEN
  if (!botToken) {
    res.status(500).json({ error: 'BOT_TOKEN no configurado' })
    return
  }

  const { destinatarios } = req.body
  const idsFiltro = Array.isArray(destinatarios) && destinatarios.length > 0 ? destinatarios : undefined

  const [socios, configIndividual, configAdicional, configIban] = await Promise.all([
    prisma.usuario.findMany({
      where: {
        telegram_chat_id: { not: null },
        estado: 'activo',
        ...(idsFiltro ? { id: { in: idsFiltro } } : {}),
      },
      select: { telegram_chat_id: true, nombre: true, tipo_cuota: true },
    }),
    prisma.configuracion.findUnique({ where: { clave: 'precio_cuota_individual' } }),
    prisma.configuracion.findUnique({ where: { clave: 'precio_cuota_adicional' } }),
    prisma.configuracion.findUnique({ where: { clave: 'iban_club' } }),
  ])

  const precioIndividual = configIndividual?.valor ?? '15'
  const precioAdicional = configAdicional?.valor ?? '5'
  const iban = configIban?.valor ?? 'IBAN no configurado'

  const mensajes = socios
    .filter((s) => s.telegram_chat_id)
    .map((s) => {
      const precio = s.tipo_cuota === 'individual' ? precioIndividual : precioAdicional
      return {
        chat_id: s.telegram_chat_id!.toString(),
        text: `🐉 <b>Recordatorio de cuota — Dragón de Madera</b>\n\nHola ${s.nombre}, recuerda realizar el pago de tu cuota mensual de <b>${precio}€</b> entre el día 1 y el 15 del mes.\n\nTransferencia al IBAN: <code>${iban}</code>\n\n¡Gracias!`,
        parse_mode: 'HTML',
      }
    })

  const { enviados, errores } = await sendBatch(botToken, mensajes)
  res.json({ data: { enviados, errores, total: socios.length } })
})

// POST /api/telegram/webhook — recibe updates del bot de Telegram
router.post('/webhook', async (req, res) => {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (secret) {
    const header = req.headers['x-telegram-bot-api-secret-token']
    if (header !== secret) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }
  }

  const update = req.body as TelegramUpdate
  const botToken = process.env.BOT_TOKEN

  if (!botToken || !update.callback_query) {
    res.sendStatus(200)
    return
  }

  const { id: callbackId, data, message } = update.callback_query
  const chatId = message?.chat?.id
  const messageId = message?.message_id

  if (!data || !chatId) {
    res.sendStatus(200)
    return
  }

  if (data.startsWith('confirm_avisos:')) {
    const userId = data.replace('confirm_avisos:', '')
    await prisma.usuario.updateMany({
      where: { id: userId, telegram_chat_id: BigInt(chatId) },
      data: {},
    })
    await answerCallback(botToken, callbackId, '✅ ¡Confirmado! Recibirás los avisos del club.')
  } else if (data.startsWith('cancel_avisos:')) {
    await answerCallback(botToken, callbackId, '❌ Cancelado. Puedes confirmar más adelante desde tu perfil.')
  } else {
    await answerCallback(botToken, callbackId, '')
  }

  if (messageId) {
    await removeInlineKeyboard(botToken, chatId, messageId)
  }

  res.sendStatus(200)
})

async function answerCallback(token: string, callbackQueryId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  })
}

async function removeInlineKeyboard(token: string, chatId: number, messageId: number) {
  await fetch(`https://api.telegram.org/bot${token}/editMessageReplyMarkup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } }),
  })
}

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
