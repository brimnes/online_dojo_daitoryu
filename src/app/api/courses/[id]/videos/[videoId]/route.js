/**
 * PUT    /api/courses/[id]/videos/[videoId] — обновить фильм/урок (admin)
 * DELETE /api/courses/[id]/videos/[videoId] — удалить фильм/урок (admin)
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';
import { videoToSnake } from '../../../shared.js';

export async function PUT(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const data = {};
    if (body.title          !== undefined) data.title         = body.title;
    if (body.subtitle       !== undefined) data.subtitle      = body.subtitle;
    if (body.description    !== undefined) data.description   = body.description;
    if (body.duration       !== undefined) data.duration      = body.duration || null;
    if (body.sort_order     !== undefined) data.sortOrder     = Number(body.sort_order) || 0;
    if (body.video_provider !== undefined) data.videoProvider = body.video_provider;
    if (body.video_id       !== undefined) data.videoId       = body.video_id || null;
    if (body.video_status   !== undefined) data.videoStatus   = body.video_status;

    const { count } = await prisma.courseVideo.updateMany({
      where: { id: params.videoId, courseId: params.id }, data,
    });
    if (!count) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const video = await prisma.courseVideo.findUnique({ where: { id: params.videoId } });
    return NextResponse.json({ ok: true, video: videoToSnake(video) });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    await prisma.courseVideo.deleteMany({ where: { id: params.videoId, courseId: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
