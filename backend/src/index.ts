import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'

import prismaPlugin from './plugins/prisma.plugin.js'
import authenticatePlugin from './plugins/authenticate.plugin.js'

import authRoutes from './routes/auth.routes.js'
import sociosRoutes from './routes/socios.routes.js'
import juegosRoutes from './routes/juegos.routes.js'
import prestamosRoutes from './routes/prestamos.routes.js'
import visitasRoutes from './routes/visitas.routes.js'

const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
  },
})

// ── Plugins externos ──────────────────────────────────────────────────────────
await app.register(cors, {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'https://dragondemadera.com'
    : true,
  credentials: true,
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? 'dev_secret_change_in_production',
  sign: { expiresIn: '7d' },
})

// ── Plugins internos ──────────────────────────────────────────────────────────
await app.register(prismaPlugin)
await app.register(authenticatePlugin)

// ── Rutas ─────────────────────────────────────────────────────────────────────
await app.register(authRoutes,     { prefix: '/api/auth' })
await app.register(sociosRoutes,   { prefix: '/api/socios' })
await app.register(juegosRoutes,   { prefix: '/api/juegos' })
await app.register(prestamosRoutes,{ prefix: '/api/prestamos' })
await app.register(visitasRoutes,  { prefix: '/api/visitas' })

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }))

// ── Start ─────────────────────────────────────────────────────────────────────
try {
  const port = Number(process.env.PORT) || 3000
  await app.listen({ port, host: '127.0.0.1' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
