import { Router } from 'express'
import { z } from 'zod'
import { EstadoPago, EstadoSocio } from '@prisma/client'
import { requireRoles, ROLES } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()

// GET /api/cuotas — socios activos con sus pagos.
// Cuota conjunta: los pagos son del grupo y todos los miembros los comparten (cuota_id = id del grupo).
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
        solicitud_grupal: { select: { id: true, pagos } },
      },
      orderBy: [{ nombre: 'asc' }, { apellidos: 'asc' }],
    })
    res.json({
      data: socios.map(({ solicitud_grupal: grupo, ...s }) => ({
        ...s,
        conjunta: !!grupo,
        cuota_id: grupo?.id ?? s.id,
        pagos_cuota: grupo?.pagos ?? s.pagos_cuota,
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
      select: { id: true, solicitud_grupal_id: true },
    })
    if (!socio) {
      res.status(404).json({ error: 'Socio no encontrado' })
      return
    }
    // Cuota conjunta: el pago se apunta en el grupo y vale para todos sus miembros
    const grupo_id = socio.solicitud_grupal_id
    const de = grupo_id ? { grupo_id } : { socio_id: socio.id }
    if (estado === null) {
      await prisma.pagoCuota.deleteMany({ where: { ...de, anio, mes } })
    } else {
      await prisma.pagoCuota.upsert({
        where: grupo_id
          ? { grupo_id_anio_mes: { grupo_id, anio, mes } }
          : { socio_id_anio_mes: { socio_id: socio.id, anio, mes } },
        create: { ...de, anio, mes, estado, revisado_por_id: req.user.id },
        update: { estado, revisado_por_id: req.user.id },
      })
    }
    res.json({ data: { ...de, anio, mes, estado } })
  } catch (err) {
    next(err)
  }
})

export default router
