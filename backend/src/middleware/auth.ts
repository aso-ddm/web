import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { Rol, EstadoSocio } from '@prisma/client'
import { prisma } from '../lib/prisma'

// Sin secreto válido no se arranca: un secreto conocido permitiría fabricar tokens de cualquier rol.
const JWT_SECRET = process.env.JWT_SECRET ?? ''
if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET no definido o demasiado corto (mínimo 32 caracteres)')
}

export interface JwtPayload {
  id: string
  email: string
  roles: string[]
}

// Verifica el JWT y carga estado y roles reales desde BD: una baja o un cambio de rol
// se aplican en la siguiente petición, sin esperar a que caduque el token.
// ponytail: una consulta por petición autenticada; cachear por id si algún día pesa.
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autorizado' })
    return
  }
  let payload: JwtPayload
  try {
    payload = jwt.verify(auth.slice(7), JWT_SECRET) as JwtPayload
  } catch {
    res.status(401).json({ error: 'No autorizado' })
    return
  }
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: payload.id },
      select: { id: true, email: true, roles: true, estado: true },
    })
    if (!usuario || usuario.estado !== EstadoSocio.activo) {
      res.status(401).json({ error: 'Sesión no válida' })
      return
    }
    req.user = { id: usuario.id, email: usuario.email, roles: usuario.roles }
    next()
  } catch (err) {
    next(err)
  }
}

export function requireRoles(...allowedRoles: Rol[]) {
  const checkRoles = (req: Request, res: Response, next: NextFunction) => {
    if (!allowedRoles.some(role => (req.user.roles as Rol[]).includes(role))) {
      res.status(403).json({ error: 'No tienes permisos para esta acción' })
      return
    }
    next()
  }
  // Si la ruta ya pasó por authenticate, no se repite la consulta
  return (req: Request, res: Response, next: NextFunction) =>
    req.user
      ? checkRoles(req, res, next)
      : authenticate(req, res, (err?: unknown) => (err ? next(err) : checkRoles(req, res, next)))
}

// Decisión: presidente, secretario y tesorero tienen los mismos permisos (junta pequeña, se cubren entre sí).
export const ROLES = {
  DIRECTIVA: [Rol.administrador, Rol.presidente, Rol.secretario, Rol.tesorero] as Rol[],
  DIRECTIVA_Y_VOCALES: [Rol.administrador, Rol.presidente, Rol.secretario, Rol.tesorero, Rol.vocal] as Rol[],
  DIRECTIVA_Y_LUDOTECARIO: [Rol.administrador, Rol.presidente, Rol.secretario, Rol.tesorero, Rol.ludotecario] as Rol[],
  TODOS_LOS_ROLES: [Rol.administrador, Rol.presidente, Rol.secretario, Rol.tesorero, Rol.vocal, Rol.ludotecario, Rol.socio_basico] as Rol[],
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}
