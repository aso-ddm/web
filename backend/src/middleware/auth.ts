import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import { Rol } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_in_production'

export interface JwtPayload {
  id: string
  email: string
  roles: string[]
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autorizado' })
    return
  }
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET) as JwtPayload
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'No autorizado' })
  }
}

export function requireRoles(...allowedRoles: Rol[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = req.headers.authorization
    if (!auth?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No autorizado' })
      return
    }
    try {
      const payload = jwt.verify(auth.slice(7), JWT_SECRET) as JwtPayload
      req.user = payload
      const userRoles = payload.roles as Rol[]
      const hasRole = allowedRoles.some(role => userRoles.includes(role))
      if (!hasRole) {
        res.status(403).json({ error: 'No tienes permisos para esta acción' })
        return
      }
      next()
    } catch {
      res.status(401).json({ error: 'No autorizado' })
    }
  }
}

export const ROLES = {
  DIRECTIVA: [Rol.presidente, Rol.secretario, Rol.tesorero] as Rol[],
  DIRECTIVA_Y_VOCALES: [Rol.presidente, Rol.secretario, Rol.tesorero, Rol.vocal] as Rol[],
  DIRECTIVA_Y_LUDOTECARIO: [Rol.presidente, Rol.secretario, Rol.tesorero, Rol.ludotecario] as Rol[],
  TODOS_LOS_ROLES: [Rol.presidente, Rol.secretario, Rol.tesorero, Rol.vocal, Rol.ludotecario, Rol.socio_basico] as Rol[],
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}
