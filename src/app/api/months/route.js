/** GET /api/months — все месяцы, отсортированные по sort_order */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth } from '@/lib/auth-server.js';

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const months = await prisma.month.findMany({ orderBy: { sortOrder: 'asc' } });
  return NextResponse.json(months.map(m => ({
    id: m.id, label: m.label, kanji: m.kanji,
    description: m.description, is_open: m.isOpen, sort_order: m.sortOrder,
  })));
}
