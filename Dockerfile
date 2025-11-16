# Multi-stage build for Next.js + Python
FROM node:18-slim AS deps

# Python 및 필수 패키지 설치
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Node.js 의존성 설치
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

# Python 의존성 설치
COPY backend/requirements.txt ./backend/
RUN pip3 install --break-system-packages --no-cache-dir -r backend/requirements.txt

# Playwright Chromium 설치
RUN playwright install chromium && \
    playwright install-deps chromium

# Builder stage
FROM node:18-slim AS builder

RUN apt-get update && apt-get install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 의존성 복사
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /usr/lib/python3.11 /usr/lib/python3.11
COPY --from=deps /usr/bin/python3 /usr/bin/python3
COPY --from=deps /usr/bin/pip3 /usr/bin/pip3

# 소스 코드 복사
COPY frontend/ .
COPY backend/ ./backend/

# Prisma 생성 (빌드용 임시 환경변수)
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
ENV NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENV NEXTAUTH_URL="http://localhost:3000"
ENV NEXTAUTH_SECRET="build-time-secret"
RUN npx prisma generate

# Next.js 빌드
RUN npm run build

# Production stage
FROM node:18-slim AS runner

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    chromium \
    chromium-driver \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libatspi2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libwayland-client0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxkbcommon0 \
    libxrandr2 \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 필요한 파일만 복사
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=deps /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=deps /usr/bin/python3 /usr/bin/python3
COPY --from=deps /usr/local/bin /usr/local/bin
COPY frontend/start.sh ./start.sh

# Python 패키지 경로 추가
ENV PATH="/root/.local/bin:$PATH"
ENV PYTHONPATH="/usr/local/lib/python3.11/site-packages"
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0

# Playwright 브라우저 설치 (runner 단계에서)
RUN pip3 install --break-system-packages playwright && \
    playwright install chromium && \
    playwright install-deps chromium

# 업로드 디렉토리 생성 및 스크립트 실행 권한 부여
RUN mkdir -p /app/public/uploads && chmod +x /app/start.sh

EXPOSE 3000 8000

ENV HOSTNAME "0.0.0.0"

CMD ["sh", "start.sh"]
