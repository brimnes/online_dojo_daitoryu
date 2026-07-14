/**
 * /api/robokassa/webhook — Result URL Робокассы
 *
 * Робокасса шлёт OutSum, InvId, SignatureValue — методом GET или POST
 * (выбирается в личном кабинете при настройке Result URL, поддерживаем оба).
 * Подпись проверяется Паролем #2. В отличие от ЮKassa, обязательный формат
 * ответа — НЕ JSON, а текст "OK{InvId}", иначе Робокасса будет ретраить.
 */

import { prisma } from '@/lib/prisma.js';
import { verifyResultSignature } from '@/lib/robokassa.js';

const MONTH_REFS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

async function handleResult(params) {
  const outSum         = params.get('OutSum');
  const invId          = params.get('InvId');
  const signatureValue = params.get('SignatureValue');

  console.log('[robokassa webhook] HIT — InvId:', invId, '| OutSum:', outSum);

  if (!outSum || !invId || !signatureValue) {
    console.error('[robokassa webhook] missing required fields');
    return new Response('bad request', { status: 400 });
  }

  const valid = verifyResultSignature({ outSum, invId, signatureValue });
  if (!valid) {
    console.error('[robokassa webhook] invalid signature for InvId:', invId);
    return new Response('bad signature', { status: 400 });
  }

  const providerPaymentId = String(invId);

  const existing = await prisma.payment.findUnique({
    where:  { providerPaymentId },
    select: { id: true, status: true, userId: true, productId: true, productReference: true, amount: true },
  });

  if (!existing) {
    console.error('[robokassa webhook] payment not found:', providerPaymentId);
    // Отвечаем OK всё равно — Робокасса не должна ретраить неизвестный InvId бесконечно
    return new Response(`OK${invId}`);
  }

  if (existing.status === 'succeeded') {
    console.log('[robokassa webhook] already processed, skipping:', providerPaymentId);
    return new Response(`OK${invId}`);
  }

  const paidAt = new Date();

  await prisma.payment.update({
    where: { providerPaymentId },
    data:  { status: 'succeeded', paidAt, rawPayload: { outSum, invId, signatureValue } },
  });

  const accessType = MONTH_REFS.includes(existing.productReference) ? 'month' : 'section';

  try {
    await prisma.userAccess.upsert({
      where: {
        userId_type_reference: { userId: existing.userId, type: accessType, reference: existing.productReference },
      },
      create: {
        userId:    existing.userId,
        type:      accessType,
        reference: existing.productReference,
        paidAt,
        amount:    Math.round(Number(existing.amount ?? outSum)),
        source:    'robokassa',
      },
      update: {
        paidAt,
        amount: Math.round(Number(existing.amount ?? outSum)),
        source: 'robokassa',
      },
    });
    console.log(`[robokassa webhook] access granted: user=${existing.userId} type=${accessType} ref=${existing.productReference}`);
  } catch (accessErr) {
    console.error('[robokassa webhook] failed to grant access:', accessErr);
    // Не возвращаем ошибку Робокассе — платёж принят, разберёмся вручную
  }

  return new Response(`OK${invId}`);
}

export async function POST(request) {
  try {
    const rawBody = await request.text();
    return await handleResult(new URLSearchParams(rawBody));
  } catch (err) {
    console.error('[robokassa webhook] unexpected error:', err);
    // Всё равно 200, чтобы Робокасса не ретраила бесконечно из-за наших внутренних ошибок
    return new Response('OK', { status: 200 });
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    return await handleResult(searchParams);
  } catch (err) {
    console.error('[robokassa webhook] unexpected error:', err);
    return new Response('OK', { status: 200 });
  }
}
