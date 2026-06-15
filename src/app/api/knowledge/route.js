/**
 * GET  /api/knowledge        — список опубликованных статей (auth); ?admin=1 — все (admin)
 * POST /api/knowledge        — создать статью (admin)
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth, requireAdmin } from '@/lib/auth-server.js';

function toSnake(k) {
  return {
    id: k.id, title: k.title, subtitle: k.subtitle, content: k.content,
    sort_order: k.sortOrder, is_published: k.isPublished,
    tag: k.tag ?? null,
    video_provider: k.videoProvider, video_id: k.videoId, video_status: k.videoStatus,
    created_at: k.createdAt, updated_at: k.updatedAt,
    attachments: (k.attachments ?? []).map(a => ({
      id: a.id, type: a.type, url: a.url, s3_key: a.s3Key,
      name: a.name, size: a.size, content_type: a.contentType, sort_order: a.sortOrder,
    })),
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const adminMode = searchParams.get('admin') === '1';

  if (adminMode) {
    const { error } = await requireAdmin(request);
    if (error) return error;
  } else {
    const { error } = await requireAuth(request);
    if (error) return error;
  }

  const where = adminMode ? {} : { isPublished: true };
  const items = await prisma.knowledgeItem.findMany({
    where,
    orderBy: { sortOrder: 'asc' },
    include: { attachments: { orderBy: { sortOrder: 'asc' } } },
  });
  return NextResponse.json(items.map(toSnake));
}

export async function POST(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const item = await prisma.knowledgeItem.create({
      data: {
        title:         body.title || 'Новая статья',
        subtitle:      body.subtitle      || '',
        content:       body.content       || '',
        sortOrder:     body.sort_order    ?? 0,
        isPublished:   body.is_published  ?? false,
        tag:           body.tag           || null,
        videoProvider: body.video_provider || null,
        videoId:       body.video_id       || null,
        videoStatus:   body.video_status   || 'none',
      },
    });
    return NextResponse.json({ ok: true, item: toSnake(item) }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
