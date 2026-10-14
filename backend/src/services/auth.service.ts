import { PrismaClient, Rol } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { RegisterInput, LoginInput, SolicitudInput } from '../schemas/auth.schema'
import { TelegramAuthInput } from '../schemas/telegram.schema'
import { HttpError } from '../lib/httpError'
import { igualesSeguro } from '../lib/seguridad'
import { eventos } from '../lib/eventos'
import { telegram } from '../lib/telegram'

function verifyTelegramData(data: TelegramAuthInput, botToken: string): boolean {
  const { hash, ...rest } = data
  const checkString = (Object.keys(rest) as (keyof typeof rest)[])
    .sort()
    .map(k => `${k}=${rest[k]}`)
    .join('\n')
  const secretKey = crypto.createHash('sha256').update(botToken).digest()
  const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex')
  return igualesSeguro(hmac, hash)
}

// Firma + caducidad (24h) de los datos del widget. Devuelve el id de Telegram como BigInt
function checkTelegram(data: TelegramAuthInput): bigint {
  const botToken = process.env.BOT_TOKEN?.trim()
  if (!botToken) throw new Error('BOT_TOKEN no configurado')
  if (!verifyTelegramData(data, botToken)) throw new HttpError(400, 'Firma de Telegram inválida')
  if (Math.floor(Date.now() / 1000) - data.auth_date > 86400) {
    throw new HttpError(400, 'La autenticación de Telegram ha expirado, vuelve a intentarlo')
  }
  return BigInt(data.id)
}

const SALT_ROUNDS = 12

const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Envía un mensaje HTML a los secretarios activos con Telegram vinculado. Con `archivo`, lo adjunta
// como documento y el texto va de pie (máx. 1024 caracteres). Devuelve si llegó a alguno
async function avisarSecretarios(prisma: PrismaClient, contexto: string, texto: string, archivo?: string): Promise<boolean> {
  if (!process.env.BOT_TOKEN) throw new Error('BOT_TOKEN no configurado')

  const secretarios = await prisma.usuario.findMany({
    where: { roles: { has: Rol.secretario }, estado: 'activo', telegram_chat_id: { not: null } },
    select: { telegram_chat_id: true },
  })

  const resultados = await Promise.all(secretarios.map((s) => {
    const chat_id = s.telegram_chat_id!.toString()
    return archivo
      ? telegram(prisma, 'sendDocument', { chat_id, caption: texto, parse_mode: 'HTML' }, contexto, { archivo })
      : telegram(prisma, 'sendMessage', { chat_id, text: texto, parse_mode: 'HTML' }, contexto)
  }))
  return resultados.some((r) => r.ok)
}
export const MESES_PARA_LLAVES = 6

/** Fecha a partir de la cual el socio puede pedir llaves (fecha de alta + 6 meses) */
export function fechaPuedePedirLlaves(fechaAlta: Date): Date {
  const d = new Date(fechaAlta)
  d.setMonth(d.getMonth() + MESES_PARA_LLAVES)
  return d
}

export const DIAS_ENTRE_SOLICITUDES_LLAVES = 30

/** Fecha a partir de la cual el socio puede volver a pedir llaves (30 días exactos tras la última solicitud) */
export function fechaPuedeRepetirSolicitudLlaves(solicitadas: Date): Date {
  return new Date(solicitadas.getTime() + DIAS_ENTRE_SOLICITUDES_LLAVES * 86_400_000)
}

const SESSION_SELECT = { id: true, email: true, nombre: true, apellidos: true, roles: true, estado: true } as const

// Búsqueda sin distinguir mayúsculas: hay cuentas antiguas guardadas con mayúsculas
const porEmail = (email: string) => ({ email: { equals: email.trim(), mode: 'insensitive' as const } })

// Con contraseña entra también una solicitud pendiente, pero solo a editar su formulario (authenticatePendiente)
function comprobarEstado<T extends { estado: string }>(usuario: T, permitirPendiente = false): T {
  if (usuario.estado === 'baja') throw new HttpError(403, 'Esta cuenta ha sido dada de baja')
  if (usuario.estado === 'pendiente' && !permitirPendiente) throw new HttpError(403, 'Tu solicitud está pendiente de aprobación por la directiva')
  return usuario
}

