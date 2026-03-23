import { PrismaClient, Rol } from '@prisma/client'
import bcrypt from 'bcrypt'
import { RegisterInput, LoginInput } from '../schemas/auth.schema.js'

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
      },
    })

    if (!usuario) {
      throw new Error('Usuario no encontrado')
    }

    return usuario
  }
}
