/** GET /api/user/access — доступы текущего пользователя */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth } from '@/lib/auth-server.js';

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  // Возвращаем реальные строки user_access для всех пользователей, включая admin.
  // Это нужно чтобы выдача/отзыв доступа работали корректно даже на admin-аккаунте.
  // Просмотр видео для admin по-прежнему всегда разрешён в /api/kinescope/auth.
  const rows = await prisma.userAccess.findMany({
    where:  { userId: user.id },
    select: { type: true, reference: true },
  });
  return NextResponse.json(rows);
}
