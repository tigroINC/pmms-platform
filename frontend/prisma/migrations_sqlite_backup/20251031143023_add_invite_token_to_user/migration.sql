-- AlterTable
ALTER TABLE "User" ADD COLUMN "inviteToken" TEXT;
ALTER TABLE "User" ADD COLUMN "inviteTokenExpiry" TIMESTAMP;

