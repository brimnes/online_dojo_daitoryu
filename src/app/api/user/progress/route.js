/**
 * GET  /api/user/progress — отметки «просмотрено» текущего пользователя
 *   → { watched: { [lessonId]: true } }
 *
 * POST /api/user/progress — переключить отметку
 *   Body: { lesson_id, watched: boolean }
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth } from '@/lib/auth-server.js';

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const rows = await prisma.lessonProgress.findMany({
    where:  { userId: user.id, watched: true },
    select: { lessonId: true },
  });

  const watched = {};
  for (const r of rows) watched[r.lessonId] = true;
  return NextResponse.json({ watched });
}

export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const { lesson_id, watched } = await request.json();
  if (!lesson_id) {
    return NextResponse.json({ error: 'lesson_id required' }, { status: 400 });
  }

  try {
    await prisma.lessonProgress.upsert({
      where:  { userId_lessonId: { userId: user.id, lessonId: lesson_id } },
      create: { userId: user.id, lessonId: lesson_id, watched: !!watched, watchedAt: watched ? new Date() : null },
      update: { watched: !!watched, watchedAt: watched ? new Date() : null },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[POST /api/user/progress]', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
