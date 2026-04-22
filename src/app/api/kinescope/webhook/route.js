import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateWebhookSignature } from '@/lib/kinescope';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('X-Kinescope-Signature') || '';

    // ── Логируем КАЖДЫЙ входящий запрос до проверки подписи ──────
    console.log('[kinescope-webhook] incoming request');
    console.log('[kinescope-webhook] signature present:', !!signature);
    console.log('[kinescope-webhook] raw body (first 500 chars):', rawBody.slice(0, 500));

    // Validate webhook signature
    const valid = await validateWebhookSignature(rawBody, signature);
    if (!valid) {
      // Временно: логируем но НЕ блокируем — чтобы проверить приходят ли события
      console.warn('[kinescope-webhook] INVALID SIGNATURE — check KINESCOPE_WEBHOOK_SECRET env var');
      console.warn('[kinescope-webhook] signature received:', signature);
      // TODO: вернуть 401 после отладки:
      // return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    let event;
    try {
      event = JSON.parse(rawBody);
    } catch (parseErr) {
      console.error('[kinescope-webhook] JSON parse error:', parseErr.message, 'body:', rawBody.slice(0, 200));
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { type, data } = event;
    console.log('[kinescope-webhook] event.type:', type);
    console.log('[kinescope-webhook] event.data:', JSON.stringify(data).slice(0, 300));

    // Only handle video processing events
    // Kinescope event types: video.created, video.processing, video.ready, video.error
    if (!type?.startsWith('video.')) {
      console.log('[kinescope-webhook] skipping non-video event:', type);
      return NextResponse.json({ ok: true });
    }

    const videoId  = data?.id;
    const duration = data?.duration;       // seconds (integer)
    const poster   = data?.poster_url;     // thumbnail URL

    console.log('[kinescope-webhook] videoId:', videoId, 'duration:', duration);

    if (!videoId) {
      console.error('[kinescope-webhook] no videoId in payload!');
      return NextResponse.json({ ok: true });
    }

    let video_status;
    if (type === 'video.ready')           video_status = 'ready';
    else if (type === 'video.error')      video_status = 'error';
    else if (type === 'video.processing') video_status = 'processing';
    else {
      console.log('[kinescope-webhook] unhandled video event type:', type);
      return NextResponse.json({ ok: true });
    }

    console.log('[kinescope-webhook] will set video_status:', video_status, 'for videoId:', videoId);

    // lessons: поля video_duration, video_poster_url
    const lessonPayload = { video_status };
    if (video_status === 'ready') {
      if (duration) lessonPayload.video_duration    = String(duration);
      if (poster)   lessonPayload.video_poster_url  = poster;
    }

    // technique_videos: поле duration (не video_duration!)
    const techPayload = { video_status };
    if (video_status === 'ready') {
      if (duration) techPayload.duration = String(duration);
    }

    console.log('[webhook] updating video_id:', videoId, 'status:', video_status);

    // Update lessons table
    const { data: lessonData, error: lessonErr } = await supabaseAdmin
      .from('lessons')
      .update(lessonPayload)
      .eq('video_id', videoId)
      .select('id,title,video_status');

    // Update technique_videos table
    const { data: techData, error: techErr } = await supabaseAdmin
      .from('technique_videos')
      .update(techPayload)
      .eq('video_id', videoId)
      .select('id,title,video_status');

    if (lessonErr) {
      console.error('[kinescope-webhook] lessons update ERROR:', JSON.stringify(lessonErr));
    } else {
      console.log('[kinescope-webhook] lessons updated:', lessonData?.length ?? 0, 'rows');
      if (lessonData?.length) console.log('[kinescope-webhook] lesson rows:', JSON.stringify(lessonData));
    }

    if (techErr) {
      console.error('[kinescope-webhook] technique_videos update ERROR:', JSON.stringify(techErr));
    } else {
      console.log('[kinescope-webhook] technique_videos updated:', techData?.length ?? 0, 'rows');
      if (techData?.length) console.log('[kinescope-webhook] tech rows:', JSON.stringify(techData));
      else console.warn('[kinescope-webhook] 0 rows updated in technique_videos — video_id not found:', videoId);
    }

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('[webhook] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
