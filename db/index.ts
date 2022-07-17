import { PrismaClient } from '@prisma/client';

declare global {
  // allow global `var` declarations, caching it globally so we can
  // use the same connection throughout the app
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma
  || new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
