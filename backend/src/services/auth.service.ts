import { PrismaClient, Rol } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { RegisterInput, LoginInput, TelegramLoginInput } from '../schemas/auth.schema'
import { HttpError } from '../lib/httpError'
import { TelegramAuthInput } from '../schemas/telegram.schema'

function verifyTelegramData(data: TelegramAuthInput, botToken: string): boolean {
  const { hash, ...rest } = data
  const checkString = (Object.keys(rest) as (keyof typeof rest)[])
    .sort()
    .map(k => `${k}=${rest[k]}`)
    .join('\n')
  const secretKey = crypto.createHash('sha256').update(botToken).digest()
  const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex')
  return hmac === hash
}

// Firma + caducidad (24h) de los datos del widget. Devuelve el id de Telegram como BigInt
function checkTelegram(data: TelegramAuthInput): bigint {
  const botToken = process.env.BOT_TOKEN?.trim()
  if (!botToken) throw new Error('BOT_TOKEN no configurado')
  if (!verifyTelegramData(data, botToken)) throw new Error('Firma de Telegram inválida')
  if (Math.floor(Date.now() / 1000) - data.auth_date > 86400) {
    throw new Error('La autenticación de Telegram ha expirado, vuelve a intentarlo')
  }
  return BigInt(data.id)
}

const SALT_ROUNDS = 12

const SESSION_SELECT = { id: true, email: true, nombre: true, apellidos: true, roles: true, estado: true } as const

// Búsqueda sin distinguir mayúsculas: hay cuentas antiguas guardadas con mayúsculas
const porEmail = (email: string) => ({ email: { equals: email.trim(), mode: 'insensitive' as const } })

