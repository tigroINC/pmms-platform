/*
  Warnings:

  - You are about to drop the column `organizationId` on the `Customer` table. All the data in the column will be lost.
  - Added the required column `organizationId` to the `Measurement` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Stack" ADD COLUMN "coordinates" TEXT;
ALTER TABLE "Stack" ADD COLUMN "description" TEXT;
ALTER TABLE "Stack" ADD COLUMN "location" TEXT;

-- CreateTable
CREATE TABLE "CustomerOrganization" (
    "id" TEXT PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "contractStartDate" TIMESTAMP,
    "contractEndDate" TIMESTAMP,
    "customCode" TEXT,
    "notified30Days" BOOLEAN NOT NULL DEFAULT false,
    "notified7Days" BOOLEAN NOT NULL DEFAULT false,
    "notifiedExpiry" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "approvedAt" TIMESTAMP,
    "approvedBy" TEXT,
    CONSTRAINT "CustomerOrganization_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomerOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StackOrganization" (
    "id" TEXT PRIMARY KEY,
    "stackId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "requestedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requestedBy" TEXT NOT NULL,
    "approvedAt" TIMESTAMP,
    "approvedBy" TEXT,
    CONSTRAINT "StackOrganization_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StackOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StackRequest" (
    "id" TEXT PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "stackName" TEXT,
    "stackCode" TEXT,
    "location" TEXT,
    "height" REAL,
    "diameter" REAL,
    "coordinates" TEXT,
    "description" TEXT,
    "existingStackId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "requestedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP,
    "rejectionReason" TEXT,
    CONSTRAINT "StackRequest_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StackRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StackRequest_existingStackId_fkey" FOREIGN KEY ("existingStackId") REFERENCES "Stack" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "StackHistory" (
    "id" TEXT PRIMARY KEY,
    "stackId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "changeReason" TEXT,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StackHistory_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StackHistory_changedBy_fkey" FOREIGN KEY ("changedBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- ?ÑÏãú ?åÏù¥Î∏îÏóê Í∏∞Ï°¥ Customer ?∞Ïù¥???Ä??(organizationId ?¨Ìï®)
CREATE TEMP TABLE "temp_Customer_Migration" AS
SELECT * FROM "Customer";

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
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);
INSERT INTO "new_Customer" ("address", "businessNumber", "code", "createdAt", "fullName", "id", "industry", "isActive", "name", "siteCategory", "siteType", "updatedAt") SELECT "address", "businessNumber", "code", "createdAt", "fullName", "id", "industry", "isActive", "name", "siteCategory", "siteType", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_name_key" ON "Customer"("name");
CREATE UNIQUE INDEX "Customer_businessNumber_key" ON "Customer"("businessNumber");
CREATE INDEX "Customer_code_idx" ON "Customer"("code");
CREATE INDEX "Customer_businessNumber_idx" ON "Customer"("businessNumber");

-- Í∏∞Ï°¥ Customer.organizationIdÎ•?CustomerOrganization?ºÎ°ú ÎßàÏù¥Í∑∏Î†à?¥ÏÖò
INSERT INTO "CustomerOrganization" ("id", "customerId", "organizationId", "status", "requestedBy", "isActive", "createdAt", "updatedAt", "approvedAt")
SELECT 
    lower(hex(randomblob(16))),
    "id",
    "organizationId",
    'APPROVED',
    'SYSTEM',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "temp_Customer_Migration"
WHERE "organizationId" IS NOT NULL;
CREATE TABLE "new_Measurement" (
    "id" TEXT PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "stackId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "measuredAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,
    "weather" TEXT,
    "temperatureC" REAL,
    "humidityPct" REAL,
    "pressureMmHg" REAL,
    "windDirection" TEXT,
    "windSpeedMs" REAL,
    "gasVelocityMs" REAL,
    "gasTempC" REAL,
    "moisturePct" REAL,
    "oxygenMeasuredPct" REAL,
    "oxygenStdPct" REAL,
    "flowSm3Min" REAL,
    "limitAtMeasure" REAL,
    "limitCheck" TEXT,
    "measuringCompany" TEXT,
    CONSTRAINT "Measurement_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Measurement_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Measurement_itemKey_fkey" FOREIGN KEY ("itemKey") REFERENCES "Item" ("key") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Measurement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- Measurement??organizationId ?§Ï†ï (?ÑÏãú ?åÏù¥Î∏îÏùò organizationId ?¨Ïö©)
INSERT INTO "new_Measurement" 
SELECT 
    m."id",
    m."customerId",
    m."stackId",
    m."itemKey",
    m."value",
    m."measuredAt",
    COALESCE(c."organizationId", (SELECT "id" FROM "Organization" LIMIT 1)),
    m."weather",
    m."temperatureC",
    m."humidityPct",
    m."pressureMmHg",
    m."windDirection",
    m."windSpeedMs",
    m."gasVelocityMs",
    m."gasTempC",
    m."moisturePct",
    m."oxygenMeasuredPct",
    m."oxygenStdPct",
    m."flowSm3Min",
    m."limitAtMeasure",
    m."limitCheck",
    m."measuringCompany"
FROM "Measurement" m
LEFT JOIN "temp_Customer_Migration" c ON m."customerId" = c."id";
DROP TABLE "Measurement";
ALTER TABLE "new_Measurement" RENAME TO "Measurement";
CREATE INDEX "Measurement_customerId_stackId_itemKey_measuredAt_idx" ON "Measurement"("customerId", "stackId", "itemKey", "measuredAt");
CREATE INDEX "Measurement_customerId_stackId_measuredAt_idx" ON "Measurement"("customerId", "stackId", "measuredAt");
CREATE INDEX "Measurement_itemKey_measuredAt_idx" ON "Measurement"("itemKey", "measuredAt");
CREATE INDEX "Measurement_organizationId_idx" ON "Measurement"("organizationId");
CREATE INDEX "Measurement_customerId_organizationId_idx" ON "Measurement"("customerId", "organizationId");
CREATE UNIQUE INDEX "Measurement_stackId_itemKey_measuredAt_key" ON "Measurement"("stackId", "itemKey", "measuredAt");

-- ?ÑÏãú ?åÏù¥Î∏???†ú
DROP TABLE IF EXISTS "temp_Customer_Migration";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CustomerOrganization_status_idx" ON "CustomerOrganization"("status");

-- CreateIndex
CREATE INDEX "CustomerOrganization_contractEndDate_idx" ON "CustomerOrganization"("contractEndDate");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerOrganization_customerId_organizationId_key" ON "CustomerOrganization"("customerId", "organizationId");

-- CreateIndex
CREATE INDEX "StackOrganization_status_idx" ON "StackOrganization"("status");

-- CreateIndex
CREATE UNIQUE INDEX "StackOrganization_stackId_organizationId_key" ON "StackOrganization"("stackId", "organizationId");

-- CreateIndex
CREATE INDEX "StackRequest_status_idx" ON "StackRequest"("status");

-- CreateIndex
CREATE INDEX "StackRequest_customerId_idx" ON "StackRequest"("customerId");

-- CreateIndex
CREATE INDEX "StackHistory_stackId_idx" ON "StackHistory"("stackId");

-- CreateIndex
CREATE INDEX "StackHistory_changedAt_idx" ON "StackHistory"("changedAt");

