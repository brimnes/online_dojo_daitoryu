/**
 * GET  /api/admin/news — все новости (включая скрытые) + сколько прочитали
 * POST /api/admin/news — объявление: { title, body, link_type, link_ref, push }
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';
import { newsToSnake, publishNews } from '@/lib/news.js';

const LINK_TYPES = new Set(['month', 'knowledge', 'course', 'url']);

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;
  const news = await prisma.news.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    include: { _count: { select: { reads: true } } },
  });
  return NextResponse.json(news.map(n => ({ ...newsToSnake(n), read_count: n._count.reads })));
}

export async function POST(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const b = await request.json().catch(() => ({}));
  const title = String(b.title || '').trim();
  if (!title) return NextResponse.json({ error: 'Нужен заголовок' }, { status: 400 });
  const linkType = LINK_TYPES.has(b.link_type) && String(b.link_ref || '').trim() ? b.link_type : null;

  const news = await publishNews({
    kind: 'announcement',
    title: title.slice(0, 120),
    body: String(b.body || '').trim().slice(0, 400),
    linkType,
    linkRef: linkType ? String(b.link_ref).trim() : null,
    push: b.push !== false,
  });
  if (!news) return NextResponse.json({ error: 'Не удалось сохранить новость' }, { status: 500 });
  return NextResponse.json({ ok: true, news: { ...newsToSnake(news), read_count: 0 } }, { status: 201 });
}
