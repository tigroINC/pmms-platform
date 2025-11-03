-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "englishName" TEXT,
    "unit" TEXT NOT NULL,
    "limit" REAL NOT NULL,
    "category" TEXT,
    "hasLimit" BOOLEAN,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_Item" ("category", "englishName", "hasLimit", "isActive", "key", "limit", "name", "unit") SELECT "category", "englishName", "hasLimit", "isActive", "key", "limit", "name", "unit" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
