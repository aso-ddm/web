import { Router } from 'express'
import { prisma } from '../lib/prisma'

const router = Router()

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

  if (!data || !chatId) {
    res.sendStatus(200)
    return
  }

  if (data.startsWith('confirm_avisos:')) {
    const userId = data.replace('confirm_avisos:', '')
    await prisma.usuario.updateMany({
      where: { id: userId, telegram_chat_id: BigInt(chatId) },
      data: { telegram_avisos_confirmado: true },
    })
    await answerCallback(botToken, callbackId, '✅ ¡Confirmado! Recibirás los avisos del club.')
  } else if (data.startsWith('cancel_avisos:')) {
    await answerCallback(botToken, callbackId, '❌ Cancelado. Puedes confirmar más adelante desde tu perfil.')
  } else {
    await answerCallback(botToken, callbackId, '')
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

interface TelegramUpdate {
  callback_query?: {
    id: string
    data?: string
    message?: {
      chat?: { id: number }
    }
  }
}

export default router
