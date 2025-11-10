-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "businessNumber" TEXT,
    "corporateNumber" TEXT,
    "fullName" TEXT,
    "representative" TEXT,
    "siteType" TEXT,
    "address" TEXT,
    "businessType" TEXT,
    "industry" TEXT,
    "siteCategory" TEXT,
    "contractStartDate" TIMESTAMP,
    "contractEndDate" TIMESTAMP,
    "groupId" TEXT,
    "createdBy" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'CONNECTED',
    "draftCreatedBy" TEXT,
    "draftCreatedAt" TIMESTAMP,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "lastModifiedBy" TEXT,
    "lastModifiedAt" TIMESTAMP,
    "subscriptionPlan" TEXT NOT NULL DEFAULT 'FREE',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'TRIAL',
    "hideSubscriptionInfo" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "Customer_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CustomerGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Customer" ("address", "businessNumber", "businessType", "code", "contractEndDate", "contractStartDate", "corporateNumber", "createdAt", "createdBy", "draftCreatedAt", "draftCreatedBy", "fullName", "groupId", "id", "industry", "isActive", "isPublic", "isVerified", "lastModifiedAt", "lastModifiedBy", "name", "representative", "siteCategory", "siteType", "status", "updatedAt") SELECT "address", "businessNumber", "businessType", "code", "contractEndDate", "contractStartDate", "corporateNumber", "createdAt", "createdBy", "draftCreatedAt", "draftCreatedBy", "fullName", "groupId", "id", "industry", "isActive", "isPublic", "isVerified", "lastModifiedAt", "lastModifiedBy", "name", "representative", "siteCategory", "siteType", "status", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_businessNumber_key" ON "Customer"("businessNumber");
CREATE INDEX "Customer_code_idx" ON "Customer"("code");
CREATE INDEX "Customer_businessNumber_idx" ON "Customer"("businessNumber");
CREATE INDEX "Customer_groupId_idx" ON "Customer"("groupId");
CREATE INDEX "Customer_createdBy_idx" ON "Customer"("createdBy");
CREATE INDEX "Customer_status_idx" ON "Customer"("status");
CREATE INDEX "Customer_draftCreatedBy_idx" ON "Customer"("draftCreatedBy");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

