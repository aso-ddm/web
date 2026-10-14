import { Router } from 'express'
import { requireRoles, ROLES } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { CuotasService } from '../services/cuotas.service'
import { marcarCuotaSchema } from '../schemas/cuota.schema'

const router = Router()
const cuotasService = new CuotasService(prisma)

// GET /api/cuotas — socios activos con sus pagos
router.get('/', requireRoles(...ROLES.DIRECTIVA), async (_req, res) => {
  res.json({ data: await cuotasService.listar() })
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
