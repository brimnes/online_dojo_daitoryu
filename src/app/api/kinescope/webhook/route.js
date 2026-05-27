/**
 * POST /api/kinescope/webhook
 *
 * Принимает события от Kinescope (video.ready, video.error, video.processing).
 * Обновляет video_status в таблицах lessons и technique_videos.
 *
 * Signature check отключён — включить когда KINESCOPE_WEBHOOK_SECRET будет в ENV.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
// import { validateWebhookSignature } from '@/lib/kinescope'; // disabled

export async function POST(request) {
  try {
    const rawBody  = await request.text();
    // const signature = request.headers.get('X-Kinescope-Signature') || '';
    // const valid = await validateWebhookSignature(rawBody, signature);
    // if (!valid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });

    console.log('[kinescope-webhook] received');

    const event = JSON.parse(rawBody);
    const { type, data } = event;

    console.log('[kinescope-webhook] event.type:', type, '| video.id:', data?.id);

    if (!type?.startsWith('video.')) {
      return NextResponse.json({ ok: true });
    }

    const videoId  = data?.id;
    const duration = data?.duration;  // секунды (число) от Kinescope
    const poster   = data?.poster_url;

    // Конвертация секунд → "MM:SS" или "H:MM:SS"
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
    const durationFmt = fmtDuration(duration);

    if (!videoId) {
      console.error('[kinescope-webhook] no videoId in payload');
      return NextResponse.json({ ok: true });
    }

    let videoStatus;
    if      (type === 'video.ready')      videoStatus = 'ready';
    else if (type === 'video.error')      videoStatus = 'error';
    else if (type === 'video.processing') videoStatus = 'processing';
    else return NextResponse.json({ ok: true });

    console.log('[kinescope-webhook] setting status:', videoStatus, 'for:', videoId);

    // lessons: videoDuration (сырые сек) + duration (читаемый формат) + poster
    const lessonData = { videoStatus };
    if (videoStatus === 'ready') {
      if (duration)    lessonData.videoDuration  = String(duration);
      if (durationFmt) lessonData.duration       = durationFmt;  // автозаполняем поле длительности
      if (poster)      lessonData.videoPosterUrl = poster;
    }

    // technique_videos: поле duration
    const techData = { videoStatus };
    if (videoStatus === 'ready') {
      if (durationFmt) techData.duration = durationFmt;
    }

    // knowledge_items: только videoStatus
    const knowledgeData = { videoStatus };

    // Обновляем все три таблицы параллельно
    const [lessonResult, techResult, knowledgeResult] = await Promise.allSettled([
      prisma.lesson.updateMany({ where: { videoId }, data: lessonData }),
      prisma.techniqueVideo.updateMany({ where: { videoId }, data: techData }),
      prisma.knowledgeItem.updateMany({ where: { videoId }, data: knowledgeData }),
    ]);

    console.log('[kinescope-webhook] lessons:',
      lessonResult.status === 'fulfilled' ? lessonResult.value.count : lessonResult.reason
    );
    console.log('[kinescope-webhook] technique_videos:',
      techResult.status === 'fulfilled' ? techResult.value.count : techResult.reason
    );
    console.log('[kinescope-webhook] knowledge_items:',
      knowledgeResult.status === 'fulfilled' ? knowledgeResult.value.count : knowledgeResult.reason
    );

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('[kinescope-webhook] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
