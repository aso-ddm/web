# CLAUDE.md — Dragón de Madera Plataforma

## Estado actual del proyecto

### Fase 1 — COMPLETADA
La **Fase 1** es la web pública estática de Dragón de Madera (presentación del club, información para socios, ludoteca pública). Está **completamente desarrollada** y vive en `frontend/`. No requiere backend.

### Fase 2 — EN DESARROLLO ACTIVO
La **Fase 2** añade las **áreas de gestión para socios**: registro, login, gestión de préstamos, ludoteca con inventario, panel de administración, etc.

**Backend — DESARROLLADO:** Lógica de negocio completa para las entidades principales:
- `auth`: registro individual y grupal (multipart/form-data + comprobante), login JWT, perfil propio, recuperar contraseña por Telegram
- `socios`: CRUD, aprobación/rechazo (individual y grupal), roles, ciclo de vida, llaves, cuota conjunta
- `juegos`: catálogo con filtros y paginación (solo socios autenticados)
- `préstamos`: préstamo directo (reserva atómica del juego) → renovación → devolución
- `cuotas`: control mensual de pagos (directiva)
- `solicitudes-juego` y `logs de juego`: cesiones de socios e historial de cada juego
- `telegram`: vinculación, anuncios, webhook del bot y log de errores
- `admin`: gestión completa de usuarios (rol administrador)
- `visitas`: registro con visitas gratuitas configurables y cobro automático
- `configuración`: parámetros de negocio ajustables por directiva

**Frontend — DESARROLLADO:** Todas las páginas de Fase 2 implementadas:
- Área de socios: Dashboard, Perfil, Préstamos, Ludoteca, Registro de visita
- Área de ludoteca: Gestión de juegos, Gestión de préstamos
- Área de directiva: Solicitudes, Gestión de socios, Llaves, Anuncios, Cuotas, Configuración
- Admin: Usuarios, Logs del bot de Telegram
- Auth: Login, Registro (individual + conjunta), Mi solicitud, Recuperar contraseña, rutas protegidas por rol

---

## Entornos y despliegue (léelo antes de tocar CI, Docker o migraciones)

- **Se trabaja y despliega solo sobre la rama `web2-feature`.** `main` queda para cuando el proyecto pase a
  producción; entonces se migrará todo. No abrir PRs a `main` por ahora.
- **Las pruebas son siempre en remoto:** https://test.dragondemadera.com, con la base de datos del VPS (acceso por SSH).
  Las bases locales (Postgres nativo en 5432, Docker en 5433) no se usan.
- **Despliegue efectivo: `.github/workflows/docker-deploy.yml`** (push a `web2-feature`):
  tests y tipos → build de imágenes (`:latest`) → las que corren pasan a `:previous` → carga por SSH →
  `docker compose up -d` en `/opt/web` → health check público (`https://test.dragondemadera.com/api/health`, hasta 3 min)
  → si falla, vuelve a `:previous`. Un despliegue a la vez (`concurrency`).
- **El Docker del VPS manda:** su `docker-compose.yml` y su `.env` son la referencia; los del repo pueden estar
  desfasados. No dar por buenos servicios, puertos ni variables del compose del repo: comprobar desde fuera o preguntar.
- **El backend aplica las migraciones al arrancar el contenedor** (`prisma migrate deploy` en el `CMD`).
  Una migración que falla deja el backend caído hasta el rollback, y **el rollback no deshace migraciones**.
- `deploy.yml` (bare metal + PM2, solo `main`) está preparado para producción: tests, un deploy a la vez,
  frontend después del backend, `pnpm deploy` desde el lockfile y backup de `node_modules`/`prisma` para el rollback.
  Requiere pnpm >= 10 en el runner.

### Reglas para migraciones
- **Compatibles con la versión anterior** (expand/contract): primero añadir, desplegar, y quitar en un despliegue
  posterior cuando ya nada lo use. El rollback arranca la imagen anterior sobre el schema nuevo.
- **Que no puedan fallar con datos reales:** nada de `ALTER COLUMN ... TYPE enum` ni de restricciones únicas nuevas sin
  saber qué hay en la base del VPS. Por eso se descartaron (de momento) pasar `TelegramLog.direccion` y
  `Configuracion.tipo` a enum, fusionar `EstadoSolicitud`/`EstadoSolicitudJuego` y normalizar emails a minúsculas.
