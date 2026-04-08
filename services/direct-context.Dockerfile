# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json tsconfig.direct.json ./
COPY src ./src
COPY configs ./configs

RUN npm ci
RUN npm run direct:build

FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV DIRECT_PORT=4300

COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist-direct ./dist-direct
COPY --from=build /app/configs ./configs
COPY --from=build /app/.env.example ./.env.example

EXPOSE 4300
HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD wget -qO- http://127.0.0.1:4300/health || exit 1

CMD ["node", "dist-direct/index.js"]
