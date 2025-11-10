#!/bin/sh
set -e

echo "Resolving failed migrations..."
npx prisma migrate resolve --rolled-back "20251110_init" || true
npx prisma migrate resolve --rolled-back "20251110000000_init" || true

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting application..."
node server.js
