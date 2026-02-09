# FASE 2 - SISTEMA DE GESTIÓN
## Dragón de Madera - Asociación Sin Ánimo de Lucro

### **DOCUMENTO TÉCNICO**

---

## 📋 ÍNDICE

1. [Resumen Técnico](#resumen-técnico)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Especificaciones por Área](#especificaciones-por-área)
5. [Base de Datos](#base-de-datos)
6. [API Endpoints](#api-endpoints)
7. [Infraestructura y DevOps](#infraestructura-y-devops)
8. [Seguridad](#seguridad)
9. [Pendientes Técnicos](#pendientes-técnicos)

---

## 🎯 RESUMEN TÉCNICO

### Objetivo
Desarrollar un sistema de gestión full-stack para asociación sin ánimo de lucro con gestión de socios, ludoteca, préstamos y visitas.

### Scope Fase 2
- Área privada con autenticación JWT
- Sistema de roles y permisos multinivel
- CRUD completo de socios, juegos, préstamos y visitas
- Panel de administración para directiva
- Panel de gestión para ludotecario
- Área de usuario para socios

---

## 🛠️ STACK TECNOLÓGICO

### Frontend

```
React + Vite
├── Bundler: Vite
├── Framework: React 18+
├── Routing: React Router v6
├── State Management: [TBD - Context API / Zustand / Redux]
├── Forms: React Hook Form + Zod/Yup
├── HTTP Client: Axios / TanStack Query
├── UI Library: [TBD - Material-UI / Chakra / Ant Design / shadcn/ui]
└── Testing: Vitest + React Testing Library
```

**Justificación de Vite:**
- Build ultra-rápido (HMR instantáneo)
- Menor bundle size vs Create React App
- Mejor developer experience
- Soporte nativo para TypeScript

### Backend

```
[TBD - Node.js / Python / PHP]

Opción A (Node.js):
├── Runtime: Node.js 18+ LTS
├── Framework: Express / NestJS / Fastify
├── ORM: Prisma / TypeORM / Sequelize
├── Validation: Zod / Joi / class-validator
├── Auth: JWT + Passport / Auth.js
└── Testing: Jest / Vitest

Opción B (Python):
├── Runtime: Python 3.11+
├── Framework: FastAPI / Django REST
├── ORM: SQLAlchemy / Django ORM
├── Validation: Pydantic
├── Auth: JWT + python-jose
└── Testing: Pytest

Opción C (PHP):
├── Runtime: PHP 8.2+
├── Framework: Laravel
├── ORM: Eloquent
├── Validation: Laravel Validation
├── Auth: Laravel Sanctum / Passport
└── Testing: PHPUnit / Pest
```

**Decisión pendiente del equipo de backend**

### Base de Datos

```
[TBD - Supabase vs Firebase]

Opción A (Supabase):
├── DB: PostgreSQL 15+
├── Auth: Supabase Auth
├── Storage: Supabase Storage
├── Realtime: Supabase Realtime
└── Edge Functions: Deno

Opción B (Firebase):
├── DB: Firestore / Realtime DB
├── Auth: Firebase Auth
├── Storage: Firebase Storage
├── Functions: Cloud Functions
└── Hosting: Firebase Hosting
```

**IMPORTANTE:** La API debe ser agnóstica del proveedor de base de datos. Implementar patrón Repository para aislar la lógica de persistencia.

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────┐
│                    CLOUDFLARE CDN                       │
│              (DNS, SSL, DDoS Protection)                │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                 HOSTING PROVIDER                        │
│         [Vercel / AWS / GitHub Pages - TBD]            │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌──────────────────┐          ┌──────────────────┐
│    FRONTEND      │          │    BACKEND       │
│                  │          │                  │
│  React + Vite    │◄────────►│  API REST/       │
│  Static Site     │   JWT    │  GraphQL         │
│                  │          │                  │
└──────────────────┘          └────────┬─────────┘
                                       │
                                       ▼
                              ┌──────────────────┐
                              │ SUPABASE/        │
                              │ FIREBASE         │
                              │                  │
                              │ • PostgreSQL/    │
                              │   Firestore      │
                              │ • Auth           │
                              │ • Storage        │
                              │ • Realtime       │
                              └──────────────────┘
```

### Patrón de Arquitectura: Repository Pattern

Para mantener la API independiente del proveedor de BD:

```typescript
// Domain Layer (Business Logic)
interface SocioRepository {
  findAll(filters?: SocioFilters): Promise<Socio[]>
  findById(id: string): Promise<Socio | null>
  create(data: CreateSocioDTO): Promise<Socio>
  update(id: string, data: UpdateSocioDTO): Promise<Socio>
  delete(id: string): Promise<void>
}

// Infrastructure Layer - Supabase Implementation
class SupabaseSocioRepository implements SocioRepository {
  async findAll(filters?: SocioFilters) {
    // Supabase-specific query
    return supabase.from('usuarios').select('*').match(filters)
  }
  // ... otros métodos
}

// Infrastructure Layer - Firebase Implementation
class FirebaseSocioRepository implements SocioRepository {
  async findAll(filters?: SocioFilters) {
    // Firestore-specific query
    return db.collection('usuarios').where(filters).get()
  }
  // ... otros métodos
}

// Application Layer
class SocioService {
  constructor(private repository: SocioRepository) {}
  
  async getAllSocios(filters?: SocioFilters) {
    return this.repository.findAll(filters)
  }
}

// Dependency Injection
const socioRepository = new SupabaseSocioRepository() // o Firebase
const socioService = new SocioService(socioRepository)
```

---

## 📐 ESPECIFICACIONES POR ÁREA

### 🎨 FRONTEND (React + Vite)

#### Estructura de Proyecto

```
src/
├── assets/              # Imágenes, fuentes, etc
├── components/
│   ├── common/          # Componentes reutilizables
│   │   ├── Button/
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Table/
│   │   ├── Card/
│   │   └── Layout/
│   ├── socios/
│   │   ├── FormularioRegistro/
│   │   ├── ListaSocios/
│   │   ├── DetalleSocio/
│   │   ├── SolicitudLlaves/
│   │   └── GestionCuotas/
│   ├── ludoteca/
│   │   ├── CatalogoJuegos/
│   │   ├── DetalleJuego/
│   │   ├── FormularioJuego/
│   │   ├── GestionPrestamos/
│   │   └── SolicitudPrestamo/
│   └── visitas/
│       ├── FormularioVisita/
│       ├── ListaVisitas/
│       └── EstadisticasVisitas/
├── pages/
│   ├── public/
│   │   ├── Home/
│   │   ├── Login/
│   │   └── Registro/
│   ├── socios/
│   │   ├── Dashboard/
│   │   ├── MiPerfil/
│   │   ├── MisPrestamos/
│   │   └── RegistrarVisita/
│   ├── directiva/
│   │   ├── DashboardDirectiva/
│   │   ├── GestionSocios/
│   │   ├── SolicitudesPendientes/
│   │   └── Configuracion/
│   └── ludotecario/
│       ├── DashboardLudoteca/
│       ├── GestionJuegos/
│       └── PrestamosPendientes/
├── hooks/
│   ├── useAuth.ts
│   ├── useSocios.ts
│   ├── useLudoteca.ts
│   ├── usePrestamos.ts
│   ├── useVisitas.ts
│   └── usePermissions.ts
├── services/
│   ├── api/
│   │   ├── client.ts        # Axios instance
│   │   ├── socios.ts
│   │   ├── ludoteca.ts
│   │   ├── prestamos.ts
│   │   └── visitas.ts
│   ├── auth/
│   │   ├── authService.ts
│   │   └── tokenManager.ts
│   └── storage/
│       └── localStorage.ts
├── types/
│   ├── Socio.ts
│   ├── Juego.ts
│   ├── Prestamo.ts
│   ├── Visita.ts
│   └── User.ts
├── utils/
│   ├── validators/
│   │   ├── socioValidation.ts
│   │   └── prestamoValidation.ts
│   ├── formatters/
│   │   ├── dateFormatter.ts
│   │   └── currencyFormatter.ts
│   └── constants/
│       ├── roles.ts
│       ├── permissions.ts
│       └── routes.ts
├── routes/
│   ├── ProtectedRoute.tsx
│   ├── RoleBasedRoute.tsx
│   └── index.tsx
├── context/
│   ├── AuthContext.tsx
│   └── ThemeContext.tsx
├── App.tsx
├── main.tsx
└── vite.config.ts
```

#### Configuración de Vite

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui': ['@mui/material'], // o la UI lib elegida
        }
      }
    }
  }
})
```

#### Sistema de Routing

```typescript
// routes/index.tsx
import { createBrowserRouter } from 'react-router-dom'
import { ROLES, PERMISSIONS } from '@utils/constants/roles'

export const router = createBrowserRouter([
  // Rutas públicas
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'registro', element: <Registro /> },
    ]
  },
  
  // Rutas protegidas - Socios
  {
    path: '/socios',
    element: <ProtectedRoute><SocioLayout /></ProtectedRoute>,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'perfil', element: <MiPerfil /> },
      { path: 'prestamos', element: <MisPrestamos /> },
      { path: 'registrar-visita', element: <RegistrarVisita /> },
    ]
  },
  
  // Rutas protegidas - Directiva
  {
    path: '/directiva',
    element: (
      <RoleBasedRoute 
        allowedRoles={[ROLES.PRESIDENTE, ROLES.SECRETARIO, ROLES.TESORERO]}
      >
        <DirectivaLayout />
      </RoleBasedRoute>
    ),
    children: [
      { index: true, element: <DashboardDirectiva /> },
      { path: 'socios', element: <GestionSocios /> },
      { path: 'solicitudes', element: <SolicitudesPendientes /> },
      { path: 'configuracion', element: <Configuracion /> },
    ]
  },
  
  // Rutas protegidas - Ludotecario
  {
    path: '/ludoteca',
    element: (
      <RoleBasedRoute 
        allowedRoles={[
          ROLES.LUDOTECARIO, 
          ROLES.PRESIDENTE, 
          ROLES.SECRETARIO, 
          ROLES.TESORERO
        ]}
      >
        <LudotecaLayout />
      </RoleBasedRoute>
    ),
    children: [
      { index: true, element: <DashboardLudoteca /> },
      { path: 'juegos', element: <GestionJuegos /> },
      { path: 'prestamos', element: <PrestamosPendientes /> },
    ]
  },
])
```

#### Gestión de Estado (ejemplo con Zustand)

```typescript
// stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: User | null
  token: string | null
  roles: string[]
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  hasRole: (role: string) => boolean
  hasPermission: (permission: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      roles: [],
      isAuthenticated: false,
      
      login: (user, token) => set({ 
        user, 
        token, 
        roles: user.roles,
        isAuthenticated: true 
      }),
      
      logout: () => set({ 
        user: null, 
        token: null, 
        roles: [],
        isAuthenticated: false 
      }),
      
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      })),
      
      hasRole: (role) => get().roles.includes(role),
      
      hasPermission: (permission) => {
        const { roles } = get()
        return ROLE_PERMISSIONS[roles[0]]?.includes(permission) || false
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        roles: state.roles,
      })
    }
  )
)
```

#### Custom Hooks

```typescript
// hooks/useSocios.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { sociosAPI } from '@services/api/socios'

export const useSocios = (filters?: SocioFilters) => {
  return useQuery({
    queryKey: ['socios', filters],
    queryFn: () => sociosAPI.getAll(filters),
  })
}

export const useCreateSocio = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: sociosAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socios'] })
    }
  })
}

export const useAprobarSocio = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id }: { id: string }) => sociosAPI.aprobar(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['socios'] })
    }
  })
}

// hooks/usePermissions.ts
import { useAuthStore } from '@stores/authStore'
import { PERMISSIONS } from '@utils/constants/permissions'

export const usePermissions = () => {
  const { hasPermission, hasRole } = useAuthStore()
  
  return {
    canViewSocios: hasPermission(PERMISSIONS.VIEW_SOCIOS),
    canEditSocios: hasPermission(PERMISSIONS.EDIT_SOCIOS),
    canApproveSocios: hasPermission(PERMISSIONS.APPROVE_SOCIOS),
    canManageJuegos: hasPermission(PERMISSIONS.MANAGE_JUEGOS),
    canApprovePrestamos: hasPermission(PERMISSIONS.APPROVE_PRESTAMOS),
    isDirectiva: hasRole('presidente') || hasRole('secretario') || hasRole('tesorero'),
    isLudotecario: hasRole('ludotecario'),
  }
}
```

---

### ⚙️ BACKEND

#### Estructura de Proyecto (ejemplo Node.js + Express)

```
src/
├── config/
│   ├── database.ts         # Config DB (Supabase/Firebase)
│   ├── auth.ts             # Config JWT
│   └── env.ts              # Variables de entorno
├── domain/
│   ├── entities/
│   │   ├── Socio.ts
│   │   ├── Juego.ts
│   │   ├── Prestamo.ts
│   │   └── Visita.ts
│   └── repositories/       # Interfaces
│       ├── ISocioRepository.ts
│       ├── IJuegoRepository.ts
│       ├── IPrestamoRepository.ts
│       └── IVisitaRepository.ts
├── infrastructure/
│   ├── repositories/       # Implementaciones
│   │   ├── supabase/
│   │   │   ├── SupabaseSocioRepository.ts
│   │   │   ├── SupabaseJuegoRepository.ts
│   │   │   └── ...
│   │   └── firebase/
│   │       ├── FirebaseSocioRepository.ts
│   │       └── ...
│   └── database/
│       ├── supabase.ts
│       └── firebase.ts
├── application/
│   ├── services/
│   │   ├── SocioService.ts
│   │   ├── JuegoService.ts
│   │   ├── PrestamoService.ts
│   │   └── VisitaService.ts
│   ├── dtos/
│   │   ├── CreateSocioDTO.ts
│   │   ├── UpdateSocioDTO.ts
│   │   └── ...
│   └── validators/
│       ├── socioValidation.ts
│       └── ...
├── presentation/
│   ├── controllers/
│   │   ├── AuthController.ts
│   │   ├── SocioController.ts
│   │   ├── JuegoController.ts
│   │   ├── PrestamoController.ts
│   │   └── VisitaController.ts
│   ├── middlewares/
│   │   ├── authMiddleware.ts
│   │   ├── roleMiddleware.ts
│   │   ├── validationMiddleware.ts
│   │   └── errorHandler.ts
│   └── routes/
│       ├── auth.routes.ts
│       ├── socios.routes.ts
│       ├── juegos.routes.ts
│       ├── prestamos.routes.ts
│       └── visitas.routes.ts
├── utils/
│   ├── jwt.ts
│   ├── logger.ts
│   └── constants.ts
├── app.ts                  # Express app setup
└── server.ts               # Entry point
```

#### Middleware de Autorización

```typescript
// middlewares/roleMiddleware.ts
import { Request, Response, NextFunction } from 'express'
import { Role } from '@/utils/constants'

export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRoles = req.user?.roles || []
    
    const hasPermission = allowedRoles.some(role => 
      userRoles.includes(role)
    )
    
    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'No tienes permisos para esta acción' 
      })
    }
    
    next()
  }
}

// middlewares/permissionMiddleware.ts
export const requirePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRoles = req.user?.roles || []
    
    const hasPermission = userRoles.some(role => {
      return ROLE_PERMISSIONS[role]?.includes(permission)
    })
    
    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'No tienes permisos para esta acción' 
      })
    }
    
    next()
  }
}
```

#### Ejemplo de Rutas

```typescript
// routes/socios.routes.ts
import { Router } from 'express'
import { SocioController } from '@/presentation/controllers/SocioController'
import { authenticate } from '@/presentation/middlewares/authMiddleware'
import { authorize } from '@/presentation/middlewares/roleMiddleware'
import { validate } from '@/presentation/middlewares/validationMiddleware'
import { createSocioSchema, updateSocioSchema } from '@/application/validators/socioValidation'

const router = Router()
const controller = new SocioController()

// Rutas públicas
router.post(
  '/register', 
  validate(createSocioSchema),
  controller.register
)

// Rutas protegidas - Solo Directiva
router.get(
  '/',
  authenticate,
  authorize('presidente', 'secretario', 'tesorero', 'vocal'),
  controller.getAll
)

router.get(
  '/pendientes',
  authenticate,
  authorize('presidente', 'secretario', 'tesorero'),
  controller.getPendientes
)

router.post(
  '/:id/aprobar',
  authenticate,
  authorize('presidente', 'secretario', 'tesorero'),
  controller.aprobar
)

router.delete(
  '/:id',
  authenticate,
  authorize('presidente', 'secretario', 'tesorero'),
  controller.darDeBaja
)

// Rutas protegidas - Cualquier socio autenticado
router.get(
  '/me',
  authenticate,
  controller.getProfile
)

router.put(
  '/me',
  authenticate,
  validate(updateSocioSchema),
  controller.updateProfile
)

// Llaves
router.post(
  '/:id/solicitar-llaves',
  authenticate,
  controller.solicitarLlaves
)

router.post(
  '/:id/aprobar-llaves',
  authenticate,
  authorize('presidente', 'secretario', 'tesorero'),
  controller.aprobarLlaves
)

export default router
```

---

## 🗄️ BASE DE DATOS

### Esquema de Base de Datos (PostgreSQL - Supabase)

```sql
-- ==========================================
-- TABLA: usuarios
-- ==========================================
CREATE TABLE usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  nombre VARCHAR(100) NOT NULL,
  apellidos VARCHAR(100) NOT NULL,
  dni VARCHAR(20) UNIQUE NOT NULL,
  telefono VARCHAR(20),
  fecha_nacimiento DATE,
  direccion TEXT,
  alias_telegram VARCHAR(100),
  usuario_bgg VARCHAR(100),
  apodo VARCHAR(100),
  tipo_cuota VARCHAR(20) CHECK (tipo_cuota IN ('individual', 'pareja', 'familiar')),
  consentimiento_tiendas BOOLEAN DEFAULT false,
  estado VARCHAR(20) CHECK (estado IN ('pendiente', 'activo', 'inactivo', 'baja')) DEFAULT 'pendiente',
  fecha_alta TIMESTAMP,
  fecha_baja TIMESTAMP,
  tiene_llaves BOOLEAN DEFAULT false,
  fecha_solicitud_llaves TIMESTAMP,
  fecha_aprobacion_llaves TIMESTAMP,
  
  -- Trazabilidad
  usuario_aprobo_alta UUID REFERENCES usuarios(id),
  usuario_aprobo_llaves UUID REFERENCES usuarios(id),
  usuario_dio_baja UUID REFERENCES usuarios(id),
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Índices para optimización
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_estado ON usuarios(estado);
CREATE INDEX idx_usuarios_dni ON usuarios(dni);

-- ==========================================
-- TABLA: roles
-- ==========================================
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(50) UNIQUE NOT NULL CHECK (nombre IN (
    'presidente', 
    'secretario', 
    'tesorero', 
    'vocal', 
    'ludotecario', 
    'socio_basico'
  )),
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Insertar roles por defecto
INSERT INTO roles (nombre, descripcion) VALUES
  ('presidente', 'Presidente de la asociación'),
  ('secretario', 'Secretario de la asociación'),
  ('tesorero', 'Tesorero de la asociación'),
  ('vocal', 'Vocal de la junta directiva'),
  ('ludotecario', 'Responsable de la ludoteca'),
  ('socio_basico', 'Socio sin cargo especial');

-- ==========================================
-- TABLA: usuarios_roles (Many-to-Many)
-- ==========================================
CREATE TABLE usuarios_roles (
  usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  rol_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  fecha_asignacion TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (usuario_id, rol_id)
)

-- ==========================================
-- TABLA: relaciones_socios
-- ==========================================
CREATE TABLE relaciones_socios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  socio_principal_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  socio_relacionado_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo_relacion VARCHAR(20) CHECK (tipo_relacion IN ('pareja', 'hijo', 'padre')),
  activa BOOLEAN DEFAULT true,
  fecha_inicio TIMESTAMP DEFAULT NOW(),
  fecha_fin TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)

-- ==========================================
-- TABLA: juegos
-- ==========================================
CREATE TABLE juegos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo VARCHAR(255) NOT NULL,
  autor VARCHAR(255),
  editorial VARCHAR(255),
  anio_publicacion INTEGER,
  num_jugadores_min INTEGER,
  num_jugadores_max INTEGER,
  duracion_minutos INTEGER,
  edad_recomendada INTEGER,
  categoria VARCHAR(100),
  estado VARCHAR(20) CHECK (estado IN ('disponible', 'prestado', 'mantenimiento')) DEFAULT 'disponible',
  propietario VARCHAR(100),
  foto_url VARCHAR(500),
  bgg_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Índices
CREATE INDEX idx_juegos_titulo ON juegos(titulo);
CREATE INDEX idx_juegos_estado ON juegos(estado);

-- ==========================================
-- TABLA: prestamos
-- ==========================================
CREATE TABLE prestamos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  juego_id UUID REFERENCES juegos(id) ON DELETE CASCADE,
  socio_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
  fecha_solicitud TIMESTAMP DEFAULT NOW(),
  fecha_aprobacion TIMESTAMP,
  fecha_prestamo TIMESTAMP,
  fecha_devolucion TIMESTAMP,
  estado VARCHAR(20) CHECK (estado IN ('pendiente', 'aprobado', 'rechazado', 'activo', 'devuelto')) DEFAULT 'pendiente',
  usuario_aprobo UUID REFERENCES usuarios(id),
  usuario_confirmo_devolucion UUID REFERENCES usuarios(id),
  motivo_rechazo TEXT,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Índices
CREATE INDEX idx_prestamos_juego_id ON prestamos(juego_id);
CREATE INDEX idx_prestamos_socio_id ON prestamos(socio_id);
CREATE INDEX idx_prestamos_estado ON prestamos(estado);

-- ==========================================
-- TABLA: visitas
-- ==========================================
CREATE TABLE visitas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_completo VARCHAR(255) NOT NULL,
  fecha_visita DATE NOT NULL,
  numero_visita INTEGER NOT NULL,
  es_pago BOOLEAN DEFAULT false,
  importe DECIMAL(10,2),
  socio_registro_id UUID REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT NOW()
)

-- Índices
CREATE INDEX idx_visitas_nombre ON visitas(nombre_completo);
CREATE INDEX idx_visitas_fecha ON visitas(fecha_visita);

-- ==========================================
-- TABLA: configuracion
-- ==========================================
CREATE TABLE configuracion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT,
  tipo VARCHAR(20) CHECK (tipo IN ('numero', 'texto', 'boolean')),
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Configuración por defecto
INSERT INTO configuracion (clave, valor, tipo, descripcion) VALUES
  ('visitas_gratuitas', '3', 'numero', 'Número de visitas gratuitas para no socios'),
  ('precio_visita_pago', '4', 'numero', 'Precio en euros de visita de pago');

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_juegos_updated_at BEFORE UPDATE ON juegos
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_configuracion_updated_at BEFORE UPDATE ON configuracion
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- ROW LEVEL SECURITY (RLS) - Supabase
-- ==========================================

-- Habilitar RLS en todas las tablas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE relaciones_socios ENABLE ROW LEVEL SECURITY;
ALTER TABLE juegos ENABLE ROW LEVEL SECURITY;
ALTER TABLE prestamos ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

-- Políticas de ejemplo (ajustar según necesidades)

-- Usuarios: solo pueden ver su propio perfil, directiva puede ver todos
CREATE POLICY "Usuarios pueden ver su propio perfil"
  ON usuarios FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Directiva puede ver todos los usuarios"
  ON usuarios FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM usuarios_roles ur
      JOIN roles r ON ur.rol_id = r.id
      WHERE ur.usuario_id = auth.uid()
      AND r.nombre IN ('presidente', 'secretario', 'tesorero', 'vocal')
    )
  );

-- Juegos: todos los autenticados pueden ver
CREATE POLICY "Usuarios autenticados pueden ver juegos"
  ON juegos FOR SELECT
  TO authenticated
  USING (true);

-- Solo ludotecario y directiva pueden modificar
CREATE POLICY "Ludotecario puede gestionar juegos"
  ON juegos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM usuarios_roles ur
      JOIN roles r ON ur.rol_id = r.id
      WHERE ur.usuario_id = auth.uid()
      AND r.nombre IN ('ludotecario', 'presidente', 'secretario', 'tesorero')
    )
  );
```

### Esquema alternativo para Firebase (Firestore)

```typescript
// Estructura de colecciones en Firestore

// Collection: usuarios
{
  id: string (auto-generated),
  email: string,
  nombre: string,
  apellidos: string,
  dni: string,
  telefono: string,
  fechaNacimiento: Timestamp,
  direccion: string,
  aliasTelegram: string,
  usuarioBgg: string,
  apodo: string,
  tipoCuota: 'individual' | 'pareja' | 'familiar',
  consentimientoTiendas: boolean,
  estado: 'pendiente' | 'activo' | 'inactivo' | 'baja',
  fechaAlta: Timestamp,
  fechaBaja: Timestamp | null,
  tieneLlaves: boolean,
  fechaSolicitudLlaves: Timestamp | null,
  fechaAprobacionLlaves: Timestamp | null,
  roles: string[], // ['socio_basico', 'ludotecario', etc]
  
  // Trazabilidad
  usuarioAproboAlta: string | null,
  usuarioAproboLlaves: string | null,
  usuarioDioBaja: string | null,
  
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// Collection: juegos
{
  id: string,
  titulo: string,
  autor: string,
  editorial: string,
  anioPublicacion: number,
  numJugadoresMin: number,
  numJugadoresMax: number,
  duracionMinutos: number,
  edadRecomendada: number,
  categoria: string,
  estado: 'disponible' | 'prestado' | 'mantenimiento',
  propietario: string,
  fotoUrl: string,
  bggId: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// Collection: prestamos
{
  id: string,
  juegoId: string,
  socioId: string,
  fechaSolicitud: Timestamp,
  fechaAprobacion: Timestamp | null,
  fechaPrestamo: Timestamp | null,
  fechaDevolucion: Timestamp | null,
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'activo' | 'devuelto',
  usuarioAprobo: string | null,
  usuarioConfirmoDevolucion: string | null,
  motivoRechazo: string | null,
  notas: string | null,
  createdAt: Timestamp
}

// Collection: visitas
{
  id: string,
  nombreCompleto: string,
  fechaVisita: Timestamp,
  numeroVisita: number,
  esPago: boolean,
  importe: number,
  socioRegistroId: string,
  createdAt: Timestamp
}

// Collection: configuracion
{
  id: string,
  clave: string,
  valor: string,
  tipo: 'numero' | 'texto' | 'boolean',
  descripcion: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// Security Rules (Firestore)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isDirectiva() {
      return get(/databases/$(database)/documents/usuarios/$(request.auth.uid))
        .data.roles.hasAny(['presidente', 'secretario', 'tesorero']);
    }
    
    function isLudotecario() {
      return get(/databases/$(database)/documents/usuarios/$(request.auth.uid))
        .data.roles.hasAny(['ludotecario', 'presidente', 'secretario', 'tesorero']);
    }
    
    // Usuarios
    match /usuarios/{userId} {
      allow read: if isAuthenticated() && (
        request.auth.uid == userId || isDirectiva()
      );
      allow update: if isAuthenticated() && (
        request.auth.uid == userId || isDirectiva()
      );
      allow create: if true; // Registro público
      allow delete: if isDirectiva();
    }
    
    // Juegos
    match /juegos/{juegoId} {
      allow read: if isAuthenticated();
      allow write: if isLudotecario();
    }
    
    // Préstamos
    match /prestamos/{prestamoId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
      allow update: if isLudotecario();
    }
    
    // Visitas
    match /visitas/{visitaId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated();
    }
    
    // Configuración
    match /configuracion/{configId} {
      allow read: if isAuthenticated();
      allow write: if isDirectiva();
    }
  }
}
```

---

## 🌐 API ENDPOINTS

### Base URL
```
Development: http://localhost:5000/api
Production: https://api.dragondemadera.com/api (TBD)
```

### Autenticación

```
POST   /auth/register          - Registro nuevo usuario
POST   /auth/login             - Login
POST   /auth/logout            - Logout
POST   /auth/refresh-token     - Renovar token
GET    /auth/me                - Datos usuario actual
```

**Ejemplo Request - Login:**
```json
POST /api/auth/login

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Ejemplo Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "nombre": "Juan",
      "apellidos": "Pérez",
      "roles": ["socio_basico"]
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "..."
  }
}
```

### Gestión de Socios

```
GET    /socios                       - Listar socios (filtros por estado)
GET    /socios/:id                   - Detalle socio
POST   /socios                       - Crear solicitud socio
PUT    /socios/:id                   - Actualizar socio
DELETE /socios/:id                   - Dar de baja socio
GET    /socios/pendientes            - Socios pendientes validación
POST   /socios/:id/aprobar           - Aprobar solicitud
POST   /socios/:id/rechazar          - Rechazar solicitud

-- Llaves
POST   /socios/:id/solicitar-llaves  - Solicitar llaves
POST   /socios/:id/aprobar-llaves    - Aprobar llaves
GET    /socios/:id/elegibilidad-llaves - Verificar elegibilidad
```

**Ejemplo Request - Aprobar Socio:**
```json
POST /api/socios/:id/aprobar

Headers:
Authorization: Bearer {token}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "estado": "activo",
    "fechaAlta": "2025-01-18T10:00:00Z",
    "usuarioAproboAlta": "uuid-secretario"
  },
  "message": "Socio aprobado correctamente"
}
```

### Ludoteca

```
GET    /juegos                 - Listar juegos (filtros)
GET    /juegos/:id             - Detalle juego
POST   /juegos                 - Añadir juego
PUT    /juegos/:id             - Actualizar juego
DELETE /juegos/:id             - Borrar juego
GET    /juegos/disponibles     - Solo juegos disponibles
GET    /juegos/search?q=catan  - Búsqueda
```

### Préstamos

```
GET    /prestamos                    - Listar préstamos
GET    /prestamos/:id                - Detalle préstamo
POST   /prestamos                    - Solicitar préstamo
PUT    /prestamos/:id/aprobar        - Aprobar préstamo
PUT    /prestamos/:id/rechazar       - Rechazar préstamo
PUT    /prestamos/:id/devolver       - Registrar devolución
GET    /prestamos/mis-prestamos      - Préstamos del socio actual
GET    /prestamos/pendientes         - Préstamos pendientes aprobación
GET    /prestamos/activos            - Préstamos activos (no devueltos)
```

**Ejemplo Request - Solicitar Préstamo:**
```json
POST /api/prestamos

Headers:
Authorization: Bearer {token}

Body:
{
  "juegoId": "uuid-juego",
  "notas": "Lo necesito para el sábado"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid-prestamo",
    "juegoId": "uuid-juego",
    "socioId": "uuid-socio",
    "estado": "pendiente",
    "fechaSolicitud": "2025-01-18T10:00:00Z",
    "notas": "Lo necesito para el sábado"
  },
  "message": "Solicitud de préstamo creada. Pendiente de aprobación."
}
```

### Visitas

```
GET    /visitas                - Listar visitas
POST   /visitas                - Registrar visita
GET    /visitas/buscar/:nombre - Buscar visitante por nombre
GET    /visitas/estadisticas   - Estadísticas de visitas
GET    /visitas/:nombre/historial - Historial de un visitante
```

**Ejemplo Request - Registrar Visita:**
```json
POST /api/visitas

Headers:
Authorization: Bearer {token}

Body:
{
  "nombreCompleto": "Carlos Martínez",
  "fechaVisita": "2025-01-18"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid-visita",
    "nombreCompleto": "Carlos Martínez",
    "fechaVisita": "2025-01-18",
    "numeroVisita": 3,
    "esPago": false,
    "importe": 0,
    "mensaje": "Visita gratuita (3 de 3). Próxima visita: 4€"
  }
}
```

### Configuración

```
GET    /configuracion          - Obtener toda la configuración
GET    /configuracion/:clave   - Obtener valor específico
PUT    /configuracion/:clave   - Actualizar parámetro
```

---

## 🚀 INFRAESTRUCTURA Y DEVOPS

### Opciones de Hosting

#### Opción 1: Vercel (Recomendada para React + Vite)

**Pros:**
- ✅ Deploy automático desde Git
- ✅ Optimizado para frontend moderno
- ✅ CDN global incluido
- ✅ SSL gratis
- ✅ Preview deployments automáticos
- ✅ Serverless functions para API

**Contras:**
- ❌ Backend debe ser serverless o externo

**Configuración:**
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

#### Opción 2: AWS (EC2 + S3 + CloudFront)

**Pros:**
- ✅ Control total
- ✅ Escalable
- ✅ Múltiples servicios integrados

**Contras:**
- ❌ Más complejo de configurar
- ❌ Requiere más mantenimiento
- ❌ Costos menos predecibles

#### Opción 3: GitHub Pages

**Pros:**
- ✅ Gratis para proyectos públicos
- ✅ Fácil setup

**Contras:**
- ❌ Solo archivos estáticos
- ❌ Backend debe estar separado
- ❌ Sin serverless functions

**Recomendación:** Vercel para frontend + Supabase/Firebase para backend

---

### CI/CD Pipeline

#### GitHub Actions - Workflow Completo

```yaml
# .github/workflows/main.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  # ========================================
  # JOB 1: Linting y Tests
  # ========================================
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run ESLint
        run: npm run lint
      
      - name: Run Tests
        run: npm run test
      
      - name: Build
        run: npm run build
  
  # ========================================
  # JOB 2: AI Code Review (Solo en PRs)
  # ========================================
  ai-review:
    if: github.event_name == 'pull_request'
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
    
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: AI Code Review con Claude/Gemini
        uses: your-org/ai-code-review-action@v1
        with:
          # Opción A: Claude
          ai-provider: 'claude'
          claude-api-key: ${{ secrets.CLAUDE_API_KEY }}
          
          # Opción B: Gemini
          # ai-provider: 'gemini'
          # gemini-api-key: ${{ secrets.GEMINI_API_KEY }}
          
          # Configuración
          review-type: 'comprehensive'
          focus-areas: |
            - Security vulnerabilities
            - Performance issues
            - Code quality
            - Best practices
            - Accessibility
          
          exclude-files: |
            *.test.ts
            *.spec.ts
            dist/**
  
  # ========================================
  # JOB 3: Deploy (Solo en push a main)
  # ========================================
  deploy:
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: [test]
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
      
      # Deploy a Vercel
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
      
      # Alternativa: Deploy a GitHub Pages
      # - name: Deploy to GitHub Pages
      #   uses: peaceiris/actions-gh-pages@v3
      #   with:
      #     github_token: ${{ secrets.GITHUB_TOKEN }}
      #     publish_dir: ./dist
```

#### Action Personalizada para AI Code Review

```yaml
# .github/workflows/ai-code-review.yml
name: AI Code Review

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
      contents: read
    
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: Get changed files
        id: changed-files
        uses: tj-actions/changed-files@v40
      
      - name: Setup Python (para script de review)
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install anthropic  # Para Claude
          # o pip install google-generativeai  # Para Gemini
      
      - name: Run AI Review
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          # o GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
          REPO: ${{ github.repository }}
        run: |
          python .github/scripts/ai-review.py \
            --files "${{ steps.changed-files.outputs.all_changed_files }}" \
            --pr-number $PR_NUMBER \
            --repo $REPO
```

#### Script de AI Review (Python)

```python
# .github/scripts/ai-review.py
import os
import sys
import anthropic
from github import Github

def review_code_with_claude(changed_files):
    client = anthropic.Anthropic(
        api_key=os.environ['ANTHROPIC_API_KEY']
    )
    
    reviews = []
    
    for file_path in changed_files:
        with open(file_path, 'r') as f:
            code = f.read()
        
        message = client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=2000,
            messages=[
                {
                    "role": "user",
                    "content": f"""
                    Revisa el siguiente código y proporciona feedback sobre:
                    1. Vulnerabilidades de seguridad
                    2. Problemas de rendimiento
                    3. Violaciones de buenas prácticas
                    4. Mejoras sugeridas
                    
                    Archivo: {file_path}
                    
                    ```
                    {code}
                    ```
                    
                    Formato de respuesta: Markdown con secciones claras.
                    """
                }
            ]
        )
        
        reviews.append({
            'file': file_path,
            'review': message.content[0].text
        })
    
    return reviews

def post_review_to_pr(reviews, pr_number, repo_name):
    g = Github(os.environ['GITHUB_TOKEN'])
    repo = g.get_repo(repo_name)
    pr = repo.get_pull(pr_number)
    
    comment = "## 🤖 AI Code Review\n\n"
    
    for review in reviews:
        comment += f"### 📄 {review['file']}\n\n"
        comment += review['review']
        comment += "\n\n---\n\n"
    
    pr.create_issue_comment(comment)

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser()
    parser.add_argument('--files', required=True)
    parser.add_argument('--pr-number', required=True, type=int)
    parser.add_argument('--repo', required=True)
    
    args = parser.parse_args()
    
    changed_files = args.files.split()
    
    reviews = review_code_with_claude(changed_files)
    post_review_to_pr(reviews, args.pr_number, args.repo)
```

---

## 🔒 SEGURIDAD

### Autenticación JWT

```typescript
// utils/jwt.ts
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_EXPIRES_IN = '24h'
const REFRESH_TOKEN_EXPIRES_IN = '7d'

export const generateToken = (userId: string, roles: string[]) => {
  return jwt.sign(
    { 
      sub: userId,
      roles,
      type: 'access'
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export const generateRefreshToken = (userId: string) => {
  return jwt.sign(
    { 
      sub: userId,
      type: 'refresh'
    },
    JWT_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  )
}

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    throw new Error('Token inválido')
  }
}
```

### Variables de Entorno

```bash
# .env.example

# Base de datos
DATABASE_PROVIDER=supabase # o firebase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx

# o para Firebase
FIREBASE_PROJECT_ID=xxx
FIREBASE_PRIVATE_KEY=xxx
FIREBASE_CLIENT_EMAIL=xxx

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_EXPIRES_IN=7d

# API
API_PORT=5000
NODE_ENV=development

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://dragondemadera.com

# Email (TBD)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=info@dragondemadera.com
SMTP_PASS=xxx

# AI Review (para GitHub Actions)
ANTHROPIC_API_KEY=xxx
# o GEMINI_API_KEY=xxx
```

### Headers de Seguridad

```typescript
// middlewares/securityHeaders.ts
import helmet from 'helmet'

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
})
```

### Rate Limiting

```typescript
// middlewares/rateLimiter.ts
import rateLimit from 'express-rate-limit'

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: 'Demasiadas peticiones desde esta IP'
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 intentos de login
  message: 'Demasiados intentos de login'
})
```

---

## ⚠️ PENDIENTES TÉCNICOS

### Alta Prioridad

#### 1. Decisión de Stack Backend
**Estado:** ⏳ Pendiente  
**Opciones:**
- Node.js + Express/NestJS
- Python + FastAPI/Django
- PHP + Laravel

**Requiere:** Consenso del equipo de backend

---

#### 2. Elección de Base de Datos
**Estado:** ⏳ Pendiente  
**Opciones:**
- Supabase (PostgreSQL)
- Firebase (Firestore)

**Consideraciones:**
- Supabase: Más SQL tradicional, mejor para queries complejas
- Firebase: Más fácil de escalar, realtime nativo

**Requiere:** Evaluación de requisitos de escalabilidad y experiencia del equipo

---

#### 3. Proveedor de AI para Code Review
**Estado:** ⏳ Pendiente  
**Opciones:**
- Claude (Anthropic)
- Gemini (Google)
- GPT-4 (OpenAI)

**Requiere:** Pruebas de calidad de review y costos

---

#### 4. Hosting Provider
**Estado:** ⏳ Pendiente  
**Opciones:**
- Vercel (recomendado para frontend)
- AWS
- GitHub Pages (solo frontend estático)

**Requiere:** Evaluación de costos y necesidades

---

### Media Prioridad

#### 5. UI Component Library
**Estado:** ⏳ Pendiente  
**Opciones:**
- Material-UI
- Chakra UI
- Ant Design
- shadcn/ui

**Requiere:** Decisión del equipo de diseño/frontend

---

#### 6. State Management
**Estado:** ⏳ Pendiente  
**Opciones:**
- Context API (nativo)
- Zustand (ligero)
- Redux Toolkit (robusto)

**Requiere:** Evaluación de complejidad del estado

---

#### 7. Sistema de Notificaciones
**Estado:** ⏳ Pendiente  
**Tipo:**
- Email (SMTP)
- Telegram Bot
- Push Notifications
- Combinación

**Requiere:** Definición de requisitos funcionales

---

#### 8. Testing Strategy
**Estado:** ⏳ Pendiente  
**Áreas:**
- Unit tests: Vitest/Jest
- Integration tests
- E2E tests: Playwright/Cypress
- Coverage mínimo: TBD

---

#### 9. Monitorización y Logging
**Estado:** ⏳ Pendiente  
**Opciones:**
- Sentry (errores)
- LogRocket (session replay)
- New Relic / DataDog (performance)
- Winston / Pino (logs backend)

---

### Baja Prioridad

#### 10. Internacionalización (i18n)
**Estado:** ⏳ Pendiente  
**Necesidad:** ¿Solo español o también otros idiomas?

---

#### 11. PWA Support
**Estado:** ⏳ Pendiente  
**Necesidad:** ¿App instalable en móvil?

---

#### 12. Migración de Datos
**Estado:** ⏳ Pendiente  
**Fuentes:**
- Datos actuales en Airtable
- ¿Otros sistemas?

**Requiere:** Script de migración

---

## 📚 RECURSOS Y REFERENCIAS

### Documentación Oficial

**Frontend:**
- React: https://react.dev
- Vite: https://vitejs.dev
- React Router: https://reactrouter.com

**Backend:**
- Express: https://expressjs.com
- NestJS: https://nestjs.com
- FastAPI: https://fastapi.tiangolo.com

**Base de Datos:**
- Supabase: https://supabase.com/docs
- Firebase: https://firebase.google.com/docs

**DevOps:**
- GitHub Actions: https://docs.github.com/en/actions
- Vercel: https://vercel.com/docs

---

## 📞 CONTACTO TÉCNICO

**Tech Lead:** [Por definir]  
**Frontend Lead:** [Por definir]  
**Backend Lead:** [Por definir]  
**DevOps Lead:** [Por definir]

---

**Fecha:** Enero 2025  
**Versión:** 1.0 - Documento Técnico  
**Estado:** En revisión

---

## 📝 CHANGELOG

### v1.0 - 2025-01-18
- Versión inicial del documento técnico
- Especificación de arquitectura y stack
- Definición de esquema de base de datos
- Configuración de CI/CD con AI review
- Lista de pendientes técnicos

---
