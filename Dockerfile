FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL_BROWSER
ENV VITE_API_URL_BROWSER=$VITE_API_URL_BROWSER

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY server.mjs ./

EXPOSE 80
CMD ["node", "server.mjs"]
