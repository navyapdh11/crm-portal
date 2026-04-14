FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npx tsc

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache wget
COPY package*.json ./
RUN npm ci --only=production
COPY --from=builder /app/dist ./dist
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=5s --retries=5 CMD wget -qO- http://localhost:4000/health || exit 1
CMD ["node", "dist/api/index.js"]
