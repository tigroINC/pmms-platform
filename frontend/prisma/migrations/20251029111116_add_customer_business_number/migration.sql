/*
  Warnings:

  - A unique constraint covering the columns `[businessNumber]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "businessNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_businessNumber_key" ON "Customer"("businessNumber");

-- CreateIndex
CREATE INDEX "Customer_businessNumber_idx" ON "Customer"("businessNumber");

