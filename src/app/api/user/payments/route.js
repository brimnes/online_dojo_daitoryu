/**
 * GET /api/user/payments
 *
 * Возвращает список успешных платежей текущего пользователя из БД.
 * Требует авторизации (httpOnly cookie dojo_token).
 *
 * Response: Array<{
 *   id:     string,
 *   desc:   string,   // название продукта
 *   amount: string,   // напр. '1 990 ₽'
 *   date:   string,   // дата оплаты в формате dd.mm.yyyy
 * }>
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth } from '@/lib/auth-server.js';

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    const payments = await prisma.payment.findMany({
      where:   { userId: user.id, status: 'succeeded' },
      orderBy: { paidAt: 'desc' },
      select: {
        id:               true,
        productTitle:     true,
        productReference: true,
        amount:           true,
        paidAt:           true,
      },
    });

    return NextResponse.json(payments.map(p => ({
      id:        p.id,
      desc:      p.productTitle || '—',
      reference: p.productReference || null,
      amount:    p.amount
        ? `${Number(p.amount).toLocaleString('ru-RU')} ₽`
        : '—',
      date:      p.paidAt
        ? new Date(p.paidAt).toLocaleDateString('ru-RU')
        : '',
    })));

  } catch (e) {
    console.error('[GET /api/user/payments]', e);
    return NextResponse.json({ error: e.message || 'Ошибка сервера' }, { status: 500 });
  }
}
