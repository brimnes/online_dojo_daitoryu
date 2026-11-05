/**
 * POST /api/knowledge/[id]/read — отметить прочтение статьи (auth)
 *
 * Одна строка на ученика и статью: read_count растёт при каждом открытии.
 * Прочтения админов и преподавателей не считаем.
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth } from '@/lib/auth-server.js';

export async function POST(request, { params }) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  if (user.role === 'admin' || user.role === 'teacher') return NextResponse.json({ ok: true, skipped: true });

  try {
    const item = await prisma.knowledgeItem.findFirst({
      where: { id: params.id, isPublished: true }, select: { id: true },
    });
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.knowledgeRead.upsert({
      where:  { itemId_userId: { itemId: item.id, userId: user.id } },
      create: { itemId: item.id, userId: user.id },
      update: { readCount: { increment: 1 }, lastReadAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
