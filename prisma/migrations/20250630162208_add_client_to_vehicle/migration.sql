/*
  Warnings:

  - Added the required column `clientId` to the `Vehicle` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "placa" TEXT NOT NULL,
    "especieTipo" TEXT,
    "marcaModelo" TEXT,
    "numeroChassi" TEXT NOT NULL,
    "anoFabricacaoModelo" TEXT,
    "clientId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vehicle_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
-- Atribuir o primeiro cliente disponível aos veículos existentes
INSERT INTO "new_Vehicle" ("anoFabricacaoModelo", "createdAt", "especieTipo", "id", "marcaModelo", "numeroChassi", "placa", "updatedAt", "clientId")
SELECT "anoFabricacaoModelo", "createdAt", "especieTipo", "id", "marcaModelo", "numeroChassi", "placa", "updatedAt",
       (SELECT "id" FROM "Client" LIMIT 1) as "clientId"
FROM "Vehicle";
DROP TABLE "Vehicle";
ALTER TABLE "new_Vehicle" RENAME TO "Vehicle";
CREATE UNIQUE INDEX "Vehicle_placa_key" ON "Vehicle"("placa");
CREATE UNIQUE INDEX "Vehicle_numeroChassi_key" ON "Vehicle"("numeroChassi");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
