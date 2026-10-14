import fs from 'fs'
import path from 'path'
import type { Prisma, PrismaClient } from '@prisma/client'

const RETENCION_DIAS = 90

export type TelegramRespuesta = { ok: boolean; description?: string; result?: unknown }

type Opciones = {
  /** Ruta de un archivo a adjuntar como `document` (multipart) */
  archivo?: string
  /** No guarda el mensaje en el log (p. ej. códigos de recuperación): ese error no se puede reintentar */
  sensible?: boolean
}

/** Registra un error del bot y purga los de más de 90 días. Nunca lanza: el log no debe romper el flujo */
export async function registrarErrorTelegram(
  prisma: PrismaClient,
  datos: { direccion: 'envio' | 'recepcion'; metodo: string; contexto: string; chat_id?: string | null; error: string; payload?: Prisma.InputJsonValue },
) {
  try {
    await prisma.telegramLog.create({ data: datos })
    await prisma.telegramLog.deleteMany({ where: { created_at: { lt: new Date(Date.now() - RETENCION_DIAS * 86_400_000) } } })
  } catch (err) {
    console.error('No se pudo registrar el error de Telegram:', err, datos.error)
  }
}

/**
 * Llama a un método de la Bot API. Nunca lanza: los fallos (red, ok:false, sin token)
 * vuelven como { ok: false, description } y quedan en TelegramLog.
 */
export async function telegram(
  prisma: PrismaClient,
  metodo: string,
  params: Record<string, unknown>,
  contexto: string,
  opciones: Opciones = {},
): Promise<TelegramRespuesta> {
  const token = process.env.BOT_TOKEN
  let respuesta: TelegramRespuesta
  try {
    if (!token) throw new Error('BOT_TOKEN no configurado')
    const url = `https://api.telegram.org/bot${token}/${metodo}`
    let init: RequestInit
    if (opciones.archivo) {
      const form = new FormData()
      for (const [k, v] of Object.entries(params)) form.append(k, String(v))
      form.append('document', await fs.openAsBlob(opciones.archivo), path.basename(opciones.archivo))
      init = { method: 'POST', body: form }
    } else {
      init = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) }
    }
    const r = await fetch(url, init)
    respuesta = await r.json().catch(() => ({ ok: false, description: `HTTP ${r.status} sin JSON` })) as TelegramRespuesta
  } catch (err) {
    respuesta = { ok: false, description: err instanceof Error ? err.message : String(err) }
  }

  if (!respuesta.ok) {
    await registrarErrorTelegram(prisma, {
      direccion: 'envio',
      metodo,
      contexto,
      chat_id: params.chat_id != null ? String(params.chat_id) : null,
      error: respuesta.description ?? 'Error desconocido',
      payload: opciones.sensible ? undefined : { params, archivo: opciones.archivo } as Prisma.InputJsonValue,
    })
  }
  return respuesta
}
