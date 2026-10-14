// Carga backend/.env y, si falta alguna variable, el .env de la raíz del monorepo (pnpm dev:backend corre en backend/).
// require y no import: tiene que ejecutarse antes que los módulos que leen process.env al cargarse (auth.ts)
require('dotenv').config({ path: ['.env', '../.env'] })
import './types/index'
import express from 'express'
// Express 4 no captura promesas rechazadas: esto las manda al errorHandler en vez de tumbar el proceso
import 'express-async-errors'
// Mensajes de validación de Zod en español (global): antes que cualquier schema se use
import './lib/zodEs'
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
import adminRouter from './routes/admin.routes'
import cuotasRouter from './routes/cuotas.routes'
import eventosRouter from './routes/eventos.routes'
import carnetRouter from './routes/carnet.routes'
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
app.use('/api/admin', adminRouter)
app.use('/api/cuotas', cuotasRouter)
app.use('/api/eventos', eventosRouter)
app.use('/api/carnet', carnetRouter)

// ── Errores ───────────────────────────────────────────────────────────────────
app.use(notFound)
app.use(errorHandler)

// Red de seguridad para promesas sueltas (p.ej. avisos de Telegram sin await)
process.on('unhandledRejection', (err) => console.error('unhandledRejection:', err))

// ── Start ─────────────────────────────────────────────────────────────────────
const port = Number(process.env.PORT) || 3001
// Docker necesita 0.0.0.0 (le llega tráfico desde otros contenedores). En bare metal deploy.yml fija
// HOST=127.0.0.1: el puerto 3001 no queda expuesto y nadie puede falsear X-Real-IP saltándose nginx
const host = process.env.HOST || '0.0.0.0'
app.listen(port, host, () => {
  console.log(`Backend escuchando en http://${host}:${port}`)
})

export default app
