# CLAUDE.md — Dragón de Madera Plataforma

## Estado actual del proyecto

### Fase 1 — COMPLETADA
La **Fase 1** es la web pública estática de Dragón de Madera (presentación del club, información para socios, ludoteca pública). Está **completamente desarrollada** y vive en `frontend/`. No requiere backend.

### Fase 2 — EN DESARROLLO ACTIVO
La **Fase 2** añade las **áreas de gestión para socios**: registro, login, gestión de préstamos, ludoteca con inventario, panel de administración, etc.

**Backend — DESARROLLADO:** Lógica de negocio completa para las 6 entidades principales:
- `auth`: registro individual y grupal (multipart/form-data + comprobante), login JWT, perfil propio
- `socios`: CRUD, aprobación/rechazo (individual y grupal), roles, ciclo de vida, llaves
- `juegos`: catálogo con filtros y paginación
- `préstamos`: flujo completo (solicitud → aprobación → activación → devolución)
- `visitas`: registro con visitas gratuitas configurables y cobro automático
- `configuración`: parámetros de negocio ajustables por directiva

**Frontend — DESARROLLADO:** Todas las páginas de Fase 2 implementadas:
- Área de socios: Dashboard, Perfil, Préstamos, Registro de visita
- Área de ludoteca: Gestión de juegos, Gestión de préstamos
- Área de directiva: Solicitudes, Gestión de socios, Llaves, Configuración
- Auth: Login, Registro (individual + conjunta), rutas protegidas por rol

**Infraestructura — CONFIGURADA:** Nginx, PM2, CI/CD con GitHub Actions self-hosted runner operativos, con health checks y rollback automático. Docker listo para contenedores.

---

## Estructura del monorepo

```
dragondemadera/
├── frontend/               # React 19 + Vite + TypeScript + Tailwind 4 + shadcn/ui
│   ├── src/
│   │   ├── api/            # api/client.ts — fetch tipado
│   │   ├── components/     # atomic design: atoms/, molecules/, organisms/, ui/ (shadcn)
│   │   ├── pages/          # Páginas por área: area/, directiva/, ludoteca/
│   │   ├── services/api/   # Clientes de API por entidad
│   │   ├── store/          # Zustand (authStore)
│   │   ├── test/           # setup.ts para vitest
│   │   └── types/
│   ├── Dockerfile          # Multi-stage: build + nginx
│   └── nginx.conf          # SPA fallback + proxy /api → backend:3001
├── backend/                # Node.js + Express 4 + TypeScript + Prisma 5
│   ├── src/
│   │   ├── server.ts       # Entry point Express
│   │   ├── lib/
│   │   │   └── prisma.ts   # Singleton PrismaClient
│   │   ├── middleware/
│   │   │   ├── auth.ts     # JWT middleware, requireRoles(), ROLES, signToken()
│   │   │   └── errorHandler.ts  # 404 + error global
│   │   ├── routes/         # Express Routers por entidad + health.ts
│   │   ├── schemas/        # Zod schemas (framework-agnostic)
│   │   ├── services/       # Lógica de negocio (toman PrismaClient como arg)
│   │   └── types/
│   │       └── index.ts    # Express Request type extension (req.user)
│   └── Dockerfile          # Multi-stage: build + producción
├── prisma/                 # Prisma en raíz (compartido)
│   ├── schema.prisma       # binaryTargets: native + linux-musl-openssl-3.0.x
│   ├── migrations/
│   └── seed.ts
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD: bare metal PM2 con rollback
├── docker-compose.yml      # Despliegue Docker (3 servicios: db, backend, frontend)
├── package.json            # Monorepo root con scripts de workspace
├── pnpm-workspace.yaml
├── tsconfig.json           # Root TS (apunta a backend/src, CommonJS)
└── .env.example
```

---

## Stack

### Frontend
- React 19 + TypeScript + Vite 6
- **Tailwind CSS 4** + shadcn/ui (estilo "New York") — *dragondemadera lidera, el boilerplate adoptará esta config*
- React Router DOM v7
- Zustand (auth state), TanStack Query, React Hook Form + Zod
- Vitest + React Testing Library
- Gestor de paquetes: pnpm
- Alias de rutas: `@/*` → `./src/*`

### Backend
- Node.js + **Express 4** + TypeScript (CommonJS output)
- Prisma 5 + PostgreSQL 16
- Auth: jsonwebtoken (JWT, 7d, HS256)
- Upload: multer (comprobantes de transferencia, 10 MB, PDF/JPG/PNG/WebP)
- Puerto: **3001** (localhost en bare metal, contenedor en Docker)
- `.env` nunca va al repo

