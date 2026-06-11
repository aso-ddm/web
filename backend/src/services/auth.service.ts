import { PrismaClient, Rol } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { RegisterInput, LoginInput } from '../schemas/auth.schema'
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

const SALT_ROUNDS = 12

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(data: RegisterInput, comprobanteFilename: string) {
    if (data.tipo_cuota === 'conjunta') {
      return this.registerConjunta(data, comprobanteFilename)
    }
    return this.registerIndividual(data, comprobanteFilename)
  }

  private async registerIndividual(data: Extract<RegisterInput, { tipo_cuota: 'individual' }>, comprobanteFilename: string) {
    const existing = await this.prisma.usuario.findUnique({
      where: { email: data.email },
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
      const existing = await this.prisma.usuario.findUnique({ where: { email } })
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

    // Transacción atómica
    const resultado = await this.prisma.$transaction(async (tx) => {
      // Crear SolicitudGrupal con titular_id temporal (se actualizará)
      // Necesitamos crear el titular primero para tener su id
      const password_hash_titular = await bcrypt.hash(data.password, SALT_ROUNDS)
      const { password: _, miembros_adicionales, ...restoTitular } = data

      // Crear SolicitudGrupal con un titular_id placeholder — lo actualizamos tras crear el titular
      // Prisma requiere titular_id no nulo, así que creamos titular primero sin solicitud_grupal_id
      // y luego creamos SolicitudGrupal con el id real del titular
      const titular = await tx.usuario.create({
        data: {
          ...restoTitular,
          password_hash: password_hash_titular,
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
        const { password: _p, tipo_relacion, fecha_nacimiento, ...restoMiembro } = m
        const password_hash_miembro = await bcrypt.hash(m.password, SALT_ROUNDS)

        const miembro = await tx.usuario.create({
          data: {
            ...restoMiembro,
            password_hash: password_hash_miembro,
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
    const usuario = await this.prisma.usuario.findUnique({
      where: { email: data.email },
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

    if (!usuario) {
      throw new Error('Credenciales incorrectas')
    }

    if (usuario.estado === 'baja') {
      throw new Error('Esta cuenta ha sido dada de baja')
    }

    if (usuario.estado === 'pendiente') {
      throw new Error('Tu solicitud está pendiente de aprobación por la directiva')
    }

    if (usuario.estado === 'inactivo') {
      throw new Error('Esta cuenta está inactiva. Contacta con la directiva')
    }

    const passwordOk = await bcrypt.compare(data.password, usuario.password_hash)
    if (!passwordOk) {
      throw new Error('Credenciales incorrectas')
    }

    const { password_hash: _, ...userWithoutHash } = usuario
    return userWithoutHash
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
        fecha_solicitud_llaves: true,
        fecha_aprobacion_llaves: true,
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
    const botToken = process.env.BOT_TOKEN?.trim()
    if (!botToken) throw new Error('BOT_TOKEN no configurado')

    if (!verifyTelegramData(data, botToken)) {
      throw new Error('Firma de Telegram inválida')
    }

    const now = Math.floor(Date.now() / 1000)
    if (now - data.auth_date > 86400) {
      throw new Error('La autenticación de Telegram ha expirado, vuelve a intentarlo')
    }

    const existing = await this.prisma.usuario.findFirst({
      where: { telegram_chat_id: BigInt(data.id), NOT: { id: userId } },
    })
    if (existing) throw new Error('Este usuario de Telegram ya está vinculado a otra cuenta')

    const updated = await this.prisma.usuario.update({
      where: { id: userId },
      data: {
        telegram_chat_id: BigInt(data.id),
        alias_telegram: data.username ? `@${data.username}` : null,
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
    const usuario = await this.prisma.usuario.findUnique({ where: { email } })
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

    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: usuario.telegram_chat_id.toString(),
        text: texto,
        parse_mode: 'HTML',
      }),
    })

    return { hasTelegram: true }
  }

  async confirmPasswordReset(email: string, token: string, newPassword: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email } })
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
