/**
 * POST /api/payments/webhook
 * Принимает события от YooKassa.
 * Валидация: Basic Auth (shopId:secretKey).
 * При payment.succeeded → вызывает RPC grant_access() через service role.
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// YooKassa IP ranges (актуальные на 2024–2025)
// Если хотите проверять IP — раскомментируйте ALLOWED_IPS и блок проверки ниже.
// const ALLOWED_IPS = [
//   '185.71.76.0/27', '185.71.77.0/27',
//   '77.75.153.0/25', '77.75.156.11', '77.75.156.35',
//   '77.75.154.128/25', '2a02:5180::/32',
// ];

function validateBasicAuth(req) {
  const shopId    = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  if (!shopId || !secretKey) return false;

  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Basic ')) return false;

  const decoded   = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
  const expected  = `${shopId}:${secretKey}`;
  return decoded === expected;
}

export async function POST(req) {
  // 1. Валидация Basic Auth
  if (!validateBasicAuth(req)) {
    console.warn('webhook: unauthorized attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let event;
  try {
    event = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 2. Обрабатываем только payment.succeeded
  if (event?.event !== 'payment.succeeded') {
    // Другие события игнорируем, возвращаем 200 чтобы YooKassa не ретраила
    return NextResponse.json({ ok: true });
  }

  const payment  = event.object;
  const metadata = payment?.metadata || {};
  const { user_id, type, reference } = metadata;
  const amount   = parseFloat(payment?.amount?.value || '0');

  if (!user_id || !type || !reference) {
    console.error('webhook: missing metadata', metadata);
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
  }

  // 3. Выдаём доступ через service role (только на сервере!)
  const supabaseUrl         = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('webhook: Supabase service role not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });

  // Вызываем RPC — SECURITY DEFINER функцию, она делает upsert
  const { error } = await supabase.rpc('grant_access', {
    p_user_id:   user_id,
    p_type:      type,
    p_reference: reference,
    p_amount:    amount,
  });

  if (error) {
    console.error('webhook: grant_access failed', error);
    // Возвращаем 500 → YooKassa сделает повторную попытку
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  console.log(`webhook: access granted user=${user_id} type=${type} ref=${reference}`);
  return NextResponse.json({ ok: true });
}
