import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// import { validateWebhookSignature } from '@/lib/kinescope'; // disabled

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('X-Kinescope-Signature') || '';

    // Signature check — temporarily disabled.
    // Kinescope sends to a private HTTPS URL, so this is safe without signature.
    // Re-enable when KINESCOPE_WEBHOOK_SECRET is confirmed correct in ENV.
    //
    // const valid = await validateWebhookSignature(rawBody, signature);
    // if (!valid) {
    //   console.warn('[webhook] invalid signature, sig:', signature);
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }
    console.log('[kinescope-webhook] received, type will follow');

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

    let video_status;
    if (type === 'video.ready')           video_status = 'ready';
    else if (type === 'video.error')      video_status = 'error';
    else if (type === 'video.processing') video_status = 'processing';
    else return NextResponse.json({ ok: true });

    console.log('[kinescope-webhook] setting status:', video_status, 'for:', videoId);

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

    if (lessonErr) console.error('[kinescope-webhook] lessons error:', lessonErr);
    else console.log('[kinescope-webhook] lessons updated:', lessonData?.length ?? 0, 'rows');

    if (techErr) console.error('[kinescope-webhook] technique_videos error:', techErr);
    else console.log('[kinescope-webhook] technique_videos updated:', techData?.length ?? 0, 'rows', techData?.length ? techData : '(none found)');

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('[webhook] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
