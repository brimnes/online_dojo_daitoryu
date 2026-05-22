/**
 * POST /api/yookassa/verify-payment
 *
 * Проверяет статус платежа напрямую у YooKassa API.
 * Используется success-страницей как fallback, если вебхук не дошёл.
 *
 * Body: { provider_payment_id: string }
 *
 * Flow:
 *   1. Ищем payment в БД по providerPaymentId
 *   2. Если уже succeeded → возвращаем сразу
 *   3. Если pending → запрашиваем YooKassa GET /v3/payments/{id}
 *   4. Если YooKassa status = succeeded → обновляем payment + выдаём user_access
 *   5. Возвращаем { status, type, reference }
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth } from '@/lib/auth-server.js';

const MONTH_REFS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

async function queryYooKassa(providerPaymentId) {
  const credentials = Buffer.from(
    `${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`
  ).toString('base64');

  const res = await fetch(`https://api.yookassa.ru/v3/payments/${providerPaymentId}`, {
    headers: { 'Authorization': `Basic ${credentials}` },
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`YooKassa API ${res.status}: ${txt}`);
  }
  return res.json();
}

async function processSucceededPayment(payment, ykPayment) {
  const paidAt = new Date(ykPayment.captured_at || ykPayment.created_at || Date.now());

  // Обновляем статус payment в БД
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status:     'succeeded',
      paidAt,
      rawPayload: ykPayment,
    },
  });

  // Определяем тип доступа
  const accessType = payment.productType === 'section'
    ? 'section'
    : MONTH_REFS.includes(payment.productReference)
      ? 'month'
      : payment.productType || 'month';

  // Выдаём доступ (upsert — идемпотентно)
  await prisma.userAccess.upsert({
    where: {
      userId_type_reference: {
        userId:    payment.userId,
        type:      accessType,
        reference: payment.productReference,
      },
    },
    create: {
      userId:    payment.userId,
      type:      accessType,
      reference: payment.productReference,
      paidAt,
      amount:    Math.round(Number(payment.amount ?? 0)),
    },
    update: {
      paidAt,
      amount: Math.round(Number(payment.amount ?? 0)),
    },
  });

  console.log(`[verify-payment] access granted: user=${payment.userId} type=${accessType} ref=${payment.productReference}`);
  return { accessType, reference: payment.productReference };
}

export async function POST(request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const { provider_payment_id } = await request.json();
    if (!provider_payment_id) {
      return NextResponse.json({ error: 'provider_payment_id required' }, { status: 400 });
    }

    // 1. Найти payment в БД
    const payment = await prisma.payment.findUnique({
      where: { providerPaymentId: provider_payment_id },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found', status: 'not_found' }, { status: 404 });
    }

    // Проверяем, что платёж принадлежит текущему пользователю
    if (payment.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Уже обработан
    if (payment.status === 'succeeded') {
      console.log('[verify-payment] already succeeded:', provider_payment_id);
      return NextResponse.json({
        status:    'succeeded',
        type:      payment.productType,
        reference: payment.productReference,
      });
    }

    // 3. Запросить актуальный статус у YooKassa
    let ykPayment;
    try {
      ykPayment = await queryYooKassa(provider_payment_id);
    } catch (e) {
      console.error('[verify-payment] YooKassa query failed:', e.message);
      return NextResponse.json({
        status: payment.status,
        error:  'Cannot reach YooKassa: ' + e.message,
      }, { status: 502 });
    }

    const ykStatus = ykPayment.status; // pending | waiting_for_capture | succeeded | canceled

    console.log(`[verify-payment] YooKassa status=${ykStatus} for ${provider_payment_id}`);

    if (ykStatus === 'succeeded') {
      const { accessType, reference } = await processSucceededPayment(payment, ykPayment);
      return NextResponse.json({
        status:    'succeeded',
        type:      accessType,
        reference,
      });
    }

    if (ykStatus === 'canceled') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'cancelled' },
      });
      return NextResponse.json({ status: 'cancelled' });
    }

    // pending / waiting_for_capture — платёж ещё не завершён
    return NextResponse.json({ status: ykStatus });

  } catch (err) {
    console.error('[verify-payment] unexpected error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
