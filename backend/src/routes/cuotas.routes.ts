import { Router } from 'express'
import { z } from 'zod'
import { EstadoPago, EstadoSocio } from '@prisma/client'
import { requireRoles, ROLES } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()

// GET /api/cuotas — socios activos que pagan cuota (individuales y titulares de grupo) con sus pagos
// ponytail: solo activos; los de baja con deuda no aparecen. Añadir filtro si hace falta perseguirla.
router.get('/', requireRoles(...ROLES.DIRECTIVA), async (_req, res, next) => {
  try {
    const socios = await prisma.usuario.findMany({
      where: {
        estado: EstadoSocio.activo,
        fecha_alta: { not: null },
        OR: [{ solicitud_grupal_id: null }, { grupo_como_titular: { isNot: null } }],
      },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        apodo: true,
        fecha_alta: true,
        grupo_como_titular: { select: { _count: { select: { miembros: true } } } },
        pagos_cuota: { select: { anio: true, mes: true, estado: true } },
      },
      orderBy: [{ nombre: 'asc' }, { apellidos: 'asc' }],
    })
    res.json({ data: socios })
  } catch (err) {
    next(err)
  }
})

const marcarSchema = z.object({
  anio: z.coerce.number().int().min(2000).max(2100),
  mes: z.coerce.number().int().min(1).max(12),
  // null = volver a "sin revisar"
  estado: z.nativeEnum(EstadoPago).nullable(),
})

// PUT /api/cuotas/:socioId/:anio/:mes — marca el estado de un mes
router.put('/:socioId/:anio/:mes', requireRoles(...ROLES.DIRECTIVA), async (req, res, next) => {
  const parsed = marcarSchema.safeParse({ ...req.params, estado: req.body?.estado })
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  const { anio, mes, estado } = parsed.data
  const socio_id = req.params.socioId
  try {
    const socio = await prisma.usuario.findUnique({ where: { id: socio_id }, select: { id: true } })
    if (!socio) {
      res.status(404).json({ error: 'Socio no encontrado' })
      return
    }
    const where = { socio_id_anio_mes: { socio_id, anio, mes } }
    if (estado === null) {
      await prisma.pagoCuota.deleteMany({ where: { socio_id, anio, mes } })
    } else {
      await prisma.pagoCuota.upsert({
        where,
        create: { socio_id, anio, mes, estado, revisado_por_id: req.user.id },
        update: { estado, revisado_por_id: req.user.id },
      })
    }
    res.json({ data: { socio_id, anio, mes, estado } })
  } catch (err) {
    next(err)
  }
})

export default router
