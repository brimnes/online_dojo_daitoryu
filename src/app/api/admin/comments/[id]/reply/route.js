/**
 * POST /api/admin/comments/[id]/reply
 * Creates an admin reply to a comment.
 * Body: { text: string }
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';
import { sendPushToUser, truncate } from '@/lib/push-server.js';

export async function POST(request, { params }) {
  const { error, user } = await requireAdmin(request);
  if (error) return error;

  const commentId = Number(params.id);
  const { text } = await request.json();

  if (!text?.trim()) return NextResponse.json({ error: 'text required' }, { status: 400 });

  // Get the parent comment to get lessonId
  const parent = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!parent) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

  const reply = await prisma.comment.create({
    data: {
      lessonId:        parent.lessonId,
      techniqueId:     parent.techniqueId,
      userId:          user.id,
      text:            text.trim(),
      status:          'visible',
      parentCommentId: commentId,
      isAdminReply:    true,
    },
  });

  // Уведомляем автора комментария (если отвечает не он сам)
  if (parent.userId !== user.id) {
    let url = '/';
    let where = '';
    if (parent.lessonId) {
      const lesson = await prisma.lesson.findUnique({
        where: { id: parent.lessonId }, select: { monthId: true, title: true },
      }).catch(() => null);
      if (lesson) {
        url = `/?open=lesson&month=${encodeURIComponent(lesson.monthId)}&lesson=${encodeURIComponent(parent.lessonId)}`;
        where = lesson.title ? `Урок «${lesson.title}»` : '';
      }
    } else if (parent.techniqueId) {
      url = `/?open=technique&id=${encodeURIComponent(parent.techniqueId)}`;
      where = `Техника ${parent.techniqueId.split('_').slice(1).join(' ')}`;
    }
    await sendPushToUser(parent.userId, {
      title: 'Сэнсэй ответил на ваш комментарий',
      body:  [where, truncate(reply.text)].filter(Boolean).join('\n'),
      url,
      tag:   `comment-${commentId}`,
    });
  }

  return NextResponse.json({ ok: true, reply: { id: reply.id, text: reply.text, created_at: reply.createdAt } });
}
