# Requirements Document

## Introduction

Esta feature modifica el sistema de tipos de cuota del club de juegos de mesa "Dragón de Madera", simplificando de tres tipos (individual, pareja, familiar) a dos (individual, conjunta). La cuota conjunta permite registrar a varios miembros del mismo núcleo familiar o pareja en una única solicitud, con precio escalonado. El panel de directiva debe gestionar estas solicitudes agrupadas como una unidad, aprobando o rechazando a todos los miembros a la vez.

## Glossary

- **Sistema**: El sistema de gestión de socios de Dragón de Madera (backend Fastify + frontend React).
- **Registro_Service**: El servicio backend responsable de crear usuarios (`auth.service.ts`).
- **Socios_Service**: El servicio backend responsable de gestionar socios (`socios.service.ts`).
- **Formulario_Registro**: La página frontend de solicitud de alta (`RegistroPage.tsx`).
- **Panel_Directiva**: La página frontend de solicitudes pendientes (`SolicitudesPage.tsx`).
- **Titular**: El primer miembro de una cuota conjunta, que inicia el registro del grupo.
- **Miembro_Adicional**: Cada familiar directo o pareja mayor de edad añadido a una cuota conjunta.
- **Grupo_Conjunto**: El conjunto formado por un Titular y uno o más Miembros_Adicionales bajo una cuota conjunta.
- **SolicitudGrupal**: La entidad que agrupa a todos los usuarios de un Grupo_Conjunto para su revisión por la directiva.
- **TipoCuota**: Enumeración con los valores `individual` y `conjunta`.
- **TipoRelacion**: Enumeración con los valores `pareja` y `familiar_directo`.
- **DNI**: Documento Nacional de Identidad español, formato 8 dígitos + 1 letra (ej: `12345678A`).

---

## Requirements

### Requirement 1: Simplificación del enum TipoCuota

**User Story:** Como desarrollador, quiero que el enum `TipoCuota` tenga solo los valores `individual` y `conjunta`, para que el modelo de datos refleje la nueva lógica de negocio.

#### Acceptance Criteria

1. THE Sistema SHALL definir el enum `TipoCuota` con exactamente dos valores: `individual` y `conjunta`.
2. THE Sistema SHALL eliminar los valores `pareja` y `familiar` del enum `TipoCuota`.
3. WHEN el Sistema realiza una migración de base de datos, THE Sistema SHALL convertir los registros existentes con `tipo_cuota = 'pareja'` o `tipo_cuota = 'familiar'` al valor `conjunta`.
4. THE Sistema SHALL mantener `individual` como valor por defecto del campo `tipo_cuota` en el modelo `Usuario`.

---

### Requirement 2: Modelo de agrupación de solicitudes conjuntas

**User Story:** Como arquitecto del sistema, quiero un mecanismo para agrupar los usuarios de una cuota conjunta en una única solicitud, para que la directiva pueda revisarlos y aprobarlos como unidad.

#### Acceptance Criteria

1. THE Sistema SHALL crear un modelo `SolicitudGrupal` en el esquema Prisma con los campos: `id` (UUID), `titular_id` (referencia al Usuario Titular), `estado` (`pendiente` | `aprobada` | `rechazada`), `created_at` y `updated_at`.
2. THE Sistema SHALL crear una relación entre `SolicitudGrupal` y `Usuario` de forma que cada usuario de cuota conjunta pertenezca a exactamente una `SolicitudGrupal`.
3. WHEN se crea una solicitud de cuota `individual`, THE Registro_Service SHALL crear el usuario sin asociarlo a ninguna `SolicitudGrupal`.
4. WHEN se crea una solicitud de cuota `conjunta`, THE Registro_Service SHALL crear una `SolicitudGrupal` y asociar a ella al Titular y a todos los Miembros_Adicionales.
5. THE Sistema SHALL mantener el modelo `RelacionSocio` existente para registrar el tipo de relación entre el Titular y cada Miembro_Adicional (`pareja` o `familiar_directo`).

---

### Requirement 3: Cálculo dinámico del precio de la cuota conjunta

**User Story:** Como usuario que se registra, quiero ver el precio total calculado en tiempo real según el número de miembros que añado, para saber cuánto pagaré antes de enviar la solicitud.

#### Acceptance Criteria

