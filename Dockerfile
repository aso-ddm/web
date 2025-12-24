FROM node:20-slim
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV CI=true

RUN corepack enable pnpm

WORKDIR /app/frontend

EXPOSE 3000

CMD [ "pnpm", "dev" ]
