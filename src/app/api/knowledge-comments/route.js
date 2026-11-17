/**
 * GET  /api/knowledge-comments?item_id=xxx  — видимые комментарии к статье
 * POST /api/knowledge-comments              — оставить комментарий (требует авторизации)
 *   Body: { item_id, text }
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth } from '@/lib/auth-server.js';

// Новые (непрочитанные автором) ответы сэнсэя: помечаем is_new и сразу считаем прочитанными
async function markRepliesSeen(model, comments, userId) {
  const fresh = new Set();
  for (const c of comments) {
    if (c.userId !== userId) continue;
    for (const r of c.replies || []) if (!r.readAt) fresh.add(r.id);
  }
  if (fresh.size) {
    await model.updateMany({ where: { id: { in: [...fresh] } }, data: { readAt: new Date() } }).catch(() => null);
  }
  return fresh;
}

export async function GET(request) {
  const { error, user } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get('item_id');
  if (!itemId) return NextResponse.json({ error: 'item_id required' }, { status: 400 });

  const comments = await prisma.knowledgeComment.findMany({
    where: {
      knowledgeItemId: itemId,
      parentCommentId: null,
      status: 'visible',
    },
    orderBy: { createdAt: 'asc' },
    include: {
      user:    { select: { name: true } },
      replies: {
        where:   { isAdminReply: true, status: 'visible' },
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { name: true } } },
      },
    },
  });

  const fresh = await markRepliesSeen(prisma.knowledgeComment, comments, user.id);

  return NextResponse.json(comments.map(c => ({
    id:      c.id,
    author:  c.user?.name || '—',
    avatar:  (c.user?.name || '?')[0].toUpperCase(),
    role:    'student',
    text:    c.text,
    date:    c.createdAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    replies: c.replies.map(r => ({
      id:     r.id,
      author: r.user?.name || 'Сэнсэй',
      avatar: (r.user?.name || 'С')[0].toUpperCase(),
      role:   'sensei',
      text:   r.text,
      date:   r.createdAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      is_new: fresh.has(r.id),
    })),
  })));
}

export async function POST(request) {
  const { error, user } = await requireAuth(request);
  if (error) return error;

  const { item_id, text } = await request.json();
  if (!item_id || !text?.trim()) {
    return NextResponse.json({ error: 'item_id and text required' }, { status: 400 });
  }

  const comment = await prisma.knowledgeComment.create({
    data: {
      knowledgeItemId: item_id,
      userId:          user.id,
      text:            text.trim(),
      status:          'visible',
    },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json({
    id:      comment.id,
    author:  comment.user?.name || '—',
    avatar:  (comment.user?.name || '?')[0].toUpperCase(),
    role:    'student',
    text:    comment.text,
    date:    'Только что',
    replies: [],
  });
}
