/**
 * GET /api/notifications — колокольчик ученика:
 *   replies — ответы сэнсэя на его комментарии (уроки, техники, статьи)
 *   news    — новости додзё (с момента незадолго до регистрации)
 *   unread  — сколько всего непрочитанного
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth } from '@/lib/auth-server.js';
import { newsToSnake } from '@/lib/news.js';

const LIMIT = 30;
// Новичок видит новости за последние 2 недели до регистрации, не всю историю
const NEWS_BEFORE_JOIN_MS = 14 * 24 * 3600 * 1000;

export async function GET(request) {
  const { error, user } = await requireAuth(request);
  if (error) return error;

  const replyWhere = { isAdminReply: true, status: 'visible', parent: { userId: user.id, status: 'visible' } };

  const [lessonReplies, knowledgeReplies, news] = await Promise.all([
    prisma.comment.findMany({
      where: replyWhere,
      orderBy: { createdAt: 'desc' },
      take: LIMIT,
      include: {
        parent: { select: { text: true, lessonId: true, techniqueId: true } },
        lesson: { select: { title: true, monthId: true } },
      },
    }),
    prisma.knowledgeComment.findMany({
      where: replyWhere,
      orderBy: { createdAt: 'desc' },
      take: LIMIT,
      include: {
        parent:        { select: { text: true } },
        knowledgeItem: { select: { id: true, title: true } },
      },
    }),
    prisma.news.findMany({
      where: {
        isHidden: false,
        createdAt: { gte: new Date(new Date(user.joinedAt).getTime() - NEWS_BEFORE_JOIN_MS) },
      },
      orderBy: { createdAt: 'desc' },
      take: LIMIT,
      include: { reads: { where: { userId: user.id }, select: { userId: true } } },
    }),
  ]);

  const replies = [
    ...lessonReplies.map(r => {
      const techniqueId = r.parent?.techniqueId || r.techniqueId;
      let where = '', link = null;
      if (r.lessonId && r.lesson) {
        where = `Урок «${r.lesson.title}»`;
        link  = { type: 'lesson', month_id: r.lesson.monthId, lesson_id: r.lessonId };
      } else if (techniqueId) {
        where = `Техника ${techniqueId.split('_').slice(1).join(' ')}`;
        link  = { type: 'technique', id: techniqueId };
      }
      return { id: `c${r.id}`, source: 'comment', reply_id: r.id, where, link, question: r.parent?.text || '', text: r.text, created_at: r.createdAt, read: !!r.readAt };
    }),
    ...knowledgeReplies.map(r => ({
      id: `k${r.id}`, source: 'knowledge', reply_id: r.id,
      where: r.knowledgeItem ? `Статья «${r.knowledgeItem.title}»` : '',
      link:  r.knowledgeItem ? { type: 'knowledge', id: r.knowledgeItem.id } : null,
      question: r.parent?.text || '', text: r.text, created_at: r.createdAt, read: !!r.readAt,
    })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, LIMIT);

  const newsOut = news.map(n => newsToSnake(n, { read: n.reads.length > 0 }));
  const unread  = replies.filter(r => !r.read).length + newsOut.filter(n => !n.read).length;

  return NextResponse.json({ replies, news: newsOut, unread });
}
