/** GET /api/techniques — все техники + ошибки + видео */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth } from '@/lib/auth-server.js';

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const [techniques, mistakes, videos] = await Promise.all([
    prisma.technique.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.techniqueMistake.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.techniqueVideo.findMany({ orderBy: { sortOrder: 'asc' } }),
  ]);

  return NextResponse.json({
    techniques: techniques.map(t => ({
      id: t.id, name_ru: t.nameRu, kyu: t.kyu, section: t.section,
      description: t.description, principles: t.principles,
      sensei_quote: t.senseiQuote, sort_order: t.sortOrder,
    })),
    mistakes: mistakes.map(m => ({
      id: m.id, technique_id: m.techniqueId, title: m.title,
      description: m.description, sort_order: m.sortOrder,
    })),
    videos: videos.map(v => ({
      id: v.id, technique_id: v.techniqueId, category: v.category,
      title: v.title, duration: v.duration, video_url: v.videoUrl,
      video_id: v.videoId, video_status: v.videoStatus,
      video_provider: v.videoProvider, video_poster_url: v.videoPosterUrl,
      sort_order: v.sortOrder,
    })),
  });
}
