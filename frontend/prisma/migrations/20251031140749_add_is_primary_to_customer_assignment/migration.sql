-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CustomerAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedBy" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomerAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CustomerAssignment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CustomerAssignment" ("assignedAt", "assignedBy", "customerId", "id", "userId") SELECT "assignedAt", "assignedBy", "customerId", "id", "userId" FROM "CustomerAssignment";
DROP TABLE "CustomerAssignment";
ALTER TABLE "new_CustomerAssignment" RENAME TO "CustomerAssignment";
CREATE INDEX "CustomerAssignment_userId_idx" ON "CustomerAssignment"("userId");
CREATE INDEX "CustomerAssignment_customerId_idx" ON "CustomerAssignment"("customerId");
CREATE UNIQUE INDEX "CustomerAssignment_userId_customerId_key" ON "CustomerAssignment"("userId", "customerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
