/**
 * POST /api/kinescope/generate-poster
 *
 * Создаёт обложку из кадра видео (начало ролика, не первый кадр) и сохраняет её
 * в lessons.video_poster_url. Используется кнопкой «Обновить превью» в админке.
 *
 * Body: { lessonId?: string, videoId?: string }
 * Требует: admin
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';
import { generateFramePoster, savePosterForVideo } from '@/lib/kinescopePoster.js';

export const runtime = 'nodejs';

export async function POST(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { lessonId, videoId: bodyVideoId } = await request.json();

  let videoId = bodyVideoId;
  let durationSec;
  if (!videoId && lessonId) {
    const lesson = await prisma.lesson.findUnique({
      where:  { id: lessonId },
      select: { videoId: true, videoDuration: true },
    });
    videoId     = lesson?.videoId;
    durationSec = lesson?.videoDuration;
  }
  if (!videoId) {
    return NextResponse.json({ error: 'lessonId or videoId required' }, { status: 400 });
  }

  const posterUrl = await generateFramePoster(videoId, durationSec);
  if (!posterUrl) {
    return NextResponse.json({ ok: false, error: 'Kinescope не вернул готовую обложку' }, { status: 502 });
  }

  const updated = await savePosterForVideo(videoId, posterUrl);
  return NextResponse.json({ ok: true, posterUrl, updated });
}
