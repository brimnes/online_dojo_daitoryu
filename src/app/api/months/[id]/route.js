/**
 * PATCH /api/months/[id] — обновить месяц (admin). Используется для toggleOpen и прочих правок.
 *
 * Месяцы jan–may (sortOrder 1–5) скрыты из UI. Прямые PATCH-запросы к ним разрешены
 * только администраторам — публичный GET /api/months их не возвращает.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';

// Месяцы, скрытые из публичного UI (sort_order 1–5)
const HIDDEN_MONTH_IDS = new Set(['jan', 'feb', 'mar', 'apr', 'may']);

export async function GET(request, { params }) {
  // Прямой GET к скрытому месяцу → 404 для обычных пользователей
  if (HIDDEN_MONTH_IDS.has(params.id)) {
    return NextResponse.json({ error: 'Месяц недоступен' }, { status: 404 });
  }
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PATCH(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json();
  const data = {};
  if (body.is_open       !== undefined) data.isOpen       = body.is_open;
  if (body.label         !== undefined) data.label        = body.label;
  if (body.kanji         !== undefined) data.kanji        = body.kanji;
  if (body.modal_theme   !== undefined) data.modalTheme   = body.modal_theme;
  if (body.modal_topics  !== undefined) data.modalTopics  = body.modal_topics;
  if (body.modal_results !== undefined) data.modalResults = body.modal_results;
  if (body.modal_extras  !== undefined) data.modalExtras  = body.modal_extras;

  try {
    const m = await prisma.month.update({ where: { id: params.id }, data });
    return NextResponse.json({ ok: true, month: { ...m, is_open: m.isOpen } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
