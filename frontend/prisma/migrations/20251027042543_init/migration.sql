/*
  Warnings:
  - A unique constraint covering the columns `[code]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "code" TEXT;
-- AlterTable
ALTER TABLE "Item" ADD COLUMN "category" TEXT;
ALTER TABLE "Item" ADD COLUMN "englishName" TEXT;
ALTER TABLE "Item" ADD COLUMN "hasLimit" BOOLEAN;
-- AlterTable
ALTER TABLE "Measurement" ADD COLUMN "flowSm3Min" REAL;
ALTER TABLE "Measurement" ADD COLUMN "gasTempC" REAL;
ALTER TABLE "Measurement" ADD COLUMN "gasVelocityMs" REAL;
ALTER TABLE "Measurement" ADD COLUMN "humidityPct" REAL;
ALTER TABLE "Measurement" ADD COLUMN "limitAtMeasure" REAL;
ALTER TABLE "Measurement" ADD COLUMN "limitCheck" TEXT;
ALTER TABLE "Measurement" ADD COLUMN "measuringCompany" TEXT;
ALTER TABLE "Measurement" ADD COLUMN "moisturePct" REAL;
ALTER TABLE "Measurement" ADD COLUMN "oxygenMeasuredPct" REAL;
ALTER TABLE "Measurement" ADD COLUMN "oxygenStdPct" REAL;
ALTER TABLE "Measurement" ADD COLUMN "pressureMmHg" REAL;
ALTER TABLE "Measurement" ADD COLUMN "temperatureC" REAL;
ALTER TABLE "Measurement" ADD COLUMN "weather" TEXT;
ALTER TABLE "Measurement" ADD COLUMN "windDirection" TEXT;
ALTER TABLE "Measurement" ADD COLUMN "windSpeedMs" REAL;
-- AlterTable
ALTER TABLE "Stack" ADD COLUMN "category" TEXT;
ALTER TABLE "Stack" ADD COLUMN "code" TEXT;
ALTER TABLE "Stack" ADD COLUMN "diameter" REAL;
ALTER TABLE "Stack" ADD COLUMN "facilityType" TEXT;
ALTER TABLE "Stack" ADD COLUMN "fullName" TEXT;
ALTER TABLE "Stack" ADD COLUMN "height" REAL;
-- CreateTable
CREATE TABLE "StackAlias" (
    "id" TEXT PRIMARY KEY,
    "stackId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "type" TEXT,
    CONSTRAINT "StackAlias_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- CreateTable
CREATE TABLE "ItemLimitHistory" (
    "id" TEXT PRIMARY KEY,
    "itemKey" TEXT NOT NULL,
    "limit" REAL NOT NULL,
    "effectiveFrom" TIMESTAMP,
    "effectiveTo" TIMESTAMP,
    "source" TEXT,
    CONSTRAINT "ItemLimitHistory_itemKey_fkey" FOREIGN KEY ("itemKey") REFERENCES "Item" ("key") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- CreateTable
CREATE TABLE "StagingMeasurementRaw" (
    "id" TEXT PRIMARY KEY,
    "sourceFile" TEXT NOT NULL,
    "rowNo" INTEGER NOT NULL,
    "rawJson" TEXT NOT NULL,
    "ingestedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- CreateIndex
CREATE INDEX "StackAlias_alias_idx" ON "StackAlias"("alias");
-- CreateIndex
CREATE UNIQUE INDEX "StackAlias_stackId_alias_key" ON "StackAlias"("stackId", "alias");
-- CreateIndex
CREATE INDEX "ItemLimitHistory_itemKey_idx" ON "ItemLimitHistory"("itemKey");
-- CreateIndex
CREATE INDEX "StagingMeasurementRaw_sourceFile_rowNo_idx" ON "StagingMeasurementRaw"("sourceFile", "rowNo");
-- CreateIndex
CREATE UNIQUE INDEX "Customer_code_key" ON "Customer"("code");
-- CreateIndex
CREATE INDEX "Measurement_customerId_stackId_measuredAt_idx" ON "Measurement"("customerId", "stackId", "measuredAt");
-- CreateIndex
CREATE INDEX "Measurement_itemKey_measuredAt_idx" ON "Measurement"("itemKey", "measuredAt");

