/**
 * POST /api/yookassa/verify-payment
 *
 * Проверяет статус оплаты текущего пользователя напрямую у платёжного
 * провайдера — ЮKassa или Робокасса, в зависимости от того, кем был создан
 * конкретный платёж (payment.paymentProvider). Имя роута осталось историческим,
 * НЕ требует provider_payment_id — находит платёж сам по type+reference.
 *
 * Body: { type: 'month'|'section', reference: 'jun'|'jul'|... }
 *
 * Flow:
 *   1. Находим самый свежий pending-платёж пользователя с нужным type+reference
 *   2. Запрашиваем статус у соответствующего провайдера
 *   3. Если succeeded → обновляем payment + выдаём user_access
 *   4. Возвращаем { status: 'succeeded'|'pending'|'cancelled' }
 *
 * Идемпотентен: если доступ уже есть → сразу возвращаем succeeded.
 */

import { NextResponse } from 'next/server';
import { prisma }       from '@/lib/prisma.js';
import { requireAuth }  from '@/lib/auth-server.js';
import { queryRobokassaStatus } from '@/lib/robokassa.js';

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

async function grantAccess(userId, accessType, reference, amount, paidAt, source) {
  await prisma.userAccess.upsert({
    where:  { userId_type_reference: { userId, type: accessType, reference } },
    create: { userId, type: accessType, reference, paidAt, amount: Math.round(Number(amount ?? 0)), source },
    update: { paidAt, amount: Math.round(Number(amount ?? 0)), source },
  });
  console.log(`[verify-payment] access granted: user=${userId} ${accessType}/${reference} via ${source}`);
}

export async function POST(request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const body      = await request.json();
    const type      = body.type;       // 'month' | 'section'
    const reference = body.reference;  // 'jun', 'jul', etc.

    if (!type || !reference) {
      return NextResponse.json({ error: 'type and reference required' }, { status: 400 });
    }

    // 1. Если доступ уже есть — сразу succeeded
    const existing = await prisma.userAccess.findFirst({
      where: { userId: user.id, type, reference },
    });
    if (existing) {
      console.log(`[verify-payment] access already exists for ${user.id} ${type}/${reference}`);
      return NextResponse.json({ status: 'succeeded', type, reference });
    }

    // 2. Найти самый свежий pending-платёж этого пользователя по type+reference
    const payment = await prisma.payment.findFirst({
      where: {
        userId:           user.id,
        productType:      type,
        productReference: reference,
        status:           { in: ['pending', 'succeeded'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!payment) {
      console.warn(`[verify-payment] no payment found for ${user.id} ${type}/${reference}`);
      return NextResponse.json({ status: 'not_found', error: 'Payment not found' }, { status: 404 });
    }

    // Если payment уже succeeded в БД но access нет — выдаём access
    if (payment.status === 'succeeded') {
      const paidAt = payment.paidAt ?? new Date();
      await grantAccess(user.id, type, reference, payment.amount, paidAt, payment.paymentProvider || 'yookassa');
      return NextResponse.json({ status: 'succeeded', type, reference });
    }

    if (!payment.providerPaymentId) {
      return NextResponse.json({ status: 'pending', error: 'No provider_payment_id' });
    }

    // 3. Запросить актуальный статус у соответствующего провайдера
    if (payment.paymentProvider === 'robokassa') {
      let rkState;
      try {
        rkState = await queryRobokassaStatus(payment.providerPaymentId);
      } catch (e) {
        console.error('[verify-payment] Robokassa query failed:', e.message);
        return NextResponse.json({ status: 'pending', error: e.message }, { status: 502 });
      }

      console.log(`[verify-payment] Robokassa ${payment.providerPaymentId} → code ${rkState.code}`);

      if (rkState.succeeded) {
        const paidAt = new Date();
        await prisma.payment.update({
          where: { id: payment.id },
          data:  { status: 'succeeded', paidAt, rawPayload: { code: rkState.code } },
        });
        await grantAccess(user.id, type, reference, payment.amount, paidAt, 'robokassa');
        return NextResponse.json({ status: 'succeeded', type, reference });
      }

      if (rkState.code === '5') {
        await prisma.payment.update({ where: { id: payment.id }, data: { status: 'cancelled' } });
        return NextResponse.json({ status: 'cancelled' });
      }

      return NextResponse.json({ status: 'pending' });
    }

    let ykPayment;
    try {
      ykPayment = await queryYooKassa(payment.providerPaymentId);
    } catch (e) {
      console.error('[verify-payment] YooKassa query failed:', e.message);
      return NextResponse.json({ status: 'pending', error: e.message }, { status: 502 });
    }

    const ykStatus = ykPayment.status;
    console.log(`[verify-payment] YooKassa ${payment.providerPaymentId} → ${ykStatus}`);

    if (ykStatus === 'succeeded') {
      const paidAt = new Date(ykPayment.captured_at || ykPayment.created_at || Date.now());
      // Обновить payment
      await prisma.payment.update({
        where: { id: payment.id },
        data:  { status: 'succeeded', paidAt, rawPayload: ykPayment },
      });
      // Выдать доступ
      await grantAccess(user.id, type, reference, payment.amount, paidAt, 'yookassa');
      return NextResponse.json({ status: 'succeeded', type, reference });
    }

    if (ykStatus === 'canceled') {
      await prisma.payment.update({
        where: { id: payment.id },
        data:  { status: 'cancelled' },
      });
      return NextResponse.json({ status: 'cancelled' });
    }

    return NextResponse.json({ status: ykStatus });

  } catch (err) {
    console.error('[verify-payment] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
