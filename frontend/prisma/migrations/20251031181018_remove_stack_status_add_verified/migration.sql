/*
  Warnings:

  - You are about to drop the column `confirmedAt` on the `Stack` table. All the data in the column will be lost.
  - You are about to drop the column `confirmedBy` on the `Stack` table. All the data in the column will be lost.
  - You are about to drop the column `draftCreatedAt` on the `Stack` table. All the data in the column will be lost.
  - You are about to drop the column `draftCreatedBy` on the `Stack` table. All the data in the column will be lost.
  - You are about to drop the column `rejectionReason` on the `Stack` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Stack` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP,
    "createdBy" TEXT NOT NULL DEFAULT 'SYSTEM',
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Stack_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Stack" ("category", "code", "coordinates", "createdAt", "customerId", "description", "diameter", "facilityType", "fullName", "height", "id", "isActive", "location", "name", "siteCode", "siteName", "updatedAt") SELECT "category", "code", "coordinates", "createdAt", "customerId", "description", "diameter", "facilityType", "fullName", "height", "id", "isActive", "location", "name", "siteCode", "siteName", "updatedAt" FROM "Stack";
DROP TABLE "Stack";
ALTER TABLE "new_Stack" RENAME TO "Stack";
CREATE INDEX "Stack_customerId_idx" ON "Stack"("customerId");
CREATE INDEX "Stack_isActive_idx" ON "Stack"("isActive");
CREATE INDEX "Stack_isVerified_idx" ON "Stack"("isVerified");
CREATE UNIQUE INDEX "Stack_customerId_siteCode_key" ON "Stack"("customerId", "siteCode");
CREATE UNIQUE INDEX "Stack_customerId_name_key" ON "Stack"("customerId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

