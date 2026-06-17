/**
 * POST /api/user/avatar  — загрузить/заменить аватар (multipart: field "file")
 * DELETE /api/user/avatar — удалить аватар
 */
import { NextResponse }      from 'next/server';
import { requireAuth }       from '@/lib/auth-server.js';
import { prisma }            from '@/lib/prisma.js';
import { uploadToS3, deleteFromS3 } from '@/lib/s3.js';
import { randomUUID }        from 'crypto';
import path                  from 'path';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE      = 5 * 1024 * 1024; // 5 МБ

function keyFromUrl(url) {
  // "https://s3.host/bucket/avatars/uuid.jpg" → "avatars/uuid.jpg"
  try {
    const u = new URL(url);
    return u.pathname.replace(/^\/[^/]+\//, ''); // strip /bucket/
  } catch {
    return null;
  }
}

export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const formData = await request.formData();
  const file     = formData.get('file');

  if (!file) return NextResponse.json({ error: 'Нет файла' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type))
    return NextResponse.json({ error: 'Разрешены только JPEG, PNG, WebP' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.byteLength > MAX_SIZE)
    return NextResponse.json({ error: 'Файл слишком большой (макс. 5 МБ)' }, { status: 400 });

  // Удаляем старый аватар из S3
  if (user.avatarUrl) {
    const oldKey = keyFromUrl(user.avatarUrl);
    if (oldKey) await deleteFromS3(oldKey).catch(() => {});
  }

  const ext = path.extname(file.name) || '.jpg';
  const key = `avatars/${randomUUID()}${ext}`;
  const url = await uploadToS3(buffer, key, file.type);

  const updated = await prisma.user.update({
    where:  { id: user.id },
    data:   { avatarUrl: url },
    select: { avatarUrl: true },
  });

  return NextResponse.json({ avatarUrl: updated.avatarUrl });
}

export async function DELETE(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  if (user.avatarUrl) {
    const key = keyFromUrl(user.avatarUrl);
    if (key) await deleteFromS3(key).catch(() => {});
  }

  await prisma.user.update({
    where: { id: user.id },
    data:  { avatarUrl: null },
  });

  return NextResponse.json({ ok: true });
}
