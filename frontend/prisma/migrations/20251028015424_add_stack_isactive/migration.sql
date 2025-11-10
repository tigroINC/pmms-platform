CREATE TABLE "new_Stack" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "fullName" TEXT,
    "facilityType" TEXT,
    "height" REAL,
    "diameter" REAL,
    "category" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "customerId" TEXT NOT NULL,
    CONSTRAINT "Stack_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Stack" ("category", "code", "customerId", "diameter", "facilityType", "fullName", "height", "id", "name") SELECT "category", "code", "customerId", "diameter", "facilityType", "fullName", "height", "id", "name" FROM "Stack";
DROP TABLE "Stack";
ALTER TABLE "new_Stack" RENAME TO "Stack";
CREATE UNIQUE INDEX "Stack_customerId_name_key" ON "Stack"("customerId", "name");

