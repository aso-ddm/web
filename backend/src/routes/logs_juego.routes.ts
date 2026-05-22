import { Router, Request, Response, NextFunction } from 'express'
import { authenticate, requireRoles, ROLES } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { LogsJuegoService } from '../services/logs_juego.service'
import { crearLogManualSchema, filtrosLogsSchema } from '../schemas/log_juego.schema'

const router = Router({ mergeParams: true })
const logsService = new LogsJuegoService(prisma)

router.get(
  '/',
  authenticate,
  requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { juegoId } = req.params
      const filtros = filtrosLogsSchema.parse(req.query)
      const result = await logsService.getByJuego(juegoId, filtros)
      res.json(result)
    } catch (err) {
      next(err)
    }
  },
)

router.post(
  '/',
  authenticate,
  requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { juegoId } = req.params
      const { texto } = crearLogManualSchema.parse(req.body)
      const log = await logsService.crearManual(juegoId, req.user!.id, texto)
      res.status(201).json(log)
    } catch (err) {
      next(err)
    }
  },
)

export default router
