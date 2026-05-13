/**
 * PATCH  /api/lessons/[id] — сохранить урок (admin)
 * DELETE /api/lessons/[id] — удалить урок (admin)
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';

export async function PATCH(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const data = {};
    if (body.title         !== undefined) data.title         = body.title;
    if (body.subtitle      !== undefined) data.subtitle      = body.subtitle;
    if (body.text          !== undefined) data.text          = body.text;
    if (body.duration      !== undefined) data.duration      = body.duration;
    if (body.video_url     !== undefined) data.videoUrl      = body.video_url;
    if (body.video_id      !== undefined) data.videoId       = body.video_id;
    if (body.video_status  !== undefined) data.videoStatus   = body.video_status;
    if (body.video_provider !== undefined) data.videoProvider = body.video_provider;
    if (body.video_poster_url !== undefined) data.videoPosterUrl = body.video_poster_url;
    if (body.video_duration   !== undefined) data.videoDuration  = body.video_duration;

    await prisma.lesson.update({ where: { id: params.id }, data });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    // Каскадное удаление настроено в schema.prisma (onDelete: Cascade)
    await prisma.lesson.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
