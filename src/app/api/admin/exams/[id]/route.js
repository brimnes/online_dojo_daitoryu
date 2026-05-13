/** PATCH /api/admin/exams/[id] — одобрить или отклонить экзамен (admin/teacher) */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';

export async function PATCH(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const { status, teacher_note } = await request.json();
    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'status must be approved or rejected' }, { status: 400 });
    }

    const exam = await prisma.exam.update({
      where: { id: Number(params.id) },
      data:  { status, teacherNote: teacher_note || '', resolvedAt: new Date() },
    });

    // Если одобрен — обновляем уровень пользователя (заменяет DB триггер on_exam_approved)
    if (status === 'approved') {
      await prisma.user.update({
        where: { id: exam.userId },
        data:  { level: exam.targetLevel },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
