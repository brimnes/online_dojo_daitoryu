import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

// GET /api/settings?keys=months_subtitle,other_key
// Returns { months_subtitle: "...", ... }
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const keys = searchParams.get('keys')?.split(',').filter(Boolean);

  const where = keys?.length ? { key: { in: keys } } : undefined;
  const rows = await prisma.siteSetting.findMany({ where });
  const result = Object.fromEntries(rows.map(r => [r.key, r.value]));
  return NextResponse.json(result);
}

// PATCH /api/settings  { key: 'months_subtitle', value: '...' }
// Admin only
export async function PATCH(req) {
  const user = await getSessionUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { key, value } = await req.json();
  if (!key || value === undefined) {
    return NextResponse.json({ error: 'key and value required' }, { status: 400 });
  }

  const row = await prisma.siteSetting.upsert({
    where:  { key },
    update: { value },
    create: { key, value },
  });
  return NextResponse.json(row);
}
