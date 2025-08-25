// Script para verificar dados dos usuários
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsersData() {
  try {
    console.log('🔍 Verificando dados dos usuários...\n');

    // 1. Verificar usuários
    const users = await prisma.user.findMany();
    console.log('👥 Usuários encontrados:');
    users.forEach(user => {
      console.log(`   - ID: ${user.id}, Username: ${user.username}, Role: ${user.role}`);
    });

    // 2. Verificar clientes
    const clients = await prisma.client.findMany({
      include: {
        user: true
      }
    });
    console.log(`\n📋 Clientes encontrados (${clients.length}):`);
    clients.forEach(client => {
      console.log(`   - ${client.name} (userId: ${client.userId}) - User: ${client.user?.username || 'N/A'}`);
    });

    // 3. Verificar laudos
    const laudos = await prisma.laudo.findMany({
      include: {
        client: {
          include: {
            user: true
          }
        }
      }
    });
    console.log(`\n🗂️ Laudos encontrados (${laudos.length}):`);
    laudos.forEach(laudo => {
      console.log(`   - OS: ${laudo.ordemServico} (Cliente: ${laudo.client.name}) - User: ${laudo.client.user?.username || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsersData();