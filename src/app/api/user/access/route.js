/** GET /api/user/access — доступы текущего пользователя */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth } from '@/lib/auth-server.js';

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  // Администратор получает полный доступ ко всему контенту автоматически
  if (user.role === 'admin') {
    const allMonths = await prisma.month.findMany({ select: { id: true } });
    return NextResponse.json([
      ...allMonths.map(m => ({ type: 'month', reference: m.id })),
      { type: 'section', reference: 'ikkajo' },
      { type: 'section', reference: 'tachiai' },
      { type: 'section', reference: 'idori' },
      { type: 'section', reference: 'ushirodori' },
      { type: 'section', reference: 'hanzahandachi' },
    ]);
  }

  const rows = await prisma.userAccess.findMany({
    where:  { userId: user.id },
    select: { type: true, reference: true },
  });
  return NextResponse.json(rows);
}
