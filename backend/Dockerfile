FROM node:22-alpine AS builder

WORKDIR /app

RUN apk add --no-cache python3 make g++ openssl

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

RUN npm install --no-audit --no-fund

COPY backend/ ./backend/

WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

FROM node:22-alpine

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/prisma ./backend/prisma
COPY --from=builder /app/backend/package.json ./backend/

WORKDIR /app/backend
EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
