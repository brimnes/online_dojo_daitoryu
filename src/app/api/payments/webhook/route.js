/**
 * POST /api/payments/webhook
 *
 * ⚠️  УСТАРЕЛ — не использовать.
 *
 * Этот эндпоинт несовместим с текущим flow оплаты:
 * он ожидал поля `type` и `reference` в metadata напрямую,
 * но /api/yookassa/create-payment передаёт только `product_id`.
 *
 * Актуальный вебхук: POST /api/yookassa/webhook
 *
 * Возвращает 200 без действий, чтобы ЮKassa не ретраила запросы,
 * если URL был когда-либо зарегистрирован.
 */

import { NextResponse } from 'next/server';

export async function POST(request) {
  console.warn('[payments/webhook] DEPRECATED — используйте /api/yookassa/webhook');
  return NextResponse.json({ ok: true, deprecated: true });
}
