# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps ./apps
COPY configs ./configs

RUN npm ci
RUN npm run build --workspace @apps/knowledge-pipeline

FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/knowledge-pipeline/dist ./apps/knowledge-pipeline/dist
COPY --from=build /app/apps/knowledge-pipeline/package.json ./apps/knowledge-pipeline/package.json

CMD ["node", "apps/knowledge-pipeline/dist/index.js"]
