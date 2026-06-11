# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app/frontend

COPY frontend/package.json ./

RUN npm install

COPY frontend/ ./

ARG VITE_APP_VERSION=dev
ENV VITE_APP_VERSION=$VITE_APP_VERSION

RUN npm run build

# ── Production stage ───────────────────────────────────────────────────────────
FROM nginx:alpine AS production

COPY --from=builder /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
