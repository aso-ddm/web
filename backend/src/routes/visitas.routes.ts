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

// GET /api/visitas — listado paginado (cualquier socio autenticado)
router.get('/', authenticate, async (req, res) => {
  const page   = Math.max(1, parseInt(String(req.query.page  ?? '1'),  10) || 1)
  const limit  = Math.min(100, Math.max(1, parseInt(String(req.query.limit ?? '50'), 10) || 50))
  const search = typeof req.query.search === 'string' && req.query.search.trim().length >= 2
    ? req.query.search.trim()
    : undefined
  const result = await visitasService.getAll({ page, limit, search })
  res.json(result)
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
