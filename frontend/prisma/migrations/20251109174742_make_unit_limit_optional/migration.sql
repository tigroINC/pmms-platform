-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "englishName" TEXT,
    "unit" TEXT,
    "limit" REAL,
    "category" TEXT,
    "classification" TEXT,
    "analysisMethod" TEXT,
    "hasLimit" BOOLEAN,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "inputType" TEXT DEFAULT 'number',
    "options" TEXT
);
INSERT INTO "new_Item" ("analysisMethod", "category", "classification", "englishName", "hasLimit", "inputType", "isActive", "key", "limit", "name", "options", "order", "unit") SELECT "analysisMethod", "category", "classification", "englishName", "hasLimit", "inputType", "isActive", "key", "limit", "name", "options", "order", "unit" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
