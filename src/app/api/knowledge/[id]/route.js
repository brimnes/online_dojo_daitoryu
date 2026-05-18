/**
 * GET    /api/knowledge/[id] — опубликованная статья (auth)
 * PUT    /api/knowledge/[id] — обновить статью (admin)
 * DELETE /api/knowledge/[id] — удалить статью (admin)
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
  };
}

export async function GET(request, { params }) {
  const { error } = await requireAuth(request);
  if (error) return error;

  try {
    const item = await prisma.knowledgeItem.findFirst({
      where: { id: params.id, isPublished: true },
    });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(toSnake(item));
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const data = {};
    if (body.title         !== undefined) data.title         = body.title;
    if (body.subtitle      !== undefined) data.subtitle      = body.subtitle;
    if (body.content       !== undefined) data.content       = body.content;
    if (body.sort_order    !== undefined) data.sortOrder     = body.sort_order;
    if (body.is_published  !== undefined) data.isPublished   = body.is_published;
    if (body.tag           !== undefined) data.tag           = body.tag || null;
    if (body.video_provider !== undefined) data.videoProvider = body.video_provider;
    if (body.video_id      !== undefined) data.videoId       = body.video_id;
    if (body.video_status  !== undefined) data.videoStatus   = body.video_status;

    const item = await prisma.knowledgeItem.update({ where: { id: params.id }, data });
    return NextResponse.json({ ok: true, item: toSnake(item) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    await prisma.knowledgeItem.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
