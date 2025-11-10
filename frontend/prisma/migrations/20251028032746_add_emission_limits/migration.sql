-- CreateTable
CREATE TABLE "EmissionLimit" (
    "id" TEXT PRIMARY KEY,
    "itemKey" TEXT NOT NULL,
    "limit" REAL NOT NULL,
    "region" TEXT,
    "customerId" TEXT,
    "stackId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);

-- CreateIndex
CREATE INDEX "EmissionLimit_itemKey_idx" ON "EmissionLimit"("itemKey");

-- CreateIndex
CREATE INDEX "EmissionLimit_customerId_idx" ON "EmissionLimit"("customerId");

-- CreateIndex
CREATE INDEX "EmissionLimit_stackId_idx" ON "EmissionLimit"("stackId");

-- CreateIndex
CREATE UNIQUE INDEX "EmissionLimit_itemKey_customerId_stackId_key" ON "EmissionLimit"("itemKey", "customerId", "stackId");

