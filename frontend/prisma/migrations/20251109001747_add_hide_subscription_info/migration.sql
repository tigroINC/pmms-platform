-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "businessNumber" TEXT,
    "corporateNumber" TEXT,
    "businessType" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "representative" TEXT,
    "website" TEXT,
    "fax" TEXT,
    "establishedDate" DATETIME,
    "subscriptionPlan" TEXT NOT NULL DEFAULT 'FREE',
    "subscriptionStatus" TEXT NOT NULL DEFAULT 'TRIAL',
    "subscriptionStartAt" DATETIME,
    "subscriptionEndAt" DATETIME,
    "maxUsers" INTEGER NOT NULL DEFAULT 1,
    "maxStacks" INTEGER NOT NULL DEFAULT 5,
    "maxDataRetention" INTEGER NOT NULL DEFAULT 365,
    "billingEmail" TEXT,
    "billingContact" TEXT,
    "lastPaymentAt" DATETIME,
    "nextBillingAt" DATETIME,
    "hasContractManagement" BOOLEAN NOT NULL DEFAULT false,
    "hideSubscriptionInfo" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Organization" ("address", "billingContact", "billingEmail", "businessNumber", "businessType", "corporateNumber", "createdAt", "email", "establishedDate", "fax", "hasContractManagement", "id", "isActive", "lastPaymentAt", "maxDataRetention", "maxStacks", "maxUsers", "name", "nextBillingAt", "phone", "representative", "subscriptionEndAt", "subscriptionPlan", "subscriptionStartAt", "subscriptionStatus", "updatedAt", "website") SELECT "address", "billingContact", "billingEmail", "businessNumber", "businessType", "corporateNumber", "createdAt", "email", "establishedDate", "fax", "hasContractManagement", "id", "isActive", "lastPaymentAt", "maxDataRetention", "maxStacks", "maxUsers", "name", "nextBillingAt", "phone", "representative", "subscriptionEndAt", "subscriptionPlan", "subscriptionStartAt", "subscriptionStatus", "updatedAt", "website" FROM "Organization";
DROP TABLE "Organization";
ALTER TABLE "new_Organization" RENAME TO "Organization";
CREATE UNIQUE INDEX "Organization_businessNumber_key" ON "Organization"("businessNumber");
CREATE INDEX "Organization_businessNumber_idx" ON "Organization"("businessNumber");
CREATE INDEX "Organization_subscriptionStatus_idx" ON "Organization"("subscriptionStatus");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
