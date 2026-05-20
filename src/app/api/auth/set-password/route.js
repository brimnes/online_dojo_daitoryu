/**
 * POST /api/auth/set-password
 *
 * Используется при первом входе пользователей, импортированных из Supabase.
 * Устанавливает новый пароль и сразу выдаёт JWT cookie (авторизует).
 *
 * Body: { userId, password }
 * Требования: passwordHash === 'RESET_REQUIRED' (иначе 403)
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth-server.js';

export async function POST(request) {
  try {
    const { userId, password } = await request.json();

    if (!userId || !password) {
      return NextResponse.json(
        { error: 'userId и password обязательны' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен содержать минимум 6 символов' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    // Разрешаем только тем, у кого стоит RESET_REQUIRED
    if (user.passwordHash !== 'RESET_REQUIRED') {
      return NextResponse.json(
        { error: 'Смена пароля через этот маршрут недоступна' },
        { status: 403 }
      );
    }

    const newHash = await hashPassword(password);
    const updated = await prisma.user.update({
      where: { id: userId },
      data:  { passwordHash: newHash },
    });

    // Сразу авторизуем — выдаём cookie
    const token = createToken(updated);
    const response = NextResponse.json({
      user: {
        id:         updated.id,
        email:      updated.email,
        name:       updated.name,
        role:       updated.role,
        level:      updated.level,
        status:     updated.status,
        selfLevel:  updated.selfLevel,
        senseiName: updated.senseiName,
        experience: updated.experience,
        joinedAt:   updated.joinedAt,
      },
    });

    setAuthCookie(response, token);
    return response;

  } catch (e) {
    console.error('[POST /api/auth/set-password]', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
