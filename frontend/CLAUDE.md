# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dragón de Madera is a website for a board game club association in Granada, Spain. Built with Next.js 16 (App Router) and deployed as a static export to GitHub Pages.

**Live site:** https://dragondemadera.com/

## Development Commands

```bash
pnpm run dev       # Start development server at http://localhost:3000
pnpm run build     # Build static export
pnpm run lint      # Run ESLint
npm run deploy     # Build and deploy to gh-pages
```

## Architecture

### Tech Stack
- **Framework:** Next.js 16 with App Router (static export mode)
- **Language:** TypeScript with strict mode
- **Styling:** Tailwind CSS 4 with CSS variables for theming
- **UI Components:** shadcn/ui (Radix primitives) in `components/ui/`
- **Theming:** next-themes for light/dark mode support

### Key Directories
- `app/` - Next.js App Router pages (layout.tsx, page.tsx, club/, socio/)
- `components/` - React components including `ui/` for shadcn components
- `lib/constants.ts` - Design tokens, social URLs, external links
- `texts.json` - All website content in Spanish (centralized for easy updates)

### Content Management
All UI text is stored in `texts.json` at the root. Edit this file to update website content without touching components.

### Fonts
Three Google Fonts are configured in the root layout:
- Gemunu Libre (display)
- Quicksand (--font-quicksand)
- Frank Ruhl Libre (--font-frank)

### Color Scheme
Primary colors defined in `app/globals.css`:
- Primary: Teal/Dark Green
- Secondary: Terracotta/Orange
- Accent: Warm Cream/Peach

## Configuration Notes

- `next.config.mjs`: Static export enabled, image optimization disabled for GitHub Pages compatibility
- `components.json`: shadcn/ui configuration with "New York" style variant
- Path alias `@/*` maps to project root
