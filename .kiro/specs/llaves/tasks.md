# Plan de implementación: Gestión de Llaves

## Overview

Implementación del flujo completo de gestión de llaves del local. El backend ya tiene `solicitarLlaves`, `aprobarLlaves` y sus rutas. Lo que queda es: el método `devolverLlaves` en backend, el cliente API en frontend, la lógica de estado compartida, y las vistas en el área del socio, el panel de directiva y una nueva página de titulares.

## Tasks

- [x] 1. Backend: implementar `devolverLlaves` y su ruta
  - [x] 1.1 Añadir método `devolverLlaves(socioId, adminId)` en `SociosService`
    - Verificar que el socio existe; si no, lanzar `'Socio no encontrado'`
    - Verificar `tiene_llaves === true`; si no, lanzar `'El socio no tiene ninguna llave asignada'`
    - Actualizar: `tiene_llaves = false`, `fecha_solicitud_llaves = null`, `fecha_aprobacion_llaves = null`, `aprobado_llaves_por_id = null`
    - Devolver el usuario actualizado con `SOCIO_PUBLIC_SELECT`
    - _Requirements: 4.1, 4.2_

  - [ ]* 1.2 Escribir tests unitarios para `devolverLlaves`
    - Socio no encontrado → lanza error
    - Socio sin llaves → lanza `'El socio no tiene ninguna llave asignada'`
    - Socio con llaves → devuelve usuario con los cuatro campos limpiados
    - _Requirements: 4.1, 4.2_

  - [ ]* 1.3 Escribir property test — Property 7: round-trip solicitar → aprobar → devolver
    - **Property 7: Round-trip solicitar → aprobar → devolver restaura estado inicial**
    - **Validates: Requirements 4.1**

  - [ ]* 1.4 Escribir property test — Property 8: devolución rechazada si el socio no es titular
    - **Property 8: Devolución rechazada si el socio no es titular**
    - **Validates: Requirements 4.2**

  - [x] 1.5 Añadir ruta `POST /api/socios/:id/devolver-llaves` en `socios.routes.ts`
    - `preHandler: requireRoles(...ROLES.DIRECTIVA)`
    - Llamar a `sociosService.devolverLlaves(id, request.user.id)`
    - Responder `{ message: 'Llave devuelta correctamente', data: socio }`
    - _Requirements: 4.1, 7.1_

  - [ ]* 1.6 Escribir property test — Property 11: rutas de admin rechazan usuarios sin rol de directiva
    - **Property 11: Rutas de admin rechazan usuarios sin rol de directiva**
    - Cubrir también `POST /socios/:id/devolver-llaves` además de `aprobar-llaves`
    - **Validates: Requirements 7.1**

- [ ] 2. Checkpoint — Asegurarse de que todos los tests del backend pasan
  - Asegurarse de que todos los tests pasan; preguntar al usuario si surge alguna duda.

- [x] 3. Frontend: cliente API y helper de estado
  - [x] 3.1 Añadir `sociosApi.devolverLlaves(id)` en `frontend/src/services/api/socios.ts`
    - `devolverLlaves: (id: string) => api.action<{ data: SocioAdmin }>(\`/socios/\${id}/devolver-llaves\`)`
    - _Requirements: 4.1_

  - [x] 3.2 Crear helper `getEstadoLlaves(socio)` en un archivo de utilidades compartido (p. ej. `frontend/src/lib/llaves.ts`)
    - Definir el tipo `EstadoLlaves` con los tres casos: `sin_llave`, `pendiente`, `titular`
    - Implementar la función según el diseño: `tiene_llaves` → titular; `fecha_solicitud_llaves && !tiene_llaves` → pendiente; resto → sin_llave
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 3.3 Escribir tests unitarios para `getEstadoLlaves`
    - Ejemplos concretos para los tres estados
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 3.4 Escribir property test — Property 9: `getEstadoLlaves` cubre los tres estados sin solapamiento
    - **Property 9: Renderizado de estado de llaves cubre los tres estados**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 4. Frontend: sección "Mis llaves" en el área del socio
  - [x] 4.1 Reemplazar la ruta `/area/llaves` (actualmente `ComingSoon`) por una sección real dentro de `DashboardPage` o como página propia en `frontend/src/pages/area/LlavesAreaPage.tsx`
    - Obtener el perfil del socio con `sociosApi.getMe()` (ya disponible)
    - Usar `getEstadoLlaves` para derivar el estado visual
    - Estado `sin_llave` + elegible (≥6 meses desde `fecha_alta`): mostrar botón "Solicitar llave"
    - Estado `sin_llave` + no elegible: mostrar mensaje con la fecha a partir de la cual podrá solicitar
    - Estado `pendiente`: badge "Pendiente de aprobación" + fecha de solicitud
    - Estado `titular`: badge "Tienes llave" + fecha de aprobación
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 5.2, 5.3_

  - [x] 4.2 Conectar el botón "Solicitar llave" con `sociosApi.solicitarLlaves(id)` (ya implementado)
    - Deshabilitar el botón mientras `isPending`
    - Mostrar `toast.error(err.message)` en caso de error
    - Invalidar la query del perfil tras éxito
    - _Requirements: 1.1_

  - [ ]* 4.3 Escribir tests unitarios para la sección "Mis llaves"
    - Botón visible solo cuando el socio es elegible y no tiene llave ni solicitud pendiente
    - Mensaje de fecha visible cuando no es elegible
    - Badge "Pendiente" visible cuando hay solicitud en curso
    - Badge "Tienes llave" visible cuando es titular
    - _Requirements: 1.2, 5.2, 5.3_

