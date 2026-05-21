import { Router } from 'express'
import { z } from 'zod'
import { ConfiguracionService } from '../services/configuracion.service'
import { requireRoles, ROLES } from '../middleware/auth'
import { prisma } from '../lib/prisma'

const updateConfigSchema = z.object({
  valor: z.string().min(1, 'El valor es obligatorio'),
})

const router = Router()
const configService = new ConfiguracionService(prisma)

// GET /api/config — listado (directiva)
router.get('/', requireRoles(...ROLES.DIRECTIVA), async (_req, res) => {
  const configs = await configService.getAll()
  res.json({ data: configs })
})

// GET /api/config/:clave — valor individual (público)
router.get('/:clave', async (req, res) => {
  try {
    const config = await configService.getByKey(req.params.clave)
    res.json({ data: config })
  } catch {
    res.status(404).json({ error: `Configuración '${req.params.clave}' no encontrada` })
  }
})

// PUT /api/config/:clave — actualizar (directiva)
router.put('/:clave', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const parsed = updateConfigSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  try {
    const config = await configService.update(req.params.clave, parsed.data.valor)
    res.json({ data: config })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error'
    res.status(404).json({ error: message })
  }
})

export default router
