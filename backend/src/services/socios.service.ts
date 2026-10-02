import { PrismaClient, Rol, EstadoSocio, Prisma } from '@prisma/client'
import { UpdateSocioInput, FiltrosSociosInput } from '../schemas/socio.schema'

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
  telegram_chat_id: true,
  apodo: true,
  tipo_cuota: true,
  roles: true,
  estado: true,
  fecha_alta: true,
  fecha_baja: true,
  tiene_llaves: true,
  comprobante_transferencia: true,
  created_at: true,
  aprobado_por: { select: { id: true, nombre: true, apellidos: true } },
  baja_por: { select: { id: true, nombre: true, apellidos: true } },
} as const

// El rol administrador no se asigna ni se retira desde la app (solo BD/seed).
export function comprobarCambioAdmin(actuales: Rol[], nuevos: Rol[]) {
  if (actuales.includes(Rol.administrador) !== nuevos.includes(Rol.administrador)) {
    throw new Error('El rol de administrador no se puede asignar ni retirar desde la aplicación')
  }
}

// Un único rol base por persona; ludotecario es el único que se acumula sobre cualquiera.
// Socio o vocal + ludotecario → gana los permisos de ludoteca. Presidente, secretario o
// tesorero + ludotecario → solo queda marcado (la directiva ya tiene esos permisos).
// Sin rol base → socio_basico. Orden: rol base primero, ludotecario al final.
const ROLES_BASE: Rol[] = [Rol.presidente, Rol.secretario, Rol.tesorero, Rol.vocal, Rol.socio_basico]
export function normalizarRoles(roles: Rol[]): Rol[] {
  const unicos = [...new Set(roles)]
  const base = unicos.filter((r) => ROLES_BASE.includes(r))
  if (base.length > 1) {
    throw new Error('Solo se puede tener un rol, además de ludotecario')
  }
  const esAdmin = unicos.includes(Rol.administrador)
  if (base.length === 0 && !esAdmin) base.push(Rol.socio_basico)
  return [
    ...(esAdmin ? [Rol.administrador] : []),
    ...base,
    ...(unicos.includes(Rol.ludotecario) ? [Rol.ludotecario] : []),
  ]
}

export class SociosService {
  constructor(private prisma: PrismaClient) {}

  async getAll(filtros: FiltrosSociosInput) {
    const { estado, search, page, limit } = filtros
    const skip = (page - 1) * limit

    if (search) {
      const pattern = `%${search}%`
      const estadoClause = estado
        ? Prisma.sql`AND estado::text = ${estado}`
        : Prisma.sql``

      const [rows, countRows] = await Promise.all([
        this.prisma.$queryRaw<{ id: string }[]>`
          SELECT id FROM "Usuario"
          WHERE (
            unaccent(nombre) ILIKE unaccent(${pattern})
            OR unaccent(apellidos) ILIKE unaccent(${pattern})
            OR email ILIKE ${pattern}
            OR dni ILIKE ${pattern}
            OR unaccent(apodo) ILIKE unaccent(${pattern})
          )
          ${estadoClause}
          ORDER BY created_at DESC
          LIMIT ${limit} OFFSET ${skip}
        `,
        this.prisma.$queryRaw<{ count: bigint }[]>`
          SELECT COUNT(*) as count FROM "Usuario"
          WHERE (
            unaccent(nombre) ILIKE unaccent(${pattern})
            OR unaccent(apellidos) ILIKE unaccent(${pattern})
            OR email ILIKE ${pattern}
            OR dni ILIKE ${pattern}
            OR unaccent(apodo) ILIKE unaccent(${pattern})
          )
          ${estadoClause}
        `,
      ])

      const ids = rows.map((r) => r.id)
      const total = Number(countRows[0]?.count ?? 0)

      const socios = ids.length > 0
        ? await this.prisma.usuario.findMany({
            where: { id: { in: ids } },
            select: SOCIO_PUBLIC_SELECT,
            orderBy: { created_at: 'desc' },
          })
        : []

      return {
        data: socios,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      }
    }

    const where = { ...(estado && { estado }) }

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
              comprobante_transferencia: true,
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
          roles: [Rol.socio_basico],
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

  async aprobar(id: string, aprobadoPorId: string, rol: Rol) {
    const socio = await this.prisma.usuario.findUnique({ where: { id } })
    if (!socio) throw new Error('Socio no encontrado')
    if (socio.estado !== EstadoSocio.pendiente) {
      throw new Error('Solo se pueden aprobar solicitudes en estado pendiente')
    }
    comprobarCambioAdmin(socio.roles, [rol])

    return this.prisma.usuario.update({
      where: { id },
      data: {
        estado: EstadoSocio.activo,
        fecha_alta: new Date(),
        aprobado_por_id: aprobadoPorId,
        roles: normalizarRoles([rol]),
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
    if (id === bajaPorId) throw new Error('No puedes darte de baja a ti mismo')
    const socio = await this.prisma.usuario.findUnique({ where: { id } })
    if (!socio) throw new Error('Socio no encontrado')
    if (socio.roles.includes(Rol.administrador)) {
      throw new Error('Una cuenta de administrador no se puede dar de baja desde la aplicación')
    }
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

  async reactivar(id: string, reactivadoPorId: string) {
    const socio = await this.prisma.usuario.findUnique({ where: { id } })
    if (!socio) throw new Error('Socio no encontrado')
    if (socio.estado !== EstadoSocio.baja) {
      throw new Error('Solo se pueden reactivar socios dados de baja')
    }

    return this.prisma.usuario.update({
      where: { id },
      data: {
        estado: EstadoSocio.activo,
        fecha_baja: null,
        baja_por_id: null,
      },
      select: SOCIO_PUBLIC_SELECT,
    })
  }

  async updateRoles(id: string, roles: Rol[], actorId: string) {
    if (id === actorId) throw new Error('No puedes cambiar tus propios roles')
    const socio = await this.prisma.usuario.findUnique({ where: { id } })
    if (!socio) throw new Error('Socio no encontrado')
    roles = normalizarRoles(roles)
    comprobarCambioAdmin(socio.roles, roles)

    return this.prisma.usuario.update({
      where: { id },
      data: { roles },
      select: SOCIO_PUBLIC_SELECT,
    })
  }

  // Llaves: solo se registra si el socio las tiene o no.
  async setLlaves(socioId: string, tieneLlaves: boolean) {
    const socio = await this.prisma.usuario.findUnique({ where: { id: socioId } })
    if (!socio) throw new Error('Socio no encontrado')
    if (tieneLlaves && socio.estado !== EstadoSocio.activo) {
      throw new Error('Solo se pueden asignar llaves a socios activos')
    }

    return this.prisma.usuario.update({
      where: { id: socioId },
      data: { tiene_llaves: tieneLlaves },
      select: SOCIO_PUBLIC_SELECT,
    })
  }
}
