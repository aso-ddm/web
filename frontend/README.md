# Dragón de Madera

Web oficial de la asociación granadina de juegos de mesa **Dragón de Madera**.

**URL de producción:** https://dragondemadera.com/

---

## Tabla de Contenidos

- [Tecnologías](#tecnologías)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Desarrollo](#instalación-y-desarrollo)
- [Scripts Disponibles](#scripts-disponibles)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Arquitectura de Componentes](#arquitectura-de-componentes)
- [Sistema de Estilos](#sistema-de-estilos)
- [Rutas](#rutas)
- [Contenido y Textos](#contenido-y-textos)
- [Despliegue](#despliegue)
- [Guía de Contribución](#guía-de-contribución)

---

## Tecnologías

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| **Vite** | 6.x | Bundler y servidor de desarrollo |
| **React** | 19.x | Biblioteca de UI |
| **TypeScript** | 5.x | Tipado estático |
| **React Router** | 7.x | Enrutamiento SPA |
| **Tailwind CSS** | 4.x | Framework de estilos |
| **shadcn/ui** | - | Componentes UI (Radix UI) |
| **next-themes** | 0.4.x | Gestión de tema claro/oscuro |

---

## Requisitos Previos

- **Node.js** >= 18.x
- **npm** >= 9.x o **pnpm** >= 8.x (recomendado)

---

## Instalación y Desarrollo

### 1. Clonar el repositorio

```bash
git clone https://github.com/JMProf/Dragon-de-madera.git
cd Dragon-de-madera
```

### 2. Instalar dependencias

```bash
npm install
# o con pnpm
pnpm install
```

### 3. Iniciar servidor de desarrollo

```bash
npm run dev
# o con pnpm
pnpm dev
```

La web estará disponible en `http://localhost:5173`

---

## Scripts Disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| `dev` | `npm run dev` | Inicia servidor de desarrollo en localhost:5173 |
| `build` | `npm run build` | Compila TypeScript y genera build de producción en `/dist` |
| `preview` | `npm run preview` | Previsualiza el build de producción localmente |
| `deploy` | `npm run deploy` | Genera build y despliega a GitHub Pages |
| `lint` | `npm run lint` | Ejecuta ESLint para análisis de código |

---

## Estructura del Proyecto!

```
Dragon-de-madera/
├── public/                    # Archivos estáticos (imágenes, favicon)
├── src/
│   ├── components/
│   │   ├── atoms/             # Componentes básicos reutilizables
│   │   │   └── icons/         # Iconos SVG del proyecto
│   │   ├── molecules/         # Combinaciones de átomos
│   │   ├── organisms/         # Componentes complejos (Header, Footer)
│   │   └── ui/                # Componentes shadcn/ui (Radix)
│   ├── config/
│   │   ├── navigation.ts      # Configuración de navegación
│   │   └── routes.tsx         # Definición de rutas
│   ├── data/
│   │   └── texts.json         # Contenido de texto de la web
│   ├── hooks/
│   │   ├── useMobile.ts       # Detección de dispositivo móvil
│   │   ├── useScrollNavigation.ts  # Navegación con scroll suave
│   │   └── useToast.ts        # Sistema de notificaciones
│   ├── lib/
│   │   ├── constants.ts       # Constantes (URLs, spacing)
│   │   ├── scroll.ts          # Utilidades de scroll
│   │   └── utils.ts           # Utilidad cn() para clases CSS
│   ├── pages/
│   │   ├── HomePage.tsx       # Página principal (/)
│   │   ├── ClubPage.tsx       # Página del club (/club)
│   │   └── SocioPage.tsx      # Página hazte socio (/socio)
│   ├── styles/
│   │   └── globals.css        # Estilos globales y variables CSS
│   ├── App.tsx                # Componente raíz con scroll handling
│   └── main.tsx               # Punto de entrada de la aplicación
├── index.html                 # HTML principal
├── vite.config.ts             # Configuración de Vite
├── tsconfig.json              # Configuración de TypeScript
├── postcss.config.mjs         # Configuración de PostCSS/Tailwind
└── package.json               # Dependencias y scripts
```

---

## Arquitectura de Componentes

El proyecto sigue el patrón **Atomic Design**:

### Atoms (`src/components/atoms/`)

Componentes más pequeños y reutilizables.

```
atoms/
├── icons/
│   ├── DragonIcon.tsx         # Logo del dragón
│   ├── DragonTextLogo.tsx     # Logo con texto
│   ├── MeepleIcon.tsx         # Icono de meeple
│   ├── WhatsAppIcon.tsx       # Icono de WhatsApp
│   ├── types.ts               # Interface IconProps unificada
│   └── index.ts               # Exportaciones
├── Container.tsx              # Wrapper con spacing consistente
└── index.ts
```

**Interfaz unificada de iconos:**

```typescript
interface IconProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'  // 16px, 24px, 32px, 48px
}
```

### Molecules (`src/components/molecules/`)

Combinaciones de átomos con funcionalidad específica.

| Componente | Propósito |
|------------|-----------|
| `NavLink` | Link de navegación con scroll suave |
| `SocialLink` | Enlace a red social con icono |
| `FeatureItem` | Item de característica con meeple |
| `StepCard` | Tarjeta de paso numerado |

### Organisms (`src/components/organisms/`)

Componentes complejos que forman secciones de página.

| Componente | Propósito |
|------------|-----------|
| `Header` | Navegación principal (desktop y móvil) |
| `Footer` | Pie de página con redes sociales |
| `PageHero` | Sección hero reutilizable |
| `SectionHeading` | Título de sección estilizado |
| `WhatsAppButton` | Botón CTA de WhatsApp |
| `FaqButton` | Botón para FAQs |
| `LudotecaTable` | Tabla de juegos (Google Sheets) |

### UI (`src/components/ui/`)

Componentes de **shadcn/ui** basados en Radix UI. No modificar directamente.

---

## Sistema de Estilos

### Archivo Principal: `src/styles/globals.css`

Este archivo controla **todos los colores y estilos base** de la aplicación.

#### Estructura del archivo

```css
/* 1. Importación de fuentes */
@import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@600&family=Gemunu+Libre:wght@400&family=Quicksand:wght@600&display=swap');

/* 2. Tailwind CSS v4 */
@import "tailwindcss";
@import "tw-animate-css";

/* 3. Variables CSS - Modo claro */
:root {
  --background: rgb(243, 243, 243);
  --primary: rgb(0, 76, 72);
  --secondary: rgb(186, 76, 0);
  --accent: rgb(255, 212, 166);
  /* ... */
}

/* 4. Variables CSS - Modo oscuro (mismo que claro) */
.dark {
  --background: rgb(243, 243, 243);
  --primary: rgb(0, 76, 72);
  /* ... */
}

/* 5. Mapeo a Tailwind */
@theme inline {
  --color-background: var(--background);
  --color-primary: var(--primary);
  /* ... */
}

/* 6. Estilos base */
@layer base {
  body {
    font-family: 'Gemunu Libre', sans-serif;
    @apply bg-background text-foreground tracking-wide;
  }
}
```

### Paleta de Colores

| Variable | Valor | Color | Uso |
|----------|-------|-------|-----|
| `--background` | `rgb(243, 243, 243)` | Gris claro crema | Fondo principal |
| `--foreground` | `oklch(0.25 0.02 60)` | Marrón oscuro | Texto principal |
| `--primary` | `rgb(0, 76, 72)` | Verde teal | Botones, header, footer |
| `--primary-foreground` | `oklch(0.99 0.01 85)` | Blanco cálido | Texto sobre primary |
| `--secondary` | `rgb(186, 76, 0)` | Naranja terracota | Secciones destacadas |
| `--secondary-foreground` | `oklch(0.25 0.02 60)` | Marrón oscuro | Texto sobre secondary |
| `--accent` | `rgb(255, 212, 166)` | Crema cálido | Fondos de acento |
| `--card` | `rgb(24, 24, 27)` | Gris muy oscuro | Texto en tarjetas |
| `--muted` | `oklch(0.92 0.015 85)` | Gris suave | Fondos sutiles |
| `--border` | `oklch(0.88 0.02 85)` | Gris claro | Bordes |

### Fuentes

| Fuente | Peso | Uso |
|--------|------|-----|
| **Gemunu Libre** | 400 | Texto general (body) |
| **Quicksand** | 600 | Títulos y botones (`font-display`) |
| **Frank Ruhl Libre** | 600 | Nombre del club (`font-trajan`) |

### Uso de Colores en Componentes

```tsx
// Clases de Tailwind que usan las variables CSS
<Button className="bg-primary text-primary-foreground">

<section className="bg-secondary text-primary-foreground">

<footer className="bg-primary text-background">

// Tailwind traduce automáticamente:
// bg-primary → background-color: var(--primary) → rgb(0, 76, 72)
```

### Constantes de Spacing (`src/lib/constants.ts`)

```typescript
export const SPACING = {
  container: 'container mx-auto px-4',
  section: 'py-12 sm:py-16 md:py-20 lg:py-24',
  sectionHero: 'py-8 sm:py-12 md:py-16',
  contentGap: 'gap-8 lg:gap-12',
  itemsGap: 'space-y-4 sm:space-y-5 md:space-y-6',
  // ...
}
```

---

## Rutas

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/` | `HomePage` | Página principal con hero, calendario, FAQs |
| `/club` | `ClubPage` | Información del club, ludoteca |
| `/socio` | `SocioPage` | Cómo hacerse socio, beneficios |
| `/#calendario` | Sección | Scroll a la sección del calendario |

### Configuración de Rutas

```typescript
// src/config/routes.tsx
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/club" element={<ClubPage />} />
      <Route path="/socio" element={<SocioPage />} />
    </Routes>
  )
}
```

### Navegación con Scroll

```typescript
// src/config/navigation.ts
export const navigationItems = [
  { label: 'Inicio', to: '/', scrollTo: 'top' },
  { label: 'Calendario', to: '/', scrollTo: 'calendario' },
  { label: 'El club', to: '/club' },
  { label: 'Hazte socio', to: '/socio' },
]
```

---

## Contenido y Textos

Todo el contenido de texto está centralizado en `src/data/texts.json`.

### Estructura del archivo

```json
{
  "navigation": {
    "home": "Inicio",
    "calendar": "Calendario",
    "club": "El club",
    "member": "Hazte socio"
  },
  "common": {
    "clubName": "Dragón de Madera",
    "clubNameTagline": "Club de juegos de mesa de Granada",
    "address": {
      "street": "C/ Alcaicería, 3",
      "city": "Granada"
    }
  },
  "home": {
    "hero": {
      "title": "...",
      "heading": "...",
      "features": ["...", "..."]
    },
    "faq": {
      "items": [
        { "question": "...", "answer": "..." }
      ]
    }
  }
}
```

### Uso en componentes

```tsx
import texts from '@/data/texts.json'

<h1>{texts.home.hero.title}</h1>
<p>{texts.common.clubNameTagline}</p>
```

---

## Despliegue

### GitHub Pages

```bash
npm run deploy
```

Este comando:
1. Ejecuta `vite build` → genera `/dist`
2. Ejecuta `gh-pages -d dist` → despliega a GitHub Pages

### Build de Producción

```bash
npm run build
```

Genera archivos optimizados en `/dist`:
- `index.html` - HTML principal
- `assets/index-[hash].css` - CSS minificado (~130KB)
- `assets/index-[hash].js` - JavaScript minificado (~365KB)

---

## Guía de Contribución

### Convenciones de Código

1. **Componentes**: PascalCase (`NavLink.tsx`, `HomePage.tsx`)
2. **Hooks**: camelCase con prefijo `use` (`useMobile.ts`)
3. **Utilidades**: camelCase (`scroll.ts`, `utils.ts`)
4. **Constantes**: UPPER_SNAKE_CASE (`SPACING`, `SOCIAL_URLS`)

### Añadir un Nuevo Componente

1. Determinar el nivel (atom, molecule, organism)
2. Crear archivo en la carpeta correspondiente
3. Exportar desde `index.ts` del directorio
4. Usar la utilidad `cn()` para clases condicionales

```tsx
// src/components/molecules/MiComponente.tsx
import { cn } from '@/lib/utils'

interface MiComponenteProps {
  className?: string
  // ...
}

export function MiComponente({ className }: MiComponenteProps) {
  return (
    <div className={cn('estilos-base', className)}>
      {/* ... */}
    </div>
  )
}
```

### Modificar Colores

Editar únicamente `src/styles/globals.css`:

```css
:root {
  --primary: rgb(0, 76, 72);  /* Cambiar aquí */
}

.dark {
  --primary: rgb(0, 76, 72);  /* Mantener igual para consistencia */
}
```

### Añadir Textos

1. Añadir al archivo `src/data/texts.json`
2. Importar y usar en el componente

### Alias de Importación

El proyecto usa el alias `@/` que apunta a `src/`:

```typescript
// En lugar de:
import { Button } from '../../../components/ui/button'

// Usar:
import { Button } from '@/components/ui/button'
```

---

## Enlaces Útiles

- **Producción**: https://dragondemadera.com/
- **Repositorio**: https://github.com/JMProf/Dragon-de-madera
- **Tailwind CSS v4**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com/
- **Radix UI**: https://www.radix-ui.com/
- **React Router**: https://reactrouter.com/

---

## Licencia

Proyecto privado de la Asociación Dragón de Madera.

