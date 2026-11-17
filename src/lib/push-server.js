/**
 * Серверная отправка web-push конкретному пользователю
 * (на все устройства, где он включил уведомления).
 * Ошибки не пробрасываются: уведомление — не повод ронять основной запрос.
 */
import webpush from 'web-push';
import { prisma } from '@/lib/prisma.js';

let configured = false;
function configure() {
  if (configured) return true;
  const { VAPID_SUBJECT, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
  if (!VAPID_SUBJECT || !NEXT_PUBLIC_VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  configured = true;
  return true;
}

export function truncate(text, max = 140) {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export async function sendPushToUser(userId, { title, body, url = '/', tag }) {
  try {
    if (!userId || !configure()) return { sent: 0 };
    const subs = await prisma.pushSubscription.findMany({ where: { userId } });
    if (!subs.length) return { sent: 0 };

    const payload = JSON.stringify({ title, body, url, tag });
    const stale = [];
    let sent = 0;

    await Promise.allSettled(subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
        sent++;
      } catch (e) {
        if (e.statusCode === 410 || e.statusCode === 404) stale.push(s.id);
      }
    }));

    if (stale.length) {
      await prisma.pushSubscription.deleteMany({ where: { id: { in: stale } } });
    }
    return { sent };
  } catch (e) {
    console.warn('[push] sendPushToUser failed:', e?.message);
    return { sent: 0 };
  }
}
