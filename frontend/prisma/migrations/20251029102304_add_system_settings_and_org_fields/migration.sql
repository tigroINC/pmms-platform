-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "corporateNumber" TEXT;
ALTER TABLE "Organization" ADD COLUMN "establishedDate" DATETIME;
ALTER TABLE "Organization" ADD COLUMN "fax" TEXT;
ALTER TABLE "Organization" ADD COLUMN "representative" TEXT;
ALTER TABLE "Organization" ADD COLUMN "website" TEXT;

-- CreateTable
CREATE TABLE "SystemSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SystemSettings_key_key" ON "SystemSettings"("key");

-- CreateIndex
CREATE INDEX "SystemSettings_category_idx" ON "SystemSettings"("category");

-- CreateIndex
CREATE INDEX "SystemSettings_key_idx" ON "SystemSettings"("key");
