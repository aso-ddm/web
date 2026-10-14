# ── Build stage ───────────────────────────────────────────────────────────────
# Mismo lockfile que el backend (pnpm-lock.yaml de la raíz): builds reproducibles
# pnpm 11 (el del lockfile) necesita Node >= 22.13
FROM node:22-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm@11

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN pnpm install --frozen-lockfile --filter dragon-de-madera...

COPY frontend/ ./frontend/

ARG VITE_APP_VERSION=dev
ENV VITE_APP_VERSION=$VITE_APP_VERSION

RUN pnpm -C frontend build

# ── Production stage ───────────────────────────────────────────────────────────
FROM nginx:alpine AS production

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
