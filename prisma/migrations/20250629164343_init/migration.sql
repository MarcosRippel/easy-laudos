-- CreateTable
CREATE TABLE "AdminSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyName" TEXT,
    "companyTaxId" TEXT,
    "companyAddress" TEXT,
    "companyPhone" TEXT,
    "companyLogoUrl" TEXT,
    "reportTitle" TEXT NOT NULL DEFAULT 'LAUDO DE INSPEÇÃO TÉCNICA',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Client" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "placa" TEXT NOT NULL,
    "especieTipo" TEXT,
    "marcaModelo" TEXT,
    "numeroChassi" TEXT NOT NULL,
    "anoFabricacaoModelo" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Laudo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codTemporal" TEXT,
    "ordemServico" TEXT NOT NULL,
    "dataEmissao" DATETIME NOT NULL,
    "clientId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "fabricanteEquipamento" TEXT DEFAULT 'N.A',
    "mesAnoFabricEquip" TEXT DEFAULT 'N.A',
    "diametroPinoRei" TEXT DEFAULT 'N.A',
    "dataVerifPinoRei" TEXT,
    "fotoDianteiraUrl" TEXT,
    "fotoTraseiraUrl" TEXT,
    "fotoChassiUrl" TEXT,
    "observacoes" TEXT,
    "laudoType" TEXT NOT NULL,
    "dataVencimento" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Laudo_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Laudo_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_cnpj_key" ON "Client"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_placa_key" ON "Vehicle"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_numeroChassi_key" ON "Vehicle"("numeroChassi");

-- CreateIndex
CREATE UNIQUE INDEX "Laudo_ordemServico_key" ON "Laudo"("ordemServico");
