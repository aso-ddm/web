import { Request, Response, NextFunction } from 'express'

// ponytail: contador en memoria por proceso; con varias instancias del backend, moverlo a Redis
export function rateLimit({ max, windowMs }: { max: number; windowMs: number }) {
  const hits = new Map<string, { count: number; reset: number }>()

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now()
    // Detrás de nginx req.ip es siempre 127.0.0.1: la IP del cliente llega en X-Real-IP
    const key = req.get('x-real-ip') ?? req.ip ?? 'unknown'
    let entry = hits.get(key)
    if (!entry || entry.reset <= now) {
      if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset <= now) hits.delete(k)
      entry = { count: 0, reset: now + windowMs }
      hits.set(key, entry)
    }
    if (++entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)))
      res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos y vuelve a probar.' })
      return
    }
    next()
  }
}
