import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Criando usuários iniciais...');

  // Senha padrão para todos os usuários (não mostrar no frontend)
  const defaultPassword = 'change-me';
  const hashedPassword = hashPassword(defaultPassword);

  // Criar usuário admin
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
    },
  });

  // Criar usuário client_a
  const client_a = await prisma.user.upsert({
    where: { username: 'client_a' },
    update: {},
    create: {
      username: 'client_a',
      password: hashedPassword,
      role: 'client_a',
      isActive: true,
    },
  });

  // Criar usuário client_b
  const client_b = await prisma.user.upsert({
    where: { username: 'client_b' },
    update: {},
    create: {
      username: 'client_b',
      password: hashedPassword,
      role: 'client_b',
      isActive: true,
    },
  });

  console.log('✅ Usuários criados:');
  console.log(`- Admin: ${admin.username} (ID: ${admin.id})`);
  console.log(`- ClientA: ${client_a.username} (ID: ${client_a.id})`);
  console.log(`- ClientB: ${client_b.username} (ID: ${client_b.id})`);
  
  console.log('\n🔑 Credenciais de login:');
  console.log('- admin / change-me');
  console.log('- client_a / change-me');
  console.log('- client_b / change-me');

  // Duplicar equipamentos para os usuários client_a e client_b
  console.log('\n🔧 Duplicando equipamentos para usuários cliente...');
  
  const existingEquipments = await prisma.equipment.findMany({
    where: { userId: null }, // Equipamentos do admin
  });

  for (const equipment of existingEquipments) {
    // Duplicar para client_a
    await prisma.equipment.create({
      data: {
        name: equipment.name,
        model: equipment.model,
        certificateNumber: `${equipment.certificateNumber}-C1`,
        calibrationDate: equipment.calibrationDate,
        expirationDate: equipment.expirationDate,
        equipmentType: equipment.equipmentType,
        isActive: equipment.isActive,
        userId: client_a.id,
      },
    });

    // Duplicar para client_b
    await prisma.equipment.create({
      data: {
        name: equipment.name,
        model: equipment.model,
        certificateNumber: `${equipment.certificateNumber}-C2`,
        calibrationDate: equipment.calibrationDate,
        expirationDate: equipment.expirationDate,
        equipmentType: equipment.equipmentType,
        isActive: equipment.isActive,
        userId: client_b.id,
      },
    });
  }

  console.log(`✅ ${existingEquipments.length} equipamentos duplicados para cada usuário cliente`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao criar usuários:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });