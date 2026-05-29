/** GET /api/techniques — все техники + ошибки + видео
 *  POST /api/techniques — создать новую технику (admin)
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth, requireAdmin } from '@/lib/auth-server.js';

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

export async function POST(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const { id, nameRu, kyu, section } = await request.json();
    if (!id || !nameRu || !kyu || !section) {
      return NextResponse.json({ error: 'id, nameRu, kyu, section — обязательные поля' }, { status: 400 });
    }
    // ID должен быть уникальным — проверяем
    const exists = await prisma.technique.findUnique({ where: { id } });
    if (exists) {
      return NextResponse.json({ error: `Техника с ID «${id}» уже существует` }, { status: 409 });
    }
    const t = await prisma.technique.create({
      data: { id, nameRu, kyu, section, principles: [] },
    });
    return NextResponse.json({
      id: t.id, name_ru: t.nameRu, kyu: t.kyu, section: t.section,
      description: t.description, principles: t.principles,
      sensei_quote: t.senseiQuote, sort_order: t.sortOrder,
    }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
