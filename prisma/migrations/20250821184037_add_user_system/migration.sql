-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AdminSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT,
    "companyTaxId" TEXT,
    "companyAddress" TEXT,
    "companyPhone" TEXT,
    "companyLogoUrl" TEXT,
    "reportTitle" TEXT NOT NULL DEFAULT 'LAUDO DE INSPEÇÃO TÉCNICA',
    "userId" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdminSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AdminSetting" ("companyAddress", "companyLogoUrl", "companyName", "companyPhone", "companyTaxId", "id", "reportTitle", "updatedAt") SELECT "companyAddress", "companyLogoUrl", "companyName", "companyPhone", "companyTaxId", "id", "reportTitle", "updatedAt" FROM "AdminSetting";
DROP TABLE "AdminSetting";
ALTER TABLE "new_AdminSetting" RENAME TO "AdminSetting";
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cnpj" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "addressStreet" TEXT,
    "addressNumber" TEXT,
    "addressCity" TEXT,
    "addressState" TEXT,
    "addressZip" TEXT,
    "addressDistrict" TEXT,
    "phone" TEXT,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Client" ("addressCity", "addressDistrict", "addressNumber", "addressState", "addressStreet", "addressZip", "cnpj", "createdAt", "id", "name", "phone", "updatedAt") SELECT "addressCity", "addressDistrict", "addressNumber", "addressState", "addressStreet", "addressZip", "cnpj", "createdAt", "id", "name", "phone", "updatedAt" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE UNIQUE INDEX "Client_cnpj_userId_key" ON "Client"("cnpj", "userId");
CREATE TABLE "new_Equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "calibrationDate" DATETIME NOT NULL,
    "expirationDate" DATETIME NOT NULL,
    "equipmentType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Equipment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Equipment" ("calibrationDate", "certificateNumber", "createdAt", "equipmentType", "expirationDate", "id", "isActive", "model", "name", "updatedAt") SELECT "calibrationDate", "certificateNumber", "createdAt", "equipmentType", "expirationDate", "id", "isActive", "model", "name", "updatedAt" FROM "Equipment";
DROP TABLE "Equipment";
ALTER TABLE "new_Equipment" RENAME TO "Equipment";
CREATE UNIQUE INDEX "Equipment_certificateNumber_userId_key" ON "Equipment"("certificateNumber", "userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
