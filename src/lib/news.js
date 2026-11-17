/**
 * Новости додзё (колокольчик ученика).
 * Автоматические новости создаются один раз на событие (auto_key)
 * и сразу уходят push-ом всем подписанным.
 */
import { prisma } from '@/lib/prisma.js';
import { sendPushToAll } from '@/lib/push-server.js';
import { monthRefLabel } from '@/lib/months';

// Ссылка, которую открывает уведомление (обрабатывается в App.jsx)
export function newsUrl(linkType, linkRef) {
  if (!linkType || !linkRef) return '/';
  if (linkType === 'url') return linkRef;
  return `/?open=${encodeURIComponent(linkType)}&id=${encodeURIComponent(linkRef)}`;
}

export function newsToSnake(n, { read = false } = {}) {
  return {
    id:         n.id,
    kind:       n.kind,
    title:      n.title,
    body:       n.body || '',
    link_type:  n.linkType,
    link_ref:   n.linkRef,
    is_auto:    !!n.autoKey,
    is_hidden:  n.isHidden,
    created_at: n.createdAt,
    read,
  };
}

/** Создаёт новость (если такой auto_key ещё не было) и рассылает push. */
export async function publishNews({ autoKey = null, kind, title, body = '', linkType = null, linkRef = null, push = true }) {
  try {
    let news;
    try {
      news = await prisma.news.create({ data: { autoKey, kind, title, body, linkType, linkRef } });
    } catch (e) {
      if (e.code === 'P2002') return null; // уже объявляли
      throw e;
    }
    if (push) {
      await sendPushToAll({ title, body: body || 'Дайто-рю · Онлайн додзё', url: newsUrl(linkType, linkRef), tag: `news-${news.id}` });
    }
    return news;
  } catch (e) {
    console.warn('[news] publish failed:', e?.message);
    return null;
  }
}

export function announceMonthOpened(month) {
  const name = monthRefLabel(month.id) || `${month.label} ${month.year ?? ''}`.trim();
  return publishNews({
    autoKey: `month:${month.id}`, kind: 'month',
    title: `Открыт месяц «${name}»`,
    body: 'Новые уроки уже в разделе «Месяцы»',
    linkType: 'month', linkRef: month.id,
  });
}

export function announceArticle(item) {
  return publishNews({
    autoKey: `article:${item.id}`, kind: 'article',
    title: `Новая статья: «${item.title}»`,
    body: item.subtitle || 'В базе знаний',
    linkType: 'knowledge', linkRef: item.id,
  });
}

export function announceCourse(course) {
  return publishNews({
    autoKey: `course:${course.id}`, kind: 'course',
    title: `Новый курс: «${course.title}»`,
    body: course.subtitle || 'В разделе «Курсы»',
    linkType: 'course', linkRef: course.id,
  });
}
