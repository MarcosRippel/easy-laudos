import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var -- padrão do singleton Prisma: `var` é necessário em declare global
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({ });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;