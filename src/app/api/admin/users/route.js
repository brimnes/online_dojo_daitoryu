/** GET /api/admin/users — список всех пользователей (admin) */
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAdmin } from '@/lib/auth-server.js';

export async function GET(request) {
  const { error } = await requireAdmin(request);
  if (error) return error;

  const users = await prisma.user.findMany({
    orderBy: { joinedAt: 'asc' },
    select: {
      id: true, email: true, name: true, level: true, role: true,
      status: true, joinedAt: true, selfLevel: true,
      senseiName: true, experience: true,
    },
  });

  return NextResponse.json(users.map(u => ({
    id: u.id, email: u.email, name: u.name, level: u.level,
    role: u.role, status: u.status, joined_at: u.joinedAt,
    self_level: u.selfLevel, sensei_name: u.senseiName,
    experience: u.experience,
  })));
}
