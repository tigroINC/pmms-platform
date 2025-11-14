#!/bin/sh

# Prisma 마이그레이션
npx prisma migrate deploy

# 백엔드 서버 시작 (백그라운드)
cd /app/backend && python3 main.py &

# 프론트엔드 서버 시작 (standalone)
cd /app && node server.js