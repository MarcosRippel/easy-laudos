-- CreateTable
CREATE TABLE "LaudoPinoRei" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "laudoId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "dataValidadeInspecao" TEXT NOT NULL,
    "posicaoVertical" BOOLEAN NOT NULL,
    "presencaTrincas" BOOLEAN NOT NULL,
    "integridadeFixacao" BOOLEAN NOT NULL,
    "seloIdentificacao" BOOLEAN NOT NULL,
    "tipoFixacaoPino" TEXT NOT NULL,
    "diametroRegistrado" DECIMAL NOT NULL,
    "estadoConservacao" BOOLEAN NOT NULL,
    "resultadoPinoRei" TEXT NOT NULL,
    "tipoFixacaoMesa" TEXT NOT NULL,
    "mesaBemFixada" BOOLEAN NOT NULL,
    "mesaReparoSolda" BOOLEAN NOT NULL,
    "resultadoMesa" TEXT NOT NULL,
    "ensaioComplementar" BOOLEAN NOT NULL,
    "qualEnsaio" TEXT,
    "resultadoGeral" TEXT NOT NULL,
    "fotoChassiUrl" TEXT,
    "fotoPinoReiUrl" TEXT,
    "fotoMesaUrl" TEXT,
    "observacoes" TEXT,
    "normasAplicaveis" TEXT NOT NULL,
    "inspetorResponsavel" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LaudoPinoRei_laudoId_fkey" FOREIGN KEY ("laudoId") REFERENCES "Laudo" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LaudoPinoRei_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "LaudoPinoRei_laudoId_key" ON "LaudoPinoRei"("laudoId");
