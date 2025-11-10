CREATE TABLE "new_Item" (
    "key" TEXT PRIMARY KEY,
    "name" TEXT NOT NULL,
    "englishName" TEXT,
    "unit" TEXT NOT NULL,
    "limit" REAL NOT NULL,
    "category" TEXT,
    "hasLimit" BOOLEAN,
    "isActive" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Item" ("category", "englishName", "hasLimit", "key", "limit", "name", "unit") SELECT "category", "englishName", "hasLimit", "key", "limit", "name", "unit" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";

