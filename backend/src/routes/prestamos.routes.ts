import { Router } from 'express'
import { PrestamosService } from '../services/prestamos.service'
import {
  solicitarPrestamoSchema,
  filtrosPrestamosSchema,
  filtrosGestionPrestamosSchema,
  rechazarPrestamoSchema,
} from '../schemas/prestamo.schema'
import { authenticate, requireRoles, ROLES } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()
const prestamosService = new PrestamosService(prisma)

// GET /api/prestamos/mis-prestamos — historial propio
router.get('/mis-prestamos', authenticate, async (req, res) => {
  const parsed = filtrosPrestamosSchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ error: 'Parámetros inválidos' })
    return
  }
  const result = await prestamosService.misPrestamos(req.user.id, parsed.data)
  res.json(result)
})

// GET /api/prestamos — listado (ludotecario / directiva)
router.get('/', requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO), async (req, res) => {
  const parsed = filtrosGestionPrestamosSchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ error: 'Parámetros inválidos' })
    return
  }
  const result = await prestamosService.getAll(parsed.data)
  res.json(result)
})

// POST /api/prestamos — solicitar préstamo
router.post('/', authenticate, async (req, res) => {
  const parsed = solicitarPrestamoSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    const prestamo = await prestamosService.solicitar(req.user.id, parsed.data)
    res.status(201).json({ data: prestamo })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    res.status(400).json({ error: message })
  }
})

// POST /api/prestamos/:id/aprobar
router.post('/:id/aprobar', requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO), async (req, res) => {
  try {
    const prestamo = await prestamosService.aprobar(req.params.id, req.user.id)
    res.json({ data: prestamo })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    res.status(400).json({ error: message })
  }
})

// POST /api/prestamos/:id/activar
router.post('/:id/activar', requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO), async (req, res) => {
  try {
    const prestamo = await prestamosService.activar(req.params.id)
    res.json({ data: prestamo })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    res.status(400).json({ error: message })
  }
})

// POST /api/prestamos/:id/rechazar
router.post('/:id/rechazar', requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO), async (req, res) => {
  const parsed = rechazarPrestamoSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos' })
    return
  }
  try {
    const prestamo = await prestamosService.rechazar(req.params.id, parsed.data.motivo)
    res.json({ data: prestamo })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    res.status(400).json({ error: message })
  }
})

// POST /api/prestamos/:id/devolucion
router.post('/:id/devolucion', requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO), async (req, res) => {
  try {
    const prestamo = await prestamosService.confirmarDevolucion(req.params.id, req.user.id)
    res.json({ data: prestamo })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    res.status(400).json({ error: message })
  }
})

// DELETE /api/prestamos/:id — cancelar préstamo propio (pendiente)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prestamosService.cancelar(req.params.id, req.user.id)
    res.status(204).send()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    const status = message.includes('permiso') ? 403 : 400
    res.status(status).json({ error: message })
  }
})

export default router
