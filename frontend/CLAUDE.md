# CLAUDE.md — frontend

Visión general, backend, despliegue y comandos del monorepo: ver `../CLAUDE.md`.

## Comandos (desde `frontend/`)

```bash
pnpm dev           # http://localhost:5173 (proxy /api → 127.0.0.1:3001)
pnpm build         # tsc -b + vite build
pnpm preview       # sirve el build
pnpm test          # vitest + jsdom
```

No hay ESLint configurado: `tsc` con `strict`, `noUnusedLocals` y `noUnusedParameters` hace de linter.

## Estructura

- `components/ui/` — solo componentes de shadcn/ui ("New York"); añadir con el CLI de shadcn, no a mano
- `components/atoms|molecules|organisms/` — atomic design (`SEOHead`, `RolBadge`, `PageLoader` son átomos;
  `RichTextContent`, `RichTextEditor`, `TelegramLoginWidget` moléculas; `ConfirmDialog`, `AreaLayout` organismos)
- `pages/` — una página por ruta; las páginas grandes tienen sus piezas en una carpeta hermana
  (`ludoteca/juegos/`, `directiva/socios/`, `registro/`)
- `services/api/` — un cliente por entidad sobre `client.ts`; las páginas nunca llaman a `api.*` directamente
- `lib/` — `format.ts` (fechas), `estados.ts`, `roles.ts`, `queryKeys.ts`, `cuotas.ts`
- `hooks/` — `useDebouncedValue`, `useConfigValor`, `useScrollNavigation`
- `data/texts.json` — textos de la web pública (Fase 1)

## Convenciones

- Rutas en `config/routes.tsx`. La web pública va en el bundle inicial; el resto de páginas con `lazyPage()`,
  que recarga una vez si el chunk ya no existe (tras un deploy); si vuelve a fallar, lo pinta `ErrorBoundary`.
- Rutas protegidas: `ProtectedRoute` (autenticado) y `RoleBasedRoute` (roles); deben coincidir con los
  `requireRoles` del backend o el usuario verá la página y recibirá 403.
- `client.ts` añade `/api`: `api.get('/socios')`, no `api.get('/api/socios')`. Un 401 cierra sesión;
  los errores llegan como `ApiRequestError` con `status`.
- Los fallos de carga ya se muestran con un toast global (`lib/queryClient.ts`); en mutaciones, `onError` → `toast.error`.
- Tras mutar, invalidar con los helpers de `lib/queryKeys.ts` (`invalidarSocios`, `invalidarJuegos`, `invalidarPrestamos`).
- Acciones destructivas o irreversibles: `ConfirmDialog`. No se cierra al confirmar: ciérralo en `onSuccess`
  (en `onError` déjalo abierto para reintentar).
- Búsquedas: `useDebouncedValue` + `placeholderData: keepPreviousData` (o `useInfiniteQuery` con "Cargar más").
- Configuración pública por clave: `useConfigValor(clave, fallback)`; `GET /config` (listado) es solo para directiva.
- Alias `@/*` → `./src/*`. Fuentes (Gemunu Libre, Quicksand, Frank Ruhl Libre) en `index.html`.
