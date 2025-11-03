-- CreateTable
CREATE TABLE "EmissionLimit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemKey" TEXT NOT NULL,
    "limit" REAL NOT NULL,
    "region" TEXT,
    "customerId" TEXT,
    "stackId" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "EmissionLimit_itemKey_idx" ON "EmissionLimit"("itemKey");

-- CreateIndex
CREATE INDEX "EmissionLimit_customerId_idx" ON "EmissionLimit"("customerId");

-- CreateIndex
CREATE INDEX "EmissionLimit_stackId_idx" ON "EmissionLimit"("stackId");

-- CreateIndex
CREATE UNIQUE INDEX "EmissionLimit_itemKey_customerId_stackId_key" ON "EmissionLimit"("itemKey", "customerId", "stackId");
