/**
 * POST /api/admin/knowledge-comments/[id]/reply
 * Ответ сэнсэя на комментарий к статье базы знаний.
 * Body: { text: string }
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';

export async function POST(request, { params }) {
  const { error, user } = await requireAdmin(request);
  if (error) return error;

  const commentId = Number(params.id);
  const { text } = await request.json();

  if (!text?.trim()) return NextResponse.json({ error: 'text required' }, { status: 400 });

  const parent = await prisma.knowledgeComment.findUnique({ where: { id: commentId } });
  if (!parent) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

  const reply = await prisma.knowledgeComment.create({
    data: {
      knowledgeItemId: parent.knowledgeItemId,
      userId:          user.id,
      text:            text.trim(),
      status:          'visible',
      parentCommentId: commentId,
      isAdminReply:    true,
    },
  });

  return NextResponse.json({ ok: true, reply: { id: reply.id, text: reply.text, created_at: reply.createdAt } });
}
