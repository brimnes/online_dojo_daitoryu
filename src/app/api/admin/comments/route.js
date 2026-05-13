/** GET /api/admin/comments — все комментарии с именами пользователей (admin) */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const comments = await prisma.comment.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json(comments.map(c => ({
    id:         c.id,
    lesson_id:  c.lessonId,
    user_id:    c.userId,
    user_name:  c.user?.name || '—',
    text:       c.text,
    created_at: c.createdAt,
    replied:    false,
  })));
}
