CREATE TABLE "new_Organization" (
    "id" TEXT PRIMARY KEY,
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
    "establishedDate" TIMESTAMP,
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
    "hasContractManagement" BOOLEAN NOT NULL DEFAULT false,
    "hideSubscriptionInfo" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);
INSERT INTO "new_Organization" ("address", "billingContact", "billingEmail", "businessNumber", "businessType", "corporateNumber", "createdAt", "email", "establishedDate", "fax", "hasContractManagement", "id", "isActive", "lastPaymentAt", "maxDataRetention", "maxStacks", "maxUsers", "name", "nextBillingAt", "phone", "representative", "subscriptionEndAt", "subscriptionPlan", "subscriptionStartAt", "subscriptionStatus", "updatedAt", "website") SELECT "address", "billingContact", "billingEmail", "businessNumber", "businessType", "corporateNumber", "createdAt", "email", "establishedDate", "fax", "hasContractManagement", "id", "isActive", "lastPaymentAt", "maxDataRetention", "maxStacks", "maxUsers", "name", "nextBillingAt", "phone", "representative", "subscriptionEndAt", "subscriptionPlan", "subscriptionStartAt", "subscriptionStatus", "updatedAt", "website" FROM "Organization";
DROP TABLE "Organization";
ALTER TABLE "new_Organization" RENAME TO "Organization";
CREATE UNIQUE INDEX "Organization_businessNumber_key" ON "Organization"("businessNumber");
CREATE INDEX "Organization_businessNumber_idx" ON "Organization"("businessNumber");
CREATE INDEX "Organization_subscriptionStatus_idx" ON "Organization"("subscriptionStatus");

