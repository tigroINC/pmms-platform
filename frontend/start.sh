#!/bin/sh
set -e

echo "Resolving failed migrations..."
npx prisma migrate resolve --rolled-back "20251026222758_init" || true
npx prisma migrate resolve --rolled-back "20251028004453_add_customer_isactive" || true

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting application..."
node server.js
