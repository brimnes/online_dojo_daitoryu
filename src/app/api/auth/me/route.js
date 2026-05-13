/**
 * GET /api/auth/me
 *
 * Возвращает текущего авторизованного пользователя по JWT из cookie.
 * Response: { user: { id, email, name, role, level, ... } }
 *
 * Используется для восстановления сессии при перезагрузке страницы.
 */

import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth-server.js';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });

  } catch (e) {
    console.error('[GET /api/auth/me]', e);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
