# ── Build stage ───────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache python3 make g++
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/
COPY prisma ./prisma/

RUN pnpm install --frozen-lockfile
RUN cd /app/node_modules/.pnpm/bcrypt@5.1.1/node_modules/bcrypt && npm run install

RUN pnpm exec prisma generate

COPY backend/src ./backend/src/
COPY backend/tsconfig.json ./backend/

RUN cd backend && pnpm exec tsc
RUN node_modules/.bin/tsc --module commonjs --target ES2020 --esModuleInterop true --skipLibCheck true prisma/seed.ts || true

# ── Production stage ───────────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/prisma ./prisma
COPY package.json pnpm-workspace.yaml ./
COPY backend/package.json ./backend/

EXPOSE 3001

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && NODE_PATH=/app/backend/node_modules node prisma/seed.js && node backend/dist/server.js"]
