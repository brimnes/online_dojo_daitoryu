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

    const updatePayload = { video_status };
    if (video_status === 'ready') {
      if (duration) updatePayload.video_duration = String(duration);
      if (poster)   updatePayload.video_poster_url = poster;
    }

    // Update lessons table
    const { error: lessonErr } = await supabaseAdmin
      .from('lessons')
      .update(updatePayload)
      .eq('video_id', videoId);

    // Update technique_videos table
    const { error: techErr } = await supabaseAdmin
      .from('technique_videos')
      .update(updatePayload)
      .eq('video_id', videoId);

    if (lessonErr) console.error('[webhook] lessons update:', lessonErr);
    if (techErr)   console.error('[webhook] technique_videos update:', techErr);

    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('[webhook] error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
