/**
 * POST /api/yookassa/webhook
 *
 * Принимает события от ЮKassa.
 * При payment.succeeded:
 *   1. Защита от дублей по provider_payment_id
 *   2. Обновляем/создаём запись в payments
 *   3. Выдаём доступ через user_access (upsert)
 */

import { prisma } from '@/lib/prisma.js';

const MONTH_REFS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('[YooKassa webhook] HIT — event:', body.event, '| payment_id:', body.object?.id, '| status:', body.object?.status);
    console.log('[YooKassa webhook] metadata:', JSON.stringify(body.object?.metadata || {}));

    // Обрабатываем только payment.succeeded
    if (body.event !== 'payment.succeeded') {
      return Response.json({ ok: true });
    }

    const payment   = body.object;
    const paymentId = payment?.id;
    const meta      = payment?.metadata || {};
    const userId    = meta.user_id;
    const productId = meta.product_id;

    if (!paymentId || !userId || !productId) {
      console.error('[webhook] missing required fields', { paymentId, userId, productId });
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    // Защита от дублей по provider_payment_id
    const existing = await prisma.payment.findUnique({
      where:  { providerPaymentId: paymentId },
      select: { id: true, status: true },
    });

    if (existing?.status === 'succeeded') {
      console.log('[webhook] already processed, skipping:', paymentId);
      return Response.json({ ok: true });
    }

    // Находим продукт
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      console.error('[webhook] product not found:', productId);
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    const paidAt = new Date();

    // Обновляем/создаём запись в payments
    if (existing) {
      await prisma.payment.update({
        where: { providerPaymentId: paymentId },
        data:  { status: 'succeeded', paidAt, rawPayload: body },
      });
    } else {
      await prisma.payment.create({
        data: {
          userId,
          productId,
          productTitle:      product.title,
          productType:       product.type,
          productReference:  product.reference,
          amount:            product.price,
          currency:          'RUB',
          status:            'succeeded',
          paymentProvider:   'yookassa',
          providerPaymentId: paymentId,
          paidAt,
          rawPayload:        body,
        },
      });
    }

    // Выдаём доступ через user_access
    const accessType = MONTH_REFS.includes(product.reference) ? 'month' : 'section';

    try {
      await prisma.userAccess.upsert({
        where: {
          userId_type_reference: { userId, type: accessType, reference: product.reference },
        },
        create: {
          userId,
          type:      accessType,
          reference: product.reference,
          paidAt,
          amount:    Math.round(Number(product.price)),
        },
        update: {
          paidAt,
          amount: Math.round(Number(product.price)),
        },
      });
      console.log(`[webhook] access granted: user=${userId} type=${accessType} ref=${product.reference}`);
    } catch (accessErr) {
      console.error('[webhook] failed to grant access:', accessErr);
      // Не возвращаем ошибку ЮKassa — платёж принят, разберёмся вручную
    }

    return Response.json({ ok: true });

  } catch (err) {
    console.error('[webhook] unexpected error:', err);
    // Возвращаем 200 чтобы ЮKassa не ретраила бесконечно
    return Response.json({ ok: true });
  }
}
