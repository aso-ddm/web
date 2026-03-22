# Dragón de Madera — Plataforma Web

Plataforma de gestión para la asociación Dragón de Madera (juegos de mesa, Granada).

## Estructura

```
dragondemadera/
├── frontend/     # React 19 + Vite + TypeScript + Tailwind + shadcn/ui
├── backend/      # Node.js + Fastify + Prisma + PostgreSQL
└── .github/
    └── workflows/
        └── deploy.yml
```

## Requisitos

- Node.js 24+
- PostgreSQL 16
- pnpm (frontend) / npm (backend)

## Desarrollo local

```bash
# Frontend
cd frontend && pnpm install && pnpm run dev

# Backend
cd backend && npm install && npm run dev
```
