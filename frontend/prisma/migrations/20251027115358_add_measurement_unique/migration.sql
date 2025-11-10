/*
  Warnings:

  - A unique constraint covering the columns `[stackId,itemKey,measuredAt]` on the table `Measurement` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Measurement_stackId_itemKey_measuredAt_key" ON "Measurement"("stackId", "itemKey", "measuredAt");

