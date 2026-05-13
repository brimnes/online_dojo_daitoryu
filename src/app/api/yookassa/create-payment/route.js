/**
 * POST /api/yookassa/create-payment
 *
 * Полный флоу создания платежа:
 * 1. Авторизация (JWT cookie)
 * 2. Поиск продукта (по UUID или по reference для mock-id вида 'p-jan')
 * 3. Проверка — нет ли уже доступа
 * 4. Создание платежа в ЮKassa
 * 5. Сохранение pending-записи в payments
 * 6. Возврат confirmation_url
 */

import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma.js';
import { requireAuth } from '@/lib/auth-server.js';

export async function POST(request) {
  try {
    // 1. Авторизация
    const { user, error } = await requireAuth(request);
    if (error) return error;

    // 2. Получаем product_id из тела запроса
    const { product_id } = await request.json();
    if (!product_id) {
      return Response.json({ error: 'product_id is required' }, { status: 400 });
    }

    // 3. Находим продукт
    // Попытка 1: поиск по UUID
    let product = await prisma.product.findFirst({
      where: { id: product_id, isActive: true },
    });

    // Попытка 2: mock-id вида 'p-jan' → reference = 'jan'
    if (!product) {
      const reference = product_id.replace(/^p-/, '');
      product = await prisma.product.findFirst({
        where: { reference, isActive: true },
      });
    }

    if (!product) {
      console.error('[create-payment] product not found:', product_id);
      return Response.json({ error: 'Product not found', product_id }, { status: 404 });
    }

    // 4. Проверяем — нет ли уже активного доступа
    const existingAccess = await prisma.userAccess.findFirst({
      where: { userId: user.id, type: product.type, reference: product.reference },
    });

    if (existingAccess) {
      return Response.json({ error: 'Access already granted' }, { status: 409 });
    }

    // 5. Создаём платёж в ЮKassa
    const idempotenceKey = randomUUID();
    const credentials    = Buffer.from(
      `${process.env.YOOKASSA_SHOP_ID}:${process.env.YOOKASSA_SECRET_KEY}`
    ).toString('base64');

    const ykRes = await fetch('https://api.yookassa.ru/v3/payments', {
      method:  'POST',
      headers: {
        'Authorization':   `Basic ${credentials}`,
        'Content-Type':    'application/json',
        'Idempotence-Key': idempotenceKey,
      },
      body: JSON.stringify({
        amount: {
          value:    Number(product.price).toFixed(2),
          currency: 'RUB',
        },
        confirmation: {
          type:       'redirect',
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?type=${product.type}&ref=${product.reference}`,
        },
        capture:     true,
        description: product.title,
        metadata: {
          user_id:    user.id,
          product_id: product.id,
        },
      }),
    });

    if (!ykRes.ok) {
      const ykError = await ykRes.json();
      console.error('[YooKassa] create-payment error:', ykError);
      return Response.json({ error: 'Payment creation failed', details: ykError }, { status: 502 });
    }

    const payment = await ykRes.json();

    // 6. Сохраняем платёж в БД со статусом pending
    await prisma.payment.create({
      data: {
        userId:             user.id,
        productId:          product.id,
        productTitle:       product.title,
        productType:        product.type,
        productReference:   product.reference,
        amount:             product.price,
        currency:           'RUB',
        status:             'pending',
        paymentProvider:    'yookassa',
        providerPaymentId:  payment.id,
      },
    });

    // 7. Возвращаем URL для редиректа
    return Response.json({
      confirmation_url: payment.confirmation.confirmation_url,
      payment_id:       payment.id,
    });

  } catch (err) {
    console.error('[create-payment] unexpected error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ ok: true, route: 'create-payment' });
}