---

## Comandos

```bash
# Desde la raíz (monorepo)
pnpm install
pnpm dev:frontend   # http://localhost:5173
pnpm dev:backend    # http://localhost:3001
pnpm build:frontend

# Prisma (desde raíz)
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:studio

# Tests
pnpm -C backend test:run   # 52 tests unitarios (vitest)
pnpm -C frontend test      # vitest + jsdom

# Docker
docker build -t asoddm/dragondemadera-backend:latest -f backend/Dockerfile .
docker build -t asoddm/dragondemadera-frontend:latest -f frontend/Dockerfile .
docker compose up -d
```

---

## Backend — arquitectura Express

### Entry point: `backend/src/server.ts`
- Express + CORS + JSON body parser
- Monta todos los routers bajo `/api/`
- Health check en `GET /api/health` (usa `prisma.$queryRaw`)

### Auth middleware: `backend/src/middleware/auth.ts`
```typescript
import { authenticate, requireRoles, ROLES, signToken } from '../middleware/auth'

// Proteger ruta — cualquier socio autenticado:
router.get('/me', authenticate, handler)

// Proteger ruta — roles específicos:
router.post('/', requireRoles(...ROLES.DIRECTIVA), handler)

// Sets predefinidos:
// ROLES.DIRECTIVA → presidente, secretario, tesorero
// ROLES.DIRECTIVA_Y_VOCALES → + vocal
// ROLES.DIRECTIVA_Y_LUDOTECARIO → + ludotecario
// ROLES.TODOS_LOS_ROLES → todos

// Payload JWT disponible en req.user:
// { id: string, email: string, roles: string[] }
```

### Prisma singleton: `backend/src/lib/prisma.ts`
```typescript
import { prisma } from '../lib/prisma'
// Servicios: reciben PrismaClient como argumento del constructor (testabilidad)
const service = new MiService(prisma)
```

### Upload de archivos
Rutas multipart usan `multer` con `diskStorage`. Comprobantes en `uploads/transferencias/`.

---

## Frontend — estructura de servicios

```typescript
// frontend/src/services/api/client.ts — fetch tipado
import { api } from '@/services/api/client'

const usuarios = await api.get<User[]>('/api/socios')
await api.post('/api/auth/login', { email, password })
```

Servicios individuales por entidad en `frontend/src/services/api/`:
`auth.ts`, `socios.ts`, `juegos.ts`, `prestamos.ts`, `visitas.ts`, `configuracion.ts`

---

## Servidor VPS (bare metal)

- Nginx sirve el build del frontend desde `$DEPLOY_PATH/frontend/dist/`
- Nginx hace proxy de `/api/` → `localhost:3001`
- PM2 gestiona el proceso backend (`dragon-backend`)
- PostgreSQL escucha solo en localhost
- **Nota:** tras la migración, actualizar nginx proxy de `:3000` a `:3001`

```nginx
location /api/ {
  proxy_pass http://localhost:3001;
  proxy_http_version 1.1;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

---

## Docker (alternativa)

```bash
# Variables en .env junto al docker-compose.yml:
POSTGRES_USER=dragondemadera
POSTGRES_PASSWORD=password_seguro
POSTGRES_DB=dragondb
APP_PORT=8080
JWT_SECRET=secreto_muy_seguro
FRONTEND_URL=https://dragondemadera.com
```

IPs en proxy_network: `.110` (db) · `.111` (backend) · `.112` (frontend)

---

## CI/CD — deploy.yml

- Detecta cambios en `frontend/`, `backend/`, `prisma/`
- **Frontend:** pnpm build → copy dist → nginx reload → health check → rollback si falla
- **Backend:** npm ci → prisma generate → tsc → copy dist + prisma → npm ci --omit=dev → prisma migrate deploy → PM2 restart → health check `GET /api/health` → rollback si falla
- Prisma vive en raíz (`prisma/`), se despliega a `$DEPLOY_PATH/prisma/`

---

## Decisiones clave

- **Express 4 en lugar de Fastify**: conformidad con el boilerplate base EDM
- **CommonJS output** (no ESM): coherencia con el ecosistema Express + ts-node + nodemon
- **Prisma en raíz** (`/prisma/`): convenio del boilerplate, necesario para los Dockerfiles multi-stage
- **Tailwind CSS 4 + shadcn/ui**: dragondemadera lidera; el boilerplate se actualizará
- **Sin Docker en producción actual**: bare metal + PM2; Docker disponible para futuros despliegues o proyectos derivados
- `.env` en servidor, nunca en repo
