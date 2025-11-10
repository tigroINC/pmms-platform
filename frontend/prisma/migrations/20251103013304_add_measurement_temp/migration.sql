-- CreateTable
CREATE TABLE "MeasurementTemp" (
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
    "updatedAt" TIMESTAMP NOT NULL
);
-- CreateIndex
CREATE UNIQUE INDEX "MeasurementTemp_tempId_key" ON "MeasurementTemp"("tempId");
-- CreateIndex
CREATE INDEX "MeasurementTemp_createdAt_idx" ON "MeasurementTemp"("createdAt");
-- CreateIndex
CREATE INDEX "MeasurementTemp_createdBy_idx" ON "MeasurementTemp"("createdBy");
-- CreateIndex
CREATE INDEX "MeasurementTemp_customerId_idx" ON "MeasurementTemp"("customerId");
-- CreateIndex
CREATE INDEX "MeasurementTemp_stackId_idx" ON "MeasurementTemp"("stackId");
-- CreateIndex
CREATE INDEX "MeasurementTemp_status_idx" ON "MeasurementTemp"("status");
-- CreateIndex
CREATE INDEX "MeasurementTemp_tempId_idx" ON "MeasurementTemp"("tempId");

