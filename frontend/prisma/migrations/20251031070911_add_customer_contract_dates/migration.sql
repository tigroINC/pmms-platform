-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "contractEndDate" DATETIME;
ALTER TABLE "Customer" ADD COLUMN "contractStartDate" DATETIME;

-- AlterTable
ALTER TABLE "UserPermission" ADD COLUMN "expiresAt" DATETIME;

-- CreateTable
CREATE TABLE "StackAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "stackId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT NOT NULL,
    CONSTRAINT "StackAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StackAssignment_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PermissionChangeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "changedBy" TEXT NOT NULL,
    "changerRole" TEXT NOT NULL,
    "changerName" TEXT NOT NULL,
    "targetUser" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "targetRole" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT NOT NULL,
    "reason" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "success" BOOLEAN NOT NULL,
    "errorMsg" TEXT
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CustomRole" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT,
    "customerId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CustomRole_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "RoleTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CustomRole_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CustomRole_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CustomRole" ("createdAt", "createdBy", "customerId", "description", "id", "isActive", "name", "organizationId", "templateId", "updatedAt") SELECT "createdAt", "createdBy", "customerId", "description", "id", "isActive", "name", "organizationId", "templateId", "updatedAt" FROM "CustomRole";
DROP TABLE "CustomRole";
ALTER TABLE "new_CustomRole" RENAME TO "CustomRole";
CREATE INDEX "CustomRole_organizationId_idx" ON "CustomRole"("organizationId");
CREATE INDEX "CustomRole_customerId_idx" ON "CustomRole"("customerId");
CREATE UNIQUE INDEX "CustomRole_organizationId_name_key" ON "CustomRole"("organizationId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "StackAssignment_userId_idx" ON "StackAssignment"("userId");

-- CreateIndex
CREATE INDEX "StackAssignment_stackId_idx" ON "StackAssignment"("stackId");

-- CreateIndex
CREATE UNIQUE INDEX "StackAssignment_userId_stackId_key" ON "StackAssignment"("userId", "stackId");

-- CreateIndex
CREATE INDEX "PermissionChangeLog_targetUser_idx" ON "PermissionChangeLog"("targetUser");

-- CreateIndex
CREATE INDEX "PermissionChangeLog_changedBy_idx" ON "PermissionChangeLog"("changedBy");

-- CreateIndex
CREATE INDEX "PermissionChangeLog_changedAt_idx" ON "PermissionChangeLog"("changedAt");

-- CreateIndex
CREATE INDEX "UserPermission_expiresAt_idx" ON "UserPermission"("expiresAt");
