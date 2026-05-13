/**
 * POST /api/auth/login
 *
 * Body: { email, password }
 * Response: { user: { id, email, name, role, level, ... } }
 *
 * Устанавливает httpOnly cookie 'dojo_token' с JWT.
 * Если password_hash = 'RESET_REQUIRED' — возвращает 403 с флагом resetRequired.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { verifyPassword, createToken, setAuthCookie } from '@/lib/auth-server.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      );
    }

    // 1. Ищем пользователя
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // 2. Проверяем статус
    if (user.status === 'inactive') {
      return NextResponse.json(
        { error: 'Аккаунт деактивирован. Обратитесь к администратору.' },
        { status: 403 }
      );
    }

    // 3. Пользователь импортирован из Supabase — нужен сброс пароля
    if (user.passwordHash === 'RESET_REQUIRED') {
      return NextResponse.json(
        { error: 'Требуется смена пароля', resetRequired: true, userId: user.id },
        { status: 403 }
      );
    }

    // 4. Проверяем пароль
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // 5. Создаём токен и устанавливаем cookie
    const token = createToken(user);
    const response = NextResponse.json({
      user: {
        id:         user.id,
        email:      user.email,
        name:       user.name,
        role:       user.role,
        level:      user.level,
        status:     user.status,
        selfLevel:  user.selfLevel,
        senseiName: user.senseiName,
        experience: user.experience,
        joinedAt:   user.joinedAt,
      },
    });

    setAuthCookie(response, token);
    return response;

  } catch (e) {
    console.error('[POST /api/auth/login]', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
