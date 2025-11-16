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
  # Railway 환경 (frontend 폴더에서 실행됨)
  echo "🚂 Railway 환경"
  
  # 현재 위치 확인
  echo "현재 디렉토리: $(pwd)"
  ls -la
  
  # 백엔드 시작
  cd ../backend
  echo "백엔드 시작: $(pwd)"
  python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &
  
  # 프론트엔드 시작
  cd ../frontend
  echo "프론트엔드 시작: $(pwd)"
  
  # Railway 빌드 시 생성되는 standalone server.js
  if [ -f ".next/standalone/server.js" ]; then
    echo "✅ standalone server.js 발견"
    node .next/standalone/server.js
  else
    echo "❌ standalone server.js 없음"
    ls -la .next/
    exit 1
  fi
fi