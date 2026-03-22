import { PrismaClient, Rol } from '@prisma/client'
import bcrypt from 'bcrypt'
import { RegisterInput, LoginInput } from '../schemas/auth.schema.js'

const SALT_ROUNDS = 12

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(data: RegisterInput) {
    const existing = await this.prisma.usuario.findUnique({
      where: { email: data.email },
    })
    if (existing) {
      throw new Error('Ya existe una cuenta con ese email')
    }

    const existingDni = await this.prisma.usuario.findUnique({
      where: { dni: data.dni },
    })
    if (existingDni) {
      throw new Error('Ya existe una cuenta con ese DNI')
    }

    const password_hash = await bcrypt.hash(data.password, SALT_ROUNDS)

    const { password: _, ...rest } = data

    const usuario = await this.prisma.usuario.create({
      data: {
        ...rest,
        password_hash,
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
        usuario_bgg: true,
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
