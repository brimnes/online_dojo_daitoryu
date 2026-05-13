/**
 * Kinescope Authorization Backend.
 *
 * Kinescope calls this URL before playing a video.
 * Request: POST { video_id, viewer_id, ... }
 * Header:  X-Kinescope-Auth: <AUTH_BACKEND_SECRET>
 *
 * viewer_id = наш user UUID (сохранён при миграции из Supabase).
 * Response 200 = allow, 403 = deny.
 *
 * Setup in Kinescope dashboard:
 *   Settings → Authorization Backend → URL: https://yourdomain.com/api/kinescope/auth
 */

import { NextResponse } from 'next/server';
import { validateAuthBackendRequest } from '@/lib/kinescope';
import { prisma } from '@/lib/prisma.js';

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
    const [lesson, techVideo] = await Promise.all([
      prisma.lesson.findFirst({
        where:  { videoId: video_id },
        select: { id: true, monthId: true },
      }),
      prisma.techniqueVideo.findFirst({
        where:  { videoId: video_id },
        select: { id: true, techniqueId: true },
      }),
    ]);

    // 3. Look up the viewer's role (viewer_id = our user UUID)
    const user = await prisma.user.findUnique({
      where:  { id: viewer_id },
      select: { role: true, status: true },
    });

    // Admins and teachers can watch everything
    if (user?.role === 'admin' || user?.role === 'teacher') {
      return NextResponse.json({ allow: true });
    }

    // 4a. Lesson video → check user_access for the month
    if (lesson) {
      const month = await prisma.month.findUnique({
        where:  { id: lesson.monthId },
        select: { isOpen: true },
      });

      if (month?.isOpen) {
        return NextResponse.json({ allow: true });
      }

      const access = await prisma.userAccess.findFirst({
        where: { userId: viewer_id, type: 'month', reference: lesson.monthId },
      });

      if (access) return NextResponse.json({ allow: true });

      return NextResponse.json({ error: 'No access to this month' }, { status: 403 });
    }

    // 4b. Technique video → check user_access for ikkajo section
    if (techVideo) {
      // All techniques are currently under ikkajo
      const access = await prisma.userAccess.findFirst({
        where: { userId: viewer_id, type: 'section', reference: 'ikkajo' },
      });

      if (access) return NextResponse.json({ allow: true });

      return NextResponse.json({ error: 'No access to this section' }, { status: 403 });
    }

    // Video not found in our DB — deny
    return NextResponse.json({ error: 'Video not found' }, { status: 403 });

  } catch (err) {
    console.error('[kinescope/auth]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
