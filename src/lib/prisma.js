/**
 * src/lib/prisma.js
 *
 * Синглтон Prisma Client.
 * В Next.js dev-режиме hot reload создаёт новые инстансы при каждом изменении —
 * сохраняем в globalThis, чтобы не плодить соединения.
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
