import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { prisma } from '@/lib/prisma.js';
import { requireAuth } from '@/lib/auth-server.js';

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY,
);

export async function POST(request) {
  const { error, user } = await requireAuth(request);
  if (error) return error;
  if (user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { title, body, url } = await request.json();
  if (!title?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'title и body обязательны' }, { status: 400 });
  }

  const subs = await prisma.pushSubscription.findMany();

  const payload = JSON.stringify({ title: title.trim(), body: body.trim(), url: url || '/' });

  let sent = 0, failed = 0;
  const stale = [];

  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        sent++;
      } catch (e) {
        failed++;
        if (e.statusCode === 410 || e.statusCode === 404) stale.push(s.id);
      }
    })
  );

  if (stale.length) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: stale } } });
  }

  return NextResponse.json({ ok: true, sent, failed, removed: stale.length });
}
