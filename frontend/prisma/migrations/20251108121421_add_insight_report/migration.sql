-- AlterTable
ALTER TABLE "Item" ADD COLUMN "analysisMethod" TEXT;
ALTER TABLE "Item" ADD COLUMN "inputType" TEXT DEFAULT 'number';
ALTER TABLE "Item" ADD COLUMN "options" TEXT;

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT PRIMARY KEY,
    "version" INTEGER NOT NULL DEFAULT 1,
    "parentId" TEXT,
    "customerId" TEXT NOT NULL,
    "stackId" TEXT NOT NULL,
    "measuredAt" TIMESTAMP NOT NULL,
    "companyName" TEXT NOT NULL,
    "address" TEXT,
    "representative" TEXT,
    "environmentalTech" TEXT,
    "industry" TEXT,
    "facilityType" TEXT,
    "siteCategory" TEXT,
    "purpose" TEXT,
    "stackName" TEXT NOT NULL,
    "stackHeight" REAL,
    "stackDiameter" REAL,
    "stackType" TEXT,
    "requestedItems" TEXT,
    "weather" TEXT,
    "temp" REAL,
    "humidity" REAL,
    "pressure" REAL,
    "windDir" TEXT,
    "wind" REAL,
    "o2Standard" REAL,
    "o2Measured" REAL,
    "flow" REAL,
    "flowCorrected" REAL,
    "moisture" REAL,
    "gasTemp" REAL,
    "gasVel" REAL,
    "gasNote" TEXT,
    "samplingDate" TIMESTAMP NOT NULL,
    "samplingStart" TEXT,
    "samplingEnd" TEXT,
    "sampler" TEXT,
    "sampler2" TEXT,
    "measurements" TEXT NOT NULL,
    "analysisStart" TEXT,
    "analysisEnd" TEXT,
    "analyst" TEXT,
    "chiefTech" TEXT,
    "opinion" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "Report_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Report_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Report_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReportTemplate" (
    "id" TEXT PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "environmentalTech" TEXT,
    "chiefTech" TEXT,
    "analyst" TEXT,
    "sampler" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "ReportTemplate_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "communications" (
    "id" TEXT PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "measurementId" TEXT,
    "stackId" TEXT,
    "contactAt" TIMESTAMP NOT NULL,
    "channel" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "contactPerson" TEXT,
    "contactOrg" TEXT,
    "isShared" BOOLEAN NOT NULL DEFAULT true,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP,
    "deletedById" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "communications_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "communications_measurementId_fkey" FOREIGN KEY ("measurementId") REFERENCES "Measurement" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "communications_stackId_fkey" FOREIGN KEY ("stackId") REFERENCES "Stack" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "communications_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "communications_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "communication_attachments" (
    "id" TEXT PRIMARY KEY,
    "communicationId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalFilename" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "communication_attachments_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "communications" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "communication_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "communication_replies" (
    "id" TEXT PRIMARY KEY,
    "communicationId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "communication_replies_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "communications" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "communication_replies_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "communication_notes" (
    "id" TEXT PRIMARY KEY,
    "communicationId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "organizationId" TEXT,
    "customerId" TEXT,
    "mentionedUserId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "communication_notes_communicationId_fkey" FOREIGN KEY ("communicationId") REFERENCES "communications" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "communication_notes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "communication_notes_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "communication_notes_mentionedUserId_fkey" FOREIGN KEY ("mentionedUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "communication_notes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "communication_templates" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "channel" TEXT,
    "category" TEXT,
    "organizationId" TEXT,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "communication_templates_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "communication_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "insight_reports" (
    "id" TEXT PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "itemName" TEXT NOT NULL,
    "periods" INTEGER NOT NULL,
    "reportData" TEXT NOT NULL,
    "chartImage" TEXT,
    "pdfBase64" TEXT NOT NULL,
    "sharedAt" TIMESTAMP,
    "sharedBy" TEXT,
    "viewedAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT NOT NULL,
    CONSTRAINT "insight_reports_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "insight_reports_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "insight_reports_sharedBy_fkey" FOREIGN KEY ("sharedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Customer" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "businessNumber" TEXT,
    "corporateNumber" TEXT,
    "fullName" TEXT,
    "representative" TEXT,
    "siteType" TEXT,
    "address" TEXT,
    "businessType" TEXT,
    "industry" TEXT,
    "siteCategory" TEXT,
    "contractStartDate" TIMESTAMP,
    "contractEndDate" TIMESTAMP,
    "groupId" TEXT,
    "createdBy" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'CONNECTED',
    "draftCreatedBy" TEXT,
    "draftCreatedAt" TIMESTAMP,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "lastModifiedBy" TEXT,
    "lastModifiedAt" TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "Customer_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "CustomerGroup" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Customer" ("address", "businessNumber", "code", "contractEndDate", "contractStartDate", "createdAt", "createdBy", "draftCreatedAt", "draftCreatedBy", "fullName", "groupId", "id", "industry", "isActive", "isPublic", "name", "siteCategory", "siteType", "status", "updatedAt") SELECT "address", "businessNumber", "code", "contractEndDate", "contractStartDate", "createdAt", "createdBy", "draftCreatedAt", "draftCreatedBy", "fullName", "groupId", "id", "industry", "isActive", "isPublic", "name", "siteCategory", "siteType", "status", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_businessNumber_key" ON "Customer"("businessNumber");
CREATE INDEX "Customer_code_idx" ON "Customer"("code");
CREATE INDEX "Customer_businessNumber_idx" ON "Customer"("businessNumber");
CREATE INDEX "Customer_groupId_idx" ON "Customer"("groupId");
CREATE INDEX "Customer_createdBy_idx" ON "Customer"("createdBy");
CREATE INDEX "Customer_status_idx" ON "Customer"("status");
CREATE INDEX "Customer_draftCreatedBy_idx" ON "Customer"("draftCreatedBy");
CREATE TABLE "new_CustomerOrganization" (
    "id" TEXT PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedBy" TEXT NOT NULL,
    "contractStartDate" TIMESTAMP,
    "contractEndDate" TIMESTAMP,
    "customCode" TEXT,
    "nickname" TEXT,
    "notified30Days" BOOLEAN NOT NULL DEFAULT false,
    "notified21Days" BOOLEAN NOT NULL DEFAULT false,
    "notified14Days" BOOLEAN NOT NULL DEFAULT false,
    "notified7Days" BOOLEAN NOT NULL DEFAULT false,
    "notifiedExpiry" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    "approvedAt" TIMESTAMP,
    "approvedBy" TEXT,
    CONSTRAINT "CustomerOrganization_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomerOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CustomerOrganization" ("approvedAt", "approvedBy", "contractEndDate", "contractStartDate", "createdAt", "customCode", "customerId", "id", "isActive", "nickname", "notified30Days", "notified7Days", "notifiedExpiry", "organizationId", "requestedBy", "status", "updatedAt") SELECT "approvedAt", "approvedBy", "contractEndDate", "contractStartDate", "createdAt", "customCode", "customerId", "id", "isActive", "nickname", "notified30Days", "notified7Days", "notifiedExpiry", "organizationId", "requestedBy", "status", "updatedAt" FROM "CustomerOrganization";
DROP TABLE "CustomerOrganization";
ALTER TABLE "new_CustomerOrganization" RENAME TO "CustomerOrganization";
CREATE INDEX "CustomerOrganization_status_idx" ON "CustomerOrganization"("status");
CREATE INDEX "CustomerOrganization_contractEndDate_idx" ON "CustomerOrganization"("contractEndDate");
CREATE UNIQUE INDEX "CustomerOrganization_customerId_organizationId_key" ON "CustomerOrganization"("customerId", "organizationId");
CREATE TABLE "new_EmissionLimit" (
    "id" TEXT PRIMARY KEY,
    "itemKey" TEXT NOT NULL,
    "limit" REAL NOT NULL,
    "region" TEXT,
    "customerId" TEXT NOT NULL DEFAULT '',
    "stackId" TEXT NOT NULL DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);
INSERT INTO "new_EmissionLimit" ("createdAt", "createdBy", "customerId", "id", "itemKey", "limit", "region", "stackId", "updatedAt") SELECT "createdAt", "createdBy", "customerId", "id", "itemKey", "limit", "region", "stackId", "updatedAt" FROM "EmissionLimit";
DROP TABLE "EmissionLimit";
ALTER TABLE "new_EmissionLimit" RENAME TO "EmissionLimit";
CREATE INDEX "EmissionLimit_itemKey_idx" ON "EmissionLimit"("itemKey");
CREATE INDEX "EmissionLimit_customerId_idx" ON "EmissionLimit"("customerId");
CREATE INDEX "EmissionLimit_stackId_idx" ON "EmissionLimit"("stackId");
CREATE UNIQUE INDEX "EmissionLimit_itemKey_customerId_stackId_key" ON "EmissionLimit"("itemKey", "customerId", "stackId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Report_customerId_stackId_measuredAt_idx" ON "Report"("customerId", "stackId", "measuredAt");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_createdBy_idx" ON "Report"("createdBy");

-- CreateIndex
CREATE UNIQUE INDEX "ReportTemplate_customerId_key" ON "ReportTemplate"("customerId");

-- CreateIndex
CREATE INDEX "communications_customerId_status_contactAt_idx" ON "communications"("customerId", "status", "contactAt" DESC);

-- CreateIndex
CREATE INDEX "communications_assignedToId_status_isDeleted_idx" ON "communications"("assignedToId", "status", "isDeleted");

-- CreateIndex
CREATE INDEX "communications_createdById_isDeleted_idx" ON "communications"("createdById", "isDeleted");

-- CreateIndex
CREATE INDEX "communications_isDeleted_contactAt_idx" ON "communications"("isDeleted", "contactAt" DESC);

-- CreateIndex
CREATE INDEX "communication_attachments_communicationId_idx" ON "communication_attachments"("communicationId");

-- CreateIndex
CREATE INDEX "communication_replies_communicationId_createdAt_idx" ON "communication_replies"("communicationId", "createdAt");

-- CreateIndex
CREATE INDEX "communication_notes_communicationId_idx" ON "communication_notes"("communicationId");

-- CreateIndex
CREATE INDEX "communication_notes_organizationId_idx" ON "communication_notes"("organizationId");

-- CreateIndex
CREATE INDEX "communication_notes_customerId_idx" ON "communication_notes"("customerId");

-- CreateIndex
CREATE INDEX "communication_notes_mentionedUserId_idx" ON "communication_notes"("mentionedUserId");

-- CreateIndex
CREATE INDEX "communication_templates_organizationId_isShared_category_idx" ON "communication_templates"("organizationId", "isShared", "category");

-- CreateIndex
CREATE INDEX "communication_templates_usageCount_idx" ON "communication_templates"("usageCount" DESC);

-- CreateIndex
CREATE INDEX "insight_reports_customerId_itemKey_createdAt_idx" ON "insight_reports"("customerId", "itemKey", "createdAt");

-- CreateIndex
CREATE INDEX "insight_reports_customerId_sharedAt_idx" ON "insight_reports"("customerId", "sharedAt");

