import { Router } from 'express'
import { PrestamosService } from '../services/prestamos.service'
import { LogsJuegoService } from '../services/logs_juego.service'
import { solicitarPrestamoSchema, filtrosPrestamosSchema, filtrosGestionPrestamosSchema } from '../schemas/prestamo.schema'
import { authenticate, requireRoles, ROLES } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const router = Router()
const logsService = new LogsJuegoService(prisma)
const prestamosService = new PrestamosService(prisma, logsService)

// GET /api/prestamos/mis-prestamos
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

// POST /api/prestamos — crear préstamo directo (socio autenticado)
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

// POST /api/prestamos/:id/renovar — socio renueva su propio préstamo
router.post('/:id/renovar', authenticate, async (req, res) => {
  try {
    const prestamo = await prestamosService.renovar(req.params.id, req.user.id)
    res.json({ data: prestamo })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    const status = message.includes('permiso') ? 403 : 400
    res.status(status).json({ error: message })
  }
})

// POST /api/prestamos/:id/devolucion — socio o admin confirma devolución
router.post('/:id/devolucion', authenticate, async (req, res) => {
  const esAdmin = ROLES.DIRECTIVA_Y_LUDOTECARIO.some((r) => req.user.roles.includes(r))
  try {
    const prestamo = await prestamosService.devolucion(req.params.id, req.user.id, esAdmin)
    res.json({ data: prestamo })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    const status = message.includes('permiso') ? 403 : 400
    res.status(status).json({ error: message })
  }
})

export default router
