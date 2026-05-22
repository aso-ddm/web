import { Router, Request, Response, NextFunction } from 'express'
import { authenticate, requireRoles, ROLES } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { SolicitudesJuegoService } from '../services/solicitudes_juego.service'
import {
  crearSolicitudJuegoSchema,
  rechazarSolicitudJuegoSchema,
  filtrosSolicitudesJuegoSchema,
} from '../schemas/solicitud_juego.schema'

const router = Router()
const service = new SolicitudesJuegoService(prisma)

// Pendientes para staff
router.get(
  '/pendientes',
  authenticate,
  requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filtros = filtrosSolicitudesJuegoSchema.parse({ ...req.query, estado: 'pendiente' })
      const result = await service.getAll(filtros)
      res.json(result)
    } catch (err) {
      next(err)
    }
  },
)

// Todas para staff
router.get(
  '/todas',
  authenticate,
  requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filtros = filtrosSolicitudesJuegoSchema.parse(req.query)
      const result = await service.getAll(filtros)
      res.json(result)
    } catch (err) {
      next(err)
    }
  },
)

// Mis solicitudes (socio)
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filtros = filtrosSolicitudesJuegoSchema.parse(req.query)
      const result = await service.getMias(req.user!.id, filtros)
      res.json(result)
    } catch (err) {
      next(err)
    }
  },
)

// Crear solicitud (socio)
router.post(
  '/',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = crearSolicitudJuegoSchema.parse(req.body)
      const result = await service.crear(req.user!.id, input)
      res.status(201).json(result)
    } catch (err) {
      next(err)
    }
  },
)

// Aprobar (staff)
router.post(
  '/:id/aprobar',
  authenticate,
  requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.aprobar(req.params.id, req.user!.id)
      res.json(result)
    } catch (err) {
      next(err)
    }
  },
)

// Rechazar (staff)
router.post(
  '/:id/rechazar',
  authenticate,
  requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = rechazarSolicitudJuegoSchema.parse(req.body)
      const result = await service.rechazar(req.params.id, input)
      res.json(result)
    } catch (err) {
      next(err)
    }
  },
)

export default router
