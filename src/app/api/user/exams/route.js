/**
 * GET /api/user/exams
 *
 * Возвращает список экзаменов текущего пользователя из БД.
 * Требует авторизации (httpOnly cookie dojo_token).
 *
 * Response: Array<{
 *   id:      number,
 *   level:   string,   // target_level, напр. '5kyu'
 *   status:  string,   // 'pending' | 'approved' | 'rejected'
 *   comment: string,   // teacher_note или ''
 *   date:    string,   // дата запроса в формате dd.mm.yyyy
 * }>
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth } from '@/lib/auth-server.js';

export async function GET(request) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    const exams = await prisma.exam.findMany({
      where:   { userId: user.id },
      orderBy: { requestedAt: 'asc' },
      select: {
        id:          true,
        targetLevel: true,
        status:      true,
        teacherNote: true,
        requestedAt: true,
      },
    });

    return NextResponse.json(exams.map(e => ({
      id:      e.id,
      level:   e.targetLevel,
      status:  e.status,                       // 'pending' | 'approved' | 'rejected'
      comment: e.teacherNote || '',
      date:    e.requestedAt
        ? new Date(e.requestedAt).toLocaleDateString('ru-RU')
        : '',
    })));

  } catch (e) {
    console.error('[GET /api/user/exams]', e);
    return NextResponse.json({ error: e.message || 'Ошибка сервера' }, { status: 500 });
  }
}
