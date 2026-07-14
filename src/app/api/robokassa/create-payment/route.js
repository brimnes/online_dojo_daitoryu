/**
 * POST /api/robokassa/create-payment
 *
 * Аналог /api/yookassa/create-payment, но для Робокассы:
 * 1. Авторизация
 * 2. Поиск продукта (по UUID или mock-id вида 'p-jan')
 * 3. Проверка — нет ли уже доступа
 * 4. Получение InvId из последовательности robokassa_inv_seq
 * 5. Сборка платёжной ссылки (подпись MD5, без внешнего API-вызова)
 * 6. Сохранение pending-записи в payments
 * 7. Возврат confirmation_url — тот же формат ответа, что и у ЮKassa-роута
 */

import { prisma } from '@/lib/prisma.js';
import { requireAuth } from '@/lib/auth-server.js';
import { buildPaymentUrl } from '@/lib/robokassa.js';

export async function POST(request) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const { product_id } = await request.json();
    if (!product_id) {
      return Response.json({ error: 'product_id is required' }, { status: 400 });
    }

    let product = await prisma.product.findFirst({
      where: { id: product_id, isActive: true },
    });
    if (!product) {
      const reference = product_id.replace(/^p-/, '');
      product = await prisma.product.findFirst({
        where: { reference, isActive: true },
      });
    }
    if (!product) {
      console.error('[robokassa/create-payment] product not found:', product_id);
      return Response.json({ error: 'Product not found', product_id }, { status: 404 });
    }

    const existingAccess = await prisma.userAccess.findFirst({
      where: { userId: user.id, type: product.type, reference: product.reference },
    });
    if (existingAccess) {
      return Response.json({ error: 'Access already granted' }, { status: 409 });
    }

    // Номер счёта — целое число, уникальное для Робокассы (её требование)
    const [{ nextval }] = await prisma.$queryRaw`SELECT nextval('robokassa_inv_seq') AS nextval`;
    const invId = Number(nextval);

    const baseUrl    = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successUrl = `${baseUrl}/payment/success?type=${product.type}&ref=${product.reference}`;

    const { url: confirmationUrl, receipt } = buildPaymentUrl({
      invId,
      amount:      product.price,
      description: product.title,
      successUrl,
      failUrl:     successUrl,
    });

    await prisma.payment.create({
      data: {
        userId:            user.id,
        productId:         product.id,
        productTitle:      product.title,
        productType:       product.type,
        productReference:  product.reference,
        amount:            product.price,
        currency:          'RUB',
        status:            'pending',
        paymentProvider:   'robokassa',
        providerPaymentId: String(invId),
        rawPayload:        { receipt },
      },
    });

    return Response.json({
      confirmation_url: confirmationUrl,
      payment_id:       String(invId),
    });

  } catch (err) {
    console.error('[robokassa/create-payment] unexpected error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
