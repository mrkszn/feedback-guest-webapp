# Build stage — Vite inlines VITE_* at build time, so they arrive as build args.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL
ARG VITE_APP_MODE=non_targeted
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_APP_MODE=$VITE_APP_MODE
RUN npm run build

# Serve stage — static SPA behind nginx with history-API fallback.
FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
