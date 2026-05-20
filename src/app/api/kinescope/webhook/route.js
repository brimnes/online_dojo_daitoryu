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
    const duration = data?.duration;
    const poster   = data?.poster_url;

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

    // lessons: поля videoDuration, videoPosterUrl
    const lessonData = { videoStatus };
    if (videoStatus === 'ready') {
      if (duration) lessonData.videoDuration   = String(duration);
      if (poster)   lessonData.videoPosterUrl  = poster;
    }

    // technique_videos: поле duration (не videoDuration!)
    const techData = { videoStatus };
    if (videoStatus === 'ready') {
      if (duration) techData.duration = String(duration);
    }

    // Обновляем обе таблицы параллельно
    const [lessonResult, techResult] = await Promise.allSettled([
      prisma.lesson.updateMany({ where: { videoId }, data: lessonData }),
      prisma.techniqueVideo.updateMany({ where: { videoId }, data: techData }),
    ]);

    console.log('[kinescope-webhook] lessons:',
      lessonResult.status === 'fulfilled' ? lessonResult.value.count : lessonResult.reason
    );
    console.log('[kinescope-webhook] technique_videos:',
      techResult.status === 'fulfilled' ? techResult.value.count : techResult.reason
    );

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('[kinescope-webhook] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
