/** PATCH /api/techniques/[id] — сохранить инфо о технике (admin) */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';

export async function PATCH(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    const body = await request.json();
    const data = {};
    if (body.nameRu      !== undefined) data.nameRu      = body.nameRu;
    if (body.kyu         !== undefined) data.kyu         = body.kyu;
    if (body.section     !== undefined) data.section     = body.section;
    if (body.description !== undefined) data.description = body.description;
    if (body.principles  !== undefined) data.principles  = body.principles;
    if (body.senseiQuote !== undefined) data.senseiQuote = body.senseiQuote;
    // snake_case aliases
    if (body.name_ru     !== undefined) data.nameRu      = body.name_ru;
    if (body.sensei_quote !== undefined) data.senseiQuote = body.sensei_quote;

    await prisma.technique.update({ where: { id: params.id }, data });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  try {
    // Cascade: mistakes and videos deleted via onDelete: Cascade in schema
    await prisma.technique.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
