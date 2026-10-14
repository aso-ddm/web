import { Router } from 'express'
import { z } from 'zod'
import { EstadoPago, EstadoSocio } from '@prisma/client'
import { requireRoles, ROLES } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()

// GET /api/cuotas — socios activos con sus pagos.
// Cuota conjunta: los pagos se guardan en el titular y todos los miembros los comparten (cuota_id = titular).
// ponytail: solo activos; los de baja con deuda no aparecen. Añadir filtro si hace falta perseguirla.
router.get('/', requireRoles(...ROLES.DIRECTIVA), async (_req, res, next) => {
  try {
    const pagos = { select: { anio: true, mes: true, estado: true } }
    const socios = await prisma.usuario.findMany({
      where: { estado: EstadoSocio.activo, fecha_alta: { not: null } },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        apodo: true,
        fecha_alta: true,
        pagos_cuota: pagos,
        solicitud_grupal: { select: { titular_id: true, titular: { select: { pagos_cuota: pagos } } } },
      },
      orderBy: [{ nombre: 'asc' }, { apellidos: 'asc' }],
    })
    res.json({
      data: socios.map(({ solicitud_grupal: grupo, ...s }) => ({
        ...s,
        conjunta: !!grupo,
        cuota_id: grupo?.titular_id ?? s.id,
        pagos_cuota: grupo?.titular.pagos_cuota ?? s.pagos_cuota,
      })),
    })
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

// PUT /api/cuotas/:socioId/:anio/:mes — marca el estado de un mes (para todo el grupo si es conjunta)
router.put('/:socioId/:anio/:mes', requireRoles(...ROLES.DIRECTIVA), async (req, res, next) => {
  const parsed = marcarSchema.safeParse({ ...req.params, estado: req.body?.estado })
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  const { anio, mes, estado } = parsed.data
  try {
    const socio = await prisma.usuario.findUnique({
      where: { id: req.params.socioId },
      select: { id: true, solicitud_grupal: { select: { titular_id: true } } },
    })
    if (!socio) {
      res.status(404).json({ error: 'Socio no encontrado' })
      return
    }
    // Cuota conjunta: el pago se apunta en el titular y vale para todo el grupo
    const socio_id = socio.solicitud_grupal?.titular_id ?? socio.id
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
