'use client';

/**
 * Колокольчик ученика: «Личное» (ответы сэнсэя на его вопросы)
 * и «Новости додзё» (открыт месяц, новая статья, новый курс, объявления).
 */
import { useState, useEffect, useCallback } from 'react';
import { C } from '@/lib/utils';
import { FLAT_INDEX } from '@/data/techniques';

const F = {
  mono:  "var(--font-mono), 'JetBrains Mono', monospace",
  serif: "var(--font-cormorant), 'Cormorant Garamond', serif",
};

const EMPTY = { replies: [], news: [], unread: 0 };
const REFRESH_MS = 3 * 60 * 1000;

export function useNotifications() {
  const [data, setData] = useState(EMPTY);

  const reload = useCallback(async () => {
    try {
      const r = await fetch('/api/notifications', { credentials: 'same-origin' });
      if (r.ok) setData(await r.json());
    } catch {}
  }, []);

  useEffect(() => {
    reload();
    const t = setInterval(reload, REFRESH_MS);
    const onFocus = () => reload();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(t); window.removeEventListener('focus', onFocus); };
  }, [reload]);

  const post = (body) => fetch('/api/notifications/read', {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }).catch(() => {});

  // Оптимистично отмечаем прочитанным
  const markItem = useCallback((item, isNews) => {
    if (item.read) return;
    setData(d => {
      const replies = d.replies.map(r => (!isNews && r.id === item.id ? { ...r, read: true } : r));
      const news    = d.news.map(n => (isNews && n.id === item.id ? { ...n, read: true } : n));
      return { replies, news, unread: Math.max(0, d.unread - 1) };
    });
    if (isNews) post({ news: [item.id] });
    else post(item.source === 'knowledge' ? { knowledge: [item.reply_id] } : { comments: [item.reply_id] });
  }, []);

  const markAll = useCallback(() => {
    setData(d => ({
      replies: d.replies.map(r => ({ ...r, read: true })),
      news:    d.news.map(n => ({ ...n, read: true })),
      unread:  0,
    }));
    post({ all: true });
  }, []);

  return { ...data, reload, markItem, markAll };
}

function fmtDate(iso) {
  const d = new Date(iso);
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(new Date()) - day(d)) / 86400000);
  if (diff === 0) return 'сегодня';
  if (diff === 1) return 'вчера';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

const short = (s, n = 90) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

const NEWS_ICON = { month: '月', article: '智', course: '技', announcement: '報' };

function openLink(nav, link) {
  if (!link) return;
  if (link.type === 'lesson')    return nav.lesson(link.month_id, link.lesson_id);
  if (link.type === 'knowledge') return nav.knowledgeItem(link.id);
  if (link.type === 'month')     return nav.month(link.id);
  if (link.type === 'course')    return nav.course(link.id);
  if (link.type === 'technique') {
    const hit = FLAT_INDEX.find(({ section, tech }) => `${section.id.toLowerCase()}_${tech.name}` === link.id);
    if (hit) nav.technique(hit.kyu, hit.section, hit.tech);
    return;
  }
  if (link.type === 'url' && link.id) {
    if (link.id.startsWith('/')) window.location.href = link.id;
    else window.open(link.id, '_blank', 'noopener');
  }
}

const BellIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const Dot = () => (
  <span style={{ width: 7, height: 7, borderRadius: '50%', background: C.accent, flexShrink: 0, marginTop: 7 }} />
);

const groupLabel = { fontFamily: F.mono, fontSize: 11, letterSpacing: '0.16em', color: C.muted, textTransform: 'uppercase', padding: '12px 16px 4px' };

