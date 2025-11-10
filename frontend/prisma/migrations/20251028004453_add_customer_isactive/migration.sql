CREATE TABLE "new_Customer" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "fullName" TEXT,
    "siteType" TEXT,
    "address" TEXT,
    "industry" TEXT,
    "siteCategory" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);
INSERT INTO "new_Customer" ("address", "code", "createdAt", "fullName", "id", "industry", "name", "siteCategory", "siteType", "updatedAt") SELECT "address", "code", "createdAt", "fullName", "id", "industry", "name", "siteCategory", "siteType", "updatedAt" FROM "Customer";
DROP TABLE "Customer";
ALTER TABLE "new_Customer" RENAME TO "Customer";
CREATE UNIQUE INDEX "Customer_name_key" ON "Customer"("name");
CREATE UNIQUE INDEX "Customer_code_key" ON "Customer"("code");

