/** POST /api/techniques/[id]/videos/[category] — полная замена видео категории (admin) */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';
import { randomUUID } from 'crypto';

export async function POST(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const { videos } = await request.json();
    const { id: techId, category } = params;

    await prisma.techniqueVideo.deleteMany({
      where: { techniqueId: techId, category },
    });

    if (videos?.length) {
      await prisma.techniqueVideo.createMany({
        data: videos.map((v, i) => ({
          // Replace temporary client-side IDs (nv-...) with real UUIDs
          id:            (!v.id || v.id.startsWith('nv-')) ? randomUUID() : v.id,
          techniqueId:   techId,
          category,
          title:         v.title,
          duration:      v.duration || null,
          videoUrl:      v.video_url || v.videoUrl || null,
          videoId:       v.video_id  || v.videoId  || null,
          videoStatus:   v.video_status  || v.videoStatus  || 'none',
          videoProvider: v.video_provider || v.videoProvider || null,
          videoPosterUrl: v.video_poster_url || v.videoPosterUrl || null,
          sortOrder:     i,
        })),
      });
    }

    const rows = await prisma.techniqueVideo.findMany({
      where: { techniqueId: techId, category }, orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      ok: true,
      data: rows.map(v => ({
        id: v.id, technique_id: v.techniqueId, category: v.category,
        title: v.title, duration: v.duration, video_url: v.videoUrl,
        video_id: v.videoId, video_status: v.videoStatus,
        video_provider: v.videoProvider, sort_order: v.sortOrder,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
