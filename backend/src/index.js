import 'dotenv/config'
import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'

const app = Fastify({ logger: true })

await app.register(cors, {
  origin: process.env.NODE_ENV === 'production' ? 'https://tudominio.com' : true
})

await app.register(jwt, {
  secret: process.env.JWT_SECRET
})

app.get('/health', async () => ({ status: 'ok' }))

try {
  await app.listen({ port: process.env.PORT || 3000, host: '127.0.0.1' })
} catch (err) {
  app.log.error(err)
  process.exit(1)
}
