# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile

RUN pnpm exec prisma generate

COPY backend/src ./backend/src/
COPY backend/tsconfig.json ./backend/

RUN cd backend && pnpm exec tsc

# ── Production stage ───────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/prisma ./prisma
COPY package.json pnpm-workspace.yaml ./
COPY backend/package.json ./backend/

EXPOSE 3001

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node backend/dist/server.js"]
