# Multi-stage build for Next.js + Python
FROM node:18-alpine AS deps

# Python 및 필수 패키지 설치
RUN apk add --no-cache python3 py3-pip python3-dev build-base

WORKDIR /app

# Node.js 의존성 설치
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Python 의존성 설치
COPY frontend/backend/requirements.txt ./backend/
RUN pip3 install --no-cache-dir -r backend/requirements.txt

# Builder stage
FROM node:18-alpine AS builder

RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# 의존성 복사
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /usr/lib/python3.11 /usr/lib/python3.11
COPY --from=deps /usr/bin/python3 /usr/bin/python3
COPY --from=deps /usr/bin/pip3 /usr/bin/pip3

# 소스 코드 복사
COPY frontend/ .

# Prisma 생성 (빌드용 임시 환경변수)
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXTAUTH_SECRET="build-time-secret"
RUN npx prisma generate

# Next.js 빌드
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

RUN apk add --no-cache python3 py3-pip

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 필요한 파일만 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/backend ./backend
COPY --from=builder /usr/lib/python3.11 /usr/lib/python3.11
COPY --from=builder /usr/bin/python3 /usr/bin/python3

# 업로드 디렉토리 생성
RUN mkdir -p /app/public/uploads

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
