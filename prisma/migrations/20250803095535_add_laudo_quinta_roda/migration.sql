-- CreateTable
CREATE TABLE "LaudoQuintaRoda" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "laudoId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "dataValidadeInspecao" TEXT NOT NULL,
    "fabricanteMarca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "numeroIdentificacao" TEXT NOT NULL,
    "seloIdentificacao" BOOLEAN NOT NULL,
    "presencaTrincas" BOOLEAN NOT NULL,
    "integraFixada" BOOLEAN NOT NULL,
    "pinosIntegros" BOOLEAN NOT NULL,
    "mancaisOvalados" BOOLEAN NOT NULL,
    "mecanismoTravamento" BOOLEAN NOT NULL,
    "pinosPressos" BOOLEAN NOT NULL,
    "desgastesCanais" BOOLEAN NOT NULL,
    "apoiosSapatas" BOOLEAN NOT NULL,
    "cantoneirasFixadas" BOOLEAN NOT NULL,
    "aterramentoFixado" BOOLEAN NOT NULL,
    "ensaioComplementar" BOOLEAN NOT NULL,
    "resultadoFinal" TEXT NOT NULL,
    "fotoQuintaRodaUrl" TEXT,
    "observacoes" TEXT,
    "normasAplicaveis" TEXT NOT NULL,
    "inspetorResponsavel" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LaudoQuintaRoda_laudoId_fkey" FOREIGN KEY ("laudoId") REFERENCES "Laudo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LaudoQuintaRoda_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "LaudoQuintaRoda_laudoId_key" ON "LaudoQuintaRoda"("laudoId");
