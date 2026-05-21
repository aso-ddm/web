import { Request, Response, NextFunction } from 'express'

export function notFound(req: Request, res: Response) {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` })
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  const isPrismaConflict = err.message?.includes('Unique constraint')
  const isPrismaNotFound = err.message?.includes('Record to update not found')

  if (isPrismaConflict) {
    res.status(409).json({ error: 'Conflicto: el recurso ya existe' })
    return
  }
  if (isPrismaNotFound) {
    res.status(404).json({ error: 'Recurso no encontrado' })
    return
  }

  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ error: 'Error interno del servidor' })
  } else {
    res.status(500).json({ error: err.message, stack: err.stack })
  }
}
