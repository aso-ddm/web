# CLAUDE.md — Dragón de Madera Plataforma

## Estructura del monorepo

```
dragondemadera/
├── frontend/     # React 19 + Vite + TypeScript + Tailwind + shadcn/ui
├── backend/      # Node.js + Fastify + Prisma + PostgreSQL
└── .github/
    └── workflows/
        └── deploy.yml
```

## Frontend

- React 19 + TypeScript + Vite
- Tailwind CSS 4 + shadcn/ui (estilo "New York")
- Gestor de paquetes: pnpm
- Alias de rutas: `@/*` → `./src/*`
- Componentes organizados en atomic design: `atoms/`, `molecules/`, `organisms/`

```bash
cd frontend
pnpm install
pnpm run dev       # http://localhost:5173
pnpm run build     # genera dist/
pnpm run lint
```

## Backend

- Node.js 24 + Fastify 5 + Prisma 5
- Base de datos: PostgreSQL 16 (`dragondb`)
- Puerto: 3000 (solo localhost)
- Auth: JWT (@fastify/jwt)
- `.env` nunca va al repo — vive en `/var/www/dragon-de-madera/dragondemadera/backend/.env`

```bash
cd backend
npm install
npm run dev        # node --watch
npm run prisma:generate
npm run prisma:migrate
```

## Servidor (VM / VPS)

- Nginx sirve el build del frontend desde `/var/www/dragon-de-madera/dragondemadera/frontend/dist/`
- Nginx hace proxy de `/api/` → `localhost:3000`
- PM2 gestiona el proceso backend
- PostgreSQL escucha solo en localhost

## Decisiones clave

- Sin Docker — bare metal + PM2
- Deploy selectivo por carpeta (frontend / backend)
- `.env` en servidor, nunca en repo
