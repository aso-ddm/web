import { Router } from 'express'
import { CarnetService } from '../services/carnet.service'
import { authenticate } from '../middleware/auth'
import { rateLimit } from '../middleware/rateLimit'
import { prisma } from '../lib/prisma'

const router = Router()
const carnetService = new CarnetService(prisma)

// Pública: la tienda escanea el QR sin cuenta. El límite frena que se prueben tokens a ciegas
const verificarLimit = rateLimit({ max: 60, windowMs: 15 * 60 * 1000 })

// GET /api/carnet — token del QR del socio autenticado
router.get('/', authenticate, async (req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json({ data: await carnetService.emitir(req.user.id) })
})

// GET /api/carnet/:token — lo que ve la tienda al escanear
router.get('/:token', verificarLimit, async (req, res) => {
  res.set('Cache-Control', 'no-store')
  res.json({ data: await carnetService.verificar(req.params.token) })
})

export default router
