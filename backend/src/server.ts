import 'dotenv/config'
import './types/index'
import express from 'express'
import cors from 'cors'

import healthRouter from './routes/health'
import authRouter from './routes/auth.routes'
import sociosRouter from './routes/socios.routes'
import juegosRouter from './routes/juegos.routes'
import prestamosRouter from './routes/prestamos.routes'
import visitasRouter from './routes/visitas.routes'
import configuracionRouter from './routes/configuracion.routes'
import logsJuegoRouter from './routes/logs_juego.routes'
import solicitudesJuegoRouter from './routes/solicitudes_juego.routes'
import telegramRouter from './routes/telegram.routes'
import { notFound, errorHandler } from './middleware/errorHandler'

const app = express()

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL ?? 'https://dragondemadera.com'
    : true,
  credentials: true,
}))
app.use(express.json())

// BigInt → string en todas las respuestas JSON
app.set('json replacer', (_key: string, value: unknown) =>
  typeof value === 'bigint' ? value.toString() : value
)

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/health', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/socios', sociosRouter)
app.use('/api/juegos', juegosRouter)
app.use('/api/juegos/:juegoId/logs', logsJuegoRouter)
app.use('/api/prestamos', prestamosRouter)
app.use('/api/visitas', visitasRouter)
app.use('/api/config', configuracionRouter)
app.use('/api/solicitudes-juego', solicitudesJuegoRouter)
app.use('/api/telegram', telegramRouter)

// ── Errores ───────────────────────────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// ── Start ─────────────────────────────────────────────────────────────────────
const port = Number(process.env.PORT) || 3001
app.listen(port, '0.0.0.0', () => {
  console.log(`Backend escuchando en http://0.0.0.0:${port}`)
})

export default app
