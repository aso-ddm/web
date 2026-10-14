import { EstadoSolicitudJuego } from '@prisma/client'
import { Router, Request, Response } from 'express'
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
  requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO),
  async (req: Request, res: Response) => {
    const filtros = filtrosSolicitudesJuegoSchema.parse({ ...req.query, estado: EstadoSolicitudJuego.pendiente })
    const result = await service.getAll(filtros)
    res.json(result)
  },
)

// Todas para staff
router.get(
  '/todas',
  requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO),
  async (req: Request, res: Response) => {
    const filtros = filtrosSolicitudesJuegoSchema.parse(req.query)
    const result = await service.getAll(filtros)
    res.json(result)
  },
)

// Mis solicitudes (socio)
router.get(
  '/',
  authenticate,
  async (req: Request, res: Response) => {
    const filtros = filtrosSolicitudesJuegoSchema.parse(req.query)
    const result = await service.getMias(req.user!.id, filtros)
    res.json(result)
  },
)

// Crear solicitud (socio)
router.post(
  '/',
  authenticate,
  async (req: Request, res: Response) => {
    const input = crearSolicitudJuegoSchema.parse(req.body)
    const result = await service.crear(req.user!.id, input)
    res.status(201).json({ data: result })
  },
)

// Aprobar (staff)
router.post(
  '/:id/aprobar',
  requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO),
  async (req: Request, res: Response) => {
    const result = await service.aprobar(req.params.id, req.user!.id)
    res.json({ data: result })
  },
)

// Rechazar (staff)
router.post(
  '/:id/rechazar',
  requireRoles(...ROLES.DIRECTIVA_Y_LUDOTECARIO),
  async (req: Request, res: Response) => {
    const input = rechazarSolicitudJuegoSchema.parse(req.body)
    const result = await service.rechazar(req.params.id, input)
    res.json({ data: result })
  },
)

export default router
