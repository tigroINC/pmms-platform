#!/bin/sh

# Prisma 마이그레이션 (실패해도 계속 진행)
npx prisma migrate deploy || echo "Migration skipped"

# 백엔드 API 서버 시작 (백그라운드)
cd /app/backend && python3 main.py &

# 프론트엔드 서버 시작 (standalone 모드)
cd /app && node server.js