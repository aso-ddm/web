import { Router } from 'express'
import { z } from 'zod'
import { VisitasService } from '../services/visitas.service'
import { authenticate, ROLES } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { paginacion } from '../lib/paginacion'

const buscarSchema = z.object({
  nombre: z.string().min(2, 'Introduce al menos 2 caracteres'),
})

const filtrosVisitasSchema = z.object({
  ...paginacion(50, 100),
  // Menos de 2 caracteres = sin filtro
  search: z.string().trim().optional().transform((s) => (s && s.length >= 2 ? s : undefined)),
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
  res.json(await visitasService.buscar(parsed.data.nombre))
})

// GET /api/visitas — listado paginado (cualquier socio autenticado)
router.get('/', authenticate, async (req, res) => {
  res.json(await visitasService.getAll(filtrosVisitasSchema.parse(req.query)))
})

// POST /api/visitas — registrar visita
router.post('/', authenticate, async (req, res) => {
  const parsed = registrarSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  const visita = await visitasService.registrar({
    nombre_completo: parsed.data.nombre_completo,
    socio_registro_id: req.user.id,
  })
  res.status(201).json({ data: visita })
})

// DELETE /api/visitas/:id — borrar una visita registrada por error (quien la registró o la directiva)
router.delete('/:id', authenticate, async (req, res) => {
  const esDirectiva = ROLES.DIRECTIVA.some((r) => req.user.roles.includes(r))
  await visitasService.eliminar(req.params.id, { id: req.user.id, esDirectiva })
  res.json({ data: { id: req.params.id } })
})

export default router
