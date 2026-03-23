# Plan de Implementación: Cuota Conjunta

## Overview

Implementación incremental de la feature cuota conjunta: migración de BD, backend (schema Prisma, Zod, servicios, rutas) y frontend (tipos, API client, RegistroPage, SolicitudesPage). Cada tarea construye sobre la anterior y termina con todo integrado.

## Tasks

- [x] 1. Migración de base de datos
  - [x] 1.1 Actualizar `schema.prisma` con los cambios del diseño
    - Añadir valor `conjunta` al enum `TipoCuota` y eliminar `pareja` y `familiar`
    - Añadir valor `familiar_directo` al enum `TipoRelacion`
    - Crear enum `EstadoSolicitud` con valores `pendiente`, `aprobada`, `rechazada`
    - Crear modelo `SolicitudGrupal` con campos `id`, `titular_id`, `estado`, `created_at`, `updated_at`
    - Añadir campo `solicitud_grupal_id` (nullable) al modelo `Usuario`
    - Añadir relaciones `grupo_como_titular` y `solicitud_grupal` en `Usuario`
    - _Requirements: 1.1, 1.2, 1.4, 2.1, 2.2_

  - [x] 1.2 Crear migration SQL explícita
    - Crear archivo en `backend/prisma/migrations/` con el SQL del diseño
    - Paso 1: `ALTER TYPE "TipoCuota" ADD VALUE 'conjunta'`
    - Paso 2: `UPDATE "Usuario" SET tipo_cuota = 'conjunta' WHERE tipo_cuota IN ('pareja','familiar')`
    - Paso 3: Recrear enum `TipoCuota` sin `pareja` ni `familiar` (drop + create + alter column)
    - Paso 4: Crear enum `EstadoSolicitud`
    - Paso 5: Crear tabla `SolicitudGrupal`
    - Paso 6: `ALTER TABLE "Usuario" ADD COLUMN "solicitud_grupal_id" UUID REFERENCES "SolicitudGrupal"("id")`
    - Paso 7: `ALTER TYPE "TipoRelacion" ADD VALUE 'familiar_directo'`
    - _Requirements: 1.2, 1.3, 2.1, 2.2_

  - [ ]* 1.3 Escribir test de propiedad para la migración de datos
    - **Property 1: Migración de datos preserva semántica**
    - **Validates: Requirements 1.3**
    - Usar `fast-check` con una BD de test: generar registros con `tipo_cuota` en `pareja`/`familiar`, ejecutar migration, verificar que todos tienen `conjunta` y ninguno tiene los valores obsoletos

- [x] 2. Schema Zod de registro actualizado
  - [x] 2.1 Actualizar `backend/src/schemas/auth.schema.ts`
    - Definir `passwordSchema` reutilizable (min 8, mayúscula, número)
    - Definir `miembroAdicionalSchema` con campos: `nombre`, `apellidos`, `dni` (regex DNI), `email`, `password`, `confirmPassword`, `tipo_relacion` (`pareja` | `familiar_directo`) y refinement de contraseñas
    - Reemplazar `registerSchema` por `z.discriminatedUnion('tipo_cuota', [...])`:
      - Rama `individual`: campos actuales del titular sin `miembros_adicionales`
      - Rama `conjunta`: campos del titular + `miembros_adicionales: z.array(miembroAdicionalSchema).min(1).max(5)`
    - Actualizar el tipo exportado `RegisterInput`
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 2.2 Escribir test de propiedad para validación de tamaño del grupo
    - **Property 6: Validación de tamaño del grupo**
    - **Validates: Requirements 4.3, 4.11, 8.3**
    - Generar payloads con `fc.oneof(fc.constant(0), fc.integer({ min: 6, max: 20 }))` miembros y verificar que `registerSchema.safeParse` devuelve `success === false`
    - Generar payloads con `fc.integer({ min: 1, max: 5 })` miembros válidos y verificar `success === true`

  - [ ]* 2.3 Escribir tests unitarios para `registerSchema`
    - Payload individual sin `miembros_adicionales` → válido
    - Payload conjunta con 1 miembro → válido
    - Payload conjunta con 0 miembros → inválido
    - Payload conjunta con 6 miembros → inválido
    - DNI con formato incorrecto en miembro → inválido
    - `confirmPassword` distinto a `password` en miembro → inválido
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 3. Checkpoint — Verificar schema y migración
  - Asegurarse de que `npx prisma validate` pasa sin errores y los tests del schema Zod están en verde. Preguntar al usuario si hay dudas antes de continuar.

