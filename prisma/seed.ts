import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Criar equipamento AKSO inicial
  const existingAkso = await prisma.equipment.findFirst({
    where: { certificateNumber: 'AKSO AK824 107420/24' }
  });

  const aksoEquipment = existingAkso || await prisma.equipment.create({
    data: {
      name: 'AKSO',
      model: 'AK824',
      certificateNumber: 'AKSO AK824 107420/24',
      calibrationDate: new Date('2024-07-17'),
      expirationDate: new Date('2025-07-17'),
      equipmentType: 'RUIDO',
      isActive: true,
    },
  });

  console.log('✅ Equipamento AKSO criado:', aksoEquipment);

  // Verificar se há equipamentos próximos ao vencimento para testar notificações
  const today = new Date();
  const oneMonthFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  const equipmentsNearExpiration = await prisma.equipment.findMany({
    where: {
      isActive: true,
      expirationDate: {
        lte: oneMonthFromNow
      }
    }
  });

  console.log(`📅 Equipamentos próximos ao vencimento: ${equipmentsNearExpiration.length}`);
  equipmentsNearExpiration.forEach(eq => {
    const daysUntilExpiration = Math.ceil(
      (eq.expirationDate.getTime() - today.getTime()) / (1000 * 3600 * 24)
    );
    console.log(`   - ${eq.name} ${eq.model}: ${daysUntilExpiration} dias`);
  });

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });