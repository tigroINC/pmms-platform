/*
  Warnings:

  - You are about to drop the column `userType` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "organizationId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER_USER',
    "customerId" TEXT,
    "department" TEXT,
    "position" TEXT,
    "companyName" TEXT,
    "businessNumber" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP,
    "rejectedReason" TEXT,
    "lastLoginAt" TIMESTAMP,
    "lastLoginIp" TEXT,
    "loginCount" INTEGER NOT NULL DEFAULT 0,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("approvedAt", "approvedBy", "businessNumber", "companyName", "createdAt", "customerId", "department", "email", "emailVerified", "emailVerifiedAt", "id", "isActive", "lastLoginAt", "lastLoginIp", "loginCount", "name", "organizationId", "password", "phone", "position", "rejectedReason", "resetToken", "resetTokenExpiry", "role", "status", "updatedAt") SELECT "approvedAt", "approvedBy", "businessNumber", "companyName", "createdAt", "customerId", "department", "email", "emailVerified", "emailVerifiedAt", "id", "isActive", "lastLoginAt", "lastLoginIp", "loginCount", "name", "organizationId", "password", "phone", "position", "rejectedReason", "resetToken", "resetTokenExpiry", "role", "status", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");
CREATE INDEX "User_customerId_idx" ON "User"("customerId");
CREATE INDEX "User_status_idx" ON "User"("status");
CREATE INDEX "User_role_idx" ON "User"("role");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