1. THE Sistema SHALL establecer el precio base de la cuota `individual` en 15€/mes.
2. THE Sistema SHALL establecer el precio base de la cuota `conjunta` en 15€/mes para el Titular.
3. WHEN el Titular añade un Miembro_Adicional, THE Formulario_Registro SHALL incrementar el precio total en 5€/mes por cada Miembro_Adicional.
4. THE Formulario_Registro SHALL mostrar el precio total calculado con la fórmula: `15€ + (5€ × número de Miembros_Adicionales)`.
5. WHEN el Titular elimina un Miembro_Adicional del formulario, THE Formulario_Registro SHALL recalcular y mostrar el precio actualizado de forma inmediata.

---

### Requirement 4: Formulario de registro con sección de miembros adicionales

**User Story:** Como usuario que quiere registrarse con cuota conjunta, quiero poder añadir los datos de mis familiares o pareja en el mismo formulario, para que todos queden registrados en una única solicitud.

#### Acceptance Criteria

1. WHEN el usuario selecciona `conjunta` como tipo de cuota, THE Formulario_Registro SHALL mostrar una sección para añadir Miembros_Adicionales.
2. WHEN el usuario selecciona `individual` como tipo de cuota, THE Formulario_Registro SHALL ocultar la sección de Miembros_Adicionales.
3. THE Formulario_Registro SHALL permitir añadir entre 1 y 5 Miembros_Adicionales a una cuota conjunta.
4. WHEN el usuario añade un Miembro_Adicional, THE Formulario_Registro SHALL requerir los siguientes campos obligatorios: nombre, apellidos, DNI, email y contraseña.
5. THE Formulario_Registro SHALL validar que el DNI de cada Miembro_Adicional tenga el formato correcto (8 dígitos + 1 letra).
6. THE Formulario_Registro SHALL validar que el email de cada Miembro_Adicional sea un email válido y distinto al del Titular y al de los demás Miembros_Adicionales.
7. THE Formulario_Registro SHALL validar que el DNI de cada Miembro_Adicional sea distinto al del Titular y al de los demás Miembros_Adicionales.
8. THE Formulario_Registro SHALL requerir que la contraseña de cada Miembro_Adicional tenga mínimo 8 caracteres, al menos una mayúscula y al menos un número.
9. THE Formulario_Registro SHALL incluir un campo de confirmación de contraseña para cada Miembro_Adicional.
10. THE Formulario_Registro SHALL permitir al usuario indicar el tipo de relación de cada Miembro_Adicional con el Titular (`pareja` o `familiar_directo`).
11. IF el usuario intenta enviar el formulario con cuota conjunta sin ningún Miembro_Adicional, THEN THE Formulario_Registro SHALL mostrar un error indicando que se debe añadir al menos un miembro.

---

### Requirement 5: Endpoint de registro grupal

**User Story:** Como sistema, quiero que el endpoint de registro acepte una solicitud con múltiples miembros, para poder crear todos los usuarios y la SolicitudGrupal en una única transacción atómica.

#### Acceptance Criteria

1. WHEN se recibe una petición `POST /api/auth/register` con `tipo_cuota: 'conjunta'`, THE Registro_Service SHALL aceptar un array `miembros_adicionales` con los datos de cada Miembro_Adicional.
2. WHEN se recibe una petición `POST /api/auth/register` con `tipo_cuota: 'individual'`, THE Registro_Service SHALL ignorar el campo `miembros_adicionales` si está presente y procesar el registro como hasta ahora.
3. THE Registro_Service SHALL crear todos los usuarios del Grupo_Conjunto dentro de una única transacción de base de datos.
4. IF algún email o DNI de cualquier miembro del Grupo_Conjunto ya existe en la base de datos, THEN THE Registro_Service SHALL abortar la transacción completa y devolver un error 409 indicando qué campo está duplicado.
5. THE Registro_Service SHALL crear una `SolicitudGrupal` en estado `pendiente` y asociar a ella al Titular y a todos los Miembros_Adicionales dentro de la misma transacción.
6. THE Registro_Service SHALL crear las entradas correspondientes en `RelacionSocio` para cada Miembro_Adicional, usando el Titular como `socio_principal_id`.
7. WHEN el registro grupal se completa con éxito, THE Registro_Service SHALL devolver un código HTTP 201 con los datos del Titular y el número de miembros adicionales creados.

---

### Requirement 6: Visualización agrupada en el Panel de Directiva

**User Story:** Como miembro de la directiva, quiero ver las solicitudes de cuota conjunta agrupadas como una única entrada, para poder revisar a todos los miembros del grupo de un vistazo.

