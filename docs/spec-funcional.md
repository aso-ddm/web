# Especificación Funcional — Dragón de Madera Plataforma

**Versión**: 1.0
**Fecha**: 2026-03-22
**Estado**: Borrador — pendiente de validación

---

## 1. Visión general

Plataforma web de gestión para la asociación Dragón de Madera. La web pública existente (`dragondemadera.com`) se mantiene intacta (Fase 1). La Fase 2 añade un área de gestión accesible desde el botón **"Área de Socios"** de la cabecera, bajo la ruta `/admin`, con rutas protegidas según rol.

---

## 2. Roles y permisos

### 2.1 Definición de roles

| Rol técnico | Nombre real | Descripción |
|---|---|---|
| `admin` | Presidente / Secretario / Tesorero | Control total del sistema |
| `ludotecario` | Ludotecario | Gestión de ludoteca y préstamos |
| `socio` | Socio Básico | Acceso a su área personal |
| `visitante` | Sin registrar | Solo web pública + formulario de registro |

### 2.2 Matriz de permisos

| Funcionalidad | Admin | Ludotecario | Socio |
|---|---|---|---|
| Aprobar/rechazar altas, cambiar rol, dar de baja, cambiar cuota | ✅ | ❌ | ❌ |
| Marcar pagos de cuota | ✅ | ❌ | ❌ |
| Añadir/editar juegos | ✅ | ✅ | ❌ |
| Borrar/retirar juego de la ludoteca | ✅ | ✅ | ❌ |
| Ver todos los préstamos activos | ✅ | ✅ | ❌ |
| Registrar devoluciones (propias) | ✅ | ✅ | ✅ |
| Configurar intervalo de avisos de préstamos | ✅ | ❌ | ❌ |
| Ver registro completo de visitas | ✅ | ✅ | ❌ |
| Marcar pago de visita de invitado | ✅ | ✅ | ❌ |
| Configuración general del sistema | ✅ | ❌ | ❌ |
| Ver perfil propio, préstamos e historial | ✅ | ✅ | ✅ |
| Solicitar préstamo | ✅ | ✅ | ✅ |
| Registrar invitados | ✅ | ✅ | ✅ |

---

## 3. Módulo de usuarios

### 3.1 Registro de nuevos socios

El visitante accede al formulario de registro desde la web pública. Al enviarlo queda en estado **pendiente** hasta que un admin lo apruebe.

#### Campos del formulario de registro

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| Tipo de cuota | Selector | ✅ | Ordinaria / Familiar-Pareja |
| Nombre | Texto | ✅ | |
| Apellidos | Texto | ✅ | |
| DNI / NIF | Texto | ✅ | |
| Email | Email | ✅ | |
| Teléfono | Texto | ✅ | |
| Fecha de nacimiento | Fecha | ✅ | |
| Apodo | Texto | ✅ | Check para usar el mismo que el nombre |
| Contraseña | Password | ✅ | |
| ¿Compartir datos con FreakMondo, Bazar de Iglesias y Dune? | Selector Sí/No | ✅ | Descuento 10% juegos de mesa y rol/cómics a cambio de compartir nombre y DNI |
| Alias en Telegram | Texto | ✅ | |

#### Estados de un socio

| Estado | Descripción |
|---|---|
| `pendiente` | Registrado, esperando aprobación de admin |
| `activo` | Aprobado, puede acceder al sistema |
| `baja` | Dado de baja, sin acceso |

### 3.2 Tipos de cuota

| Tipo | Precio | Descripción |
|---|---|---|
| Ordinaria | 15€ | Un solo titular |
| Familiar/Pareja | 15€ titular + 5€ por cada miembro adicional | Solo adultos |

- Los menores de edad **no** se registran en el sistema ni cuentan como miembros de la unidad familiar.
- El cambio de tipo de cuota puede realizarse a posteriori por un admin.
- Cada miembro adicional recibe un **email con enlace** para registrar sus propios datos (mismos campos que el titular).
- Todos los miembros quedan vinculados como unidad familiar en el sistema.
- Si un miembro se da de baja, su nombre queda registrado como referencia histórica.

### 3.3 Flujo de aprobación

1. Visitante rellena el formulario → estado `pendiente`
2. Admin recibe notificación (o consulta el listado de pendientes)
3. Admin aprueba → estado `activo`, el socio recibe email de confirmación
4. Admin rechaza → el solicitante recibe email de rechazo

---

## 4. Módulo de ludoteca

