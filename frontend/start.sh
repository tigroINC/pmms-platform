#!/bin/sh

# Prisma 마이그레이션
npx prisma migrate deploy || echo "Migration skipped"

if [ -d "/app/backend" ]; then
  # Docker 환경
  echo "🐳 Docker 환경"
  cd /app/backend
  python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &
  cd /app
  node server.js
else
  # Railway 환경 (Frontend Only)
  echo "🚂 Railway 환경 (Frontend Only)"
  echo "현재 디렉토리: $(pwd)"
  
  # 백엔드는 별도 서비스에서 실행
  # Backend runs as separate service
  
  # 프론트엔드 시작
  if [ -f ".next/standalone/server.js" ]; then
    echo "✅ standalone server.js 발견"
    node .next/standalone/server.js
  else
    echo "❌ standalone server.js 없음"
    ls -la .next/
    exit 1
  fi
fi