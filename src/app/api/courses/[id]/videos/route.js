/** POST /api/courses/[id]/videos — добавить фильм/урок в курс (admin) */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';
import { videoToSnake } from '../../shared.js';

export async function POST(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const last = await prisma.courseVideo.findFirst({
      where: { courseId: params.id }, orderBy: { sortOrder: 'desc' }, select: { sortOrder: true },
    });
    const video = await prisma.courseVideo.create({
      data: {
        courseId:    params.id,
        title:       body.title       || 'Новый урок',
        description: body.description || '',
        sortOrder:   body.sort_order  ?? ((last?.sortOrder ?? 0) + 1),
      },
    });
    return NextResponse.json({ ok: true, video: videoToSnake(video) }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
