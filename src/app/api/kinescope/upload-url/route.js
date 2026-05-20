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
 *   1. Verify admin (JWT cookie)
 *   2. Call Kinescope POST /v2/init — get videoId + TUS uploadUrl
 *   3. Save video_id / video_status='uploading' to DB (только video_ поля)
 *   4. Return { videoId, uploadUrl } to client
 *
 * The FILE is never sent through this route.
 * Client uploads directly to Kinescope via tus-js-client.
 */

import { NextResponse } from 'next/server';
import { createUploadSession, toAsciiSafe } from '@/lib/kinescope';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';

export const runtime = 'nodejs';

function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

export async function POST(request) {
  try {
    // 1. Auth
    const { error } = await requireAdmin(request);
    if (error) return error;

    // 2. Parse body
    const body = await request.json();
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

    // 3. Create TUS upload session in Kinescope
    const clientIp = getClientIp(request);
    const { videoId, uploadUrl } = await createUploadSession({
      title:    toAsciiSafe(title || filename),
      filename: toAsciiSafe(filename),
      filesize: Number(filesize),
      clientIp,
      parentId: parentId ?? undefined,
    });

    // 4. Save to DB — ТОЛЬКО video_ поля, русский title НЕ трогаем
    const videoUpdate = {
      videoId:       videoId,
      videoProvider: 'kinescope',
      videoStatus:   'uploading',
    };

    if (lessonId) {
      await prisma.lesson.update({
        where: { id: lessonId },
        data:  videoUpdate,
      });
    }
    if (techniqueVideoId) {
      await prisma.techniqueVideo.update({
        where: { id: techniqueVideoId },
        data:  videoUpdate,
      });
    }

    // 5. Return TUS endpoint to client
    return NextResponse.json({ videoId, uploadUrl });

  } catch (err) {
    console.error('[kinescope/upload-url]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
