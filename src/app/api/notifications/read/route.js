/**
 * POST /api/notifications/read — отметить прочитанным.
 * Body: { news?: [uuid], comments?: [id], knowledge?: [id], all?: true }
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth } from '@/lib/auth-server.js';

const ids = (a) => (Array.isArray(a) ? a.slice(0, 200) : []);

export async function POST(request) {
  const { error, user } = await requireAuth(request);
  if (error) return error;

  const body = await request.json().catch(() => ({}));
  const now  = new Date();
  const mine = { isAdminReply: true, readAt: null, parent: { userId: user.id } };

  if (body.all) {
    const news = await prisma.news.findMany({
      where: { isHidden: false, reads: { none: { userId: user.id } } },
      select: { id: true },
    });
    await Promise.all([
      prisma.comment.updateMany({ where: mine, data: { readAt: now } }),
      prisma.knowledgeComment.updateMany({ where: mine, data: { readAt: now } }),
      news.length && prisma.newsRead.createMany({
        data: news.map(n => ({ newsId: n.id, userId: user.id })), skipDuplicates: true,
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  const commentIds   = ids(body.comments).map(Number).filter(Number.isInteger);
  const knowledgeIds = ids(body.knowledge).map(Number).filter(Number.isInteger);
  const newsIds      = ids(body.news).filter(id => typeof id === 'string');

  await Promise.all([
    commentIds.length   && prisma.comment.updateMany({ where: { ...mine, id: { in: commentIds } }, data: { readAt: now } }),
    knowledgeIds.length && prisma.knowledgeComment.updateMany({ where: { ...mine, id: { in: knowledgeIds } }, data: { readAt: now } }),
    newsIds.length      && prisma.newsRead.createMany({
      data: newsIds.map(newsId => ({ newsId, userId: user.id })), skipDuplicates: true,
    }).catch(() => null),
  ]);
  return NextResponse.json({ ok: true });
}
