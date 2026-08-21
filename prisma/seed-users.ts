import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../lib/auth';
import type { UserRole } from '../lib/auth';

const prisma = new PrismaClient();

/**
 * Contas de inspetor criadas pelo seed.
 *
 * Os papeis `client_a` / `client_b` sao genericos de proposito: a identidade
 * do cliente vive em `AdminSetting` (companyName / companyAddress / ...),
 * nunca no papel nem no nome de usuario.
 */
const CLIENT_ACCOUNTS: { username: string; role: UserRole; suffix: string }[] = [
  { username: 'client_a', role: 'client_a', suffix: 'A' },
  { username: 'client_b', role: 'client_b', suffix: 'B' },
];

async function main() {
  console.log('🌱 Criando usuários iniciais...');

  // Senha inicial: sobrescreva com SEED_PASSWORD antes de rodar em qualquer
  // ambiente que nao seja a sua maquina, e troque no primeiro login.
  const defaultPassword = process.env.SEED_PASSWORD || 'change-me';
  const hashedPassword = await hashPassword(defaultPassword);

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

  const created = [];
  for (const account of CLIENT_ACCOUNTS) {
    const user = await prisma.user.upsert({
      where: { username: account.username },
      update: {},
      create: {
        username: account.username,
        password: hashedPassword,
        role: account.role,
        isActive: true,
      },
    });
    created.push({ ...account, id: user.id, username: user.username });
  }

  console.log('✅ Usuários criados:');
  console.log(`- Admin: ${admin.username} (ID: ${admin.id})`);
  for (const account of created) {
    console.log(`- ${account.role}: ${account.username} (ID: ${account.id})`);
  }

  console.log('\n🔑 Credenciais de login (senha inicial: $SEED_PASSWORD):');
  console.log('- admin');
  for (const account of created) {
    console.log(`- ${account.username}`);
  }

  // Duplicar equipamentos do admin para cada conta de inspetor
  console.log('\n🔧 Duplicando equipamentos para as contas de inspetor...');

  const existingEquipments = await prisma.equipment.findMany({
    where: { userId: null }, // Equipamentos do admin
  });

  for (const equipment of existingEquipments) {
    for (const account of created) {
      await prisma.equipment.create({
        data: {
          name: equipment.name,
          model: equipment.model,
          certificateNumber: `${equipment.certificateNumber}-${account.suffix}`,
          calibrationDate: equipment.calibrationDate,
          expirationDate: equipment.expirationDate,
          equipmentType: equipment.equipmentType,
          isActive: equipment.isActive,
          userId: account.id,
        },
      });
    }
  }

  console.log(`✅ ${existingEquipments.length} equipamentos duplicados para cada conta de inspetor`);
}

main()
  .catch((e) => {
    console.error('❌ Erro ao criar usuários:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