- [x] 4. Servicio de registro actualizado (`auth.service.ts`)
  - [x] 4.1 Actualizar `AuthService.register` para soportar cuota conjunta
    - Mantener el flujo individual sin cambios
    - Para `tipo_cuota === 'conjunta'`:
      - Validar unicidad de todos los emails y DNIs del grupo (titular + miembros) antes de abrir la transacción
      - Abrir `prisma.$transaction(async (tx) => { ... })`
      - Crear `SolicitudGrupal` con `estado: 'pendiente'`
      - Crear usuario titular con `solicitud_grupal_id` apuntando al grupo
      - Iterar `miembros_adicionales`: crear cada usuario con `solicitud_grupal_id` y crear `RelacionSocio` (titular → miembro)
    - Devolver `{ titular, miembros_adicionales_count }` en el 201
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

  - [ ]* 4.2 Escribir test de propiedad para atomicidad del registro conjunto
    - **Property 4: Atomicidad del registro conjunto**
    - **Validates: Requirements 2.4, 5.3, 5.4, 5.5, 5.6**
    - `fc.integer({ min: 1, max: 5 })` → generar payload con N miembros, registrar, verificar 1 `SolicitudGrupal` + N+1 `Usuario` + N `RelacionSocio`
    - Caso fallo: introducir email duplicado en el último miembro, verificar 0 `SolicitudGrupal` nuevas y 0 `Usuario` nuevos

  - [ ]* 4.3 Escribir tests unitarios para `AuthService.register`
    - Registro individual exitoso → usuario sin `solicitud_grupal_id`
    - Registro conjunto con 1 miembro → SolicitudGrupal + 2 usuarios + 1 RelacionSocio
    - Email duplicado en miembro → rollback completo
    - DNI duplicado en titular → error 409 antes de la transacción
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 4.4 Escribir test de propiedad para invariante de no-asociación individual
    - **Property 3: Invariante de no-asociación individual**
    - **Validates: Requirements 2.3, 5.2**
    - Para cualquier registro individual exitoso, verificar que `solicitud_grupal_id === null`

  - [ ]* 4.5 Escribir test de propiedad para invariante de asociación grupal
    - **Property 2: Invariante de asociación grupal**
    - **Validates: Requirements 2.2**
    - Para cualquier registro conjunto exitoso, verificar que todos los usuarios del grupo tienen `solicitud_grupal_id` no nulo apuntando a la misma `SolicitudGrupal`

- [x] 5. Servicio de socios actualizado (`socios.service.ts`)
  - [x] 5.1 Actualizar `SociosService.getPendientes` para devolver respuesta diferenciada
    - Cambiar la firma de retorno a `{ individuales: Usuario[], grupos: SolicitudGrupalConMiembros[] }`
    - Query de individuales: `findMany` donde `estado = 'pendiente'` y `solicitud_grupal_id = null`
    - Query de grupos: `findMany` en `SolicitudGrupal` donde `estado = 'pendiente'`, incluyendo `titular` y `miembros` con sus campos relevantes
    - _Requirements: 6.1, 6.5, 6.6_

  - [x] 5.2 Implementar `SociosService.aprobarGrupo`
    - Recibir `grupoId` y `aprobadoPorId`
    - Buscar `SolicitudGrupal` con sus miembros; lanzar 404 si no existe
    - Verificar que `estado === 'pendiente'`; lanzar 400 si no
    - Verificar que todos los usuarios del grupo están en `pendiente`; lanzar 400 con nombre del conflicto si no
    - `prisma.$transaction`: `updateMany` usuarios a `activo` con `fecha_alta` y `aprobado_por_id`; `update` SolicitudGrupal a `aprobada`
    - _Requirements: 7.3, 7.4, 7.5, 7.9, 7.10_

  - [x] 5.3 Implementar `SociosService.rechazarGrupo`
    - Misma estructura que `aprobarGrupo` pero actualiza usuarios a `baja` con `fecha_baja` y `baja_por_id`, y SolicitudGrupal a `rechazada`
    - _Requirements: 7.6, 7.7, 7.8, 7.9, 7.10_

  - [ ]* 5.4 Escribir test de propiedad para aprobación grupal atómica
    - **Property 9: Acción grupal atómica — aprobación**
    - **Validates: Requirements 7.3, 7.4, 7.5**
    - `fc.integer({ min: 1, max: 5 })` → crear grupo pendiente con N miembros, aprobar, verificar que todos los K=N+1 usuarios tienen `estado='activo'`, `fecha_alta` y `aprobado_por_id` no nulos, y `SolicitudGrupal.estado='aprobada'`

  - [ ]* 5.5 Escribir test de propiedad para rechazo grupal atómico
    - **Property 10: Acción grupal atómica — rechazo**
    - **Validates: Requirements 7.6, 7.7, 7.8**
    - Igual que 5.4 pero verificando `estado='baja'`, `fecha_baja` y `baja_por_id`

  - [ ]* 5.6 Escribir test de propiedad para guard de estado
    - **Property 11: Guard de estado en acción grupal**
    - **Validates: Requirements 7.10**
    - Crear grupo pendiente, activar manualmente un miembro, intentar `aprobarGrupo` → debe lanzar error; verificar que los demás miembros siguen en `pendiente`

  - [ ]* 5.7 Escribir test de propiedad para respuesta de pendientes diferenciada
    - **Property 8: Respuesta de pendientes diferenciada**
    - **Validates: Requirements 6.1, 6.5, 6.6**
    - Crear M individuales pendientes y N grupos pendientes, llamar a `getPendientes`, verificar `individuales.length === M` y `grupos.length === N`

  - [ ]* 5.8 Escribir tests unitarios para los métodos de socios
    - `getPendientes` con mezcla de individuales y grupos → respuesta diferenciada correcta
    - `aprobarGrupo` con grupo ya aprobado → error 400
    - `rechazarGrupo` con grupo no encontrado → error 404
    - _Requirements: 6.6, 7.3, 7.6, 7.10_

- [x] 6. Rutas de grupos en `socios.routes.ts`
  - [x] 6.1 Añadir rutas `POST /api/socios/grupos/:grupoId/aprobar` y `POST /api/socios/grupos/:grupoId/rechazar`
    - Ambas con `preHandler: requireRoles(...ROLES.DIRECTIVA)`
    - Extraer `grupoId` de `request.params`
    - Llamar a `sociosService.aprobarGrupo` / `rechazarGrupo` con `request.user.id`
    - Manejar errores 400 y 404 con los mensajes del diseño
    - _Requirements: 7.9_

- [ ] 7. Checkpoint — Verificar backend completo
  - Asegurarse de que todos los tests del backend pasan y los endpoints responden correctamente. Preguntar al usuario si hay dudas antes de continuar con el frontend.

- [x] 8. Tipos frontend actualizados (`frontend/src/types/api.ts`)
  - [x] 8.1 Actualizar tipos en `frontend/src/types/api.ts`
    - Cambiar `TipoCuota` a `'individual' | 'conjunta'`
    - Añadir `TipoRelacion = 'pareja' | 'familiar_directo'`
    - Añadir `EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada'`
    - Añadir interfaz `MiembroAdicionalPayload` con campos del diseño
    - Añadir interfaz `SolicitudGrupal` con `id`, `estado`, `titular`, `miembros` (con `tipo_relacion`), `created_at`
    - Actualizar `RegisterPayload` a union discriminada por `tipo_cuota`
    - _Requirements: 1.1, 4.10, 6.2, 6.3_

- [x] 9. API client frontend actualizado (`frontend/src/services/api/socios.ts`)
  - [x] 9.1 Actualizar `sociosApi.getPendientes` y añadir métodos de grupo
    - Cambiar tipo de retorno de `getPendientes` a `{ data: { individuales: SocioAdmin[]; grupos: SolicitudGrupal[] } }`
    - Añadir `aprobarGrupo: (grupoId: string) => api.post(...)`
    - Añadir `rechazarGrupo: (grupoId: string) => api.post(...)`
    - _Requirements: 6.6, 7.1, 7.2_

- [x] 10. Función `calcularPrecio` y tests
  - [x] 10.1 Crear `frontend/src/lib/cuota.ts` con la función `calcularPrecio`
    - Exportar `export function calcularPrecio(numMiembrosAdicionales: number): number { return 15 + 5 * numMiembrosAdicionales }`
    - _Requirements: 3.2, 3.3, 3.4_

  - [ ]* 10.2 Escribir test de propiedad para la fórmula de precio
    - **Property 5: Fórmula de precio**
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**
    - `fc.integer({ min: 0, max: 5 })` → verificar que `calcularPrecio(n) === 15 + 5 * n` para todo N en el rango

  - [ ]* 10.3 Escribir tests unitarios para `calcularPrecio`
    - `calcularPrecio(0)` → 15
    - `calcularPrecio(1)` → 20
    - `calcularPrecio(5)` → 40
    - _Requirements: 3.2, 3.3, 3.4_