function comprobarEstado<T extends { estado: string }>(usuario: T): T {
  if (usuario.estado === 'baja') throw new Error('Esta cuenta ha sido dada de baja')
  if (usuario.estado === 'pendiente') throw new Error('Tu solicitud está pendiente de aprobación por la directiva')
  return usuario
}

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(data: RegisterInput, comprobanteFilename: string) {
    if (data.tipo_cuota === 'conjunta') {
      return this.registerConjunta(data, comprobanteFilename)
    }
    return this.registerIndividual(data, comprobanteFilename)
  }

  private async registerIndividual(data: Extract<RegisterInput, { tipo_cuota: 'individual' }>, comprobanteFilename: string) {
    const existing = await this.prisma.usuario.findFirst({
      where: porEmail(data.email),
    })
    if (existing) {
      throw new Error(`Ya existe una cuenta con ese email: ${data.email}`)
    }

    const existingDni = await this.prisma.usuario.findUnique({
      where: { dni: data.dni },
    })
    if (existingDni) {
      throw new Error(`Ya existe una cuenta con ese DNI: ${data.dni}`)
    }

    const telegram_chat_id = await this.telegramLibre(data.telegram)
    const { telegram, ...rest } = data

    const usuario = await this.prisma.usuario.create({
      data: {
        ...rest,
        ...this.datosTelegram(telegram, telegram_chat_id),
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
    // Pre-validación de unicidad (antes de abrir transacción)
    const todosEmails = [data.email, ...data.miembros_adicionales.map((m) => m.email)]
    const todosDnis = [data.dni, ...data.miembros_adicionales.map((m) => m.dni)]

    // Verificar duplicados internos en el grupo
    const emailsSet = new Set<string>()
    for (const email of todosEmails) {
      if (emailsSet.has(email)) {
        throw new Error(`Ya existe una cuenta con ese email: ${email}`)
      }
      emailsSet.add(email)
    }

    const dnisSet = new Set<string>()
    for (const dni of todosDnis) {
      if (dnisSet.has(dni)) {
        throw new Error(`Ya existe una cuenta con ese DNI: ${dni}`)
      }
      dnisSet.add(dni)
    }

    // Verificar que ningún email ni DNI ya existe en la BD
    for (const email of todosEmails) {
      const existing = await this.prisma.usuario.findFirst({ where: porEmail(email) })
      if (existing) {
        throw new Error(`Ya existe una cuenta con ese email: ${email}`)
      }
    }

    for (const dni of todosDnis) {
      const existing = await this.prisma.usuario.findUnique({ where: { dni } })
      if (existing) {
        throw new Error(`Ya existe una cuenta con ese DNI: ${dni}`)
      }
    }

    const telegram_chat_id = await this.telegramLibre(data.telegram)

    // Transacción atómica
    const resultado = await this.prisma.$transaction(async (tx) => {
      // Crear SolicitudGrupal con titular_id temporal (se actualizará)
      // Necesitamos crear el titular primero para tener su id
      const { telegram, miembros_adicionales, ...restoTitular } = data

      // Crear SolicitudGrupal con un titular_id placeholder — lo actualizamos tras crear el titular
      // Prisma requiere titular_id no nulo, así que creamos titular primero sin solicitud_grupal_id
      // y luego creamos SolicitudGrupal con el id real del titular
      const titular = await tx.usuario.create({
        data: {
          ...restoTitular,
          ...this.datosTelegram(telegram, telegram_chat_id),
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
        },
      })

      // Crear SolicitudGrupal con el titular_id real
      const grupo = await tx.solicitudGrupal.create({
        data: {
          titular_id: titular.id,
          estado: 'pendiente',
        },
      })

      // Actualizar el titular con solicitud_grupal_id
      await tx.usuario.update({
        where: { id: titular.id },
        data: { solicitud_grupal_id: grupo.id },
      })

      // Crear miembros adicionales y sus relaciones
      for (const m of miembros_adicionales) {
        // Sin Telegram ni contraseña: se vincula en su primer login con Telegram (email + DNI)
        const { tipo_relacion, fecha_nacimiento, ...restoMiembro } = m

        const miembro = await tx.usuario.create({
          data: {
            ...restoMiembro,
            tipo_cuota: 'conjunta',
            roles: [Rol.socio_basico],
            estado: 'pendiente',
            solicitud_grupal_id: grupo.id,
            fecha_nacimiento: fecha_nacimiento ? new Date(fecha_nacimiento) : undefined,
          },
        })

        await tx.relacionSocio.create({
          data: {
            socio_principal_id: titular.id,
            socio_relacionado_id: miembro.id,
            tipo_relacion,
          },
        })
      }

      return { titular, miembros_adicionales_count: miembros_adicionales.length }
    })

    return resultado
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
    // Cuentas creadas con Telegram no tienen contraseña (pueden ponerla con "¿Olvidaste tu contraseña?")
    if (!usuario?.password_hash || !(await bcrypt.compare(data.password, usuario.password_hash))) {
      throw new Error('Credenciales incorrectas')
    }

    const { password_hash: _, ...userWithoutHash } = usuario
    return comprobarEstado(userWithoutHash)
  }

  async loginTelegram({ telegram, email, dni }: TelegramLoginInput) {
    const telegram_chat_id = checkTelegram(telegram)

    const usuario = await this.prisma.usuario.findUnique({ where: { telegram_chat_id }, select: SESSION_SELECT })
    if (usuario) return comprobarEstado(usuario)

    // Telegram sin vincular: el front pide email + DNI (status 404) y reintenta
    if (!email || !dni) {
      throw new HttpError(404, 'Es tu primer acceso con Telegram: indica tu email y DNI para vincular tu cuenta.')
    }

    // Primer acceso de los miembros de cuota conjunta (los registra el titular, sin Telegram ni contraseña).
    // ponytail: email + DNI como prueba de identidad, limitado a cuentas que nunca han tenido acceso
    // (sin Telegram y sin contraseña). Si hace falta más, código de un solo uso al aprobar el alta
    const cuenta = await this.prisma.usuario.findFirst({
      where: { ...porEmail(email), dni, telegram_chat_id: null, password_hash: null },
      select: { id: true, estado: true },
    })
    if (!cuenta) throw new Error('No hay ninguna cuenta pendiente de vincular con ese email y DNI')
    comprobarEstado(cuenta)

    const vinculada = await this.prisma.usuario.update({
      where: { id: cuenta.id },
      data: this.datosTelegram(telegram, telegram_chat_id),
      select: SESSION_SELECT,
    })
    return vinculada
  }

  private async telegramLibre(data: TelegramAuthInput) {
    const telegram_chat_id = checkTelegram(data)
    const existing = await this.prisma.usuario.findUnique({ where: { telegram_chat_id } })
    if (existing) throw new Error('Esta cuenta de Telegram ya está vinculada a otro socio')
    return telegram_chat_id
  }

  private datosTelegram(data: TelegramAuthInput, telegram_chat_id: bigint) {
    return {
      telegram_chat_id,
      telegram_linked_at: new Date(),
      ...(data.username ? { alias_telegram: `@${data.username}` } : {}),
    }
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
        telegram_chat_id: true,
        telegram_linked_at: true,
      },
    })

    if (!usuario) {
      throw new Error('Usuario no encontrado')
    }

    const { telegram_chat_id, ...rest } = usuario
    return { ...rest, telegram_chat_id: telegram_chat_id?.toString() ?? null }
  }

  async linkTelegram(userId: string, data: TelegramAuthInput) {
    checkTelegram(data)
    const botToken = process.env.BOT_TOKEN!.trim()

    const existing = await this.prisma.usuario.findFirst({
      where: { telegram_chat_id: BigInt(data.id), NOT: { id: userId } },
    })
    if (existing) throw new Error('Este usuario de Telegram ya está vinculado a otra cuenta')

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

    fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: mensajeBienvenida }),
    }).catch(() => { /* ignorar errores del bot */ })

    const { nombre: _, ...rest } = updated
    return { ...rest, telegram_chat_id: rest.telegram_chat_id?.toString() ?? null }
  }

  async unlinkTelegram(userId: string) {
    await this.prisma.usuario.update({
      where: { id: userId },
      data: { telegram_chat_id: null, telegram_linked_at: null },
    })
  }


  async requestPasswordReset(email: string) {
    const usuario = await this.prisma.usuario.findFirst({ where: porEmail(email) })
    if (!usuario || !usuario.telegram_chat_id || usuario.estado !== 'activo') {
      return { hasTelegram: false }
    }

    const botToken = process.env.BOT_TOKEN
    if (!botToken) throw new Error('BOT_TOKEN no configurado')

    const token = crypto.randomInt(100000, 999999).toString()
    const expiry = new Date(Date.now() + 15 * 60 * 1000) // 15 min

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { reset_token: token, reset_token_expiry: expiry },
    })

    const texto = `🔐 <b>Recuperación de contraseña — Dragón de Madera</b>\n\nHola ${usuario.nombre}, tu código de recuperación es:\n\n<code>${token}</code>\n\nVálido durante <b>15 minutos</b>. No lo compartas con nadie.`

    const enviado = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: usuario.telegram_chat_id.toString(),
        text: texto,
        parse_mode: 'HTML',
      }),
    })
      .then((r) => r.json() as Promise<{ ok?: boolean }>)
      .then((r) => r.ok === true)
      .catch(() => false)

    // Bot bloqueado por el socio o Telegram caído: no decir "código enviado" si no ha llegado
    if (!enviado) {
      await this.prisma.usuario.update({ where: { id: usuario.id }, data: { reset_token: null, reset_token_expiry: null } })
      throw new Error('No hemos podido enviarte el código por Telegram. Comprueba que no has bloqueado el bot o contacta con la directiva.')
    }

    return { hasTelegram: true }
  }

  async confirmPasswordReset(email: string, token: string, newPassword: string) {
    const usuario = await this.prisma.usuario.findFirst({ where: porEmail(email) })
    if (!usuario || !usuario.reset_token) throw new Error('Código incorrecto o expirado')

    if (!usuario.reset_token_expiry || usuario.reset_token_expiry < new Date()) {
      await this.prisma.usuario.update({ where: { id: usuario.id }, data: { reset_token: null, reset_token_expiry: null } })
      throw new Error('El código ha expirado. Solicita uno nuevo')
    }

    if (usuario.reset_token !== token) {
      // Invalidar token en intento fallido — previene fuerza bruta
      await this.prisma.usuario.update({ where: { id: usuario.id }, data: { reset_token: null, reset_token_expiry: null } })
      throw new Error('Código incorrecto. Solicita un nuevo código para volver a intentarlo')
    }

    const password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS)
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { password_hash, reset_token: null, reset_token_expiry: null },
    })
  }
}