- Generar el SQL con `prisma migrate diff --from-schema-datamodel <schema anterior> --to-schema-datamodel prisma/schema.prisma --script`
  y revisarlo antes de commitear.
- Prisma no representa índices parciales: si se crean a mano, el siguiente `migrate dev` los intentará borrar.

### Node y pnpm
- **pnpm 11** (el del lockfile) necesita **Node >= 22.13**. Local: Node 24. CI de tests: Node 24.
  Dockerfiles: build en `node:22-alpine` con `pnpm@11` fijado; la imagen final del backend corre en `node:20-alpine`.
- Un solo lockfile: `pnpm-lock.yaml` en la raíz. No hay `package-lock.json`.

---

## Estructura del monorepo

```
dragondemadera/
├── frontend/               # React 19 + Vite + TypeScript + Tailwind 4 + shadcn/ui (ver frontend/CLAUDE.md)
│   ├── Dockerfile          # Multi-stage: build (node:22) + nginx
│   └── nginx.conf          # SPA fallback + proxy /api → backend:3001
├── backend/                # Node.js + Express 4 + TypeScript + Prisma 5
│   ├── src/
│   │   ├── server.ts       # Entry point Express (escucha en HOST, por defecto 0.0.0.0)
│   │   ├── lib/
│   │   │   ├── prisma.ts       # Singleton PrismaClient
│   │   │   ├── httpError.ts    # HttpError(status, mensaje)
│   │   │   ├── paginacion.ts   # paginacion() para schemas, paginado() para respuestas
│   │   │   ├── config.ts       # configNumero(db, clave, fallback) con claves tipadas
│   │   │   ├── roles.ts        # normalizarRoles, comprobarCambioAdmin
│   │   │   ├── fechas.ts       # hora de Madrid: finDelDiaMadrid, anioMesMadrid
│   │   │   ├── seguridad.ts    # igualesSeguro (comparación en tiempo constante)
│   │   │   ├── search.ts       # likePattern, buscarIdsUsuarios (SQL con unaccent)
│   │   │   ├── telegram.ts, eventos.ts (SSE)
│   │   ├── middleware/     # auth.ts (authenticate, requireRoles, ROLES), errorHandler.ts, rateLimit.ts
│   │   ├── routes/         # Routers finos por entidad + health.ts
│   │   ├── schemas/        # Zod (uno por entidad: auth, socio, admin, cuota, juego, prestamo…)
│   │   ├── services/       # Lógica de negocio (reciben PrismaClient en el constructor)
│   │   │                   # cuotaConjunta.ts: unir/salir de cuota conjunta sobre una transacción
│   │   └── __tests__/      # vitest; helpers/prisma.mock.ts; integracion.db.test.ts (Postgres real)
│   └── Dockerfile          # Multi-stage: build (node:22) + producción (node:20); CMD migra y arranca
├── prisma/                 # Prisma en raíz (compartido)
│   ├── schema.prisma       # binaryTargets: native + linux-musl-openssl-3.0.x
│   ├── migrations/
│   └── seed.ts
├── .github/workflows/
│   ├── docker-deploy.yml   # Despliegue actual (web2-feature → VPS de pruebas)
│   └── deploy.yml          # Bare metal PM2 para main (producción futura)
├── docker-compose.yml      # Referencia; el que manda es el del VPS
├── docker-compose.dev.yml  # Postgres local en 5433 (no se usa en el día a día)
├── package.json            # Monorepo root con scripts de workspace
├── pnpm-workspace.yaml
├── tsconfig.json           # Solo tipos (noEmit): backend/src incluidos los tests; alias @/ → frontend/src
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
- Alias de rutas: `@/*` → `./src/*`

### Backend
- Node.js + **Express 4** + TypeScript (CommonJS output)
- Prisma 5 + PostgreSQL 16
- Auth: jsonwebtoken (JWT, 7d, HS256)
- Upload: multer (comprobantes de transferencia, 10 MB, PDF/JPG/PNG/WebP)
- Puerto: **3001**
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

# Comprobaciones (lo mismo que ejecuta el CI antes de desplegar)
pnpm -C backend test:run   # tests unitarios + contrato front/back + errorHandler sobre Express real
pnpm exec tsc -p tsconfig.json             # tipos del backend y de sus tests
pnpm -C frontend exec tsc --noEmit         # tipos del frontend
pnpm -C frontend test                      # vitest + jsdom
# Integración con Postgres real (concurrencia, SQL a mano). Base de PRUEBAS ya migrada:
DATABASE_URL_TEST=postgresql://... pnpm -C backend test:db

# Docker (local; el despliegue lo hace docker-deploy.yml)
docker build -t asoddm/dragondemadera-backend:latest -f backend/Dockerfile .
docker build -t asoddm/dragondemadera-frontend:latest -f frontend/Dockerfile .
```

---

## Backend — convenciones

### Capas
- **routes → schemas → services.** Los routers solo validan (Zod), llaman al servicio y responden.
  Nada de lógica de negocio ni de Prisma en las rutas (salvo lecturas triviales).
- **Schemas Zod en `schemas/`**, nunca definidos dentro de una ruta. Los booleanos de query string con
  `z.enum(['true','false']).transform(...)`, nunca `z.coerce.boolean()` (convierte "false" en true).
- **Servicios con `PrismaClient` en el constructor** (`new MiService(prisma)`) para poder testearlos con el mock.
  Funciones que deben ir dentro de una transacción de otro servicio reciben `tx: Prisma.TransactionClient`
  (ver `services/cuotaConjunta.ts`, `LogsJuegoService.crearSistema(..., db)`).
- **Admin no duplica lógica:** el `PUT /admin/usuarios/:id` cambia estado, roles y llaves a través de
  `SociosService` (`cambiarEstado`, `updateRoles`, `setLlaves`). Cualquier ciclo de vida nuevo va en el servicio.

### Errores
- Handlers async **sin try/catch**: `express-async-errors` manda el error al `errorHandler`.
- Errores de dominio siempre con `throw new HttpError(status, 'mensaje')`, nunca `new Error`
  (un `Error` genérico es un 500 y se registra; es lo correcto solo para fallos de configuración, p. ej. falta `BOT_TOKEN`).
  404 no existe · 409 estado que no lo permite · 403 sin permiso · 400 datos inválidos · 401 credenciales.
- **No usar 401 fuera del login**: el frontend cierra la sesión al recibir un 401 (por eso la firma de Telegram
  inválida al vincular es 400).
- `errorHandler` traduce Zod → 400, multer → 400/413, Prisma P2002/P2003 → 409, P2025 → 404.
- Si una ruta sube un fichero y luego falla, el fichero se borra (ver `POST /auth/register`).

### Respuestas
- Siempre `{ data }`. Listados paginados: `{ data, total, page, limit, totalPages }` con `paginado(data, total, filtros)`;
  filtros con `...paginacion(limitPorDefecto, max)` en el schema.
- Los listados no traen relaciones pesadas: `SOCIO_LIST_SELECT` para listas y mutaciones, `SOCIO_DETAIL_SELECT`
  (historial, aprobado por, miembros del grupo) solo en `GET /socios/:id`.
- Filtrar en el servidor, no descargar listas enteras para filtrar en el navegador.

### Concurrencia e integridad
- **Escrituras condicionadas** al estado esperado en el `where` (`updateMany({ where: { id, estado } })` y comprobar
  `count`, o `update({ where: { id, estado } })` + P2025 → 409). Así una segunda petición simultánea no repite la acción.
- **Bloqueos dentro de la transacción** cuando se cuenta y luego se escribe: `SELECT ... FOR UPDATE` (límite de
  préstamos por socio, miembros de una cuota conjunta) o `pg_advisory_xact_lock` (visitas por nombre).
- El log de cada operación se escribe en la misma transacción que la operación.
- Reglas de negocio en un solo sitio, el backend: p. ej. si una visita es gratis lo devuelve `GET /visitas/buscar`
  (`siguiente_es_pago`, `importe_siguiente`, `nuevo`); el frontend no recalcula.
- `tipo_cuota` no se edita a mano: lo fija la pertenencia a una cuota conjunta (`solicitud_grupal_id`).
- **Telegram no se desvincula nunca** (ni el socio ni el admin): solo se borra la vinculación al dar de baja (`darDeBaja`).

### Valores y configuración
- Enums de Prisma (`EstadoSocio.activo`, `EstadoJuego.prestado`…) en vez de textos sueltos.
- Configuración numérica con `configNumero(db, clave, fallback)`; las claves válidas están en el tipo `ClaveNumero`.
- Fechas de calendario en hora de Madrid (`lib/fechas.ts`), nunca `getMonth()`/`getFullYear()` del servidor.

### Seguridad
- Secretos y firmas se comparan con `igualesSeguro` (tiempo constante), no con `===`.
- Respuestas que no revelan si una cuenta existe (p. ej. recuperar contraseña responde siempre igual).
- Datos personales de socios solo para usuarios autenticados (el catálogo `/juegos` incluye propietarios: pide login).
- `requireRoles(...)` ya autentica: no anteponer `authenticate`.
- Rate limiting en `/auth` (login, registro, reset): `middleware/rateLimit.ts`, por `X-Real-IP`. En bare metal el
  backend escucha solo en `127.0.0.1` (`HOST`, lo fija `deploy.yml`) para que nadie salte nginx y falsee la IP.

### Tests
- Cada servicio con lógica tiene su test con el mock de Prisma (`__tests__/helpers/prisma.mock.ts`, incluye `$queryRaw`
  y `$transaction`). Lo nuevo con ramas (estados, permisos, dinero) deja al menos un test.
- `contrato_frontend.test.ts` comprueba que roles, enums y reglas del registro coinciden con el frontend
  (importa ficheros de `frontend/src`). Si cambias una regla en un lado, cámbiala en el otro.
- `integracion.db.test.ts` (solo con `DATABASE_URL_TEST`): concurrencia y SQL escrito a mano, que los mocks no cubren.
- `tsconfig.json` de la raíz comprueba los tipos de los tests (el build del backend los excluye) con
  `noUnusedLocals`/`noUnusedParameters`, igual que el frontend.

---

## Frontend

Convenciones detalladas en `frontend/CLAUDE.md`. Lo esencial:
- Las páginas no llaman a `api.*`: servicios por entidad en `services/api/` (query strings con `buildQuery`).
- Query keys solo de `QK` (`lib/queryKeys.ts`) e invalidación con sus helpers.
- Datos compartidos con hooks (`useMe`, `useConfig*`, `useMisPrestamosActivos`), no una query por página.
- Zustand siempre con selector; listas grandes con componentes `memo` y callbacks estables.

---

## Decisiones clave

- **Express 4 en lugar de Fastify**: conformidad con el boilerplate base EDM
- **CommonJS output** (no ESM): coherencia con el ecosistema Express + ts-node + nodemon
- **Prisma en raíz** (`/prisma/`): convenio del boilerplate, necesario para los Dockerfiles multi-stage
- **Tailwind CSS 4 + shadcn/ui**: dragondemadera lidera; el boilerplate se actualizará
- **Sin paquete compartido front/back**: roles, enums y reglas del registro se escriben en los dos lados y
  `backend/src/__tests__/contrato_frontend.test.ts` falla en CI si divergen
- **Despliegue actual en Docker** (`web2-feature` → VPS de pruebas); bare metal + PM2 (`deploy.yml`) preparado para producción
- **La ludoteca pública lee de Google Sheets**, no de `/juegos` (que incluye datos personales y pide login)
- **Descartado por ahora** (ver "Reglas para migraciones"): enums de columnas de texto, fusión de enums de solicitud,
  emails a minúsculas e índice único parcial de préstamo activo (la reserva del juego ya es atómica)
- `dias_aviso_devolucion` se conserva en configuración: está prevista para avisos de devolución
- **Las altas entran solo por registro + aprobación** (no hay alta directa desde admin); cuentas especiales con el seed
- `.env` en servidor, nunca en repo

---

## Commits

- Los mensajes de commit, PRs y descripciones de cambios **no llevan ninguna referencia a Claude**: nada de `Co-Authored-By: Claude`, ni "Generated with Claude Code", ni menciones similares.
- Un commit por bloque de cambios coherente, con mensaje en español que diga qué cambia y por qué.
