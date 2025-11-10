-- DropIndex
DROP INDEX "CustomerOrganization_customerId_organizationId_key";
-- CreateIndex
CREATE INDEX "CustomerOrganization_customerId_organizationId_idx" ON "CustomerOrganization"("customerId", "organizationId");

