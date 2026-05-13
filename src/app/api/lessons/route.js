/**
 * GET  /api/lessons?month_id=X  — уроки месяца
 * POST /api/lessons              — создать урок (admin)
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth, requireAdmin } from '@/lib/auth-server.js';

function toSnake(l) {
  return {
    id: l.id, month_id: l.monthId, num: l.num,
    title: l.title, subtitle: l.subtitle, text: l.text,
    duration: l.duration, video_url: l.videoUrl,
    video_provider: l.videoProvider, video_id: l.videoId,
    video_status: l.videoStatus, video_poster_url: l.videoPosterUrl,
    video_duration: l.videoDuration, sort_order: l.sortOrder,
    created_at: l.createdAt,
  };
}

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const monthId = searchParams.get('month_id');
  if (!monthId) return NextResponse.json({ error: 'month_id required' }, { status: 400 });

  const lessons = await prisma.lesson.findMany({
    where: { monthId },
    orderBy: { num: 'asc' },
  });
  return NextResponse.json(lessons.map(toSnake));
}

export async function POST(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { month_id } = body;
    if (!month_id) return NextResponse.json({ error: 'month_id required' }, { status: 400 });

    const count = await prisma.lesson.count({ where: { monthId: month_id } });
    const num   = count + 1;
    const id    = `${month_id}-${Date.now()}`;

    const lesson = await prisma.lesson.create({
      data: {
        id, monthId: month_id, num,
        title: 'Новый урок', subtitle: '', text: '',
        duration: '00:00', videoUrl: '',
      },
    });
    return NextResponse.json({ ok: true, lesson: toSnake(lesson) }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
