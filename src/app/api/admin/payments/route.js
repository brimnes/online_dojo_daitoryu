/** GET /api/admin/payments — все платежи (реальные транзакции, с их статусами) */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const rows = await prisma.payment.findMany({
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { name: true, email: true } } },
  });

  return NextResponse.json(rows.map(p => ({
    id:                p.id,
    user_id:           p.userId,
    user_name:         p.user?.name  || '—',
    user_email:        p.user?.email || '—',
    product_title:     p.productTitle,
    product_type:      p.productType,
    product_reference: p.productReference,
    amount:            p.amount != null ? parseFloat(p.amount) : 0,
    status:            p.status,
    provider:          p.paymentProvider,
    paid_at:           p.paidAt,
    created_at:        p.createdAt,
  })));
}
