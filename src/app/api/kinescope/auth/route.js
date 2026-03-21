/**
 * Kinescope Authorization Backend.
 *
 * Kinescope calls this URL before playing a video.
 * Request: POST { video_id, viewer_id, ... }
 * Header:  X-Kinescope-Auth: <AUTH_BACKEND_SECRET>
 *
 * We check Supabase: does this viewer have access to this video's lesson/technique?
 * Response 200 = allow, 403 = deny.
 *
 * Setup in Kinescope dashboard:
 *   Settings → Authorization Backend → URL: https://yourdomain.com/api/kinescope/auth
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAuthBackendRequest } from '@/lib/kinescope';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    // 1. Validate the request comes from Kinescope
    const authHeader = request.headers.get('X-Kinescope-Auth') || '';
    if (!validateAuthBackendRequest(authHeader)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { video_id, viewer_id } = await request.json();

    if (!video_id || !viewer_id) {
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    // 2. Find which lesson or technique_video this video_id belongs to
    const [{ data: lesson }, { data: techVideo }] = await Promise.all([
      supabaseAdmin.from('lessons').select('id, month_id').eq('video_id', video_id).maybeSingle(),
      supabaseAdmin.from('technique_videos').select('id, technique_id').eq('video_id', video_id).maybeSingle(),
    ]);

    // 3. Look up the viewer's profile (viewer_id = Supabase user UUID)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, level')
      .eq('id', viewer_id)
      .maybeSingle();

    // Admins and teachers can watch everything
    if (profile?.role === 'admin' || profile?.role === 'teacher') {
      return NextResponse.json({ allow: true });
    }

    // 4a. Lesson video → check user_access for the month
    if (lesson) {
      // Check if month is open (free) or user has paid access
      const { data: monthData } = await supabaseAdmin
        .from('months')
        .select('is_open')
        .eq('id', lesson.month_id)
        .maybeSingle();

      if (monthData?.is_open) {
        return NextResponse.json({ allow: true });
      }

      const { data: access } = await supabaseAdmin
        .from('user_access')
        .select('id')
        .eq('user_id', viewer_id)
        .eq('type', 'month')
        .eq('reference', lesson.month_id)
        .maybeSingle();

      if (access) {
        return NextResponse.json({ allow: true });
      }

      return NextResponse.json({ error: 'No access to this month' }, { status: 403 });
    }

    // 4b. Technique video → check user_access for ikkajo section
    if (techVideo) {
      const { data: technique } = await supabaseAdmin
        .from('techniques')
        .select('section')
        .eq('id', techVideo.technique_id)
        .maybeSingle();

      // Map technique section to section reference (ikkajo etc.)
      const sectionRef = 'ikkajo'; // all techniques are currently under ikkajo

      const { data: access } = await supabaseAdmin
        .from('user_access')
        .select('id')
        .eq('user_id', viewer_id)
        .eq('type', 'section')
        .eq('reference', sectionRef)
        .maybeSingle();

      if (access) {
        return NextResponse.json({ allow: true });
      }

      return NextResponse.json({ error: 'No access to this section' }, { status: 403 });
    }

    // Video not found in our DB — deny
    return NextResponse.json({ error: 'Video not found' }, { status: 403 });

  } catch (err) {
    console.error('[kinescope/auth]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
