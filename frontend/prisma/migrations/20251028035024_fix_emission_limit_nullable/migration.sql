-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmissionLimit" (
    "id" TEXT PRIMARY KEY,
    "itemKey" TEXT NOT NULL,
    "limit" REAL NOT NULL,
    "region" TEXT,
    "customerId" TEXT NOT NULL DEFAULT '',
    "stackId" TEXT NOT NULL DEFAULT '',
    "createdBy" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);
INSERT INTO "new_EmissionLimit" ("createdAt", "createdBy", "customerId", "id", "itemKey", "limit", "region", "stackId", "updatedAt") SELECT "createdAt", "createdBy", coalesce("customerId", '') AS "customerId", "id", "itemKey", "limit", "region", coalesce("stackId", '') AS "stackId", "updatedAt" FROM "EmissionLimit";
DROP TABLE "EmissionLimit";
ALTER TABLE "new_EmissionLimit" RENAME TO "EmissionLimit";
CREATE INDEX "EmissionLimit_itemKey_idx" ON "EmissionLimit"("itemKey");
CREATE INDEX "EmissionLimit_customerId_idx" ON "EmissionLimit"("customerId");
CREATE INDEX "EmissionLimit_stackId_idx" ON "EmissionLimit"("stackId");
CREATE UNIQUE INDEX "EmissionLimit_itemKey_customerId_stackId_key" ON "EmissionLimit"("itemKey", "customerId", "stackId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

