# Especificación Técnica — Dragón de Madera Plataforma

**Versión**: 1.0
**Fecha**: 2026-03-22
**Estado**: Borrador — pendiente de validación

---

## 1. Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS 4 + shadcn/ui |
| Backend | Node.js 24 + Fastify 5 |
| ORM | Prisma 5 |
| Base de datos | PostgreSQL 16 |
| Autenticación | JWT (@fastify/jwt) |
| Email | A decidir (nodemailer o servicio externo) |
| Servidor web | Nginx (reverse proxy + estáticos) |
| Gestor de procesos | PM2 |
| CI/CD | GitHub Actions (self-hosted runner) |

---

## 2. Modelo de datos

### Usuario
```
Usuario
├── id
├── email (único)
├── password_hash
├── nombre
├── apellidos
├── dni_nif
├── telefono
├── fecha_nacimiento
├── apodo
├── alias_telegram
├── compartir_datos (boolean)
├── rol (admin | ludotecario | socio)
├── estado (pendiente | activo | baja)
├── tipo_cuota (ordinaria | familiar)
├── unidad_familiar_id (FK → UnidadFamiliar, nullable)
├── cuota_pagada (boolean)
├── fecha_alta
└── fecha_baja (nullable)
```

### UnidadFamiliar
```
UnidadFamiliar
├── id
├── titular_id (FK → Usuario)
└── miembros → Usuario[]
```

### Juego
```
Juego
├── id
├── nombre
├── estanteria
├── tipo_propietario (asociacion | socio_activo | ex_socio | desconocido)
├── propietario_usuario_id (FK → Usuario, nullable)
├── propietario_nombre_libre (texto, nullable — para ex-socio o desconocido)
├── estado
├── min_jugadores (nullable)
├── max_jugadores (nullable)
├── duracion (nullable)
├── notas (nullable)
└── fecha_alta
```

### Prestamo
```
Prestamo
├── id
├── juego_id (FK → Juego)
├── socio_id (FK → Usuario)
├── fecha_inicio
├── fecha_ultimo_aviso (nullable)
├── fecha_devolucion (nullable)
├── estado (activo | devuelto)
└── notas (nullable)
```

### Visita
```
Visita
├── id
├── socio_id (FK → Usuario — quien registra)
├── invitado_nombre
├── invitado_nif
├── fecha_visita
├── es_de_pago (boolean — calculado automáticamente)
└── pago_realizado (boolean)
```

### Configuracion
```
Configuracion
├── id
├── clave (única)
└── valor
```

Claves de configuración:
- `intervalo_aviso_prestamo_dias`
- `visitas_gratuitas_por_invitado`
- `importe_visita_pago`

---

## 3. API REST

Base URL: `/api/`

### Autenticación
| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| POST | `/api/auth/login` | Login, devuelve JWT | Todos |
| POST | `/api/auth/registro` | Registro de nuevo socio | Visitante |
| POST | `/api/auth/registro-familiar` | Registro de miembro familiar por enlace | Token de invitación |
| GET | `/api/auth/me` | Datos del usuario autenticado | Autenticado |

### Usuarios
| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| GET | `/api/usuarios` | Listado de socios | Admin |
| GET | `/api/usuarios/pendientes` | Socios pendientes de aprobación | Admin |
| PATCH | `/api/usuarios/:id/aprobar` | Aprobar alta | Admin |
| PATCH | `/api/usuarios/:id/rechazar` | Rechazar alta | Admin |
| PATCH | `/api/usuarios/:id/baja` | Dar de baja | Admin |
| PATCH | `/api/usuarios/:id/rol` | Cambiar rol | Admin |
| PATCH | `/api/usuarios/:id/cuota` | Cambiar tipo de cuota | Admin |
| PATCH | `/api/usuarios/:id/pago` | Marcar pago de cuota | Admin |
| GET | `/api/usuarios/:id` | Ver perfil de un socio | Admin |
| PATCH | `/api/usuarios/perfil` | Editar perfil propio | Autenticado |

