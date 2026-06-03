// scripts/seed-test-data.ts
// Execute com: npx ts-node --project tsconfig.json -e "require('./scripts/seed-test-data.ts')"
// ou: npx tsx scripts/seed-test-data.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Iniciando seed de dados de teste...');

    // Criar cliente de teste
    const existingClient = await prisma.client.findFirst({
        where: { cnpj: '00.000.000/0001-00' }
    });

    let testClient;
    if (existingClient) {
        console.log('✅ Cliente de teste já existe:', existingClient.id, '-', existingClient.name);
        testClient = existingClient;
    } else {
        testClient = await prisma.client.create({
            data: {
                cnpj: '00.000.000/0001-00',
                name: 'CLIENTE TESTE - SISTEMA',
                addressStreet: 'Rua dos Testes',
                addressNumber: '100',
                addressCity: 'Porto Alegre',
                addressState: 'RS',
                addressZip: '90000-000',
                addressDistrict: 'Centro',
                phone: '(11) 90000-0000',
                contactWhatsapp: '51999999999',
            }
        });
        console.log('✅ Cliente de teste criado:', testClient.id, '-', testClient.name);
    }

    // Criar veículo de teste
    const existingVehicle = await prisma.vehicle.findFirst({
        where: { placa: 'TEST001' }
    });

    let testVehicle;
    if (existingVehicle) {
        console.log('✅ Veículo de teste já existe:', existingVehicle.id, '-', existingVehicle.placa);
        testVehicle = existingVehicle;
    } else {
        testVehicle = await prisma.vehicle.create({
            data: {
                placa: 'TEST001',
                especieTipo: 'SEMIRREBOQUE',
                marcaModelo: 'RANDON/RS',
                numeroChassi: '9BWZZZ377VT004251',
                anoFabricacaoModelo: '2020/2020',
                clientId: testClient.id,
            }
        });
        console.log('✅ Veículo de teste criado:', testVehicle.id, '-', testVehicle.placa);
    }

    console.log('\n📋 Resumo dos dados de teste:');
    console.log('Cliente:', testClient.name, '| ID:', testClient.id, '| CNPJ:', testClient.cnpj);
    console.log('Veículo:', testVehicle.marcaModelo, '| ID:', testVehicle.id, '| Placa:', testVehicle.placa);

    await prisma.$disconnect();
}

main().catch(async (e) => {
    console.error('❌ Erro no seed:', e);
    await prisma.$disconnect();
    process.exit(1);
});
