/**
 * GET    /api/knowledge/[id]/attachments — список вложений статьи
 * POST   /api/knowledge/[id]/attachments — добавить вложение после загрузки в S3
 * DELETE /api/knowledge/[id]/attachments?attach_id=N — удалить вложение
 */
import { NextResponse }   from 'next/server';
import { prisma }         from '@/lib/prisma.js';
import { requireAdmin }   from '@/lib/auth-server.js';
import { deleteFromS3 }   from '@/lib/s3.js';

function toOut(a) {
  return {
    id: a.id, type: a.type, url: a.url, s3_key: a.s3Key,
    name: a.name, size: a.size, content_type: a.contentType, sort_order: a.sortOrder,
  };
}

export async function GET(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const list = await prisma.knowledgeAttachment.findMany({
    where: { knowledgeItemId: params.id },
    orderBy: { sortOrder: 'asc' },
  });
  return NextResponse.json(list.map(toOut));
}

export async function POST(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const body = await request.json();
  const { url, s3_key, name, size, content_type } = body;
  if (!url || !s3_key) return NextResponse.json({ error: 'url and s3_key required' }, { status: 400 });

  const type = content_type?.startsWith('image/') ? 'image' : 'file';

  const last = await prisma.knowledgeAttachment.findFirst({
    where: { knowledgeItemId: params.id },
    orderBy: { sortOrder: 'desc' },
  });

  const attachment = await prisma.knowledgeAttachment.create({
    data: {
      knowledgeItemId: params.id,
      type, url, s3Key: s3_key, name,
      size:        size    ?? null,
      contentType: content_type ?? null,
      sortOrder:   (last?.sortOrder ?? -1) + 1,
    },
  });
  return NextResponse.json({ ok: true, attachment: toOut(attachment) }, { status: 201 });
}

export async function DELETE(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const attachId = Number(searchParams.get('attach_id'));
  if (!attachId) return NextResponse.json({ error: 'attach_id required' }, { status: 400 });

  const att = await prisma.knowledgeAttachment.findFirst({
    where: { id: attachId, knowledgeItemId: params.id },
  });
  if (!att) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await deleteFromS3(att.s3Key).catch(() => {});
  await prisma.knowledgeAttachment.delete({ where: { id: attachId } });

  return NextResponse.json({ ok: true });
}