- [x] 5. Frontend: sección "Llaves" en el detalle del socio (panel admin)
  - [x] 5.1 Añadir sección "Llaves" en el componente `SocioDetalle` dentro de `GestionSociosPage.tsx`
    - Usar `getEstadoLlaves` para mostrar el estado actual (igual que la vista del socio)
    - Si `tiene_llaves === true`: mostrar botón "Registrar devolución"
    - Si hay solicitud pendiente: indicar que aparece en la página de Solicitudes
    - Mostrar `fecha_aprobacion_llaves` y nombre del admin autorizador cuando aplica
    - _Requirements: 4.3, 5.1, 5.2, 5.3_

  - [x] 5.2 Implementar `AlertDialog` de confirmación antes de ejecutar la devolución
    - Llamar a `sociosApi.devolverLlaves(socio.id)` al confirmar
    - Mostrar `toast.success` / `toast.error` según resultado
    - Invalidar la query `'socios-gestion'` tras éxito
    - _Requirements: 4.1, 4.3_

  - [ ]* 5.3 Escribir tests unitarios para la sección "Llaves" en `SocioDetalle`
    - Botón "Registrar devolución" visible solo cuando `tiene_llaves === true`
    - `AlertDialog` se muestra antes de ejecutar la acción
    - _Requirements: 4.2, 4.3_

- [ ] 6. Checkpoint — Asegurarse de que todos los tests del frontend pasan hasta aquí
  - Asegurarse de que todos los tests pasan; preguntar al usuario si surge alguna duda.

- [x] 7. Frontend: nueva página `LlavesPage` en el panel de directiva
  - [x] 7.1 Crear `frontend/src/pages/directiva/LlavesPage.tsx`
    - Obtener socios con `sociosApi.getAll({ estado: 'activo', limit: 200 })` y filtrar en cliente por `tiene_llaves === true`
    - Mostrar tabla con columnas: nombre y apellidos, fecha de aprobación, aprobado por
    - Ordenar por `fecha_aprobacion_llaves` ascendente
    - Mostrar contador total de llaves entregadas
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ]* 7.2 Escribir property test — Property 10: listado de titulares es completo, ordenado y con contador correcto
    - **Property 10: Listado de titulares es completo, ordenado y con contador correcto**
    - **Validates: Requirements 6.1, 6.2, 6.3**

- [x] 8. Frontend: ruta y enlace de navegación para `LlavesPage`
  - [x] 8.1 Añadir la ruta `/directiva/llaves` en `frontend/src/config/routes.tsx`
    - Importar `LlavesPage` y registrarla dentro del bloque de rutas de directiva
    - _Requirements: 6.1, 7.1_

  - [x] 8.2 Añadir enlace "Llaves" en la sección "Directiva" del sidebar en `AreaLayout.tsx`
    - Solo visible para `isDirectivaOVocal()` (mismo guard que los otros ítems de directiva)
    - Usar el icono `Key` (ya importado en `AreaLayout.tsx`)
    - _Requirements: 6.1, 7.1_

- [ ] 9. Checkpoint final — Asegurarse de que todos los tests pasan
  - Asegurarse de que todos los tests pasan; preguntar al usuario si surge alguna duda.

## Notes

- Las tareas marcadas con `*` son opcionales y se pueden omitir para un MVP más rápido.
- Cada tarea referencia los requisitos específicos para trazabilidad.
- Los property tests usan **fast-check** con `numRuns: 100` mínimo; cada test debe incluir el comentario `// Feature: llaves, Property N: <texto>`.
- El helper `getEstadoLlaves` debe exportarse desde `frontend/src/lib/llaves.ts` para ser reutilizable en `SocioDetalle`, la página del área del socio y `LlavesPage`.
