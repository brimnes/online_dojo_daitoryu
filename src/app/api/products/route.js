/** GET /api/products — активные товары (auth) */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth } from '@/lib/auth-server.js';

export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return error;

  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(products.map(p => ({
      id:          p.id,
      type:        p.type,
      reference:   p.reference,
      title:       p.title,
      description: p.description,
      price:       Number(p.price),
      is_active:   p.isActive,
      sort_order:  p.sortOrder,
    })));
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
