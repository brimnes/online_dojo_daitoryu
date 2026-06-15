/**
 * POST /api/upload
 * Загружает файл (картинку или документ) в S3 и возвращает публичный URL.
 * Доступно только администраторам.
 *
 * Body: multipart/form-data
 *   file     — файл
 *   folder   — опциональная папка (по умолчанию "knowledge")
 */
import { NextResponse } from 'next/server';
import { requireAuth }  from '@/lib/auth-server.js';
import { uploadToS3 }   from '@/lib/s3.js';
import { randomUUID }   from 'crypto';
import path             from 'path';

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const MAX_SIZE = 20 * 1024 * 1024; // 20 МБ

export async function POST(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;
  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const formData = await request.formData();
  const file     = formData.get('file');
  const folder   = formData.get('folder') || 'knowledge';

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Тип файла не поддерживается' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (buffer.byteLength > MAX_SIZE) {
    return NextResponse.json({ error: 'Файл слишком большой (макс. 20 МБ)' }, { status: 400 });
  }

  const ext      = path.extname(file.name) || '';
  const key      = `${folder}/${randomUUID()}${ext}`;
  const url      = await uploadToS3(buffer, key, file.type);

  return NextResponse.json({
    url,
    key,
    name:         file.name,
    size:         buffer.byteLength,
    content_type: file.type,
  });
}
