#!/bin/sh

# Prisma 마이그레이션 (실패해도 계속 진행)
npx prisma migrate deploy || echo "Migration skipped"

# 백엔드 API 서버 시작 (백그라운드)
# Railway: 루트 디렉토리 기준
if [ -d "/app/backend" ]; then
  # Docker 환경
  cd /app/backend && python3 main.py &
  cd /app && node server.js
else
  # Railway 환경
  cd backend && python3 main.py &
  cd .. && node server.js
fi