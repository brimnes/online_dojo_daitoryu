/**
 * GET  /api/comments/technique?technique_id=tachiai_Ippondori
 * POST /api/comments/technique  { technique_id, text }
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth } from '@/lib/auth-server.js';

function shape(c) {
  return {
    id:      c.id,
    author:  c.user?.name || '—',
    avatar:  (c.user?.name || '?')[0].toUpperCase(),
    role:    c.isAdminReply ? 'sensei' : 'student',
    text:    c.text,
    date:    c.createdAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    replies: (c.replies || []).map(r => ({
      id:     r.id,
      author: r.user?.name || 'Сэнсэй',
      avatar: (r.user?.name || 'С')[0].toUpperCase(),
      role:   'sensei',
      text:   r.text,
      date:   r.createdAt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    })),
  };
}

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const techniqueId = searchParams.get('technique_id');
  if (!techniqueId) return NextResponse.json({ error: 'technique_id required' }, { status: 400 });

  const comments = await prisma.comment.findMany({
    where: { techniqueId, parentCommentId: null, status: 'visible' },
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

  return NextResponse.json(comments.map(shape));
}

export async function POST(request) {
  const { error, user } = await requireAuth(request);
  if (error) return error;

  const { technique_id, text } = await request.json();
  if (!technique_id || !text?.trim()) {
    return NextResponse.json({ error: 'technique_id and text required' }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      techniqueId: technique_id,
      userId:      user.id,
      text:        text.trim(),
      status:      'visible',
    },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json({
    ...shape({ ...comment, replies: [] }),
    date: 'Только что',
  }, { status: 201 });
}
