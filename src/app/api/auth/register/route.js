/**
 * POST /api/auth/register
 *
 * Body: { email, password, name, selfLevel?, senseiName?, experience? }
 * Response: { user: { id, email, name, role, level, ... } }
 *
 * Создаёт пользователя с role='student', level='6kyu', status='active'.
 * Устанавливает httpOnly cookie 'dojo_token'.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { hashPassword, createToken, setAuthCookie } from '@/lib/auth-server.js';

// ─── Временный запрет регистрации ────────────────────────────────
// Поставь false чтобы снова открыть регистрацию
const REGISTRATION_CLOSED = true;

export async function POST(request) {
  if (REGISTRATION_CLOSED) {
    return NextResponse.json(
      { error: 'Регистрация временно закрыта' },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { email, password, name, selfLevel, senseiName, experience } = body;

    // Валидация
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Email, пароль и имя обязательны' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Пароль должен быть не менее 6 символов' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Проверяем, не занят ли email
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      );
    }

    // Хешируем пароль и создаём пользователя
    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email:        normalizedEmail,
        passwordHash,
        name:         name.trim(),
        role:         'student',
        level:        '6kyu',
        status:       'active',
        selfLevel:    selfLevel   || 'none',
        senseiName:   senseiName  || '',
        experience:   experience  || '',
      },
    });

    // Создаём токен и устанавливаем cookie
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
    }, { status: 201 });

    setAuthCookie(response, token);
    return response;

  } catch (e) {
    console.error('[POST /api/auth/register]', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
