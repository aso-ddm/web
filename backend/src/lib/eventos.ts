import { EventEmitter } from 'node:events'

// Cambios que la web escucha en vivo por GET /api/eventos (SSE). El payload es la queryKey a refrescar.
// ponytail: en memoria, vale con un solo proceso PM2; con varios, LISTEN/NOTIFY de Postgres
export const eventos = new EventEmitter().setMaxListeners(0)
