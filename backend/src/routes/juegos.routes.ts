import { Router } from 'express'
import { JuegosService } from '../services/juegos.service'
import { LogsJuegoService } from '../services/logs_juego.service'
import { crearJuegoSchema, updateJuegoSchema, filtrosJuegosSchema } from '../schemas/juego.schema'
import { authenticate, requireRoles, ROLES } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { filtrosLogsSchema } from '../schemas/log_juego.schema'

const router = Router()
const logsService = new LogsJuegoService(prisma)
const juegosService = new JuegosService(prisma, logsService)

// GET /api/juegos/logs — todos los logs (staff)
router.get('/logs', authenticate, requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO), async (req, res) => {
  // ZodError → 400 en el errorHandler
  res.json(await logsService.getAll(filtrosLogsSchema.parse(req.query)))
})

// GET /api/juegos/export/csv — exportar catálogo (staff)
router.get('/export/csv', authenticate, requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO), async (req, res) => {
  const csv = await juegosService.exportCsv()
  const fecha = new Date().toISOString().split('T')[0]
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="ludoteca-${fecha}.csv"`)
  res.send('﻿' + csv) // BOM para Excel
})

// GET /api/juegos — catálogo con filtros
router.get('/', async (req, res) => {
  const parsed = filtrosJuegosSchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ error: 'Parámetros inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  const result = await juegosService.getAll(parsed.data)
  res.json(result)
})

// GET /api/juegos/:id — detalle
router.get('/:id', async (req, res) => {
  const juego = await juegosService.getById(req.params.id)
  res.json({ data: juego })
})

// POST /api/juegos — crear (ludotecario / directiva)
router.post('/', authenticate, requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO), async (req, res) => {
  const parsed = crearJuegoSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  const juego = await juegosService.crear(parsed.data, req.user!.id)
  res.status(201).json({ data: juego })
})

// PUT /api/juegos/:id — actualizar (ludotecario / directiva)
router.put('/:id', authenticate, requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO), async (req, res) => {
  const parsed = updateJuegoSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  const juego = await juegosService.update(req.params.id, parsed.data)
  res.json({ data: juego })
})

// POST /api/juegos/:id/retirar — retirar juego (ludotecario / directiva)
router.post('/:id/retirar', authenticate, requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO), async (req, res) => {
  const juego = await juegosService.retirar(req.params.id, req.user!.id)
  res.json({ data: juego })
})

// PUT /api/juegos/:id/reactivar — reactivar juego retirado (ludotecario / directiva)
router.put('/:id/reactivar', authenticate, requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO), async (req, res) => {
  const juego = await juegosService.reactivar(req.params.id, req.user!.id)
  res.json({ data: juego })
})

// DELETE /api/juegos/:id — eliminar (solo directiva)
router.delete('/:id', authenticate, requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  await juegosService.delete(req.params.id)
  res.status(204).send()
})

export default router
