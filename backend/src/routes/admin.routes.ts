import { Router } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { requireRoles } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { comprobarCambioAdmin, normalizarRoles, SociosService } from '../services/socios.service'
import { Rol, EstadoSocio, TipoCuota, TipoCambioEstado } from '@prisma/client'
import { HttpError } from '../lib/httpError'
import { dniSchema, emailSchema, passwordSchema } from '../schemas/auth.schema'
import { buscarIdsUsuarios } from '../lib/search'

const router = Router()
const sociosService = new SociosService(prisma)

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
  telegram_linked_at: true,
  direccion: true,
  consentimiento_tiendas: true,
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
    const { ids, total } = await buscarIdsUsuarios(prisma, { search, estado, limit: limitNum, skip })
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
  dni: dniSchema,
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
  rest.roles = normalizarRoles(rest.roles)
  comprobarCambioAdmin([], rest.roles)
  const existing = await prisma.usuario.findFirst({
    where: { OR: [{ email: { equals: rest.email, mode: 'insensitive' } }, { dni: rest.dni }] },
  })
  if (existing) {
    res.status(409).json({ error: 'Ya existe un usuario con ese email o DNI' })
    return
  }
  const password_hash = await bcrypt.hash(rawPassword as string, 12)
  const usuario = await prisma.usuario.create({
    data: {
      ...rest,
      password_hash,
      ...(rest.estado === 'activo' && {
        fecha_alta: new Date(),
        historial_estado: { create: { tipo: TipoCambioEstado.alta, por_id: req.user.id } },
      }),
    },
    select: USUARIO_SELECT,
  })
  res.status(201).json({ data: { ...usuario, telegram_chat_id: usuario.telegram_chat_id?.toString() ?? null } })
})

const updateUsuarioSchema = z.object({
  email: emailSchema.optional(),
  nombre: z.string().min(1).optional(),
  apellidos: z.string().min(1).optional(),
  dni: dniSchema.optional(),
  telefono: z.string().optional().nullable(),
  roles: z.array(z.nativeEnum(Rol)).min(1).optional(),
  estado: z.nativeEnum(EstadoSocio).optional(),
  tipo_cuota: z.nativeEnum(TipoCuota).optional(),
  alias_telegram: z.string().optional().nullable(),
  apodo: z.string().optional().nullable(),
  fecha_nacimiento: z.coerce.date().nullable().optional(),
  direccion: z.string().nullable().optional(),
  consentimiento_tiendas: z.boolean().optional(),
  tiene_llaves: z.boolean().optional(),
  fecha_alta: z.coerce.date().nullable().optional(),
  fecha_baja: z.coerce.date().nullable().optional(),
  // Solo para desvincular: la vinculación la hace el propio socio con el bot
  telegram_chat_id: z.null().optional(),
  password: passwordSchema.optional(),
})

// PUT /api/admin/usuarios/:id
// Estado, roles y llaves pasan por SociosService (cuota del mes de alta, cuota conjunta, aviso de baja, historial).
// ponytail: cada paso es su propia transacción; si uno falla, los anteriores quedan aplicados.
// Se valida todo lo posible antes de escribir para que eso no pase con datos normales.
router.put('/usuarios/:id', async (req, res) => {
  const parsed = updateUsuarioSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  const { id } = req.params
  const { password, estado, roles, tiene_llaves, ...datos } = parsed.data
  const actual = await prisma.usuario.findUnique({ where: { id }, select: { roles: true, estado: true, tiene_llaves: true } })
  if (!actual) throw new HttpError(404, 'Usuario no encontrado')

  const nuevosRoles = roles && normalizarRoles(roles)
  const cambiaRoles = nuevosRoles && nuevosRoles.join() !== normalizarRoles(actual.roles).join()
  if (cambiaRoles) {
    if (id === req.user.id) throw new HttpError(403, 'No puedes cambiar tus propios roles')
    comprobarCambioAdmin(actual.roles, nuevosRoles)
  }

  if (estado && estado !== actual.estado) await sociosService.cambiarEstado(id, estado, req.user.id)
  if (cambiaRoles) await sociosService.updateRoles(id, nuevosRoles, req.user.id)
  if (tiene_llaves !== undefined && tiene_llaves !== actual.tiene_llaves) {
    await sociosService.setLlaves(id, tiene_llaves, req.user.id)
  }

  // Datos sueltos al final: lo que el admin fija a mano (p. ej. fechas de alta/baja) prevalece sobre lo automático
  const usuario = await prisma.usuario.update({
    where: { id },
    data: {
      ...datos,
      ...(datos.telegram_chat_id === null && { telegram_linked_at: null }),
      ...(password && { password_hash: await bcrypt.hash(password, 12) }),
    },
    select: USUARIO_SELECT,
  })
  res.json({ data: { ...usuario, telegram_chat_id: usuario.telegram_chat_id?.toString() ?? null } })
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
  await prisma.usuario.delete({ where: { id } })
  res.json({ data: { ok: true } })
})

export default router
