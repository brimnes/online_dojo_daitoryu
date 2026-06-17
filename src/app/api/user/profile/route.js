/**
 * PATCH /api/user/profile
 * Обновляет редактируемые поля профиля текущего пользователя:
 * name, senseiName, experience, level
 */
import { NextResponse }  from 'next/server';
import { requireAuth }   from '@/lib/auth-server.js';
import { prisma }        from '@/lib/prisma.js';

const ALLOWED_LEVELS = ['6kyu','5kyu','4kyu','3kyu','2kyu','1kyu','1dan','2dan','3dan'];

export async function PATCH(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const body = await request.json();
  const data = {};

  if (typeof body.name       === 'string') data.name       = body.name.trim().slice(0, 100);
  if (typeof body.senseiName === 'string') data.senseiName = body.senseiName.trim().slice(0, 100);
  if (typeof body.experience === 'string') data.experience = body.experience.trim().slice(0, 2000);
  if (typeof body.level      === 'string' && ALLOWED_LEVELS.includes(body.level)) data.level = body.level;

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Нет данных для обновления' }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data,
    select: {
      id: true, email: true, name: true, role: true,
      level: true, status: true, selfLevel: true,
      senseiName: true, experience: true, avatarUrl: true, joinedAt: true,
    },
  });

  return NextResponse.json({ user: updated });
}