- [x] 11. Actualizar `RegistroPage.tsx` con sección de miembros adicionales
  - [x] 11.1 Actualizar el schema Zod del formulario en `RegistroPage.tsx`
    - Añadir `miembroAdicionalSchema` local con los campos del diseño (incluyendo `confirmPassword` y `tipo_relacion`)
    - Convertir `registroSchema` a `z.discriminatedUnion('tipo_cuota', [...])` con ramas `individual` y `conjunta`
    - Añadir `.superRefine` en la rama conjunta para validar unicidad de emails y DNIs entre miembros y titular
    - _Requirements: 4.5, 4.6, 4.7, 4.8, 4.9, 4.10, 4.11_

  - [x] 11.2 Añadir sección de miembros adicionales al formulario
    - Usar `useFieldArray` de react-hook-form para el array `miembros_adicionales`
    - Renderizar la sección condicionalmente: solo cuando `tipoCuota === 'conjunta'`
    - Cada miembro muestra campos: nombre, apellidos, DNI, email, contraseña, confirmar contraseña, tipo de relación (Select con `pareja` / `familiar_directo`)
    - Botón "Añadir miembro" (deshabilitado si ya hay 5 miembros)
    - Botón "Eliminar" por cada miembro
    - Mostrar precio total calculado con `calcularPrecio(fields.length)` en tiempo real
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.10, 3.3, 3.4, 3.5_

  - [x] 11.3 Actualizar la mutación de envío en `RegistroPage.tsx`
    - Adaptar el payload enviado a `authApi.register` para incluir `miembros_adicionales` cuando `tipo_cuota === 'conjunta'`
    - Eliminar `confirmPassword` de cada miembro antes de enviar (igual que el titular)
    - _Requirements: 5.1, 5.7_

  - [ ]* 11.4 Escribir tests unitarios para `RegistroPage`
    - Formulario con `tipo_cuota=individual` → sección miembros oculta
    - Formulario con `tipo_cuota=conjunta` → sección miembros visible
    - Envío con 0 miembros en conjunta → error de validación visible
    - Precio se actualiza al añadir/eliminar miembros
    - _Requirements: 4.1, 4.2, 4.11, 3.4, 3.5_

- [x] 12. Actualizar `SolicitudesPage.tsx` con tarjetas grupales
  - [x] 12.1 Crear componente `GrupoSolicitudCard`
    - Recibir `grupo: SolicitudGrupal` como prop
    - Mostrar datos del titular (nombre, apellidos, DNI, email, apodo, alias_telegram)
    - Mostrar lista de miembros con nombre, apellidos, DNI, email y tipo de relación (etiqueta legible: "Pareja" / "Familiar directo")
    - Mostrar precio total: `calcularPrecio(grupo.miembros.length)` + "€/mes"
    - Botones "Aprobar" y "Rechazar" que llaman a `sociosApi.aprobarGrupo` / `rechazarGrupo`
    - Al completar, invalidar query `['pendientes']`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 7.1, 7.2_

  - [x] 12.2 Actualizar `SolicitudesPage` para consumir la respuesta diferenciada
    - Cambiar el tipo de `pendientesData` para desestructurar `{ individuales, grupos }`
    - Renderizar `<AltaSolicitudCard>` para cada elemento de `individuales` (sin cambios)
    - Añadir nueva sección "Solicitudes conjuntas" que renderiza `<GrupoSolicitudCard>` para cada grupo
    - Actualizar el contador `totalPendiente` para incluir `grupos.length`
    - _Requirements: 6.1, 6.5_

  - [ ]* 12.3 Escribir tests unitarios para `SolicitudesPage` y `GrupoSolicitudCard`
    - Renderiza sección de grupos cuando hay grupos pendientes
    - Muestra precio correcto según número de miembros
    - Botón Aprobar llama a `aprobarGrupo` con el id correcto
    - Botón Rechazar llama a `rechazarGrupo` con el id correcto
    - _Requirements: 6.1, 6.2, 6.4, 7.1, 7.2_

- [ ] 13. Checkpoint final — Integración completa
  - Asegurarse de que todos los tests pasan, el formulario de registro funciona para ambos tipos de cuota, y el panel de directiva muestra y gestiona correctamente las solicitudes individuales y grupales. Preguntar al usuario si hay dudas.

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia los requisitos específicos para trazabilidad
- Los tests de propiedad usan `fast-check` con mínimo 100 iteraciones (`numRuns: 100`)
- Cada test de propiedad debe incluir el comentario `// Feature: cuota-conjunta, Property N: <texto>`
- La migración SQL debe ejecutarse con `npx prisma migrate dev --name cuota_conjunta` tras actualizar el schema
