FROM node:22-alpine AS builder

RUN apk add --no-cache git
RUN git config --global url."https://".insteadOf ssh://git@
RUN git config --global url."https://github.com/".insteadOf git@github.com:
WORKDIR /app
COPY package.json package-lock.json ./
ENV NODE_ENV=development
RUN npm ci
COPY src/ ./src/
COPY drizzle/ ./drizzle/
COPY tsconfig.json ./
RUN ./node_modules/.bin/tsc

FROM node:22-alpine

RUN apk add --no-cache git
RUN git config --global url."https://".insteadOf ssh://git@
RUN git config --global url."https://github.com/".insteadOf git@github.com:
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist/ ./dist/
COPY --from=builder /app/drizzle/ ./drizzle/

EXPOSE 3001
CMD ["sh", "-c", "node dist/database/migrate.js && node dist/server.js"]
