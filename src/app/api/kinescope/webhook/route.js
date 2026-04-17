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

    // Validate webhook signature
    const valid = await validateWebhookSignature(rawBody, signature);
    if (!valid) {
      console.warn('[webhook] invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const { type, data } = event;

    // Only handle video processing events
    // Kinescope event types: video.created, video.processing, video.ready, video.error
    if (!type?.startsWith('video.')) {
      return NextResponse.json({ ok: true });
    }

    const videoId  = data?.id;
    const duration = data?.duration;       // seconds (integer)
    const poster   = data?.poster_url;     // thumbnail URL

    if (!videoId) {
      return NextResponse.json({ ok: true });
    }

    let video_status;
    if (type === 'video.ready')      video_status = 'ready';
    else if (type === 'video.error') video_status = 'error';
    else if (type === 'video.processing') video_status = 'processing';
    else return NextResponse.json({ ok: true });

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

    if (lessonErr) console.error('[webhook] lessons update error:', lessonErr);
    else console.log('[webhook] lessons updated:', lessonData?.length, 'rows', lessonData);

    if (techErr)   console.error('[webhook] technique_videos update error:', techErr);
    else console.log('[webhook] technique_videos updated:', techData?.length, 'rows', techData);

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('[webhook] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
