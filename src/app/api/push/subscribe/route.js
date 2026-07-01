import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma.js';
import { requireAuth } from '@/lib/auth-server.js';

export async function POST(request) {
  const { error, user } = await requireAuth(request);
  if (error) return error;

  const { endpoint, keys } = await request.json();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where:  { endpoint },
    update: { p256dh: keys.p256dh, auth: keys.auth, userId: user.id },
    create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId: user.id },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request) {
  const { error, user } = await requireAuth(request);
  if (error) return error;

  const { endpoint } = await request.json();
  if (!endpoint) return NextResponse.json({ error: 'endpoint required' }, { status: 400 });

  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: user.id } });
  return NextResponse.json({ ok: true });
}
