# CLAUDE.md — Dragón de Madera Plataforma

## Estado actual del proyecto

### Fase 1 — COMPLETADA
La **Fase 1** es la web pública estática de Dragón de Madera (presentación del club, información para socios, ludoteca pública). Está **completamente desarrollada** y vive en `frontend/`. No requiere backend.

### Fase 2 — EN DESARROLLO ACTIVO
La **Fase 2** añade las **áreas de gestión para socios**: registro, login, gestión de préstamos, ludoteca con inventario, panel de administración, etc.

**Backend — DESARROLLADO:** Lógica de negocio completa para las 6 entidades principales:
- `auth`: registro individual y grupal (transacción atómica), login JWT, perfil propio
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

**Infraestructura — CONFIGURADA:** Nginx, PM2, CI/CD con GitHub Actions self-hosted runner operativos, con health checks y rollback automático.

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
