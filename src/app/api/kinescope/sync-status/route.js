/**
 * POST /api/kinescope/sync-status
 *
 * Запрашивает реальный статус видео напрямую у Kinescope API
 * и обновляет video_status в БД — обходит вебхук.
 *
 * Body: { videoId: string }  — Kinescope video ID
 * Требует: admin
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';

const API_SECRET = process.env.KINESCOPE_API_SECRET;

// Kinescope status → наш статус
function mapStatus(kStatus) {
  if (!kStatus) return null;
  const s = kStatus.toLowerCase();
  if (s === 'ready' || s === 'processed') return 'ready';
  if (s === 'error' || s === 'failed')    return 'error';
  if (s === 'processing' || s === 'pending' || s === 'queued') return 'processing';
  if (s === 'uploading') return 'uploading';
  return s; // передаём как есть если неизвестный
}

export async function POST(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { videoId } = await request.json();
  if (!videoId) {
    return NextResponse.json({ error: 'videoId required' }, { status: 400 });
  }

  // Запрашиваем статус напрямую у Kinescope
  const kRes = await fetch(`https://api.kinescope.io/v1/videos/${videoId}`, {
    headers: { 'Authorization': `Bearer ${API_SECRET}` },
  });

  if (!kRes.ok) {
    const text = await kRes.text().catch(() => '');
    return NextResponse.json(
      { error: `Kinescope API → ${kRes.status}: ${text}` },
      { status: 502 }
    );
  }

  const json = await kRes.json();
  // Kinescope возвращает { data: { id, status, duration, ... } }
  const data   = json.data ?? json;
  const status = mapStatus(data.status);
  const duration = data.duration ? String(data.duration) : undefined;
  const poster   = data.poster_url ?? data.poster ?? undefined;

  if (!status) {
    return NextResponse.json({ error: 'Cannot determine status from Kinescope response', raw: json }, { status: 502 });
  }

  // Обновляем обе таблицы
  const lessonData = { videoStatus: status };
  const techData   = { videoStatus: status };
  if (status === 'ready') {
    if (duration) { lessonData.videoDuration = duration; techData.duration = duration; }
    if (poster)   { lessonData.videoPosterUrl = poster; }
  }

  const [lessonRes, techRes] = await Promise.allSettled([
    prisma.lesson.updateMany({ where: { videoId }, data: lessonData }),
    prisma.techniqueVideo.updateMany({ where: { videoId }, data: techData }),
  ]);

  const lessonCount = lessonRes.status === 'fulfilled' ? lessonRes.value.count : 0;
  const techCount   = techRes.status  === 'fulfilled' ? techRes.value.count  : 0;

  console.log(`[sync-status] videoId=${videoId} status=${status} lessons=${lessonCount} techs=${techCount}`);

  return NextResponse.json({ ok: true, status, lessonCount, techCount });
}
