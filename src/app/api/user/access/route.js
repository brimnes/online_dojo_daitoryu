/** GET /api/user/access — доступы текущего пользователя */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth } from '@/lib/auth-server.js';

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const rows = await prisma.userAccess.findMany({
    where:  { userId: user.id },
    select: { type: true, reference: true },
  });
  return NextResponse.json(rows);
}