#### Acceptance Criteria

1. WHEN el Panel_Directiva carga las solicitudes de alta pendientes, THE Panel_Directiva SHALL mostrar cada `SolicitudGrupal` como una única tarjeta agrupada, no como entradas individuales separadas.
2. THE Panel_Directiva SHALL mostrar en la tarjeta grupal: los datos del Titular (nombre, apellidos, DNI, email) y los datos de cada Miembro_Adicional (nombre, apellidos, DNI, email).
3. THE Panel_Directiva SHALL mostrar el tipo de relación de cada Miembro_Adicional con el Titular.
4. THE Panel_Directiva SHALL mostrar el precio total de la cuota conjunta calculado según el número de miembros del grupo.
5. THE Panel_Directiva SHALL mostrar las solicitudes individuales (cuota `individual`) como tarjetas individuales, igual que en la implementación actual.
6. THE Socios_Service SHALL exponer un endpoint `GET /api/socios/pendientes` que devuelva tanto las solicitudes individuales como las `SolicitudGrupal` pendientes, diferenciadas por tipo.

---

### Requirement 7: Aprobación y rechazo grupal

**User Story:** Como miembro de la directiva, quiero aprobar o rechazar una solicitud conjunta de forma atómica, para que todos los miembros del grupo queden activados o rechazados a la vez.

#### Acceptance Criteria

1. THE Panel_Directiva SHALL mostrar un único botón "Aprobar" por cada `SolicitudGrupal` pendiente.
2. THE Panel_Directiva SHALL mostrar un único botón "Rechazar" por cada `SolicitudGrupal` pendiente.
3. WHEN la directiva aprueba una `SolicitudGrupal`, THE Socios_Service SHALL cambiar el `estado` de TODOS los usuarios del grupo de `pendiente` a `activo` en una única transacción.
4. WHEN la directiva aprueba una `SolicitudGrupal`, THE Socios_Service SHALL registrar la `fecha_alta` y el `aprobado_por_id` en TODOS los usuarios del grupo.
5. WHEN la directiva aprueba una `SolicitudGrupal`, THE Socios_Service SHALL actualizar el estado de la `SolicitudGrupal` a `aprobada`.
6. WHEN la directiva rechaza una `SolicitudGrupal`, THE Socios_Service SHALL cambiar el `estado` de TODOS los usuarios del grupo de `pendiente` a `baja` en una única transacción.
7. WHEN la directiva rechaza una `SolicitudGrupal`, THE Socios_Service SHALL registrar la `fecha_baja` y el `baja_por_id` en TODOS los usuarios del grupo.
8. WHEN la directiva rechaza una `SolicitudGrupal`, THE Socios_Service SHALL actualizar el estado de la `SolicitudGrupal` a `rechazada`.
9. THE Sistema SHALL exponer los endpoints `POST /api/socios/grupos/:grupoId/aprobar` y `POST /api/socios/grupos/:grupoId/rechazar` para la gestión grupal.
10. IF algún usuario del grupo ya no está en estado `pendiente` al intentar aprobar o rechazar, THEN THE Socios_Service SHALL devolver un error 400 indicando el conflicto.

---

### Requirement 8: Actualización del schema de validación Zod

**User Story:** Como desarrollador, quiero que el schema Zod de registro refleje la nueva estructura con miembros adicionales opcionales, para que la validación de entrada sea correcta y completa.

#### Acceptance Criteria

1. THE Sistema SHALL actualizar el `registerSchema` para aceptar `tipo_cuota` con los valores `individual` y `conjunta` únicamente.
2. THE Sistema SHALL definir un sub-schema `miembroAdicionalSchema` con los campos: `nombre`, `apellidos`, `dni`, `email`, `password` y `tipo_relacion` (`pareja` | `familiar_directo`).
3. WHEN `tipo_cuota` es `conjunta`, THE Sistema SHALL validar que `miembros_adicionales` contenga entre 1 y 5 elementos, cada uno conforme al `miembroAdicionalSchema`.
4. WHEN `tipo_cuota` es `individual`, THE Sistema SHALL aceptar el payload sin el campo `miembros_adicionales`.
5. THE Sistema SHALL aplicar las mismas reglas de validación de contraseña (mínimo 8 caracteres, una mayúscula, un número) a los campos `password` de los Miembros_Adicionales.
