/** GET /api/admin/access — все доступы с именами пользователей (admin) */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const rows = await prisma.userAccess.findMany({
    orderBy: { paidAt: 'desc' },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(rows.map(a => ({
    id:        a.id,
    user_id:   a.userId,
    user_name: a.user?.name || '—',
    type:      a.type,
    reference: a.reference,
    amount:    a.amount,
    paid_at:   a.paidAt,
  })));
}
