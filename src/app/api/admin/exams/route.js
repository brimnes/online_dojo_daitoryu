/**
 * GET  /api/admin/exams — все заявки на аттестацию (admin/teacher)
 * POST /api/admin/exams — добавить ручную запись об экзамене (admin/teacher)
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const exams = await prisma.exam.findMany({
    orderBy: { requestedAt: 'desc' },
    include: { student: { select: { name: true } } },
  });

  return NextResponse.json(exams.map(e => ({
    id:           e.id,
    user_id:      e.userId,
    user_name:    e.student?.name || '—',
    target_level: e.targetLevel,
    status:       e.status,
    teacher_note: e.teacherNote || '',
    requested_at: e.requestedAt,
    resolved_at:  e.resolvedAt,
  })));
}

export async function POST(request) {
  const { adminUser, error } = await requireAdmin(request);
  if (error) return error;

  try {
    const { userId, targetLevel, status, note } = await request.json();
    if (!userId || !targetLevel) {
      return NextResponse.json({ error: 'userId and targetLevel required' }, { status: 400 });
    }

    const exam = await prisma.exam.create({
      data: {
        userId,
        targetLevel,
        status:      status || 'approved',
        teacherNote: note || '',
        resolvedAt:  new Date(),
      },
    });

    // Если одобрен — обновляем уровень пользователя (заменяет DB триггер)
    if (exam.status === 'approved') {
      await prisma.user.update({
        where: { id: userId },
        data:  { level: targetLevel },
      });
    }

    return NextResponse.json({ ok: true, exam }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
