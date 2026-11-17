/**
 * PUT    /api/admin/news/[id] — правка: { title, body, is_hidden }
 * DELETE /api/admin/news/[id]
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';
import { newsToSnake } from '@/lib/news.js';

export async function PUT(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  const b = await request.json().catch(() => ({}));
  const data = {};
  if (b.title     !== undefined) data.title    = String(b.title).trim().slice(0, 120) || 'Новость';
  if (b.body      !== undefined) data.body     = String(b.body).trim().slice(0, 400);
  if (b.is_hidden !== undefined) data.isHidden = !!b.is_hidden;
  try {
    const n = await prisma.news.update({ where: { id: params.id }, data, include: { _count: { select: { reads: true } } } });
    return NextResponse.json({ ok: true, news: { ...newsToSnake(n), read_count: n._count.reads } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  // Автоновость не удаляем, а скрываем: иначе при повторном открытии
  // месяца/публикации статьи она создастся и разошлётся заново
  const n = await prisma.news.findUnique({ where: { id: params.id }, select: { autoKey: true } });
  if (!n) return NextResponse.json({ ok: true });
  if (n.autoKey) await prisma.news.update({ where: { id: params.id }, data: { isHidden: true } });
  else await prisma.news.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
