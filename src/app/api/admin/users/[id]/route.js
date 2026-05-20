/** PATCH /api/admin/users/[id] — обновить пользователя (admin). Используется для updateLevel. */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';

export async function PATCH(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const data = {};
    if (body.level  !== undefined) data.level  = body.level;
    if (body.role   !== undefined) data.role   = body.role;
    if (body.status !== undefined) data.status = body.status;

    await prisma.user.update({ where: { id: params.id }, data });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
