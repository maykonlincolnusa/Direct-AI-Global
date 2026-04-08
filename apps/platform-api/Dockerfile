# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
COPY configs ./configs

RUN npm ci
RUN npm run platform-api:build

FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/platform-api/dist ./apps/platform-api/dist
COPY --from=build /app/packages ./packages
COPY --from=build /app/configs ./configs
COPY --from=build /app/.env.example ./.env.example

EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["node", "apps/platform-api/dist/index.js"]
