// Script para adicionar coluna nomeResponsavel ao AdminSetting via Prisma
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Tenta usar $executeRawUnsafe para adicionar a coluna
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "AdminSetting" ADD COLUMN "nomeResponsavel" TEXT;`
    );
    console.log('✅ Coluna nomeResponsavel adicionada com sucesso!');
  } catch (e) {
    if (e.message && e.message.includes('duplicate column')) {
      console.log('ℹ️ Coluna já existe — nenhuma ação necessária.');
    } else {
      console.error('❌ Erro:', e.message);
      throw e;
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
