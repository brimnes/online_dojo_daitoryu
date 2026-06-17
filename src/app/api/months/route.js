/**
 * GET /api/months               — все месяцы
 * GET /api/months?with_lessons=1 — месяцы + уроки одним запросом (без N+1)
 */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth } from '@/lib/auth-server.js';

function toMonth(m, lessons) {
  const base = {
    id: m.id, label: m.label, kanji: m.kanji,
    is_open: m.isOpen, sort_order: m.sortOrder,
    modal_theme:   m.modalTheme,
    modal_topics:  m.modalTopics,
    modal_results: m.modalResults,
    modal_extras:  m.modalExtras,
  };
  if (!lessons) return base;
  return {
    ...base,
    lessons: (m.lessons ?? lessons).map(l => ({
      id: l.id, month_id: l.monthId, num: l.num,
      title: l.title, subtitle: l.subtitle, text: l.text,
      duration: l.duration, video_id: l.videoId,
      video_provider: l.videoProvider, video_status: l.videoStatus,
    })),
  };
}

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const withLessons = searchParams.get('with_lessons') === '1';

  // Месяцы 1–5 (янв–май) скрыты из UI; отображаем только с июня (sortOrder >= 6)
  const months = await prisma.month.findMany({
    where: { sortOrder: { gte: 6 } },
    orderBy: { sortOrder: 'asc' },
    ...(withLessons ? { include: { lessons: { orderBy: { num: 'asc' } } } } : {}),
  });

  return NextResponse.json(months.map(m => toMonth(m, withLessons)));
}
