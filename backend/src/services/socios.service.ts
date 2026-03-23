import { PrismaClient, Rol, EstadoSocio } from '@prisma/client'
import { UpdateSocioInput, FiltrosSociosInput } from '../schemas/socio.schema.js'

// Campos públicos que se devuelven en listados (sin datos sensibles)
const SOCIO_PUBLIC_SELECT = {
  id: true,
  email: true,
  nombre: true,
  apellidos: true,
  dni: true,
  telefono: true,
  fecha_nacimiento: true,
  alias_telegram: true,
  apodo: true,
  tipo_cuota: true,
  roles: true,
  estado: true,
  fecha_alta: true,
  fecha_baja: true,
  tiene_llaves: true,
  fecha_solicitud_llaves: true,
  fecha_aprobacion_llaves: true,
  created_at: true,
  aprobado_por: { select: { id: true, nombre: true, apellidos: true } },
  aprobado_llaves_por: { select: { id: true, nombre: true, apellidos: true } },
  baja_por: { select: { id: true, nombre: true, apellidos: true } },
} as const

export class SociosService {
  constructor(private prisma: PrismaClient) {}

  async getAll(filtros: FiltrosSociosInput) {
    const { estado, search, page, limit } = filtros
    const skip = (page - 1) * limit

    const where = {
      ...(estado && { estado }),
      ...(search && {
        OR: [
          { nombre: { contains: search, mode: 'insensitive' as const } },
          { apellidos: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { dni: { contains: search, mode: 'insensitive' as const } },
          { apodo: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    }

    const [socios, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where,
        select: SOCIO_PUBLIC_SELECT,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.usuario.count({ where }),
    ])

    return {
      data: socios,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  }

  async getPendientes() {
    const [individuales, grupos] = await Promise.all([
      this.prisma.usuario.findMany({
        where: { estado: EstadoSocio.pendiente, solicitud_grupal_id: null },
        select: SOCIO_PUBLIC_SELECT,
        orderBy: { created_at: 'asc' },
      }),
      this.prisma.solicitudGrupal.findMany({
        where: { estado: 'pendiente' },
        orderBy: { created_at: 'asc' },
        include: {
          titular: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              dni: true,
              email: true,
              apodo: true,
              alias_telegram: true,
              tipo_cuota: true,
              created_at: true,
            },
          },
          miembros: {
            select: {
              id: true,
              nombre: true,
              apellidos: true,
              dni: true,
              email: true,
              relaciones_como_relacionado: {
                select: { tipo_relacion: true, socio_principal_id: true },
              },
            },
          },
        },
      }),
    ])

    const gruposConTipoRelacion = grupos.map((grupo) => ({
      ...grupo,
      miembros: grupo.miembros.map((miembro) => {
        const relacion = miembro.relaciones_como_relacionado.find(
          (r) => r.socio_principal_id === grupo.titular_id,
        )
        const { relaciones_como_relacionado: _, ...miembroSinRelaciones } = miembro
        return {
          ...miembroSinRelaciones,
          tipo_relacion: relacion?.tipo_relacion ?? null,
        }
      }),
    }))

    return { individuales, grupos: gruposConTipoRelacion }
  }

  async aprobarGrupo(grupoId: string, aprobadoPorId: string) {
    const grupo = await this.prisma.solicitudGrupal.findUnique({
      where: { id: grupoId },
      include: { miembros: true },
    })
    if (!grupo) throw new Error('Solicitud grupal no encontrada')
    if (grupo.estado !== 'pendiente') {
      throw new Error('La solicitud grupal no está en estado pendiente')
    }
    for (const u of grupo.miembros) {
      if (u.estado !== EstadoSocio.pendiente) {
        throw new Error(`El usuario ${u.nombre} no está en estado pendiente`)
      }
    }

    await this.prisma.$transaction([
      this.prisma.usuario.updateMany({
        where: { solicitud_grupal_id: grupoId },
        data: {
          estado: EstadoSocio.activo,
          fecha_alta: new Date(),
          aprobado_por_id: aprobadoPorId,
        },
      }),
      this.prisma.solicitudGrupal.update({
        where: { id: grupoId },
        data: { estado: 'aprobada' },
      }),
    ])

    return this.prisma.solicitudGrupal.findUnique({
      where: { id: grupoId },
      include: { miembros: true },
    })
  }

  async rechazarGrupo(grupoId: string, bajaPorId: string) {
    const grupo = await this.prisma.solicitudGrupal.findUnique({
      where: { id: grupoId },
      include: { miembros: true },
    })
    if (!grupo) throw new Error('Solicitud grupal no encontrada')
    if (grupo.estado !== 'pendiente') {
      throw new Error('La solicitud grupal no está en estado pendiente')
    }
    for (const u of grupo.miembros) {
      if (u.estado !== EstadoSocio.pendiente) {
        throw new Error(`El usuario ${u.nombre} no está en estado pendiente`)
      }
    }

    await this.prisma.$transaction([
      this.prisma.usuario.updateMany({
        where: { solicitud_grupal_id: grupoId },
        data: {
          estado: EstadoSocio.baja,
          fecha_baja: new Date(),
          baja_por_id: bajaPorId,
        },
      }),
      this.prisma.solicitudGrupal.update({
        where: { id: grupoId },
        data: { estado: 'rechazada' },
      }),
    ])

    return this.prisma.solicitudGrupal.findUnique({
      where: { id: grupoId },
      include: { miembros: true },
    })
  }

  async getById(id: string) {
    const socio = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        ...SOCIO_PUBLIC_SELECT,
        direccion: true,
        consentimiento_tiendas: true,
        relaciones_como_principal: {
          where: { activa: true },
          include: {
            socio_relacionado: { select: { id: true, nombre: true, apellidos: true, roles: true } },
          },
        },
        relaciones_como_relacionado: {
          where: { activa: true },
          include: {
            socio_principal: { select: { id: true, nombre: true, apellidos: true, roles: true } },
          },
        },
      },
    })

    if (!socio) throw new Error('Socio no encontrado')
    return socio
  }

