#!/bin/sh

# Prisma 마이그레이션
npx prisma migrate deploy

# 프론트엔드 서버 시작 - Railway PORT 환경변수 사용
npx next start -p ${PORT:-3000}