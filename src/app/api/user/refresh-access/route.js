/**
 * POST /api/user/refresh-access
 *
 * Проверяет все pending-платежи текущего пользователя напрямую в YooKassa
 * и выдаёт user_access для тех, что уже оплачены.
 *
 * Вызывается автоматически при загрузке Dashboard — подстраховка на случай,
 * если success-страница не смогла завершить верификацию (нестабильный редирект,
 * старый код, нет cookies и т.д.).
 *
 * Идемпотентен: upsert, повторные вызовы безвредны.
 *
 * Response: { granted: ['month/sep', ...] }
 */

import { NextResponse } from 'next/server';
import { prisma }       from '@/lib/prisma.js';
import { requireAuth }  from '@/lib/auth-server.js';

const MONTH_REFS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

async function queryYooKassa(providerPaymentId) {
  const credentials = Buffer.from(
    `${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`
  ).toString('base64');
  const res = await fetch(`https://api.yookassa.ru/v3/payments/${providerPaymentId}`, {
    headers: { 'Authorization': `Basic ${credentials}` },
  });
  if (!res.ok) throw new Error(`YooKassa ${res.status}`);
  return res.json();
}

export async function POST(request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    // 1. Все pending-платежи пользователя с providerPaymentId
    const pendingPayments = await prisma.payment.findMany({
      where: {
        userId:           user.id,
        status:           'pending',
        providerPaymentId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (pendingPayments.length === 0) {
      return NextResponse.json({ granted: [] });
    }

    // Дедупликация: берём только самый свежий платёж на каждый type/reference
    const seen = new Set();
    const unique = [];
    for (const p of pendingPayments) {
      const key = `${p.productType}/${p.productReference}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(p);
      }
    }

    const granted = [];

    for (const payment of unique) {
      try {
        // 2. Проверяем статус в YooKassa
        const yk = await queryYooKassa(payment.providerPaymentId);

        if (yk.status !== 'succeeded') continue;

        const paidAt     = new Date(yk.captured_at || yk.created_at || Date.now());
        const accessType = MONTH_REFS.includes(payment.productReference) ? 'month' : 'section';
        const reference  = payment.productReference;
        const amount     = Math.round(Number(payment.amount ?? 0));

        // 3. Обновляем payment → succeeded
        await prisma.payment.update({
          where: { id: payment.id },
          data:  { status: 'succeeded', paidAt, rawPayload: yk },
        });

        // 4. Выдаём / обновляем user_access
        await prisma.userAccess.upsert({
          where:  { userId_type_reference: { userId: user.id, type: accessType, reference } },
          create: { userId: user.id, type: accessType, reference, paidAt, amount },
          update: { paidAt, amount },
        });

        granted.push(`${accessType}/${reference}`);
        console.log(`[refresh-access] granted: user=${user.id} ${accessType}/${reference}`);
      } catch (e) {
        // Не прерываем цикл — обрабатываем остальные платежи
        console.warn(`[refresh-access] skip ${payment.providerPaymentId}: ${e.message}`);
      }
    }

    return NextResponse.json({ granted });

  } catch (err) {
    console.error('[refresh-access] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
