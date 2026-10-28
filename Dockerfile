FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

ARG VITE_CLIENTES_API_URL
ARG VITE_PROPOSTAS_API_URL
ARG VITE_CARTOES_API_URL

COPY . .
RUN npm run build

FROM nginx:1.27-alpine
ENV PORT=8080
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
