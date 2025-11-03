-- CreateTable
CREATE TABLE "MeasurementTemp" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tempId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "stackId" TEXT NOT NULL,
    "measurementDate" DATETIME NOT NULL,
    "measurements" TEXT NOT NULL,
    "auxiliaryData" TEXT,
    "status" TEXT NOT NULL DEFAULT '임시저장',
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
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
