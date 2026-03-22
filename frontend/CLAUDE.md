# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dragón de Madera is a website for a board game club association in Granada, Spain. Built with Vite + React and deployed as a static site to GitHub Pages.

**Live site:** https://dragondemadera.com/

## Development Commands

```bash
pnpm run dev       # Start development server at http://localhost:5173
pnpm run build     # Build for production (runs tsc + vite build)
pnpm run preview   # Preview production build
pnpm run deploy    # Build and deploy to gh-pages
pnpm run lint      # Run ESLint
```

## Architecture

### Tech Stack
- **Framework:** Vite + React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 with PostCSS
- **UI Components:** shadcn/ui (Radix primitives) in `src/components/ui/`
- **Routing:** react-router-dom
- **Theming:** next-themes for light/dark mode support

### Key Directories
- `src/` - Application source code
  - `components/` - React components (atomic design: atoms, molecules, organisms)
  - `components/ui/` - shadcn/ui components
  - `lib/` - Utilities and constants
  - `pages/` - Page components
- `public/` - Static assets
- `index.html` - Vite entry point

### Content Management
UI text is centralized in `texts.json` at the root.

### Fonts
Google Fonts configured in index.html:
- Gemunu Libre (display)
- Quicksand
- Frank Ruhl Libre

## Configuration Notes

- `vite.config.ts` - Vite configuration with React plugin
- `components.json` - shadcn/ui configuration with "New York" style variant
- Path alias `@/*` maps to `./src/*`