### 4.1 Campos de un juego

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| Nombre | Texto | ✅ | |
| Estantería | Texto libre | ✅ | Gestionado por ludotecario/admin |
| Propietario | Ver 4.2 | ✅ | |
| Estado | Texto libre | ✅ | Ej: disponible, deteriorado, en reparación... |
| Mínimo de jugadores | Número | ❌ | |
| Máximo de jugadores | Número | ❌ | |
| Duración | Texto | ❌ | |
| Notas | Texto | ❌ | |

### 4.2 Propietario de un juego

Un juego tiene siempre un único propietario. Puede ser:

| Tipo | Descripción |
|---|---|
| Dragón de Madera | Propiedad de la asociación |
| Socio activo | Vinculado a un usuario del sistema |
| Ex-socio | Nombre registrado, ya no tiene cuenta activa |
| Desconocido | Propietario no identificado |

### 4.3 Gestión de juegos

- Ludotecarios y admins pueden añadir, editar y borrar/retirar juegos.
- Un socio puede ceder un juego contactando con el ludotecario por medios externos (Telegram u otros). Es el ludotecario quien lo registra en el sistema.
- Para retirar un juego de la ludoteca, el socio propietario contacta con el ludotecario por medios externos. Es el ludotecario quien lo elimina del sistema.
- El propietario puede establecer condiciones de préstamo en el campo de notas.
- Si el juego está prestado y el propietario quiere recuperarlo, debe contactar directamente con el socio por medios externos a la web.

---

## 5. Módulo de préstamos

### 5.1 Flujo de un préstamo

1. El socio solicita el préstamo desde la web.
2. Si el juego pertenece a un socio (no a la asociación), el sistema muestra un **aviso** indicando que el solicitante debe contactar con el propietario antes de llevarse el juego.
3. El préstamo queda registrado en el sistema.
4. Cada X tiempo (configurable por admin) el sistema envía un aviso al socio para que renueve el préstamo o realice la devolución.
5. El socio marca la devolución desde su panel. Ludotecarios y admins también pueden registrar devoluciones.

### 5.2 Reglas de préstamo

- Sin límite de juegos prestados simultáneamente.
- Sin límite de tiempo.
- Sin penalizaciones por devolución tardía.
- Intervalo de avisos configurable por admin.

---

## 6. Módulo de visitas de invitados

### 6.1 Registro de visita

El socio registra a sus invitados desde su panel. Campos del formulario:

| Campo | Obligatorio |
|---|---|
| Nombre completo del invitado | ✅ |
| NIF | ✅ |
| Fecha de la visita | ✅ |
| ¿La visita es gratuita o de pago? | ✅ (calculado automáticamente) |

### 6.2 Reglas de visitas

- Sin límite de invitados por socio.
- El invitado solo asiste, no puede pedir juegos prestados.
- Las primeras **N visitas** (configurable por admin, por defecto 3) son gratuitas.
- A partir de la visita N+1, el invitado debe abonar **X€** al club (configurable por admin, por defecto 4€).
- El admin o ludotecario marca si el pago ha sido realizado.

---

## 7. Módulo de pagos

- Los pagos se realizan por **transferencia bancaria** fuera del sistema.
- El admin o tesorero marca manualmente el pago como realizado en el panel.
- Queda registrado un historial de pagos por socio.

---

## 8. Configuración del sistema

Parámetros configurables por admin:

| Parámetro | Valor por defecto |
|---|---|
| Intervalo de avisos de renovación de préstamo | A definir |
| Número de visitas gratuitas por invitado | 3 |
| Importe de visita de pago | 4€ |

---

## 9. Navegación y estructura de rutas

| Ruta | Acceso | Descripción |
|---|---|---|
| `/` | Todos | Web pública — Inicio |
| `/club` | Todos | Web pública — Nuestro Club |
| `/socio` | Todos | Web pública — Ser Socio |
| `/login` | Visitante | Formulario de login |
| `/registro` | Visitante | Formulario de registro de nuevo socio |
| `/admin` | Socio, Ludotecario, Admin | Panel principal |
| `/admin/socios` | Admin | Gestión de socios |
| `/admin/ludoteca` | Admin, Ludotecario | Gestión de juegos |
| `/admin/prestamos` | Admin, Ludotecario | Gestión de préstamos |
| `/admin/visitas` | Admin, Ludotecario | Registro de visitas |
| `/admin/configuracion` | Admin | Configuración del sistema |
| `/admin/perfil` | Todos | Perfil propio |
| `/admin/mis-prestamos` | Todos | Préstamos e historial propio |
| `/admin/invitados` | Todos | Registrar invitados |
