import { NextResponse }          from 'next/server';
import { createClient }          from '@supabase/supabase-js';
import { createUploadSession, toAsciiSafe } from '@/lib/kinescope';

/**
 * POST /api/kinescope/upload-url
 *
 * Accepts: application/json
 *   lessonId          — string (one of these two required)
 *   techniqueVideoId  — string
 *   title             — string  (русский — ok, конвертируем в ASCII для Kinescope)
 *   filename          — string  (оригинальное имя файла)
 *   filesize          — number  (bytes)
 *   parentId          — string  (optional Kinescope folder)
 *
 * Flow:
 *   1. Verify admin
 *   2. Call Kinescope POST /v2/init — get videoId + TUS uploadUrl
 *   3. Save video_id / video_status='uploading' to Supabase
 *      (НЕ затирает title/subtitle/description — только video_ поля)
 *   4. Return { videoId, uploadUrl } to client
 *
 * The FILE is never sent through this route.
 * Client uploads directly to Kinescope via tus-js-client.
 */

export const runtime = 'nodejs';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Extract real client IP from Next.js request headers
function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export async function POST(request) {
  try {
    // ── 1. Auth ──────────────────────────────────────────────────
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.slice(7);

    const { data: { user }, error: authError } =
      await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // ── 2. Parse body ────────────────────────────────────────────
    const body             = await request.json();
    const { lessonId, techniqueVideoId, title, filename, filesize, parentId } = body;

    if (!filename || !filesize) {
      return NextResponse.json(
        { error: 'filename and filesize are required' },
        { status: 400 }
      );
    }
    if (!lessonId && !techniqueVideoId) {
      return NextResponse.json(
        { error: 'lessonId or techniqueVideoId is required' },
        { status: 400 }
      );
    }

    // ── 3. Create TUS upload session in Kinescope ────────────────
    //
    // title и filename — конвертируем в ASCII-safe.
    // Русские названия уроков остаются в Supabase нетронутыми.
    //
    const clientIp = getClientIp(request);

    const { videoId, uploadUrl } = await createUploadSession({
      title:    toAsciiSafe(title || filename),
      filename: toAsciiSafe(filename),
      filesize: Number(filesize),
      clientIp,
      parentId: parentId ?? undefined,
    });

    // ── 4. Save to Supabase ──────────────────────────────────────
    // ТОЛЬКО video_ поля — русский title урока НЕ трогаем
    const videoUpdate = {
      video_id:       videoId,
      video_provider: 'kinescope',
      video_status:   'uploading',
    };

    if (lessonId) {
      const { error: e } = await supabaseAdmin
        .from('lessons')
        .update(videoUpdate)
        .eq('id', lessonId);
      if (e) console.error('[upload-url] lessons update:', e);
    }
    if (techniqueVideoId) {
      const { error: e } = await supabaseAdmin
        .from('technique_videos')
        .update(videoUpdate)
        .eq('id', techniqueVideoId);
      if (e) console.error('[upload-url] technique_videos update:', e);
    }

    // ── 5. Return TUS endpoint to client ─────────────────────────
    return NextResponse.json({ videoId, uploadUrl });

  } catch (err) {
    console.error('[kinescope/upload-url]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
