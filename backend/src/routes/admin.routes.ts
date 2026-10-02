import { Router, Response } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { requireRoles } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { comprobarCambioAdmin, normalizarRoles } from '../services/socios.service'
import { Rol, EstadoSocio, TipoCuota, Prisma } from '@prisma/client'
import { emailSchema, passwordSchema } from '../schemas/auth.schema'

const router = Router()

// Todos los endpoints requieren rol administrador
router.use(requireRoles(Rol.administrador))

// ── Usuarios ──────────────────────────────────────────────────────────────────

const USUARIO_SELECT = {
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
} as const

function prismaErrorResponse(res: Response, err: unknown) {
  const code = (err as { code?: string }).code
  if (code === 'P2025') return res.status(404).json({ error: 'Usuario no encontrado' })
  if (code === 'P2002' || code === 'P2003') return res.status(409).json({ error: 'No se puede completar la operación: el usuario tiene datos asociados en el sistema' })
  return res.status(500).json({ error: 'Error interno del servidor' })
}

const filtrosAdminSchema = z.object({
  search: z.string().optional(),
  estado: z.nativeEnum(EstadoSocio).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(50),
})

// GET /api/admin/usuarios
router.get('/usuarios', async (req, res) => {
  const { search, estado, page: pageNum, limit: limitNum } = filtrosAdminSchema.parse(req.query)
  const skip = (pageNum - 1) * limitNum

  if (search) {
    const pattern = `%${search}%`
    const estadoClause = estado
      ? Prisma.sql`AND estado::text = ${estado}`
      : Prisma.sql``

    const [rows, countRows] = await Promise.all([
      prisma.$queryRaw<{ id: string }[]>`
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
        LIMIT ${limitNum} OFFSET ${skip}
      `,
      prisma.$queryRaw<{ count: bigint }[]>`
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
    const usuarios = ids.length > 0
      ? await prisma.usuario.findMany({ where: { id: { in: ids } }, select: USUARIO_SELECT, orderBy: { created_at: 'desc' } })
      : []

    res.json({
      data: usuarios.map((u) => ({ ...u, telegram_chat_id: u.telegram_chat_id?.toString() ?? null })),
      pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
    })
    return
  }

  const where = { ...(estado && { estado: estado as EstadoSocio }) }
  const [usuarios, total] = await Promise.all([
    prisma.usuario.findMany({ where, select: USUARIO_SELECT, orderBy: { created_at: 'desc' }, skip, take: limitNum }),
    prisma.usuario.count({ where }),
  ])

  res.json({
    data: usuarios.map((u) => ({ ...u, telegram_chat_id: u.telegram_chat_id?.toString() ?? null })),
    pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) },
  })
})

const createUsuarioSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  nombre: z.string().min(1),
  apellidos: z.string().min(1),
  dni: z.string().regex(/^[0-9]{8}[A-Za-z]$/),
  telefono: z.string().optional(),
  roles: z.array(z.nativeEnum(Rol)).min(1),
  estado: z.nativeEnum(EstadoSocio).optional().default(EstadoSocio.activo),
  tipo_cuota: z.nativeEnum(TipoCuota).optional().default(TipoCuota.individual),
  alias_telegram: z.string().optional(),
  apodo: z.string().optional(),
})

// POST /api/admin/usuarios
router.post('/usuarios', async (req, res) => {
  const parsed = createUsuarioSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  const { password: rawPassword, ...rest } = parsed.data
  try {
    rest.roles = normalizarRoles(rest.roles)
    comprobarCambioAdmin([], rest.roles)
  } catch (err) {
    res.status(403).json({ error: (err as Error).message })
    return
  }
  const existing = await prisma.usuario.findFirst({
    where: { OR: [{ email: { equals: rest.email, mode: 'insensitive' } }, { dni: rest.dni }] },
  })
  if (existing) {
    res.status(409).json({ error: 'Ya existe un usuario con ese email o DNI' })
    return
  }
  const password_hash = await bcrypt.hash(rawPassword as string, 12)
  const usuario = await prisma.usuario.create({
    data: { ...rest, password_hash, fecha_alta: rest.estado === 'activo' ? new Date() : undefined },
    select: USUARIO_SELECT,
  })
  res.status(201).json({ data: { ...usuario, telegram_chat_id: usuario.telegram_chat_id?.toString() ?? null } })
})

const updateUsuarioSchema = z.object({
  email: emailSchema.optional(),
  nombre: z.string().min(1).optional(),
  apellidos: z.string().min(1).optional(),
  dni: z.string().regex(/^[0-9]{8}[A-Za-z]$/).optional(),
  telefono: z.string().optional().nullable(),
  roles: z.array(z.nativeEnum(Rol)).min(1).optional(),
  estado: z.nativeEnum(EstadoSocio).optional(),
  tipo_cuota: z.nativeEnum(TipoCuota).optional(),
  alias_telegram: z.string().optional().nullable(),
  apodo: z.string().optional().nullable(),
  password: passwordSchema.optional(),
})

// PUT /api/admin/usuarios/:id
router.put('/usuarios/:id', async (req, res) => {
  const parsed = updateUsuarioSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  const { password: newPassword, ...rest } = parsed.data
  if (rest.roles || rest.estado) {
    const actual = await prisma.usuario.findUnique({ where: { id: req.params.id }, select: { roles: true, estado: true, fecha_alta: true } })
    if (!actual) {
      res.status(404).json({ error: 'Usuario no encontrado' })
      return
    }
    if (rest.estado && actual.roles.includes(Rol.administrador)) {
      res.status(403).json({ error: 'El estado de una cuenta de administrador no se puede cambiar desde la aplicación' })
      return
    }
    // Mismo ciclo de vida que aprobar / dar de baja / reactivar
    if (rest.estado && rest.estado !== actual.estado) {
      if (rest.estado === EstadoSocio.activo) {
        Object.assign(rest, { fecha_baja: null, baja_por_id: null, ...(actual.fecha_alta ? {} : { fecha_alta: new Date(), aprobado_por_id: req.user.id }) })
      } else if (rest.estado === EstadoSocio.baja) {
        Object.assign(rest, { fecha_baja: new Date(), baja_por_id: req.user.id, tiene_llaves: false })
      }
    }
    if (rest.roles) {
      if (req.params.id === req.user.id) {
        res.status(403).json({ error: 'No puedes cambiar tus propios roles' })
        return
      }
      try {
        rest.roles = normalizarRoles(rest.roles)
        comprobarCambioAdmin(actual.roles, rest.roles)
      } catch (err) {
        res.status(403).json({ error: (err as Error).message })
        return
      }
    }
  }
  const updateData: Record<string, unknown> = { ...rest }
  if (newPassword) {
    updateData.password_hash = await bcrypt.hash(newPassword as string, 12)
  }
  try {
    const usuario = await prisma.usuario.update({
      where: { id: req.params.id },
      data: updateData,
      select: USUARIO_SELECT,
    })
    res.json({ data: { ...usuario, telegram_chat_id: usuario.telegram_chat_id?.toString() ?? null } })
  } catch (err) {
    prismaErrorResponse(res, err)
  }
})

// DELETE /api/admin/usuarios/:id
router.delete('/usuarios/:id', async (req, res) => {
  const id = req.params.id
  const objetivo = await prisma.usuario.findUnique({ where: { id }, select: { roles: true } })
  if (objetivo?.roles.includes(Rol.administrador)) {
    // Incluye el autoborrado: quien llama siempre es administrador
    res.status(403).json({ error: 'Una cuenta de administrador no se puede eliminar desde la aplicación' })
    return
  }
  const prestamosActivos = await prisma.prestamo.count({
    where: { socio_id: id, estado: 'activo' },
  })
  if (prestamosActivos > 0) {
    res.status(400).json({ error: 'El usuario tiene préstamos activos. Devuelve los juegos antes de eliminar la cuenta.' })
    return
  }
  try {
    await prisma.usuario.delete({ where: { id } })
    res.json({ data: { ok: true } })
  } catch (err) {
    prismaErrorResponse(res, err)
  }
})

export default router
