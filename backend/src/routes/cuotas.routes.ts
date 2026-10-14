import { Router } from 'express'
import { requireRoles, ROLES } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { CuotasService } from '../services/cuotas.service'
import { marcarCuotaSchema, listarCuotasSchema } from '../schemas/cuota.schema'

const router = Router()
const cuotasService = new CuotasService(prisma)

// GET /api/cuotas?anio= — socios activos con los pagos del año (por defecto el actual) y sus impagos
router.get('/', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const { anio } = listarCuotasSchema.parse(req.query)
  res.json({ data: await cuotasService.listar(anio) })
})

// PUT /api/cuotas/:socioId/:anio/:mes — marca el estado de un mes (para todo el grupo si es conjunta)
router.put('/:socioId/:anio/:mes', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const parsed = marcarCuotaSchema.safeParse({ ...req.params, estado: req.body?.estado })
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  res.json({ data: await cuotasService.marcar(req.params.socioId, parsed.data, req.user.id) })
})

export default router
