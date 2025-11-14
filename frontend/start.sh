#!/bin/sh

# Prisma 마이그레이션
npx prisma migrate deploy

# 프론트엔드 서버 시작
# Railway 환경에서는 .next/standalone/server.js 사용
if [ -f ".next/standalone/server.js" ]; then
  node .next/standalone/server.js
elif [ -f "server.js" ]; then
  node server.js
else
  # standalone 빌드가 없으면 next start 사용
  npx next start
fi