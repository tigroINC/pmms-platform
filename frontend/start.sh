#!/bin/sh
npx prisma migrate deploy
npm run build
next start