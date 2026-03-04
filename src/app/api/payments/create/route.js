/**
 * POST /api/payments/create
 * Тело: { type: 'month'|'section', reference: 'jan'|...|'ikkajo' }
 * Создаёт платёж в YooKassa и возвращает { confirmation_url }
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const PRICE_MONTH  = '1990.00';
const PRICE_IKKAJO = '2900.00';

const PRODUCT_LABELS = {
  month:   { jan:'Январь', feb:'Февраль', mar:'Март', apr:'Апрель',
             may:'Май',    jun:'Июнь',    jul:'Июль', aug:'Август',
             sep:'Сентябрь', oct:'Октябрь', nov:'Ноябрь', dec:'Декабрь' },
  section: { ikkajo:'Иккаджо — база техник' },
};

function getAmount(type, reference) {
  if (type === 'section') return PRICE_IKKAJO;
  return PRICE_MONTH;
}

function getDescription(type, reference) {
  const label = PRODUCT_LABELS[type]?.[reference] || reference;
  return type === 'month'
    ? `Доступ к урокам: ${label} 2026`
    : `Доступ к базе техник: ${label}`;
}

export async function POST(req) {
  try {
    // 1. Получаем тело запроса
    const { type, reference } = await req.json();
    if (!type || !reference) {
      return NextResponse.json({ error: 'type and reference required' }, { status: 400 });
    }

    // 2. Проверяем авторизацию через Supabase (серверный клиент с anon key + cookie)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Читаем JWT из Authorization header (клиент должен передать его)
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Проверяем credentials YooKassa
    const shopId    = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;
    if (!shopId || !secretKey) {
      return NextResponse.json({ error: 'Payment provider not configured' }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    // 4. Создаём платёж в YooKassa
    const idempotenceKey = uuidv4();
    const amount = getAmount(type, reference);
    const description = getDescription(type, reference);

    const ykResponse = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'Idempotence-Key': idempotenceKey,
        'Authorization':   'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64'),
      },
      body: JSON.stringify({
        amount: { value: amount, currency: 'RUB' },
        description,
        metadata: { user_id: user.id, type, reference },
        confirmation: {
          type:       'redirect',
          return_url: `${baseUrl}/payment/success?type=${type}&ref=${reference}`,
        },
        capture: true,
      }),
    });

    if (!ykResponse.ok) {
      const err = await ykResponse.json();
      console.error('YooKassa error:', err);
      return NextResponse.json({ error: 'Payment creation failed', details: err }, { status: 502 });
    }

    const payment = await ykResponse.json();
    return NextResponse.json({
      payment_id:       payment.id,
      confirmation_url: payment.confirmation.confirmation_url,
    });

  } catch (e) {
    console.error('create payment error:', e);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
