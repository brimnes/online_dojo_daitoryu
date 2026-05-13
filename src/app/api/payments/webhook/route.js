/**
 * POST /api/payments/webhook
 * Принимает события от YooKassa.
 * Валидация: Basic Auth (shopId:secretKey).
 * При payment.succeeded → выдаёт доступ через Prisma (upsert в user_access).
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';

function validateBasicAuth(request) {
  const shopId    = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) return false;

  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Basic ')) return false;

  const decoded  = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
  return decoded === `${shopId}:${secretKey}`;
}

export async function POST(request) {
  if (!validateBasicAuth(request)) {
    console.warn('[payments/webhook] unauthorized attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let event;
  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Обрабатываем только payment.succeeded
  if (event?.event !== 'payment.succeeded') {
    return NextResponse.json({ ok: true });
  }

  const payment  = event.object;
  const metadata = payment?.metadata || {};
  const { user_id, type, reference } = metadata;
  const amount   = parseFloat(payment?.amount?.value || '0');

  if (!user_id || !type || !reference) {
    console.error('[payments/webhook] missing metadata', metadata);
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
  }

  try {
    await prisma.userAccess.upsert({
      where: {
        userId_type_reference: { userId: user_id, type, reference },
      },
      create: {
        userId:    user_id,
        type,
        reference,
        paidAt:    new Date(),
        amount:    Math.round(amount),
      },
      update: {
        paidAt:  new Date(),
        amount:  Math.round(amount),
      },
    });

    console.log(`[payments/webhook] access granted user=${user_id} type=${type} ref=${reference}`);
    return NextResponse.json({ ok: true });

  } catch (e) {
    console.error('[payments/webhook] grant_access failed', e);
    // Возвращаем 500 → YooKassa сделает повторную попытку
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }
}
