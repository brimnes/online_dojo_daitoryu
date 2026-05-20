/** POST /api/techniques/[id]/mistakes — полная замена ошибок (admin) */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';

export async function POST(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const { mistakes } = await request.json();
    const techId = params.id;

    await prisma.techniqueMistake.deleteMany({ where: { techniqueId: techId } });

    const created = await prisma.techniqueMistake.createMany({
      data: mistakes.map((m, i) => ({
        techniqueId: techId,
        title:       m.title,
        description: m.desc || m.description || null,
        sortOrder:   i,
      })),
    });

    const rows = await prisma.techniqueMistake.findMany({
      where: { techniqueId: techId }, orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      ok: true,
      mistakes: rows.map(m => ({
        id: m.id, technique_id: m.techniqueId, title: m.title,
        description: m.description, sort_order: m.sortOrder,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
