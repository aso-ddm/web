# CLAUDE.md — Dragón de Madera Plataforma

## Estado actual del proyecto

### Fase 1 — COMPLETADA
La **Fase 1** es la web pública estática de Dragón de Madera (presentación del club, información para socios, ludoteca pública). Está **completamente desarrollada** y vive en `frontend/`. No requiere backend.

### Fase 2 — EN INICIO / BASE DE DESARROLLO
La **Fase 2** consiste en añadir las **áreas de gestión para socios**: registro, login, gestión de préstamos, ludoteca con inventario, panel de administración, etc.

> ⚠️ **La Fase 2 está actualmente en proceso de toma de requisitos.** Lo que hay ahora (esqueleto de backend, schema de Prisma, estructura del monorepo) es una **base técnica de desarrollo** cuyo objetivo principal es tener el servidor correctamente configurado y validado antes de empezar el desarrollo real.

### Backend — SIN DESARROLLAR
El backend (Fastify + Prisma) está en estado de **esqueleto inicial**. El schema de Prisma es un borrador sujeto a cambios conforme avance la toma de requisitos. No hay lógica de negocio implementada aún.

### Objetivo inmediato
Terminar de configurar la infraestructura del servidor (Nginx, PM2, CI/CD con GitHub Actions self-hosted runner) para tener un entorno funcional listo cuando arranque el desarrollo real de la Fase 2.

---

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
