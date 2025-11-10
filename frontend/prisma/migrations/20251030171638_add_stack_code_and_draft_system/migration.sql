-- CreateTable
CREATE TABLE "StackCode" (
    "id" TEXT PRIMARY KEY,
    "stackId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "internalCode" TEXT NOT NULL,
    "internalName" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "StackCode_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StackCode_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- CreateTable
CREATE TABLE "StackUpdateLog" (
    "id" TEXT PRIMARY KEY,
    "stackId" TEXT NOT NULL,
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changes" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "notifiedOrgs" TEXT NOT NULL,
    CONSTRAINT "StackUpdateLog_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "status" TEXT NOT NULL DEFAULT 'CONNECTED',
    "draftCreatedBy" TEXT,
    "draftCreatedAt" TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "Customer_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CustomerGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Customer" ("address", "businessNumber", "code", "createdAt", "createdBy", "fullName", "groupId", "id", "industry", "isActive", "isPublic", "name", "siteCategory", "siteType", "updatedAt") SELECT "address", "businessNumber", "code", "createdAt", "createdBy", "fullName", "groupId", "id", "industry", "isActive", "isPublic", "name", "siteCategory", "siteType", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_name_key" ON "Customer"("name");
CREATE UNIQUE INDEX "Customer_businessNumber_key" ON "Customer"("businessNumber");
CREATE INDEX "Customer_code_idx" ON "Customer"("code");
CREATE INDEX "Customer_businessNumber_idx" ON "Customer"("businessNumber");
CREATE INDEX "Customer_groupId_idx" ON "Customer"("groupId");
CREATE INDEX "Customer_createdBy_idx" ON "Customer"("createdBy");
CREATE INDEX "Customer_status_idx" ON "Customer"("status");
CREATE INDEX "Customer_draftCreatedBy_idx" ON "Customer"("draftCreatedBy");
CREATE TABLE "new_Stack" (
    "id" TEXT PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "siteCode" TEXT NOT NULL DEFAULT '',
    "siteName" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "code" TEXT,
    "fullName" TEXT,
    "facilityType" TEXT,
    "category" TEXT,
    "location" TEXT,
    "height" REAL,
    "diameter" REAL,
    "coordinates" TEXT,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "draftCreatedBy" TEXT,
    "draftCreatedAt" TIMESTAMP,
    "confirmedBy" TEXT,
    "confirmedAt" TIMESTAMP,
    "rejectionReason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Stack_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Stack" ("category", "code", "coordinates", "customerId", "description", "diameter", "facilityType", "fullName", "height", "id", "isActive", "location", "name") SELECT "category", "code", "coordinates", "customerId", "description", "diameter", "facilityType", "fullName", "height", "id", "isActive", "location", "name" FROM "Stack";
DROP TABLE "Stack";
ALTER TABLE "new_Stack" RENAME TO "Stack";
CREATE INDEX "Stack_customerId_idx" ON "Stack"("customerId");
CREATE INDEX "Stack_status_idx" ON "Stack"("status");
CREATE INDEX "Stack_draftCreatedBy_idx" ON "Stack"("draftCreatedBy");
CREATE UNIQUE INDEX "Stack_customerId_siteCode_key" ON "Stack"("customerId", "siteCode");
CREATE UNIQUE INDEX "Stack_customerId_name_key" ON "Stack"("customerId", "name");
-- CreateIndex
CREATE INDEX "StackCode_organizationId_internalCode_idx" ON "StackCode"("organizationId", "internalCode");
-- CreateIndex
CREATE INDEX "StackCode_stackId_idx" ON "StackCode"("stackId");
-- CreateIndex
CREATE UNIQUE INDEX "StackCode_stackId_organizationId_key" ON "StackCode"("stackId", "organizationId");
-- CreateIndex
CREATE INDEX "StackUpdateLog_stackId_idx" ON "StackUpdateLog"("stackId");
-- CreateIndex
CREATE INDEX "StackUpdateLog_updatedAt_idx" ON "StackUpdateLog"("updatedAt");