const SOLICITUD_SELECT = {
  nombre: true, apellidos: true, dni: true, email: true, telefono: true, fecha_nacimiento: true,
  direccion: true, apodo: true, consentimiento_tiendas: true, tipo_cuota: true, comprobante_transferencia: true,
  solicitud_grupal: { select: { id: true, comprobante_transferencia: true } },
} as const

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(data: RegisterInput, comprobanteFilename: string) {
    const resultado = data.tipo_cuota === 'conjunta'
      ? await this.registerConjunta(data, comprobanteFilename)
      : await this.registerIndividual(data, comprobanteFilename)

    eventos.emit('cambio', 'pendientes')

    // Aviso al secretario sin bloquear ni hacer fallar el alta si Telegram no responde
    const miembros = data.tipo_cuota === 'conjunta' ? data.miembros_adicionales.length : 0
    const texto =
      `📝 <b>Nueva solicitud de alta</b>

` +
      `${esc(`${data.nombre} ${data.apellidos}`)} (${esc(data.email)})
` +
      `Cuota: ${data.tipo_cuota}${miembros ? ` (+${miembros} miembro${miembros > 1 ? 's' : ''})` : ''}

` +
      `Revísala en Directiva → Solicitudes.`
    const comprobante = path.resolve(process.cwd(), 'uploads/transferencias', comprobanteFilename)
    avisarSecretarios(this.prisma, 'aviso_alta', texto, comprobante).catch((err) => console.error('Aviso de alta por Telegram:', err))

    return resultado
  }

  private async registerIndividual(data: Extract<RegisterInput, { tipo_cuota: 'individual' }>, comprobanteFilename: string) {
    const existing = await this.prisma.usuario.findFirst({
      where: porEmail(data.email),
    })
    if (existing) {
      throw new HttpError(409, `Ya existe una cuenta con ese email: ${data.email}`)
    }

    const existingDni = await this.prisma.usuario.findUnique({
      where: { dni: data.dni },
    })
    if (existingDni) {
      throw new HttpError(409, `Ya existe una cuenta con ese DNI: ${data.dni}`)
    }

    const password_hash = await bcrypt.hash(data.password, SALT_ROUNDS)
    const { password: _, ...rest } = data

    const usuario = await this.prisma.usuario.create({
      data: {
        ...rest,
        password_hash,
        comprobante_transferencia: comprobanteFilename,
        roles: [Rol.socio_basico],
        estado: 'pendiente',
        fecha_nacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : undefined,
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellidos: true,
        roles: true,
        estado: true,
        created_at: true,
      },
    })

    return usuario
  }

  private async registerConjunta(data: Extract<RegisterInput, { tipo_cuota: 'conjunta' }>, comprobanteFilename: string) {
    const { miembros_adicionales, tipo_cuota: _t, ...primero } = data
    const personas = [primero, ...miembros_adicionales]

    // Duplicados dentro del propio formulario
    const repetido = <T,>(xs: T[]) => xs.find((x, i) => xs.indexOf(x) !== i)
    const emailRep = repetido(personas.map((p) => p.email))
    if (emailRep) throw new HttpError(409, `Ya existe una cuenta con ese email: ${emailRep}`)
    const dniRep = repetido(personas.map((p) => p.dni))
    if (dniRep) throw new HttpError(409, `Ya existe una cuenta con ese DNI: ${dniRep}`)

    // Duplicados en la BD: una sola consulta para todo el grupo
    const existentes = await this.prisma.usuario.findMany({
      where: { OR: personas.flatMap((p) => [porEmail(p.email), { dni: p.dni }]) },
      select: { email: true, dni: true },
    })
    for (const p of personas) {
      if (existentes.some((e) => e.email.toLowerCase() === p.email.toLowerCase())) {
        throw new HttpError(409, `Ya existe una cuenta con ese email: ${p.email}`)
      }
      if (existentes.some((e) => e.dni === p.dni)) throw new HttpError(409, `Ya existe una cuenta con ese DNI: ${p.dni}`)
    }

    // bcrypt es lento (~300 ms por hash): fuera de la transacción para no tenerla abierta segundos
    const hashes = await Promise.all(personas.map((p) => bcrypt.hash(p.password, SALT_ROUNDS)))

    // Todos los miembros son iguales: el comprobante es del grupo
    return this.prisma.$transaction(async (tx) => {
      const grupo = await tx.solicitudGrupal.create({
        data: { estado: 'pendiente', comprobante_transferencia: comprobanteFilename },
      })
      for (const [i, { password: _p, fecha_nacimiento, ...resto }] of personas.entries()) {
        await tx.usuario.create({
          data: {
            ...resto,
            password_hash: hashes[i],
            tipo_cuota: 'conjunta',
            roles: [Rol.socio_basico],
            estado: 'pendiente',
            solicitud_grupal_id: grupo.id,
            fecha_nacimiento: new Date(fecha_nacimiento),
          },
          select: { id: true },
        })
      }
      return { grupo_id: grupo.id, miembros: personas.length }
    })
  }

  async login(data: LoginInput) {
    const usuario = await this.prisma.usuario.findFirst({
      where: porEmail(data.email),
      select: {
        id: true,
        email: true,
        nombre: true,
        apellidos: true,
        roles: true,
        estado: true,
        password_hash: true,
      },
    })

    // Contraseña antes que estado: no revelar si una cuenta existe sin conocer su contraseña
    if (!usuario || !(await bcrypt.compare(data.password, usuario.password_hash))) {
      throw new HttpError(401, 'Credenciales incorrectas')
    }

    const { password_hash: _, ...userWithoutHash } = usuario
    return comprobarEstado(userWithoutHash, true)
  }

  // Solo cuentas ya vinculadas: Telegram se vincula tras el primer login con email + contraseña
  async loginTelegram(data: TelegramAuthInput) {
    const telegram_chat_id = checkTelegram(data)
    const usuario = await this.prisma.usuario.findUnique({ where: { telegram_chat_id }, select: SESSION_SELECT })
    if (!usuario) {
      throw new HttpError(401, 'Esta cuenta de Telegram no está vinculada a ningún socio. Entra con tu email y contraseña y vincúlala desde el área de socios.')
    }
    return comprobarEstado(usuario)
  }

  async getSolicitud(id: string) {
    const { comprobante_transferencia: _c, solicitud_grupal: _g, ...datos } = await this.prisma.usuario.findUniqueOrThrow({ where: { id }, select: SOLICITUD_SELECT })
    return datos
  }

  // Cuota conjunta: el comprobante es del grupo y cualquier miembro puede sustituirlo
  async updateSolicitud(id: string, data: SolicitudInput, comprobanteFilename?: string) {
    const actual = await this.prisma.usuario.findUniqueOrThrow({ where: { id }, select: SOLICITUD_SELECT })
    const conEseDni = await this.prisma.usuario.findUnique({ where: { dni: data.dni }, select: { id: true } })
    if (conEseDni && conEseDni.id !== id) throw new HttpError(409, `Ya existe una cuenta con ese DNI: ${data.dni}`)
    const grupo = actual.solicitud_grupal
    await this.prisma.usuario.update({
      where: { id },
      data: {
        ...data,
        fecha_nacimiento: new Date(data.fecha_nacimiento),
        ...(comprobanteFilename && !grupo ? { comprobante_transferencia: comprobanteFilename } : {}),
      },
    })
    if (comprobanteFilename) {
      if (grupo) {
        await this.prisma.solicitudGrupal.update({ where: { id: grupo.id }, data: { comprobante_transferencia: comprobanteFilename } })
      }
      const anterior = grupo ? grupo.comprobante_transferencia : actual.comprobante_transferencia
      if (anterior) {
        fs.promises.unlink(path.resolve(process.cwd(), 'uploads/transferencias', anterior))
          .catch((err) => console.error('Borrar comprobante anterior:', err))
      }
    }
    eventos.emit('cambio', 'pendientes')
    return this.getSolicitud(id)
  }

  async getMe(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nombre: true,
        apellidos: true,
        dni: true,
        telefono: true,
        fecha_nacimiento: true,
        direccion: true,
        alias_telegram: true,
        apodo: true,
        tipo_cuota: true,
        roles: true,
        estado: true,
        fecha_alta: true,
        tiene_llaves: true,
        llaves_solicitadas_at: true,
        telegram_chat_id: true,
        telegram_linked_at: true,
      },
    })

    if (!usuario) {
      throw new HttpError(404, 'Usuario no encontrado')
    }

    const { telegram_chat_id, ...rest } = usuario
    return { ...rest, telegram_chat_id: telegram_chat_id?.toString() ?? null }
  }

  async linkTelegram(userId: string, data: TelegramAuthInput) {
    checkTelegram(data)

    const existing = await this.prisma.usuario.findFirst({
      where: { telegram_chat_id: BigInt(data.id), NOT: { id: userId } },
    })
    if (existing) throw new HttpError(409, 'Este usuario de Telegram ya está vinculado a otra cuenta')

    const updated = await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        telegram_chat_id: BigInt(data.id),
        ...(data.username ? { alias_telegram: `@${data.username}` } : {}),
        telegram_linked_at: new Date(),
      },
      select: {
        nombre: true,
        alias_telegram: true,
        telegram_chat_id: true,
        telegram_linked_at: true,
      },
    })

    // Mensaje de bienvenida — fire and forget, nunca bloquea ni falla la vinculación
    const chatId = data.id.toString()
    const nombre = updated.nombre || data.first_name || 'socio/a'
    const mensajeBienvenida =
      `¡Hola, ${nombre}! 👋\n\n` +
      `Soy el bot de Dragón de Madera 🐉\n\n` +
      `No hace falta que respondas a este mensaje. ¡Bienvenido/a al club!`

    void telegram(this.prisma, 'sendMessage', { chat_id: chatId, text: mensajeBienvenida }, 'bienvenida_vinculacion')

    const { nombre: _, ...rest } = updated
    return { ...rest, telegram_chat_id: rest.telegram_chat_id?.toString() ?? null }
  }

  async unlinkTelegram(userId: string) {
    await this.prisma.usuario.update({
      where: { id: userId },
      data: { telegram_chat_id: null, telegram_linked_at: null },
    })
  }


  // Siempre responde igual (sin error ni "tiene Telegram"): así no se puede averiguar qué emails son de socios.
  // Si el envío falla (bot bloqueado, Telegram caído) queda en el log del bot y el código se anula.
  async requestPasswordReset(email: string): Promise<void> {
    const usuario = await this.prisma.usuario.findFirst({ where: porEmail(email) })
    if (!usuario || !usuario.telegram_chat_id || usuario.estado !== 'activo') return

    if (!process.env.BOT_TOKEN) throw new Error('BOT_TOKEN no configurado')

    const token = crypto.randomInt(100000, 999999).toString()
    const expiry = new Date(Date.now() + 15 * 60 * 1000) // 15 min

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { reset_token: token, reset_token_expiry: expiry },
    })

    const texto = `🔐 <b>Recuperación de contraseña — Dragón de Madera</b>\n\nHola ${usuario.nombre}, tu código de recuperación es:\n\n<code>${token}</code>\n\nVálido durante <b>15 minutos</b>. No lo compartas con nadie.`

    // sensible: el código no se guarda en el log (y no tendría sentido reintentarlo)
    const { ok: enviado } = await telegram(this.prisma, 'sendMessage', {
      chat_id: usuario.telegram_chat_id.toString(),
      text: texto,
      parse_mode: 'HTML',
    }, 'reset_password', { sensible: true })

    if (!enviado) {
      await this.prisma.usuario.update({ where: { id: usuario.id }, data: { reset_token: null, reset_token_expiry: null } })
    }
  }

  async confirmPasswordReset(email: string, token: string, newPassword: string) {
    const usuario = await this.prisma.usuario.findFirst({ where: porEmail(email) })
    if (!usuario || !usuario.reset_token) throw new HttpError(400, 'Código incorrecto o expirado')

    if (!usuario.reset_token_expiry || usuario.reset_token_expiry < new Date()) {
      await this.prisma.usuario.update({ where: { id: usuario.id }, data: { reset_token: null, reset_token_expiry: null } })
      throw new HttpError(400, 'El código ha expirado. Solicita uno nuevo')
    }

    if (usuario.reset_token !== token) {
      // Invalidar token en intento fallido — previene fuerza bruta
      await this.prisma.usuario.update({ where: { id: usuario.id }, data: { reset_token: null, reset_token_expiry: null } })
      throw new HttpError(400, 'Código incorrecto. Solicita un nuevo código para volver a intentarlo')
    }

    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS)
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { password_hash, reset_token: null, reset_token_expiry: null },
    })
  }

  // Avisa por Telegram a los secretarios activos de que un socio con 6+ meses pide llaves
  async pedirLlaves(userId: string) {
    const socio = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: { nombre: true, apellidos: true, apodo: true, email: true, alias_telegram: true, estado: true, fecha_alta: true, tiene_llaves: true, llaves_solicitadas_at: true },
    })
    if (!socio || socio.estado !== 'activo') throw new HttpError(403, 'Solo los socios activos pueden pedir llaves')
    if (socio.tiene_llaves) throw new HttpError(409, 'Ya tienes llaves del club')
    if (!socio.fecha_alta || fechaPuedePedirLlaves(socio.fecha_alta) > new Date()) {
      throw new HttpError(403, `Necesitas ${MESES_PARA_LLAVES} meses como socio para pedir llaves`)
    }

    if (socio.llaves_solicitadas_at && fechaPuedeRepetirSolicitudLlaves(socio.llaves_solicitadas_at) > new Date()) {
      throw new HttpError(409, 'Ya has pedido las llaves. Espera a que el secretario se ponga en contacto contigo por Telegram.')
    }

    const nombre = `${socio.nombre} ${socio.apellidos}${socio.apodo ? ` (${socio.apodo})` : ''}`
    const texto =
      `🔑 <b>Solicitud de llaves</b>

` +
      `${esc(nombre)} quiere pedir las llaves del club.
` +
      `Email: ${esc(socio.email)}` +
      (socio.alias_telegram ? `
Telegram: ${esc(socio.alias_telegram)}` : '')

    if (!(await avisarSecretarios(this.prisma, 'solicitud_llaves', texto))) {
      throw new HttpError(502, 'No hemos podido avisar al secretario por Telegram. Contacta con la directiva.')
    }

    await this.prisma.usuario.update({ where: { id: userId }, data: { llaves_solicitadas_at: new Date() } })
  }

  // Avisa por Telegram a los secretarios de que un socio quiere darse de baja; la baja la tramita la directiva
  async pedirBaja(userId: string) {
    const socio = await this.prisma.usuario.findUnique({
      where: { id: userId },
      select: { nombre: true, apellidos: true, apodo: true, email: true, alias_telegram: true, estado: true, tipo_cuota: true },
    })
    if (!socio || socio.estado !== 'activo') throw new HttpError(403, 'Solo los socios activos pueden pedir la baja')

    const nombre = `${socio.nombre} ${socio.apellidos}${socio.apodo ? ` (${socio.apodo})` : ''}`
    const texto =
      `🚪 <b>Solicitud de baja</b>\n\n` +
      `${esc(nombre)} quiere darse de baja del club.\n` +
      `Cuota: ${esc(socio.tipo_cuota)}\n` +
      `Email: ${esc(socio.email)}` +
      (socio.alias_telegram ? `\nTelegram: ${esc(socio.alias_telegram)}` : '')

    if (!(await avisarSecretarios(this.prisma, 'solicitud_baja', texto))) {
      throw new HttpError(502, 'No hemos podido avisar al secretario por Telegram. Contacta con la directiva.')
    }
  }
}
