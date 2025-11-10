-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "businessNumber" TEXT,
    "businessType" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "subscriptionPlan" TEXT NOT NULL DEFAULT 'FREE',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'TRIAL',
    "subscriptionStartAt" TIMESTAMP,
    "subscriptionEndAt" TIMESTAMP,
    "maxUsers" INTEGER NOT NULL DEFAULT 1,
    "maxStacks" INTEGER NOT NULL DEFAULT 5,
    "maxDataRetention" INTEGER NOT NULL DEFAULT 365,
    "billingEmail" TEXT,
    "billingContact" TEXT,
    "lastPaymentAt" TIMESTAMP,
    "nextBillingAt" TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);
-- CreateTable
CREATE TABLE "SubscriptionHistory" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startDate" TIMESTAMP NOT NULL,
    "endDate" TIMESTAMP,
    "amount" REAL,
    "reason" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubscriptionHistory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KRW',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "billingPeriodStart" TIMESTAMP NOT NULL,
    "billingPeriodEnd" TIMESTAMP NOT NULL,
    "issuedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP NOT NULL,
    "paidAt" TIMESTAMP,
    "paymentMethod" TEXT,
    CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "organizationId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER_USER',
    "userType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
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
-- CreateTable
CREATE TABLE "CustomerAssignment" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomerAssignment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "targetId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "new_Customer" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "fullName" TEXT,
    "siteType" TEXT,
    "address" TEXT,
    "industry" TEXT,
    "siteCategory" TEXT,
    "organizationId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "Customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Customer" ("address", "code", "createdAt", "fullName", "id", "industry", "isActive", "name", "siteCategory", "siteType", "updatedAt") SELECT "address", "code", "createdAt", "fullName", "id", "industry", "isActive", "name", "siteCategory", "siteType", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_name_key" ON "Customer"("name");
CREATE INDEX "Customer_code_idx" ON "Customer"("code");
CREATE INDEX "Customer_organizationId_idx" ON "Customer"("organizationId");
-- CreateIndex
CREATE UNIQUE INDEX "Organization_businessNumber_key" ON "Organization"("businessNumber");
-- CreateIndex
CREATE INDEX "Organization_businessNumber_idx" ON "Organization"("businessNumber");
-- CreateIndex
CREATE INDEX "Organization_subscriptionStatus_idx" ON "Organization"("subscriptionStatus");
-- CreateIndex
CREATE INDEX "SubscriptionHistory_organizationId_idx" ON "SubscriptionHistory"("organizationId");
-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
-- CreateIndex
CREATE INDEX "Invoice_organizationId_idx" ON "Invoice"("organizationId");
-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");
-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");
-- CreateIndex
CREATE INDEX "User_customerId_idx" ON "User"("customerId");
-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");
-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
-- CreateIndex
CREATE INDEX "CustomerAssignment_userId_idx" ON "CustomerAssignment"("userId");
-- CreateIndex
CREATE INDEX "CustomerAssignment_customerId_idx" ON "CustomerAssignment"("customerId");
-- CreateIndex
CREATE UNIQUE INDEX "CustomerAssignment_userId_customerId_key" ON "CustomerAssignment"("userId", "customerId");
-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");
-- CreateIndex
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");
-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

