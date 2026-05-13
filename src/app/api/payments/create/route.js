/**
 * POST /api/payments/create
 * Тело: { type: 'month'|'section', reference: 'jan'|...|'ikkajo' }
 * Создаёт платёж в YooKassa и возвращает { confirmation_url }
 *
 * Простой роут без записи в payments — используется для базовых покупок.
 * Для полного флоу с сохранением в БД используй /api/yookassa/create-payment.
 */

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requireAuth } from '@/lib/auth-server.js';

const PRICE_MONTH  = '1990.00';
const PRICE_IKKAJO = '2900.00';

const PRODUCT_LABELS = {
  month: {
    jan: 'Январь', feb: 'Февраль', mar: 'Март',   apr: 'Апрель',
    may: 'Май',    jun: 'Июнь',    jul: 'Июль',    aug: 'Август',
    sep: 'Сентябрь', oct: 'Октябрь', nov: 'Ноябрь', dec: 'Декабрь',
  },
  section: { ikkajo: 'Иккаджо — база техник' },
};

function getAmount(type) {
  return type === 'section' ? PRICE_IKKAJO : PRICE_MONTH;
}

function getDescription(type, reference) {
  const label = PRODUCT_LABELS[type]?.[reference] || reference;
  return type === 'month'
    ? `Доступ к урокам: ${label} 2026`
    : `Доступ к базе техник: ${label}`;
}

export async function POST(request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const { type, reference } = await request.json();
    if (!type || !reference) {
      return NextResponse.json({ error: 'type and reference required' }, { status: 400 });
    }

    const shopId    = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;
    if (!shopId || !secretKey) {
      return NextResponse.json({ error: 'Payment provider not configured' }, { status: 500 });
    }

    const baseUrl        = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const idempotenceKey = randomUUID();
    const amount         = getAmount(type);
    const description    = getDescription(type, reference);

    const ykResponse = await fetch('https://api.yookassa.ru/v3/payments', {
      method:  'POST',
      headers: {
        'Content-Type':    'application/json',
        'Idempotence-Key': idempotenceKey,
        'Authorization':   'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64'),
      },
      body: JSON.stringify({
        amount:      { value: amount, currency: 'RUB' },
        description,
        metadata:    { user_id: user.id, type, reference },
        confirmation: {
          type:       'redirect',
          return_url: `${baseUrl}/payment/success?type=${type}&ref=${reference}`,
        },
        capture: true,
      }),
    });

    if (!ykResponse.ok) {
      const err = await ykResponse.json();
      console.error('[payments/create] YooKassa error:', err);
      return NextResponse.json({ error: 'Payment creation failed', details: err }, { status: 502 });
    }

    const payment = await ykResponse.json();
    return NextResponse.json({
      payment_id:       payment.id,
      confirmation_url: payment.confirmation.confirmation_url,
    });

  } catch (e) {
    console.error('[payments/create] error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
