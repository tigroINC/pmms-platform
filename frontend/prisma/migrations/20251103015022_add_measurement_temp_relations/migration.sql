CREATE TABLE "new_MeasurementTemp" (
    "id" TEXT PRIMARY KEY,
    "tempId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "stackId" TEXT NOT NULL,
    "measurementDate" TIMESTAMP NOT NULL,
    "measurements" TEXT NOT NULL,
    "auxiliaryData" TEXT,
    "status" TEXT NOT NULL DEFAULT '?„ì‹œ?€??,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "MeasurementTemp_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "MeasurementTemp_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_MeasurementTemp" ("auxiliaryData", "createdAt", "createdBy", "customerId", "id", "measurementDate", "measurements", "stackId", "status", "tempId", "updatedAt") SELECT "auxiliaryData", "createdAt", "createdBy", "customerId", "id", "measurementDate", "measurements", "stackId", "status", "tempId", "updatedAt" FROM "MeasurementTemp";
DROP TABLE "MeasurementTemp";
ALTER TABLE "new_MeasurementTemp" RENAME TO "MeasurementTemp";
CREATE UNIQUE INDEX "MeasurementTemp_tempId_key" ON "MeasurementTemp"("tempId");
CREATE INDEX "MeasurementTemp_createdAt_idx" ON "MeasurementTemp"("createdAt");
CREATE INDEX "MeasurementTemp_createdBy_idx" ON "MeasurementTemp"("createdBy");
CREATE INDEX "MeasurementTemp_customerId_idx" ON "MeasurementTemp"("customerId");
CREATE INDEX "MeasurementTemp_stackId_idx" ON "MeasurementTemp"("stackId");
CREATE INDEX "MeasurementTemp_status_idx" ON "MeasurementTemp"("status");
CREATE INDEX "MeasurementTemp_tempId_idx" ON "MeasurementTemp"("tempId");

