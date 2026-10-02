import { Request, Response, NextFunction } from 'express'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { MulterError } from 'multer'
import { HttpError } from '../lib/httpError'

export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` })
}

const PRISMA_STATUS: Record<string, [number, string]> = {
  P2002: [409, 'Conflicto: el recurso ya existe'],
  P2003: [409, 'El recurso está referenciado por otros datos'],
  P2025: [404, 'Recurso no encontrado'],
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message })
    return
  }
  if (err instanceof ZodError) {
    res.status(400).json({ error: 'Datos inválidos', details: err.flatten().fieldErrors })
    return
  }
  if (err instanceof MulterError) {
    const tooLarge = err.code === 'LIMIT_FILE_SIZE'
    res.status(tooLarge ? 413 : 400).json({ error: tooLarge ? 'El archivo supera los 10 MB' : err.message })
    return
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && PRISMA_STATUS[err.code]) {
    const [status, error] = PRISMA_STATUS[err.code]
    res.status(status).json({ error })
    return
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({ error: 'Datos inválidos' })
    return
  }
  // body-parser (JSON malformado, payload grande) y errores con status 4xx propio
  const status = (err as { status?: number }).status
  if (status && status >= 400 && status < 500) {
    res.status(status).json({ error: status === 400 ? 'Petición inválida' : err.message })
    return
  }

  console.error(err)
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Error interno del servidor' })
  } else {
    res.status(500).json({ error: err.message, stack: err.stack })
  }
}