  async update(id: string, data: UpdateSocioInput) {
    const exists = await this.prisma.usuario.findUnique({ where: { id } })
    if (!exists) throw new Error('Socio no encontrado')

    return this.prisma.usuario.update({
      where: { id },
      data: {
        ...data,
        fecha_nacimiento: data.fecha_nacimiento ? new Date(data.fecha_nacimiento) : undefined,
      },
      select: SOCIO_PUBLIC_SELECT,
    })
  }

  async aprobar(id: string, aprobadoPorId: string) {
    const socio = await this.prisma.usuario.findUnique({ where: { id } })
    if (!socio) throw new Error('Socio no encontrado')
    if (socio.estado !== EstadoSocio.pendiente) {
      throw new Error('Solo se pueden aprobar solicitudes en estado pendiente')
    }

    return this.prisma.usuario.update({
      where: { id },
      data: {
        estado: EstadoSocio.activo,
        fecha_alta: new Date(),
        aprobado_por_id: aprobadoPorId,
      },
      select: SOCIO_PUBLIC_SELECT,
    })
  }

  async rechazar(id: string, aprobadoPorId: string) {
    const socio = await this.prisma.usuario.findUnique({ where: { id } })
    if (!socio) throw new Error('Socio no encontrado')
    if (socio.estado !== EstadoSocio.pendiente) {
      throw new Error('Solo se pueden rechazar solicitudes en estado pendiente')
    }

    return this.prisma.usuario.update({
      where: { id },
      data: {
        estado: EstadoSocio.baja,
        fecha_baja: new Date(),
        baja_por_id: aprobadoPorId,
      },
      select: SOCIO_PUBLIC_SELECT,
    })
  }

  async darDeBaja(id: string, bajaPorId: string) {
    const socio = await this.prisma.usuario.findUnique({ where: { id } })
    if (!socio) throw new Error('Socio no encontrado')
    if (socio.estado === EstadoSocio.baja) {
      throw new Error('El socio ya está dado de baja')
    }

    return this.prisma.usuario.update({
      where: { id },
      data: {
        estado: EstadoSocio.baja,
        fecha_baja: new Date(),
        baja_por_id: bajaPorId,
      },
      select: SOCIO_PUBLIC_SELECT,
    })
  }

  async updateRoles(id: string, roles: Rol[]) {
    const socio = await this.prisma.usuario.findUnique({ where: { id } })
    if (!socio) throw new Error('Socio no encontrado')

    return this.prisma.usuario.update({
      where: { id },
      data: { roles },
      select: SOCIO_PUBLIC_SELECT,
    })
  }

  async solicitarLlaves(socioId: string) {
    const socio = await this.prisma.usuario.findUnique({ where: { id: socioId } })
    if (!socio) throw new Error('Socio no encontrado')
    if (socio.estado !== EstadoSocio.activo) {
      throw new Error('Solo los socios activos pueden solicitar llaves')
    }
    if (socio.tiene_llaves) {
      throw new Error('Ya tienes llaves del club')
    }
    if (socio.fecha_solicitud_llaves && !socio.fecha_aprobacion_llaves) {
      throw new Error('Ya tienes una solicitud de llaves pendiente')
    }

    // Verificar 6 meses de antigüedad
    if (!socio.fecha_alta) throw new Error('Fecha de alta no registrada')
    const seisM = new Date(socio.fecha_alta)
    seisM.setMonth(seisM.getMonth() + 6)
    if (new Date() < seisM) {
      throw new Error(`Podrás solicitar llaves a partir del ${seisM.toLocaleDateString('es-ES')}`)
    }

    return this.prisma.usuario.update({
      where: { id: socioId },
      data: { fecha_solicitud_llaves: new Date() },
      select: SOCIO_PUBLIC_SELECT,
    })
  }

  async aprobarLlaves(socioId: string, aprobadoPorId: string) {
    const socio = await this.prisma.usuario.findUnique({ where: { id: socioId } })
    if (!socio) throw new Error('Socio no encontrado')
    if (!socio.fecha_solicitud_llaves) {
      throw new Error('El socio no ha solicitado llaves')
    }
    if (socio.tiene_llaves) {
      throw new Error('El socio ya tiene llaves')
    }

    return this.prisma.usuario.update({
      where: { id: socioId },
      data: {
        tiene_llaves: true,
        fecha_aprobacion_llaves: new Date(),
        aprobado_llaves_por_id: aprobadoPorId,
      },
      select: SOCIO_PUBLIC_SELECT,
    })
  }

  async devolverLlaves(socioId: string, adminId: string) {
    const socio = await this.prisma.usuario.findUnique({ where: { id: socioId } })
    if (!socio) throw new Error('Socio no encontrado')
    if (!socio.tiene_llaves) {
      throw new Error('El socio no tiene ninguna llave asignada')
    }

    return this.prisma.usuario.update({
      where: { id: socioId },
      data: {
        tiene_llaves: false,
        fecha_solicitud_llaves: null,
        fecha_aprobacion_llaves: null,
        aprobado_llaves_por_id: null,
      },
      select: SOCIO_PUBLIC_SELECT,
    })
  }
}
