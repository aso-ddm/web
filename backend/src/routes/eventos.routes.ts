import { Router } from 'express'
import { requireRoles, ROLES } from '../middleware/auth'
import { eventos } from '../lib/eventos'

const router = Router()

// GET /api/eventos — Server-Sent Events para refrescar la directiva sin recargar
router.get('/', requireRoles(...ROLES.DIRECTIVA_Y_VOCALES), (req, res) => {
  // X-Accel-Buffering: que nginx no acumule el stream
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no' })
  res.flushHeaders()

  const enviar = (queryKey: string) => res.write(`data: ${queryKey}\n\n`)
  // Latido por debajo del proxy_read_timeout de nginx (60 s) para que no corte la conexión
  const latido = setInterval(() => res.write(': ping\n\n'), 25_000)
  eventos.on('cambio', enviar)
  req.on('close', () => {
    clearInterval(latido)
    eventos.off('cambio', enviar)
  })
})

export default router
