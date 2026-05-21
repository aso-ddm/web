import { Router } from 'express'
import { z } from 'zod'
import { VisitasService } from '../services/visitas.service'
import { authenticate, requireRoles, ROLES } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const buscarSchema = z.object({
  nombre: z.string().min(2, 'Introduce al menos 2 caracteres'),
})

const registrarSchema = z.object({
  nombre_completo: z.string().min(2, 'El nombre es obligatorio'),
})

const router = Router()
const visitasService = new VisitasService(prisma)

// GET /api/visitas/buscar?nombre=...
router.get('/buscar', authenticate, async (req, res) => {
  const parsed = buscarSchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors.nombre?.[0] ?? 'Nombre inválido' })
    return
  }
  const resultados = await visitasService.buscar(parsed.data.nombre)
  res.json({ data: resultados })
})

// GET /api/visitas — historial reciente (directiva)
router.get('/', requireRoles(...ROLES.DIRECTIVA), async (_req, res) => {
  const visitas = await visitasService.getRecientes(100)
  res.json({ data: visitas })
})

// POST /api/visitas — registrar visita
router.post('/', authenticate, async (req, res) => {
  const parsed = registrarSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    const visita = await visitasService.registrar({
      nombre_completo: parsed.data.nombre_completo,
      socio_registro_id: req.user.id,
    })
    res.status(201).json({ data: visita })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    res.status(400).json({ error: message })
  }
})

export default router
