const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "AdminSetting" ADD COLUMN "nomeResponsavel" TEXT`
    );
    console.log('COLUNA ADICIONADA COM SUCESSO');
  } catch (e) {
    if (e.message && (e.message.includes('duplicate column') || e.message.includes('already exists'))) {
      console.log('COLUNA JA EXISTE - OK');
    } else {
      console.error('ERRO:', e.message);
      process.exit(1);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
