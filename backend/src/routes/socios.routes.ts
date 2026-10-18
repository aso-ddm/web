import { Router } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { SociosService } from '../services/socios.service'
import {
  updateSocioSchema,
  updateRolesSchema,
  filtrosSociosSchema,
  llavesSchema,
  unirCuotaConjuntaSchema,
  bajaSocioSchema,
} from '../schemas/socio.schema'
import { authenticate, requireRoles, ROLES } from '../middleware/auth'
import { prisma } from '../lib/prisma'
import { EstadoSocio } from '@prisma/client'
import { HttpError } from '../lib/httpError'

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads/transferencias')

const router = Router()
const sociosService = new SociosService(prisma)

// Protección de datos: los socios de baja solo los ve la directiva (los vocales gestionan altas, no bajas)
const esDirectiva = (roles: string[]) => ROLES.DIRECTIVA.some((r) => roles.includes(r))
async function comprobarAccesoBaja(id: string, roles: string[]) {
  if (esDirectiva(roles)) return
  const socio = await prisma.usuario.findUnique({ where: { id }, select: { estado: true } })
  if (socio?.estado === EstadoSocio.baja) throw new HttpError(403, 'Los datos de los socios de baja solo los ve la directiva')
}

// GET /api/socios — listado con filtros (directiva + vocales)
router.get('/', requireRoles(...ROLES.DIRECTIVA_Y_VOCALES), async (req, res) => {
  const parsed = filtrosSociosSchema.safeParse(req.query)
  if (!parsed.success) {
    res.status(400).json({ error: 'Parámetros inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  res.json(await sociosService.getAll(parsed.data, esDirectiva(req.user.roles)))
})

// GET /api/socios/opciones — id + nombre de socios activos para selectores (staff de ludoteca incluido)
router.get('/opciones', requireRoles(...ROLES.DIRECTIVA_Y_VOCALES, ...ROLES.DIRECTIVA_Y_LUDOTECARIO), async (_req, res) => {
  res.json({ data: await sociosService.getOpciones() })
})

// GET /api/socios/pendientes — directiva + vocales (vocales solo lectura)
router.get('/pendientes', requireRoles(...ROLES.DIRECTIVA_Y_VOCALES), async (_req, res) => {
  const pendientes = await sociosService.getPendientes()
  res.json({ data: pendientes })
})

// GET /api/socios/:id/comprobante — directiva descarga comprobante
router.get('/:id/comprobante', requireRoles(...ROLES.DIRECTIVA_Y_VOCALES), async (req, res) => {
  const { id } = req.params
  await comprobarAccesoBaja(id, req.user.roles)
  const socio = await prisma.usuario.findUnique({
    where: { id },
    select: { comprobante_transferencia: true, nombre: true, apellidos: true, solicitud_grupal: { select: { comprobante_transferencia: true } } },
  })
  if (!socio) {
    res.status(404).json({ error: 'Socio no encontrado' })
    return
  }
  // Cuota conjunta: el comprobante es del grupo
  socio.comprobante_transferencia ??= socio.solicitud_grupal?.comprobante_transferencia ?? null
  if (!socio.comprobante_transferencia) {
    res.status(404).json({ error: 'Este socio no tiene comprobante adjunto' })
    return
  }
  const filePath = path.join(UPLOADS_DIR, socio.comprobante_transferencia)
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: 'Archivo no encontrado en el servidor' })
    return
  }
  const ext = path.extname(socio.comprobante_transferencia).toLowerCase()
  const nombreArchivo = `comprobante_${socio.nombre}_${socio.apellidos}${ext}`.replace(/\s+/g, '_')
  res.type(ext) // Content-Type por extensión (solo se aceptan pdf/jpg/png/webp al subir)
  res.setHeader('Content-Disposition', `inline; filename="${nombreArchivo}"`)
  fs.createReadStream(filePath).pipe(res)
})

// GET /api/socios/:id — ver socio (directiva ve cualquiera; socio solo el suyo)
router.get('/:id', authenticate, async (req, res) => {
  const { id } = req.params
  const isDirectivaOVocal = ROLES.DIRECTIVA_Y_VOCALES.some(r => req.user.roles.includes(r))
  if (!isDirectivaOVocal && req.user.id !== id) {
    res.status(403).json({ error: 'No tienes permisos para ver este perfil' })
    return
  }
  if (req.user.id !== id) await comprobarAccesoBaja(id, req.user.roles)
  const socio = await sociosService.getById(id)
  res.json({ data: socio })
})

// PUT /api/socios/:id — editar socio
router.put('/:id', authenticate, async (req, res) => {
  const { id } = req.params
  const isDirectiva = ROLES.DIRECTIVA.some(r => req.user.roles.includes(r))
  if (!isDirectiva && req.user.id !== id) {
    res.status(403).json({ error: 'No puedes editar este perfil' })
    return
  }
  const parsed = updateSocioSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  const socio = await sociosService.update(id, parsed.data)
  res.json({ data: socio })
})

// PUT /api/socios/:id/roles — solo directiva
router.put('/:id/roles', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const { id } = req.params
  const parsed = updateRolesSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  const socio = await sociosService.updateRoles(id, parsed.data.roles, req.user.id)
  res.json({ data: socio })
})

// POST /api/socios/:id/aprobar — siempre como socio_basico
router.post('/:id/aprobar', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const socio = await sociosService.aprobar(req.params.id, req.user.id)
  res.json({ message: 'Socio aprobado correctamente', data: socio })
})

// POST /api/socios/:id/rechazar
router.post('/:id/rechazar', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const { id } = req.params
  await sociosService.rechazar(id)
  res.json({ message: 'Solicitud rechazada' })
})

// POST /api/socios/:id/baja
router.post('/:id/baja', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const { id } = req.params
  const socio = await sociosService.darDeBaja(id, req.user.id, bajaSocioSchema.parse(req.body ?? {}))
  res.json({ message: 'Socio dado de baja correctamente', data: socio })
})

// POST /api/socios/:id/reactivar
router.post('/:id/reactivar', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const { id } = req.params
  const socio = await sociosService.reactivar(id, req.user.id)
  res.json({ message: 'Socio reactivado correctamente', data: socio })
})

// POST /api/socios/:id/cuota-conjunta — une al socio a la cuota conjunta de otro
router.post('/:id/cuota-conjunta', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const parsed = unirCuotaConjuntaSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  const socio = await sociosService.unirCuotaConjunta(req.params.id, parsed.data.socio_id, req.user.id)
  res.json({ data: socio })
})

// DELETE /api/socios/:id/cuota-conjunta — saca al socio de su cuota conjunta (pasa a individual)
router.delete('/:id/cuota-conjunta', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const socio = await sociosService.salirCuotaConjunta(req.params.id, req.user.id)
  res.json({ data: socio })
})

// PUT /api/socios/:id/llaves — directiva registra si el socio tiene llaves
router.put('/:id/llaves', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const { id } = req.params
  const parsed = llavesSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: 'Datos inválidos', details: parsed.error.flatten().fieldErrors })
    return
  }
  const socio = await sociosService.setLlaves(id, parsed.data.tiene_llaves, req.user.id)
  res.json({ data: socio })
})

// POST /api/socios/grupos/:grupoId/aprobar
router.post('/grupos/:grupoId/aprobar', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const { grupoId } = req.params
  const resultado = await sociosService.aprobarGrupo(grupoId, req.user.id)
  res.json({ message: 'Solicitud grupal aprobada correctamente', data: resultado })
})

// POST /api/socios/grupos/:grupoId/rechazar
router.post('/grupos/:grupoId/rechazar', requireRoles(...ROLES.DIRECTIVA), async (req, res) => {
  const { grupoId } = req.params
  await sociosService.rechazarGrupo(grupoId)
  res.json({ message: 'Solicitud grupal rechazada' })
})

export default router
