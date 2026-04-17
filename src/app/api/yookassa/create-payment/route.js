// src/app/api/yookassa/create-payment/route.js
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

export async function POST(req) {
  try {
    // ── 1. Авторизация пользователя ──────────────────────────────
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ── 2. Получаем product_id из тела запроса ────────────────────
    const { product_id } = await req.json();
    if (!product_id) {
      return Response.json({ error: 'product_id is required' }, { status: 400 });
    }

    // ── 3. Находим продукт в Supabase ─────────────────────────────
    // Сначала ищем по UUID, затем по reference (для совместимости с mock-id вида 'p-jan')
    let product = null;

    // Попытка 1: поиск по id
    const { data: byId } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', product_id)
      .eq('is_active', true)
      .maybeSingle();

    if (byId) {
      product = byId;
    } else {
      // Попытка 2: mock-id вида 'p-jan' → reference = 'jan'
      const reference = product_id.replace(/^p-/, '');
      const { data: byRef } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('reference', reference)
        .eq('is_active', true)
        .maybeSingle();
      product = byRef || null;
    }

    if (!product) {
      console.error('[create-payment] product not found:', product_id);
      return Response.json({ error: 'Product not found', product_id }, { status: 404 });
    }

    // ── 4. Проверяем — нет ли уже активного доступа ───────────────
    const { data: existingAccess } = await supabaseAdmin
      .from('user_access')
      .select('id')
      .eq('user_id', user.id)
      .eq('type', product.type)
      .eq('reference', product.reference)
      .maybeSingle();

    if (existingAccess) {
      return Response.json({ error: 'Access already granted' }, { status: 409 });
    }

    // ── 5. Создаём платёж в ЮKassa ────────────────────────────────
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
          value:    Number(product.price).toFixed(2), // цена в рублях, ЮKassa формат: "1990.00"
          currency: 'RUB',
        },
        confirmation: {
          type:       'redirect',
          return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/success?type=${product.type}&ref=${product.reference}`,
        },
        capture:     true,
        description: `${product.title}`,
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

    // ── 6. Сохраняем платёж в БД со статусом pending ─────────────
    await supabaseAdmin.from('payments').insert({
      user_id:            user.id,
      product_id:         product.id,
      product_title:      product.title,
      product_type:       product.type,
      product_reference:  product.reference,
      amount:             product.price,
      currency:           'RUB',
      status:             'pending',
      payment_provider:   'yookassa',
      provider_payment_id: payment.id,
    });

    // ── 7. Возвращаем URL для редиректа ───────────────────────────
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
  return Response.json({ ok: true, route: "create-payment" });
}
