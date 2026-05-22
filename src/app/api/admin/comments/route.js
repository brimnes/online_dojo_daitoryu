/**
 * GET  /api/admin/comments — all top-level comments for admin (with reply count)
 * PATCH /api/admin/comments — hide or unhide a comment  { id, action:'hide'|'unhide' }
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const comments = await prisma.comment.findMany({
    where: { parentCommentId: null }, // top-level only
    orderBy: { createdAt: 'desc' },
    include: {
      user:    { select: { name: true, email: true } },
      replies: { where: { isAdminReply: true }, select: { id: true, text: true, createdAt: true } },
    },
  });

  return NextResponse.json(comments.map(c => ({
    id:            c.id,
    lesson_id:     c.lessonId,
    user_id:       c.userId,
    user_name:     c.user?.name  || '—',
    user_email:    c.user?.email || '—',
    text:          c.text,
    status:        c.status,
    created_at:    c.createdAt,
    replied:       c.replies.length > 0,
    reply_count:   c.replies.length,
    admin_replies: c.replies.map(r => ({ id: r.id, text: r.text, created_at: r.createdAt })),
  })));
}

export async function PATCH(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { id, action } = await request.json();
  if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 });

  const status = action === 'hide' ? 'hidden' : 'visible';
  await prisma.comment.update({ where: { id: Number(id) }, data: { status } });
  return NextResponse.json({ ok: true, status });
}
