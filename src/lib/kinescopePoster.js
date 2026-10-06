import { prisma } from '@/lib/prisma.js';

const API  = 'https://api.kinescope.io/v1';
const POLL_INTERVAL_MS = 2000;
const POLL_ATTEMPTS    = 10;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Начало ролика, но не первый кадр: ~10% длительности, от 3 до 15 секунд.
export function pickFrameTime(durationSec) {
  const d = Number(durationSec);
  if (!Number.isFinite(d) || d <= 0) return 3;
  if (d < 6) return 1;
  return Math.round(Math.min(15, Math.max(3, d * 0.1)));
}

async function kFetch(path, init = {}) {
  const secret = process.env.KINESCOPE_API_SECRET;
  if (!secret) throw new Error('KINESCOPE_API_SECRET is not set');
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Kinescope ${init.method || 'GET'} ${path} → ${res.status}: ${text}`);
  }
  const json = await res.json().catch(() => ({}));
  return json?.data ?? json;
}

async function listPosters(videoId) {
  const data = await kFetch(`/videos/${videoId}/posters`);
  return Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
}

const isDone = (p) => !!p && (p.status === 'done' || (!p.status && !!p.original));

/**
 * Создаёт (или переиспользует) постер из кадра видео и делает его активным.
 * Возвращает URL оригинала или null, если не вышло — вызывающий оставляет прежний постер.
 */
export async function generateFramePoster(videoId, durationSec) {
  try {
    let duration = Number(durationSec);
    if (!Number.isFinite(duration) || duration <= 0) {
      const video = await kFetch(`/videos/${videoId}`);
      duration = Number(video?.duration);
    }
    const fromTime = pickFrameTime(duration);

    const existing = (await listPosters(videoId)).find(
      (p) => p.type !== 'video' && Math.abs(Number(p.from_time) - fromTime) < 0.5 && isDone(p),
    );

    let poster = existing;
    if (!poster) {
      const created = await kFetch(`/videos/${videoId}/posters`, {
        method: 'POST',
        body: JSON.stringify({ from_time: fromTime }),
      });
      poster = created;
      for (let i = 0; i < POLL_ATTEMPTS && !isDone(poster); i++) {
        await sleep(POLL_INTERVAL_MS);
        poster = (await listPosters(videoId)).find((p) => p.id === created.id) || poster;
      }
    }

    if (!isDone(poster) || !poster.original) return null;

    if (!poster.active) {
      await kFetch(`/videos/${videoId}/posters/${poster.id}/active`, { method: 'POST' });
    }
    return poster.original;
  } catch (err) {
    console.error('[kinescope-poster]', videoId, err.message);
    return null;
  }
}

export async function savePosterForVideo(videoId, url) {
  if (!url) return 0;
  const { count } = await prisma.lesson.updateMany({ where: { videoId }, data: { videoPosterUrl: url } });
  return count;
}

// Фоновый запуск: не блокирует ответ вебхука / админского запроса.
export function generatePosterInBackground(videoId, durationSec) {
  generateFramePoster(videoId, durationSec)
    .then((url) => savePosterForVideo(videoId, url))
    .catch((err) => console.error('[kinescope-poster] background', videoId, err.message));
}
