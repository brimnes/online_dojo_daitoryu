/**
 * GET /api/kinescope/video-status?videoId=<kinescope_video_id>
 *
 * Возвращает video_status из БД. Если статус 'processing' — дополнительно
 * проверяет реальный статус напрямую у Kinescope API и обновляет БД.
 * Так polling в KinescopePlayer работает без вебхука.
 *
 * Требует авторизации (любой залогиненный пользователь).
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth } from '@/lib/auth-server.js';

const API_SECRET = process.env.KINESCOPE_API_SECRET;

// Kinescope statuses: pending | uploading | pre-processing | processing | aborted | done | error
function mapStatus(kStatus) {
  if (!kStatus) return null;
  const s = kStatus.toLowerCase();
  if (s === 'done')                                            return 'ready';
  if (s === 'error' || s === 'aborted')                        return 'error';
  if (s === 'processing' || s === 'pre-processing'
    || s === 'pending')                                        return 'processing';
  if (s === 'uploading')                                       return 'uploading';
  return s;
}

async function syncFromKinescope(videoId) {
  if (!API_SECRET) return null;
  try {
    const res = await fetch(`https://api.kinescope.io/v1/videos/${videoId}`, {
      headers: { 'Authorization': `Bearer ${API_SECRET}` },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = json.data ?? json;
    const status = mapStatus(data.status);
    if (!status || status === 'processing' || status === 'uploading') return status;

    // Статус изменился — обновляем все три таблицы
    const lessonData    = { videoStatus: status };
    const techData      = { videoStatus: status };
    const knowledgeData = { videoStatus: status };
    if (status === 'ready') {
      if (data.duration)   { lessonData.videoDuration = String(data.duration); techData.duration = String(data.duration); }
      if (data.poster_url) { lessonData.videoPosterUrl = data.poster_url; }
    }
    await Promise.allSettled([
      prisma.lesson.updateMany({ where: { videoId }, data: lessonData }),
      prisma.techniqueVideo.updateMany({ where: { videoId }, data: techData }),
      prisma.knowledgeItem.updateMany({ where: { videoId }, data: knowledgeData }),
    ]);
    return status;
  } catch {
    return null;
  }
}

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
  }

  // Ищем во всех трёх таблицах параллельно
  const [lesson, techVideo, knowledgeItem] = await Promise.all([
    prisma.lesson.findFirst({
      where:  { videoId },
      select: { videoStatus: true },
    }),
    prisma.techniqueVideo.findFirst({
      where:  { videoId },
      select: { videoStatus: true },
    }),
    prisma.knowledgeItem.findFirst({
      where:  { videoId },
      select: { videoStatus: true },
    }),
  ]);

  let status = lesson?.videoStatus ?? techVideo?.videoStatus ?? knowledgeItem?.videoStatus ?? null;

  // Если статус всё ещё processing — проверяем Kinescope напрямую
  if (status === 'processing' || status === 'uploading') {
    const liveStatus = await syncFromKinescope(videoId);
    if (liveStatus) status = liveStatus;
  }

  return NextResponse.json({ status });
}
