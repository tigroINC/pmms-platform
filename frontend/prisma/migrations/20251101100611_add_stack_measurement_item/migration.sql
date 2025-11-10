-- CreateTable
CREATE TABLE "StackMeasurementItem" (
    "id" TEXT PRIMARY KEY,
    "stackId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "StackMeasurementItem_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StackMeasurementItem_itemKey_fkey" FOREIGN KEY ("itemKey") REFERENCES "Item" ("key") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "StackMeasurementItem_stackId_idx" ON "StackMeasurementItem"("stackId");

-- CreateIndex
CREATE INDEX "StackMeasurementItem_itemKey_idx" ON "StackMeasurementItem"("itemKey");

-- CreateIndex
CREATE UNIQUE INDEX "StackMeasurementItem_stackId_itemKey_key" ON "StackMeasurementItem"("stackId", "itemKey");

