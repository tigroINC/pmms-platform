-- DropIndex
DROP INDEX "Customer_code_key";

-- CreateIndex
CREATE INDEX "Customer_code_idx" ON "Customer"("code");

