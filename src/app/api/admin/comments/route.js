/**
 * GET  /api/admin/comments
 *   — все top-level комментарии (уроки + база знаний), отсортированные по дате
 *   — каждый объект имеет поле type: 'lesson' | 'knowledge'
 *
 * PATCH /api/admin/comments
 *   — скрыть / показать комментарий
 *   — Body: { id, type: 'lesson'|'knowledge', action: 'hide'|'unhide' }
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const [lessonComments, knowledgeComments] = await Promise.all([
    prisma.comment.findMany({
      where: { parentCommentId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        user:    { select: { name: true, email: true } },
        replies: { where: { isAdminReply: true }, select: { id: true, text: true, createdAt: true } },
      },
    }),
    prisma.knowledgeComment.findMany({
      where: { parentCommentId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        user:         { select: { name: true, email: true } },
        knowledgeItem: { select: { title: true } },
        replies: { where: { isAdminReply: true }, select: { id: true, text: true, createdAt: true } },
      },
    }),
  ]);

  const fmt = (c, type) => ({
    id:            c.id,
    type,
    // lesson comments → lesson_id; knowledge comments → knowledge_item_id + item title
    lesson_id:          type === 'lesson'    ? c.lessonId          : null,
    knowledge_item_id:  type === 'knowledge' ? c.knowledgeItemId   : null,
    knowledge_item_title: type === 'knowledge' ? (c.knowledgeItem?.title || c.knowledgeItemId) : null,
    user_id:       c.userId,
    user_name:     c.user?.name  || '—',
    user_email:    c.user?.email || '—',
    text:          c.text,
    status:        c.status,
    created_at:    c.createdAt,
    replied:       c.replies.length > 0,
    reply_count:   c.replies.length,
    admin_replies: c.replies.map(r => ({ id: r.id, text: r.text, created_at: r.createdAt })),
  });

  const all = [
    ...lessonComments.map(c => fmt(c, 'lesson')),
    ...knowledgeComments.map(c => fmt(c, 'knowledge')),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return NextResponse.json(all);
}

export async function PATCH(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { id, type, action } = await request.json();
  if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 });

  const status = action === 'hide' ? 'hidden' : 'visible';

  if (type === 'knowledge') {
    await prisma.knowledgeComment.update({ where: { id: Number(id) }, data: { status } });
  } else {
    await prisma.comment.update({ where: { id: Number(id) }, data: { status } });
  }

  return NextResponse.json({ ok: true, status });
}
