import { Router } from 'express'
import { JuegosService } from '../services/juegos.service'
import { crearJuegoSchema, updateJuegoSchema, filtrosJuegosSchema } from '../schemas/juego.schema'
import { requireRoles, ROLES } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()
const juegosService = new JuegosService(prisma)

// GET /api/juegos — catálogo público con filtros
router.get('/', async (req, res) => {
  const parsed = filtrosJuegosSchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ error: 'Parámetros inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  const result = await juegosService.getAll(parsed.data)
  res.json(result)
})

// GET /api/juegos/:id — detalle público
router.get('/:id', async (req, res) => {
  try {
    const juego = await juegosService.getById(req.params.id)
    res.json({ data: juego })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    res.status(404).json({ error: message })
  }
})

// POST /api/juegos — crear (ludotecario / directiva)
router.post('/', requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO), async (req, res) => {
  const parsed = crearJuegoSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  const juego = await juegosService.crear(parsed.data)
  res.status(201).json({ data: juego })
})

// PUT /api/juegos/:id — actualizar (ludotecario / directiva)
router.put('/:id', requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO), async (req, res) => {
  const parsed = updateJuegoSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    const juego = await juegosService.update(req.params.id, parsed.data)
    res.json({ data: juego })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    res.status(404).json({ error: message })
  }
})

// DELETE /api/juegos/:id — eliminar (solo directiva)
router.delete('/:id', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  try {
    await juegosService.delete(req.params.id)
    res.status(204).send()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    const status = message.includes('no encontrado') ? 404 : 409
    res.status(status).json({ error: message })
  }
})

export default router
