-- AlterTable
ALTER TABLE "CustomerOrganization" ADD COLUMN "nickname" TEXT;
-- CreateTable
CREATE TABLE "CustomerGroup" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "businessNumber" TEXT NOT NULL,
    "address" TEXT,
    "industry" TEXT,
    "representative" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);
-- CreateTable
CREATE TABLE "RoleTemplate" (
    "id" TEXT PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);
-- CreateTable
CREATE TABLE "RoleTemplatePermission" (
    "id" TEXT PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "permissionCode" TEXT NOT NULL,
    CONSTRAINT "RoleTemplatePermission_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "RoleTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- CreateTable
CREATE TABLE "CustomRole" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT,
    "customerId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "templateId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "CustomRole_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "RoleTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
-- CreateTable
CREATE TABLE "CustomRolePermission" (
    "id" TEXT PRIMARY KEY,
    "roleId" TEXT NOT NULL,
    "permissionCode" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "CustomRolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "CustomRole" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- CreateTable
CREATE TABLE "UserPermission" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "permissionCode" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "grantedBy" TEXT NOT NULL,
    "grantedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT,
    CONSTRAINT "UserPermission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- CreateTable
CREATE TABLE "CustomerInvitation" (
    "id" TEXT PRIMARY KEY,
    "token" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "adminEmail" TEXT,
    "adminName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP NOT NULL,
    "usedAt" TIMESTAMP,
    "usedBy" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "CustomerInvitation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomerInvitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "new_Customer" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "businessNumber" TEXT,
    "fullName" TEXT,
    "siteType" TEXT,
    "address" TEXT,
    "industry" TEXT,
    "siteCategory" TEXT,
    "groupId" TEXT,
    "createdBy" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "Customer_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CustomerGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Customer" ("address", "businessNumber", "code", "createdAt", "fullName", "id", "industry", "isActive", "name", "siteCategory", "siteType", "updatedAt") SELECT "address", "businessNumber", "code", "createdAt", "fullName", "id", "industry", "isActive", "name", "siteCategory", "siteType", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_name_key" ON "Customer"("name");
CREATE UNIQUE INDEX "Customer_businessNumber_key" ON "Customer"("businessNumber");
CREATE INDEX "Customer_code_idx" ON "Customer"("code");
CREATE INDEX "Customer_businessNumber_idx" ON "Customer"("businessNumber");
CREATE INDEX "Customer_groupId_idx" ON "Customer"("groupId");
CREATE INDEX "Customer_createdBy_idx" ON "Customer"("createdBy");
CREATE TABLE "new_User" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "organizationId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER_USER',
    "customerId" TEXT,
    "customerGroupId" TEXT,
    "customRoleId" TEXT,
    "accessScope" TEXT NOT NULL DEFAULT 'SITE',
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
    CONSTRAINT "User_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_customerGroupId_fkey" FOREIGN KEY ("customerGroupId") REFERENCES "CustomerGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "User_customRoleId_fkey" FOREIGN KEY ("customRoleId") REFERENCES "CustomRole" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
-- CreateIndex
CREATE UNIQUE INDEX "CustomerGroup_businessNumber_key" ON "CustomerGroup"("businessNumber");
-- CreateIndex
CREATE INDEX "CustomerGroup_businessNumber_idx" ON "CustomerGroup"("businessNumber");
-- CreateIndex
CREATE UNIQUE INDEX "RoleTemplate_code_key" ON "RoleTemplate"("code");
-- CreateIndex
CREATE UNIQUE INDEX "RoleTemplatePermission_templateId_permissionCode_key" ON "RoleTemplatePermission"("templateId", "permissionCode");
-- CreateIndex
CREATE INDEX "CustomRole_organizationId_idx" ON "CustomRole"("organizationId");
-- CreateIndex
CREATE INDEX "CustomRole_customerId_idx" ON "CustomRole"("customerId");
-- CreateIndex
CREATE UNIQUE INDEX "CustomRole_organizationId_name_key" ON "CustomRole"("organizationId", "name");
-- CreateIndex
CREATE UNIQUE INDEX "CustomRolePermission_roleId_permissionCode_key" ON "CustomRolePermission"("roleId", "permissionCode");
-- CreateIndex
CREATE INDEX "UserPermission_userId_idx" ON "UserPermission"("userId");
-- CreateIndex
CREATE UNIQUE INDEX "UserPermission_userId_permissionCode_key" ON "UserPermission"("userId", "permissionCode");
-- CreateIndex
CREATE UNIQUE INDEX "CustomerInvitation_token_key" ON "CustomerInvitation"("token");
-- CreateIndex
CREATE INDEX "CustomerInvitation_token_idx" ON "CustomerInvitation"("token");
-- CreateIndex
CREATE INDEX "CustomerInvitation_status_idx" ON "CustomerInvitation"("status");
-- CreateIndex
CREATE INDEX "CustomerInvitation_customerId_idx" ON "CustomerInvitation"("customerId");
-- CreateIndex
CREATE INDEX "CustomerInvitation_organizationId_idx" ON "CustomerInvitation"("organizationId");

