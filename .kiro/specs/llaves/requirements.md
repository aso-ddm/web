# Documento de Requisitos — Gestión de Llaves

## Introducción

El Club Dragón de Madera necesita controlar qué socios tienen una llave física del local. El flujo completo es: un socio activo con al menos 6 meses consecutivos de antigüedad puede solicitar una llave desde la app; la solicitud llega a los admins (presidente, secretario, tesorero); un admin acepta la solicitud y el sistema registra automáticamente la fecha de aprobación y el id del admin autorizador; el contacto físico para la entrega se gestiona por vías externas al sistema. Cuando el socio devuelve la llave, el secretario la marca desde el listado de socios.

El modelo de datos ya contempla esta información en el modelo `Usuario` (campos `tiene_llaves`, `fecha_solicitud_llaves`, `fecha_aprobacion_llaves`, `aprobado_llaves_por_id`), por lo que no se requiere migración de base de datos.

## Glosario

- **Llave**: Llave física del local del Club Dragón de Madera.
- **Sistema**: La plataforma web de gestión del Club Dragón de Madera.
- **Admin**: Usuario con rol `presidente`, `secretario` o `tesorero`.
- **Socio**: Usuario con estado `activo` en el sistema.
- **Socio_Elegible**: Socio con estado `activo` de forma ininterrumpida durante al menos 6 meses desde su `fecha_alta`.
- **Titular_de_llave**: Socio al que se le ha aprobado una llave y aún no la ha devuelto (`tiene_llaves = true`).
- **Solicitud_de_llave**: Petición registrada en el sistema por un Socio_Elegible para obtener una llave del local.

## Requisitos

### Requisito 1: Solicitud de llave por parte del socio

**User Story:** Como socio activo con suficiente antigüedad, quiero solicitar una llave del local desde la app, para poder acceder al club de forma autónoma.

#### Criterios de aceptación

1. WHEN un Socio_Elegible solicita una llave, THE Sistema SHALL registrar la solicitud estableciendo `fecha_solicitud_llaves` con la fecha y hora actuales y cambiar el estado de la solicitud a `pendiente`.
2. IF el socio no cumple el requisito de 6 meses consecutivos como activo, THEN THE Sistema SHALL rechazar la solicitud con un mensaje indicando que se requieren al menos 6 meses consecutivos como socio activo.
3. IF el socio ya tiene una solicitud pendiente, THEN THE Sistema SHALL rechazar la nueva solicitud con un mensaje indicando que ya existe una solicitud en curso.
4. IF el socio ya es Titular_de_llave, THEN THE Sistema SHALL rechazar la solicitud con un mensaje indicando que el socio ya dispone de una llave.
5. WHILE el socio no tiene estado `activo`, THE Sistema SHALL impedir el acceso a la funcionalidad de solicitud de llave.

---

### Requisito 2: Notificación de solicitudes pendientes a los admins

**User Story:** Como admin, quiero ver las solicitudes de llave pendientes, para poder gestionarlas a tiempo.

#### Criterios de aceptación

1. WHEN existe al menos una Solicitud_de_llave pendiente, THE Sistema SHALL mostrar las solicitudes en el panel de administración con el nombre, apellidos y fecha de solicitud del socio.
2. THE Sistema SHALL mostrar las solicitudes pendientes ordenadas por `fecha_solicitud_llaves` ascendente.

---

### Requisito 3: Aprobación de solicitud de llave por un admin

**User Story:** Como admin, quiero aprobar la solicitud de llave de un socio, para autorizar formalmente la entrega de la llave.

#### Criterios de aceptación

1. WHEN un Admin aprueba una Solicitud_de_llave, THE Sistema SHALL establecer `tiene_llaves = true`, registrar la fecha y hora actuales como `fecha_aprobacion_llaves` y registrar el id del Admin como `aprobado_llaves_por_id`.
2. WHEN un Admin aprueba una Solicitud_de_llave, THE Sistema SHALL marcar la solicitud como aprobada sin requerir que el admin introduzca manualmente ninguna fecha.
3. IF el socio ha dejado de estar en estado `activo` antes de que se apruebe la solicitud, THEN THE Sistema SHALL rechazar la aprobación con un mensaje indicando que el socio ya no está activo.

---

### Requisito 4: Devolución de llave

**User Story:** Como admin, quiero registrar la devolución de una llave desde el listado de socios, para mantener el registro actualizado cuando un socio deja de tener acceso al local.

#### Criterios de aceptación

1. WHEN un Admin registra la devolución de una llave, THE Sistema SHALL establecer `tiene_llaves = false` y limpiar los campos `fecha_solicitud_llaves`, `fecha_aprobacion_llaves` y `aprobado_llaves_por_id` del socio.
2. IF el socio no es Titular_de_llave, THEN THE Sistema SHALL rechazar la operación con un mensaje indicando que el socio no tiene ninguna llave asignada.
3. THE Sistema SHALL permitir registrar la devolución desde la vista de detalle del socio en el listado de socios.

---

### Requisito 5: Información de llave en el perfil del socio

**User Story:** Como admin, quiero ver en el perfil de un socio si tiene llave y desde cuándo, para tener trazabilidad del acceso físico al local.

#### Criterios de aceptación

1. THE Sistema SHALL mostrar en el perfil de cada socio si es Titular_de_llave, la `fecha_aprobacion_llaves` y el nombre del admin que autorizó la entrega.
2. WHILE el socio no es Titular_de_llave, THE Sistema SHALL mostrar en su perfil que no dispone de llave.
3. WHEN el socio tiene una Solicitud_de_llave pendiente, THE Sistema SHALL indicarlo en su perfil.

---

### Requisito 6: Listado de titulares de llaves

**User Story:** Como admin, quiero ver qué socios tienen una llave del local, para saber en todo momento quién tiene acceso físico al club.

#### Criterios de aceptación

1. THE Sistema SHALL mostrar un listado de todos los Titular_de_llave con nombre, apellidos, fecha de aprobación y nombre del admin que autorizó la entrega.
2. WHEN el listado de titulares de llaves es consultado, THE Sistema SHALL ordenar los resultados por `fecha_aprobacion_llaves` ascendente.
3. THE Sistema SHALL mostrar el número total de llaves entregadas actualmente.

---

### Requisito 7: Acceso restringido

**User Story:** Como responsable del club, quiero que solo los admins puedan gestionar las llaves y que solo los socios elegibles puedan solicitarlas, para garantizar que el acceso al local esté siempre bajo control.

#### Criterios de aceptación

1. WHEN un usuario sin rol de Admin intenta acceder a las operaciones de aprobación o devolución de llaves, THE Sistema SHALL denegar el acceso y devolver un error de autorización.
2. WHEN un usuario sin estado `activo` intenta realizar una Solicitud_de_llave, THE Sistema SHALL denegar la operación y devolver un error de autorización.
3. THE Sistema SHALL exponer las operaciones de gestión de llaves únicamente bajo rutas protegidas que requieran autenticación.
