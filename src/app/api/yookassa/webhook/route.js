// src/app/api/yookassa/webhook/route.js
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Типы контента для user_access
const MONTH_REFS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

export async function POST(req) {
  try {
    const body = await req.json();
    console.log('[YooKassa webhook] event:', body.event, 'payment_id:', body.object?.id);

    // ── Обрабатываем только payment.succeeded ─────────────────────
    if (body.event !== 'payment.succeeded') {
      return Response.json({ ok: true });
    }

    const payment  = body.object;
    const paymentId = payment?.id;
    const meta     = payment?.metadata || {};
    const userId   = meta.user_id;
    const productId = meta.product_id;

    if (!paymentId || !userId || !productId) {
      console.error('[webhook] missing required fields', { paymentId, userId, productId });
      return Response.json({ error: 'Missing fields' }, { status: 400 });
    }

    // ── Защита от дублей по provider_payment_id ───────────────────
    const { data: existing } = await supabaseAdmin
      .from('payments')
      .select('id, status')
      .eq('provider_payment_id', paymentId)
      .maybeSingle();

    if (existing?.status === 'succeeded') {
      console.log('[webhook] already processed, skipping:', paymentId);
      return Response.json({ ok: true });
    }

    // ── Находим продукт ───────────────────────────────────────────
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();

    if (!product) {
      console.error('[webhook] product not found:', productId);
      return Response.json({ error: 'Product not found' }, { status: 404 });
    }

    const paidAt = new Date().toISOString();

    // ── Обновляем/создаём запись в payments ───────────────────────
    if (existing) {
      await supabaseAdmin
        .from('payments')
        .update({
          status:      'succeeded',
          paid_at:     paidAt,
          raw_payload: body,
        })
        .eq('provider_payment_id', paymentId);
    } else {
      await supabaseAdmin.from('payments').insert({
        user_id:             userId,
        product_id:          productId,
        product_title:       product.title,
        product_type:        product.type,
        product_reference:   product.reference,
        amount:              product.price,
        currency:            'RUB',
        status:              'succeeded',
        payment_provider:    'yookassa',
        provider_payment_id: paymentId,
        paid_at:             paidAt,
        raw_payload:         body,
      });
    }

    // ── Выдаём доступ через user_access ──────────────────────────
    // Определяем type: месяцы → 'month', разделы Ikkajo → 'section'
    const accessType = MONTH_REFS.includes(product.reference) ? 'month' : 'section';

    // upsert — безопасно если доступ уже выдан
    const { error: accessError } = await supabaseAdmin
      .from('user_access')
      .upsert(
        {
          user_id:   userId,
          type:      accessType,
          reference: product.reference,
          paid_at:   paidAt,
          amount:    product.price,
        },
        { onConflict: 'user_id,type,reference' }
      );

    if (accessError) {
      console.error('[webhook] failed to grant access:', accessError);
      // Не возвращаем ошибку ЮKassa — платёж принят, разберёмся вручную
    } else {
      console.log(`[webhook] access granted: user=${userId} type=${accessType} ref=${product.reference}`);
    }

    return Response.json({ ok: true });

  } catch (err) {
    console.error('[webhook] unexpected error:', err);
    // Возвращаем 200 чтобы ЮKassa не ретраила бесконечно
    return Response.json({ ok: true });
  }
}
