/**
 * POST /api/admin/grant-access
 * Тело: { user_id, type: 'month'|'section', reference: 'jan'|...|'ikkajo',
 *         source?: 'free'|'cash'|'card'|'crypto', amount?: number, revoke?: true }
 * Только для admin. Ручная выдача или отзыв доступа.
 * source — как получены деньги ('free' если доступ подарен).
 */

const MANUAL_SOURCES = ['free', 'cash', 'card', 'crypto'];

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';

export async function POST(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { user_id, type, reference, revoke, source, amount } = await request.json();

  if (!user_id || !type || !reference) {
    return NextResponse.json({ error: 'user_id, type, reference required' }, { status: 400 });
  }

  const accessSource = MANUAL_SOURCES.includes(source) ? source : 'free';
  const accessAmount = accessSource === 'free' ? 0 : Math.max(0, Math.round(Number(amount) || 0));

  try {
    if (revoke) {
      // 1. Удаляем строку доступа
      await prisma.userAccess.deleteMany({
        where: { userId: user_id, type, reference },
      });

      // 2. Аннулируем «висящие» платежи за этот же продукт, чтобы
      //    refresh-access не выдал доступ снова при следующем визите пользователя.
      //    Сопоставляем по productType/productReference — те же поля, что refresh-access использует.
      await prisma.payment.updateMany({
        where: {
          userId:           user_id,
          status:           'pending',
          productType:      type,
          productReference: reference,
        },
        data: { status: 'cancelled' },
      });

      return NextResponse.json({ ok: true, action: 'revoked' });
    }

    // Выдача доступа — upsert чтобы не дублировать
    await prisma.userAccess.upsert({
      where: {
        userId_type_reference: { userId: user_id, type, reference },
      },
      create: {
        userId:    user_id,
        type,
        reference,
        amount:    accessAmount,
        source:    accessSource,
        paidAt:    new Date(),
      },
      update: {
        paidAt: new Date(),
        amount: accessAmount,
        source: accessSource,
      },
    });

    return NextResponse.json({ ok: true, action: 'granted' });

  } catch (e) {
    console.error('[POST /api/admin/grant-access]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
