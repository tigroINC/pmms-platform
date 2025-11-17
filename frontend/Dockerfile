FROM node:18-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:18-slim AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma 생성
RUN npx prisma generate

# Next.js 빌드
RUN npm run build

FROM node:18-slim AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# standalone + static 복사
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

EXPOSE 8080
ENV PORT 8080
ENV HOSTNAME 0.0.0.0

CMD ["node", "server.js"]
