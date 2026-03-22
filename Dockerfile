FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY src/ ./src/
COPY drizzle/ ./drizzle/
COPY tsconfig.json ./
RUN npx tsc

FROM node:22-alpine

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist/ ./dist/
COPY --from=builder /app/drizzle/ ./drizzle/

EXPOSE 3001
CMD ["sh", "-c", "node dist/database/migrate.js && node dist/server.js"]