### Juegos
| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| GET | `/api/juegos` | Listado de juegos | Autenticado |
| GET | `/api/juegos/:id` | Detalle de un juego | Autenticado |
| POST | `/api/juegos` | Crear juego | Admin, Ludotecario |
| PATCH | `/api/juegos/:id` | Editar juego | Admin, Ludotecario |
| DELETE | `/api/juegos/:id` | Borrar/retirar juego | Admin, Ludotecario |

### Préstamos
| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| GET | `/api/prestamos` | Listado de todos los préstamos | Admin, Ludotecario |
| GET | `/api/prestamos/mis-prestamos` | Préstamos del usuario autenticado | Autenticado |
| POST | `/api/prestamos` | Solicitar préstamo | Autenticado |
| PATCH | `/api/prestamos/:id/devolver` | Registrar devolución | Autenticado (solo propios), Admin, Ludotecario |

### Visitas
| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| GET | `/api/visitas` | Listado de todas las visitas | Admin, Ludotecario |
| GET | `/api/visitas/mis-visitas` | Visitas registradas por el usuario | Autenticado |
| POST | `/api/visitas` | Registrar visita de invitado | Autenticado |
| PATCH | `/api/visitas/:id/pago` | Marcar pago de visita | Admin, Ludotecario |

### Configuración
| Método | Ruta | Descripción | Roles |
|---|---|---|---|
| GET | `/api/configuracion` | Ver configuración del sistema | Admin |
| PATCH | `/api/configuracion` | Actualizar configuración | Admin |

---

## 4. Autenticación y seguridad

- JWT almacenado en `httpOnly cookie` (no localStorage)
- Refresh token para renovación de sesión
- Rutas protegidas en frontend con componente `<RutaProtegida rol={[...]}>`
- Middleware de autorización por rol en cada endpoint del backend
- Contraseñas hasheadas con `bcrypt`

---

## 5. Sistema de emails

Emails transaccionales necesarios:

| Evento | Destinatario |
|---|---|
| Registro completado | Solicitante — confirmación de recepción |
| Alta aprobada | Solicitante — bienvenida + acceso |
| Alta rechazada | Solicitante — motivo de rechazo |
| Invitación miembro familiar | Email del miembro adicional |
| Aviso de renovación de préstamo | Socio con préstamo activo |

Proveedor de email: **por decidir** (opciones: nodemailer + SMTP, Resend, SendGrid)

---

## 6. Estructura de rutas del frontend

```
/login                    → Pública
/registro                 → Pública
/registro/familiar/:token → Pública (enlace de invitación)
/admin                    → Protegida (todos los roles autenticados)
/admin/perfil             → Protegida (todos)
/admin/mis-prestamos      → Protegida (todos)
/admin/invitados          → Protegida (todos)
/admin/socios             → Protegida (admin)
/admin/ludoteca           → Protegida (admin, ludotecario)
/admin/prestamos          → Protegida (admin, ludotecario)
/admin/visitas            → Protegida (admin, ludotecario)
/admin/configuracion      → Protegida (admin)
```

---

## 7. Estructura de carpetas frontend (Fase 2)

```
src/
├── pages/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   ├── RegistroPage.tsx
│   │   └── RegistroFamiliarPage.tsx
│   └── admin/
│       ├── DashboardPage.tsx
│       ├── PerfilPage.tsx
│       ├── MisPrestamoPage.tsx
│       ├── InvitadosPage.tsx
│       ├── SociosPage.tsx
│       ├── LudotecaPage.tsx
│       ├── PrestamosPage.tsx
│       ├── VisitasPage.tsx
│       └── ConfiguracionPage.tsx
├── components/
│   └── admin/
│       ├── RutaProtegida.tsx
│       ├── LayoutAdmin.tsx
│       └── SidebarAdmin.tsx
├── hooks/
│   ├── useAuth.ts
│   └── usePermisos.ts
└── lib/
    └── api.ts            → cliente HTTP con JWT
```

---

## 8. Consideraciones pendientes de decisión

- Proveedor de email transaccional
- Integración con BoardGameGeek para fichas de juegos (decisión aplazada)
- Política de contraseñas y recuperación de contraseña
- Formato y contenido exacto de los emails
