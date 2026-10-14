# CLAUDE.md — frontend

Visión general, backend, despliegue (rama `web2-feature`, pruebas en test.dragondemadera.com) y comandos del
monorepo: ver `../CLAUDE.md`.

## Comandos (desde `frontend/`)

```bash
pnpm dev           # http://localhost:5173 (proxy /api → 127.0.0.1:3001)
pnpm build         # tsc -b + vite build
pnpm preview       # sirve el build
pnpm test          # vitest + jsdom
```

No hay ESLint configurado: `tsc` con `strict`, `noUnusedLocals` y `noUnusedParameters` hace de linter.

## Estructura

- `components/ui/` — solo componentes de shadcn/ui ("New York"); añadir con el CLI de shadcn, no a mano.
  Las dependencias de Radix que no usa ningún componente se quitan (se vuelven a añadir con el CLI si hacen falta).
- `components/atoms|molecules|organisms/` — atomic design. Importar cada componente por su ruta (no hay barrels).
  - átomos: `SEOHead`, `RolBadge`, `PageLoader`
  - moléculas: `RichTextContent`, `RichTextEditor`, `TelegramLoginWidget`, `QueryError`, `Paginacion`
  - organismos: `ConfirmDialog`, `AreaLayout`, `SolicitarPrestamoDialog`, `LudotecaTable`
- `pages/` — una página por ruta; las piezas de las páginas grandes van en una carpeta hermana
  (`admin/usuarios/`, `area/visita/`, `directiva/socios/`, `directiva/solicitudes/`, `ludoteca/juegos/`, `registro/`).
  Si una página pasa de ~300 líneas, sacar sus subcomponentes ahí.
- `services/api/` — un cliente por entidad sobre `client.ts`; las páginas nunca llaman a `api.*` directamente
- `lib/` — `format.ts` (fechas, `formatJugadores`), `estados.ts`, `roles.ts` (etiquetas y grupos de roles),
  `queryKeys.ts`, `cuotas.ts`
- `hooks/` — `useMe`, `useConfigValor` (`useConfig`, `useConfigValor`, `useConfigNumero`, `useEnlacesInteres`),
  `useMisPrestamosActivos`, `useDebouncedValue`, `useScrollNavigation`
- `data/texts.json` — textos de la web pública (Fase 1)

## Datos y caché (TanStack Query)

- **Query keys solo de `QK`** (`lib/queryKeys.ts`), nunca arrays a mano. Las constantes son la raíz (sirven de prefijo
  para invalidar) y las funciones devuelven la clave con filtros (`QK.JUEGOS_GESTION(search, estado)`).
  Todo lo de juegos cuelga de `['juegos']`. `QK.PENDIENTES` = `['pendientes']` lo usa el backend por SSE: no cambiarlo.
- Tras mutar, invalidar con los helpers (`invalidarSocios`, `invalidarJuegos`, `invalidarPrestamos`, `invalidarConfig`).
- **Una definición por dato compartido**: `useMe()` para el perfil, `useConfig*` para configuración (todas las lecturas
  de una clave comparten `QK.CONFIG(clave)` con la respuesta cruda y transforman con `select`),
  `useMisPrestamosActivos()` para los préstamos activos del socio. No repetir `useQuery` del mismo endpoint en cada página.
- `GET /config` (listado) es solo para directiva: Configuración saca de ahí todos los valores (una petición).
- **Pedir lo que se muestra**: filtros en el servidor (`tiene_llaves`, `con_telegram`, `estado`…) y paginación o
  `useInfiniteQuery` con "Cargar más"; nunca descargar cientos de registros para filtrar o mostrar tres.
- **Ficha = query por id**: el detalle guarda solo el id y carga con su propia query (`QK.SOCIO(id)`), así se refresca
  tras cada cambio. Las listas usan tipos ligeros (`SocioListado`), el detalle el completo (`SocioAdmin`).
- Las reglas de negocio las decide el backend (p. ej. si una visita es gratis: `siguiente_es_pago`); el frontend
  solo las muestra. La configuración que se lee aquí es para textos informativos.
- Respuestas paginadas: tipo `PaginatedResponse<T>` (`{ data, total, page, limit, totalPages }`).
- Clientes: query strings con `buildQuery(params)` de `client.ts`; payloads tipados (no `Record<string, unknown>`).

## Renderizado

- **Zustand siempre con selector**: `useAuthStore((s) => s.x)` o `useShallow` para varios campos; nunca `useAuthStore()`
  entero. Para permisos, seleccionar el booleano (`useAuthStore((s) => s.isDirectiva())`), no la función.
- **Listas grandes**: la fila es un componente con `memo` (`JuegoRow`, `JuegoCard`) y recibe callbacks estables
  (setters de `useState` o `useCallback`). Claves estables (id), nunca el índice en listas editables.
- **Sin efectos para sincronizar estado**: valores iniciales al montar y `key` en el padre para reiniciar
  (`JuegoFormDialog`, `RichTextConfigField`, `SolicitarPrestamoDialog`); derivar en el render lo que se pueda calcular.
- Filtrar listas largas mientras se escribe: `useDeferredValue` (ver `LudotecaTable`).
- Imágenes bajo el pliegue con `loading="lazy"` y `decoding="async"`.

## Convenciones

- Rutas en `config/routes.tsx`. La web pública va en el bundle inicial; el resto de páginas con `lazyPage()`,
  que recarga una vez si el chunk ya no existe (tras un deploy); si vuelve a fallar, lo pinta `ErrorBoundary`.
- **Un único `AreaLayout`** para toda el área privada; dentro, `RoleBasedRoute` por sección. Los grupos de roles
  (`DIRECTIVA`, `DIRECTIVA_Y_VOCALES`, `DIRECTIVA_Y_LUDOTECARIO`) están en `lib/roles.ts` y deben coincidir con los
  `requireRoles` del backend (lo comprueba `backend/src/__tests__/contrato_frontend.test.ts`).
- Las reglas del registro (`pages/registro/schema.ts`) y los roles/estados de `lib/` se reflejan en el backend: si cambias
  uno, cambia el otro o el test de contrato fallará en CI.
- `client.ts` añade `/api`: `api.get('/socios')`, no `api.get('/api/socios')`. Un 401 cierra sesión;
  los errores llegan como `ApiRequestError` con `status`.
- Los fallos de carga ya se muestran con un toast global (`lib/queryClient.ts`); en listas, además
  `isError ? <QueryError onRetry={refetch} />` para que no parezca una lista vacía. En mutaciones, `onError` → `toast.error`.
- Acciones destructivas o irreversibles: `ConfirmDialog`. No se cierra al confirmar: ciérralo en `onSuccess`
  (en `onError` déjalo abierto para reintentar).
- Búsquedas: `useDebouncedValue` + `placeholderData: keepPreviousData` (o `useInfiniteQuery` con "Cargar más").
- Paginación con `molecules/Paginacion`.
- Alias `@/*` → `./src/*`. Fuentes (Gemunu Libre, Quicksand, Frank Ruhl Libre) en `index.html`.
