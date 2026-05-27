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
// Kinescope statuses: pending | uploading | pre-processing | processing | aborted | done | error
function mapStatus(kStatus) {
  if (!kStatus) return null;
  const s = kStatus.toLowerCase();
  if (s === 'done')                                      return 'ready';       // ✓ готово
  if (s === 'error' || s === 'aborted')                  return 'error';       // ✗ ошибка
  if (s === 'processing' || s === 'pre-processing'
    || s === 'pending')                                  return 'processing';  // ⏳ обрабатывается
  if (s === 'uploading')                                 return 'uploading';   // ⬆ загружается
  return s;
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
  const durationSec = data.duration;
  const poster      = data.poster_url ?? data.poster ?? undefined;

  if (!status) {
    return NextResponse.json({ error: 'Cannot determine status from Kinescope response', raw: json }, { status: 502 });
  }

  // Секунды → "MM:SS" / "H:MM:SS"
  function fmtDuration(secs) {
    if (!secs) return null;
    const s = Math.round(Number(secs));
    if (isNaN(s) || s <= 0) return null;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  }
  const durationFmt = fmtDuration(durationSec);

  // Обновляем все три таблицы
  const lessonData    = { videoStatus: status };
  const techData      = { videoStatus: status };
  const knowledgeData = { videoStatus: status };
  if (status === 'ready') {
    if (durationSec) lessonData.videoDuration = String(durationSec);
    if (durationFmt) { lessonData.duration = durationFmt; techData.duration = durationFmt; }
    if (poster)      lessonData.videoPosterUrl = poster;
  }

  const [lessonRes, techRes, knowledgeRes] = await Promise.allSettled([
    prisma.lesson.updateMany({ where: { videoId }, data: lessonData }),
    prisma.techniqueVideo.updateMany({ where: { videoId }, data: techData }),
    prisma.knowledgeItem.updateMany({ where: { videoId }, data: knowledgeData }),
  ]);

  const lessonCount    = lessonRes.status    === 'fulfilled' ? lessonRes.value.count    : 0;
  const techCount      = techRes.status      === 'fulfilled' ? techRes.value.count      : 0;
  const knowledgeCount = knowledgeRes.status === 'fulfilled' ? knowledgeRes.value.count : 0;

  console.log(`[sync-status] videoId=${videoId} status=${status} lessons=${lessonCount} techs=${techCount} knowledge=${knowledgeCount}`);

  return NextResponse.json({ ok: true, status, lessonCount, techCount, knowledgeCount });
}
