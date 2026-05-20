/**
 * GET /api/admin/user-access?user_id=...
 * Возвращает список доступов конкретного пользователя.
 * Только для admin.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const targetUserId = searchParams.get('user_id');
  if (!targetUserId) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 });
  }

  try {
    const access = await prisma.userAccess.findMany({
      where:   { userId: targetUserId },
      select:  { id: true, type: true, reference: true, amount: true, paidAt: true },
      orderBy: { paidAt: 'desc' },
    });

    // Возвращаем в snake_case для совместимости с фронтендом
    // id нужен как React key для кнопок «Отозвать» в AdminPanel
    return NextResponse.json(
      access.map(a => ({
        id:        a.id,
        type:      a.type,
        reference: a.reference,
        amount:    a.amount,
        paid_at:   a.paidAt,
      }))
    );
  } catch (e) {
    console.error('[GET /api/admin/user-access]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
