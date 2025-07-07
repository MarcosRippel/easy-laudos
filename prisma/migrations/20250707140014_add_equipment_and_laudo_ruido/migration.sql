-- CreateTable
CREATE TABLE "Equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "certificateNumber" TEXT NOT NULL,
    "calibrationDate" DATETIME NOT NULL,
    "expirationDate" DATETIME NOT NULL,
    "equipmentType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LaudoRuido" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "laudoId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "aceleracao1" DECIMAL NOT NULL,
    "aceleracao2" DECIMAL NOT NULL,
    "aceleracao3" DECIMAL NOT NULL,
    "aceleracao4" DECIMAL NOT NULL,
    "aceleracao5" DECIMAL NOT NULL,
    "aceleracao6" DECIMAL NOT NULL,
    "marchaLenta1" DECIMAL NOT NULL,
    "marchaLenta2" DECIMAL NOT NULL,
    "marchaLenta3" DECIMAL NOT NULL,
    "marchaLenta4" DECIMAL NOT NULL,
    "marchaLenta5" DECIMAL NOT NULL,
    "marchaLenta6" DECIMAL NOT NULL,
    "medianaAceleracao" DECIMAL,
    "maxAceleracao" DECIMAL,
    "medianaMarchaLenta" DECIMAL,
    "maxMarchaLenta" DECIMAL,
    "resultado" TEXT NOT NULL,
    "inspetorResponsavel" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LaudoRuido_laudoId_fkey" FOREIGN KEY ("laudoId") REFERENCES "Laudo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LaudoRuido_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Equipment_certificateNumber_key" ON "Equipment"("certificateNumber");

-- CreateIndex
CREATE UNIQUE INDEX "LaudoRuido_laudoId_key" ON "LaudoRuido"("laudoId");
