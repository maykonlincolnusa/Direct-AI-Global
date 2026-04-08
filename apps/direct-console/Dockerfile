# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json tsconfig.base.json ./
COPY apps ./apps

RUN npm ci
RUN npm run build --workspace @apps/direct-console

FROM nginx:1.27-alpine AS runtime
WORKDIR /usr/share/nginx/html

COPY --from=build /app/apps/direct-console/dist ./
COPY apps/direct-console/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=5 CMD wget -qO- http://127.0.0.1/ || exit 1
