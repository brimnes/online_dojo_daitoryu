/**
 * GET  /api/comments?lesson_id=xxx  — visible comments for a lesson (with admin replies)
 * POST /api/comments                — submit a new comment (auth required)
 *   Body: { lesson_id, text }
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth } from '@/lib/auth-server.js';

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const lessonId = searchParams.get('lesson_id');
  if (!lessonId) return NextResponse.json({ error: 'lesson_id required' }, { status: 400 });

  const comments = await prisma.comment.findMany({
    where: {
      lessonId,
      parentCommentId: null,       // top-level only
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

  return NextResponse.json(comments.map(c => ({
    id:         c.id,
    author:     c.user?.name || '—',
    avatar:     (c.user?.name || '?')[0].toUpperCase(),
    role:       'student',
    text:       c.text,
    date:       c.createdAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    replies:    c.replies.map(r => ({
      id:     r.id,
      author: r.user?.name || 'Сэнсэй',
      avatar: (r.user?.name || 'С')[0].toUpperCase(),
      role:   'sensei',
      text:   r.text,
      date:   r.createdAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    })),
  })));
}

export async function POST(request) {
  const { error, user } = await requireAuth(request);
  if (error) return error;

  const { lesson_id, text } = await request.json();
  if (!lesson_id || !text?.trim()) {
    return NextResponse.json({ error: 'lesson_id and text required' }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      lessonId: lesson_id,
      userId:   user.id,
      text:     text.trim(),
      status:   'visible',
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