export function NotificationBell({ notif, nav, isMobile, open, setOpen }) {
  const { replies, news, unread, markItem, markAll } = notif;

  const go = (item, isNews) => {
    markItem(item, isNews);
    setOpen(false);
    openLink(nav, isNews
      ? (item.link_type ? { type: item.link_type, id: item.link_ref } : null)
      : item.link);
  };

  const row = (key, { unreadDot, icon, title, sub, onClick }) => (
    <button key={key} type="button" onClick={onClick}
      style={{
        display: 'flex', gap: 12, width: '100%', textAlign: 'left', padding: '10px 16px',
        background: unreadDot ? 'rgba(158,47,31,0.05)' : 'transparent',
        border: 'none', borderTop: `1px solid ${C.hairline2}`, cursor: 'pointer',
      }}>
      <span style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 15, color: unreadDot ? C.accent : C.muted, width: 20, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontFamily: F.serif, fontSize: 16, color: C.ink, fontWeight: unreadDot ? 600 : 400, lineHeight: 1.3 }}>{title}</span>
        <span style={{ display: 'block', fontFamily: F.mono, fontSize: 12, color: C.muted, marginTop: 3, lineHeight: 1.45 }}>{sub}</span>
      </span>
      {unreadDot && <Dot />}
    </button>
  );

  const panelPos = isMobile
    ? { position: 'fixed', top: 'calc(max(12px, env(safe-area-inset-top)) + 50px)', left: 8, right: 8 }
    : { position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 420 };

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button type="button" onClick={() => setOpen(!open)}
        aria-label={unread ? `Уведомления: ${unread} новых` : 'Уведомления'}
        style={{ position: 'relative', background: 'none', border: 'none', color: unread ? C.ink : C.muted, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
        <BellIcon />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -6, minWidth: 17, height: 17, padding: '0 5px',
            background: C.accent, color: '#fff', borderRadius: 9, fontFamily: F.mono, fontSize: 11,
            lineHeight: '17px', textAlign: 'center', boxSizing: 'border-box',
          }}>{unread > 99 ? '99+' : unread}</span>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 190 }} />
          <div role="dialog" aria-label="Уведомления" style={{
            ...panelPos, zIndex: 200, background: C.surface2, border: `1px solid ${C.border}`,
            boxShadow: '0 12px 32px rgba(21,18,14,0.18)', maxHeight: isMobile ? '70vh' : 520, overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontFamily: F.serif, fontSize: 18, color: C.ink, flex: 1 }}>Уведомления</span>
              {unread > 0 && (
                <button type="button" onClick={markAll}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono, fontSize: 12, color: C.muted, textDecoration: 'underline' }}>
                  Прочитать все
                </button>
              )}
            </div>

            {replies.length > 0 && (
              <>
                <div style={groupLabel}>Ответы сэнсэя</div>
                {replies.map(r => row(r.id, {
                  unreadDot: !r.read,
                  icon: '声',
                  title: r.read ? 'Ответ на ваш вопрос' : 'Сэнсэй ответил на ваш вопрос',
                  sub: <>
                    {r.where && <>{r.where} · {fmtDate(r.created_at)}<br /></>}
                    {r.question && <span style={{ fontStyle: 'italic' }}>Вы: {short(r.question, 60)}<br /></span>}
                    <span style={{ color: C.ink2 }}>{short(r.text)}</span>
                  </>,
                  onClick: () => go(r, false),
                }))}
              </>
            )}

            {news.length > 0 && (
              <>
                <div style={groupLabel}>Новости додзё</div>
                {news.map(n => row(n.id, {
                  unreadDot: !n.read,
                  icon: NEWS_ICON[n.kind] || '報',
                  title: n.title,
                  sub: <>{n.body ? `${short(n.body, 80)} · ` : ''}{fmtDate(n.created_at)}</>,
                  onClick: () => go(n, true),
                }))}
              </>
            )}

            {!replies.length && !news.length && (
              <div style={{ padding: '28px 16px', fontFamily: F.serif, fontSize: 16, color: C.muted, textAlign: 'center' }}>
                Здесь появятся ответы сэнсэя на ваши вопросы и новости додзё
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const BANNER_KEY = 'notif_banner_hidden';

/** Баннер на главной, пока есть непрочитанное. Скрывается до появления нового. */
export function NotificationsBanner({ notif, onOpen }) {
  const unreadReplies = notif.replies.filter(r => !r.read);
  const unreadNews    = notif.news.filter(n => !n.read);
  const signature     = [...unreadReplies.map(r => r.id), ...unreadNews.map(n => n.id)].join(',');

  const [hiddenSig, setHiddenSig] = useState(null);
  useEffect(() => {
    try { setHiddenSig(sessionStorage.getItem(BANNER_KEY)); } catch {}
  }, []);

  if (!signature || hiddenSig === signature) return null;

  const hide = () => {
    setHiddenSig(signature);
    try { sessionStorage.setItem(BANNER_KEY, signature); } catch {}
  };

  let title, sub;
  if (unreadReplies.length) {
    title = unreadReplies.length === 1
      ? 'Сэнсэй ответил на ваш вопрос'
      : `Сэнсэй ответил на ваши вопросы — ${unreadReplies.length}`;
    sub = unreadReplies.map(r => r.where).filter(Boolean).slice(0, 2).join(' · ');
    if (unreadNews.length) sub = [sub, `и ещё новостей: ${unreadNews.length}`].filter(Boolean).join(' · ');
  } else {
    title = unreadNews.length === 1 ? unreadNews[0].title : `Новости додзё: ${unreadNews.length}`;
    sub   = unreadNews.length === 1 ? unreadNews[0].body : unreadNews.slice(0, 2).map(n => n.title).join(' · ');
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, padding: '14px 16px',
      background: C.surface2, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.accent}`,
    }}>
      <span style={{ color: C.accent, display: 'flex' }}><BellIcon size={20} /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: F.serif, fontSize: 17, color: C.ink, fontWeight: 600, lineHeight: 1.3 }}>{title}</div>
        {sub && <div style={{ fontFamily: F.mono, fontSize: 12, color: C.muted, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
      </div>
      <button type="button" onClick={onOpen}
        style={{ flexShrink: 0, background: C.accent, color: '#f1ece0', border: 'none', padding: '8px 14px', cursor: 'pointer', fontFamily: F.mono, fontSize: 12, letterSpacing: '0.08em' }}>
        Посмотреть
      </button>
      <button type="button" onClick={hide} aria-label="Скрыть"
        style={{ flexShrink: 0, background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 2 }}>
        ×
      </button>
    </div>
  );
}

/** Метка «Новое» у ответа сэнсэя на странице урока/техники/статьи */
export const NewReplyBadge = () => (
  <span style={{
    fontFamily: F.mono, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
    padding: '1px 7px', background: C.accent, color: '#fff',
  }}>Новое</span>
);
