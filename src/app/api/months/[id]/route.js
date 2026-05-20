/** PATCH /api/months/[id] — обновить месяц (admin). Используется для toggleOpen и прочих правок. */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';

export async function PATCH(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json();
  const data = {};
  if (body.is_open   !== undefined) data.isOpen     = body.is_open;
  if (body.label     !== undefined) data.label      = body.label;
  if (body.kanji     !== undefined) data.kanji      = body.kanji;
  if (body.description !== undefined) data.description = body.description;

  try {
    const m = await prisma.month.update({ where: { id: params.id }, data });
    return NextResponse.json({ ok: true, month: { ...m, is_open: m.isOpen } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
