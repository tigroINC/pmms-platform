#!/bin/sh

# Prisma 마이그레이션
npx prisma migrate deploy

# 프론트엔드 서버 시작 (standalone)
node server.js