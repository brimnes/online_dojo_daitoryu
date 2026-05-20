/**
 * GET /api/kinescope/video-status?videoId=<kinescope_video_id>
 *
 * Возвращает текущий video_status из БД по Kinescope video_id.
 * Используется KinescopePlayer для polling когда статус 'processing'.
 * Требует авторизации (любой залогиненный пользователь).
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth } from '@/lib/auth-server.js';

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
  }

  // Ищем в обеих таблицах параллельно
  const [lesson, techVideo] = await Promise.all([
    prisma.lesson.findFirst({
      where:  { videoId },
      select: { videoStatus: true },
    }),
    prisma.techniqueVideo.findFirst({
      where:  { videoId },
      select: { videoStatus: true },
    }),
  ]);

  const status = lesson?.videoStatus ?? techVideo?.videoStatus ?? null;

  return NextResponse.json({ status });
}
