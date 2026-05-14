'use client';

import { useState } from 'react';
import { hasLevel, levelIndex } from '@/lib/utils';
import { useIsMobile } from '@/lib/mobile';
import { LEVELS, SELF_LEVELS } from '@/data/users';
import { DB_SECTIONS } from '@/data/techniques';
import { useMonths, useLessons, useUserAccessRows, hasMonthAccess, useKnowledge, useUserExams, useUserPayments } from '@/lib/db';
import TakedaMon from '@/components/TakedaMon';
import { hasIkkajoFullAccess, hasIkkajoSectionAccess, IKKAJO_SECTIONS, IKKAJO_SECTION_LABELS, getAccessibleIkkajoSections } from '@/lib/access';
import { useProducts } from '@/lib/useProducts';

const TABS = [
  { id: 'knowledge', label: 'База знаний',    kanji: '智', num: '01' },
  { id: 'months',    label: 'Месяцы 2026',    kanji: '月', num: '02' },
  { id: 'database',  label: 'База техник',    kanji: '技', num: '03' },
  { id: 'profile',   label: 'Личный кабинет', kanji: '人', num: '04' },
];

// ── Bottom nav items ──────────────────────────────────────────────
const BOTTOM_TABS = [
  { id: 'knowledge', label: 'Знания', icon: '智' },
  { id: 'months',    label: 'Месяцы', icon: '月' },
  { id: 'database',  label: 'База',   icon: '技' },
  { id: 'profile',   label: 'Профиль',icon: '人' },
];

// ── Sidebar palette (always dark) ────────────────────────────────
const SB = {
  bg:       '#0a0807',
  bgGrad:   'linear-gradient(180deg, #16130f 0%, #0a0807 30%, #13110e 100%)',
  surface:  '#13110e',
  ink:      '#ede5d3',
  ink2:     '#c2b59c',
  muted:    '#7a6c52',
  hairline: '#1f1a16',
  accent:   '#b73828',
  gold:     '#b8923a',
};

// ── Content area design tokens ────────────────────────────────────
const D = {
  bg:      '#f0ebe0',
  card:    '#faf8f4',
  border:  '#d2c7b0',
  dark:    '#15120e',
  muted:   '#9a8860',
  sub:     '#6f6452',
  gold:    '#b8923a',
  crimson: '#b73828',
  green:   '#2d7a4a',
  greenBg: '#edf7f1',
  greenBd: '#a8d8b8',
  amberBg: '#fdf7ea',
  amberBd: '#e8d5a0',
};

export default function Dashboard({ nav, watched, user: userProp, onLogout }) {
  const [tab, setTab]     = useState('months');
  const [modal, setModal] = useState(null);
  const isMobile          = useIsMobile();
  const u     = userProp || {};
  const curLv = LEVELS.find(l => l.id === u.level);
  const isAdmin = u.role === 'admin';
  const { rows: userAccess, loading: accessLoading } = useUserAccessRows();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Sidebar (desktop only) ── */}
      {!isMobile && (
        <aside style={{ width: 260, background: SB.bgGrad, borderRight: `1px solid ${SB.hairline}`, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', boxShadow: 'inset -1px 0 0 rgba(184,146,58,0.06)' }}>
          {/* top accent stripe */}
          <div style={{ height: 2, background: `linear-gradient(90deg, transparent, ${SB.accent} 30%, ${SB.gold} 70%, transparent)`, opacity: 0.5, flexShrink: 0 }} />

          {/* brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '26px 24px 20px' }}>
            <TakedaMon size={28} color={SB.gold} />
            <div>
              <div style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: 10, letterSpacing: '0.22em', color: SB.ink, fontWeight: 600, textTransform: 'uppercase' }}>ONLINE DAITO-RYU</div>
              <div style={{ fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: 10, color: SB.gold, letterSpacing: '0.18em', marginTop: 3, opacity: 0.75 }}>合気柔術</div>
            </div>
          </div>

          <div style={{ height: 1, background: SB.hairline }} />

          {/* user card */}
          <div style={{ padding: '18px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', border: `1px solid ${SB.gold}`, background: SB.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: 17, color: SB.gold, flexShrink: 0 }}>
                {(u.name || '?')[0]}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 13, fontWeight: 500, color: SB.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                <div style={{ fontSize: 10, color: SB.muted, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
              </div>
            </div>
            {curLv && (
              <div style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${SB.hairline}`, padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
                  <span style={{ fontSize: 9, color: SB.muted, letterSpacing: '0.18em', textTransform: 'uppercase' }}>текущий уровень</span>
                  {curLv.program && <span style={{ fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: 11, color: SB.gold }}>段</span>}
                </div>
                <div style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: 15, letterSpacing: '0.05em', color: SB.ink, fontWeight: 500 }}>{curLv.label}</div>
                {curLv.program && (
                  <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: 11, color: SB.muted, marginTop: 2 }}>
                    {DB_SECTIONS.find(d => d.id === curLv.program)?.label}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ height: 1, background: SB.hairline }} />

          {/* nav */}
          <nav style={{ flex: 1, paddingTop: 10 }}>
            {TABS.map(({ id, label, kanji, num }) => {
              const isA = tab === id;
              return (
                <button key={id} onClick={() => setTab(id)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 24px', background: isA ? 'rgba(0,0,0,0.3)' : 'transparent', border: 'none', borderLeft: `2px solid ${isA ? SB.accent : 'transparent'}`, cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: isA ? SB.accent : SB.muted, letterSpacing: '0.06em', flexShrink: 0 }}>{num}</span>
                  <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 13, color: isA ? SB.ink : SB.ink2, fontWeight: isA ? 600 : 400, flex: 1 }}>{label}</span>
                  <span style={{ fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: 13, color: isA ? SB.gold : SB.muted, opacity: 0.8 }}>{kanji}</span>
                </button>
              );
            })}
          </nav>

          <div style={{ height: 1, background: SB.hairline }} />
          <div style={{ padding: '12px 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {isAdmin && (
              <a href="/admin"
                style={{ display: 'block', padding: '7px 0', background: 'none', border: 'none', color: SB.muted, fontSize: 11, cursor: 'pointer', textAlign: 'left', textDecoration: 'none', letterSpacing: '0.06em' }}>
                ⚙ Панель управления
              </a>
            )}
            <button onClick={onLogout} style={{ padding: '7px 0', background: 'none', border: 'none', color: SB.muted, fontSize: 11, cursor: 'pointer', textAlign: 'left', letterSpacing: '0.06em' }}>
              ↳ Выйти
            </button>
          </div>
          {/* bottom kanji decoration */}
          <div style={{ padding: '8px 24px 16px', textAlign: 'right', fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: 11, color: SB.gold, letterSpacing: '0.2em', opacity: 0.3 }}>武道</div>
        </aside>
      )}

      {/* ── Main content ── */}
      <main style={{ flex: 1, background: D.bg, minHeight: '100vh' }}>

        {/* Mobile top header */}
        {isMobile && (
          <header style={{
            display: 'flex',
            alignItems: 'center',
            padding: `max(12px, env(safe-area-inset-top)) 16px 12px`,
            background: SB.bg,
            borderBottom: `1px solid ${SB.hairline}`,
            position: 'sticky',
            top: 0,
            zIndex: 50,
            gap: 10,
          }}>
            <TakedaMon size={24} color={SB.gold} />
            <span style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: 11, letterSpacing: '0.14em', color: SB.ink, flex: 1, textTransform: 'uppercase' }}>
              {TABS.find(t => t.id === tab)?.label}
            </span>
            {curLv && (
              <span style={{ padding: '3px 8px', border: `1px solid ${SB.hairline}`, color: SB.gold, fontSize: 10, fontFamily: "var(--font-jost), 'Jost', sans-serif" }}>
                {curLv.label}
              </span>
            )}
          </header>
        )}

        {/* Desktop header */}
        {!isMobile && (
          <header style={{ display: 'flex', alignItems: 'center', padding: '18px 40px', background: '#faf5e8', borderBottom: `1px solid ${D.border}`, position: 'sticky', top: 0, zIndex: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, letterSpacing: '0.22em', color: D.muted, textTransform: 'uppercase', marginBottom: 2 }}>
                {TABS.find(t => t.id === tab)?.num} / 04
              </div>
              <span style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: 14, letterSpacing: '0.12em', color: D.dark, textTransform: 'uppercase' }}>
                {TABS.find(t => t.id === tab)?.label}
              </span>
            </div>
            {curLv && (
              <span style={{ padding: '4px 12px', background: 'transparent', border: `1px solid ${D.gold}`, color: D.gold, fontSize: 11, fontFamily: "var(--font-jost), 'Jost', sans-serif", letterSpacing: '0.06em' }}>
                {curLv.label}
              </span>
            )}
          </header>
        )}

        <div
          style={{ padding: isMobile ? '16px' : '40px 48px' }}
          className={isMobile ? 'has-bottom-nav' : ''}
          key={tab}
        >
          <div className="fade">
            {tab === 'knowledge' && <TabKnowledge nav={nav} isMobile={isMobile} />}
            {tab === 'months'    && <TabMonths   nav={nav} watched={watched} user={u} userAccess={userAccess} accessLoading={accessLoading} isMobile={isMobile} />}
            {tab === 'database'  && <TabDatabase nav={nav} setModal={setModal} user={u} userAccess={userAccess} isMobile={isMobile} />}
            {tab === 'profile'   && <TabProfile user={u} userAccess={userAccess} accessLoading={accessLoading} isMobile={isMobile} onLogout={onLogout} />}
          </div>
        </div>
      </main>

      {/* ── Bottom navigation (mobile only) ── */}
      {isMobile && (
        <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: SB.bg, borderTop: `1px solid ${SB.hairline}`, display: 'flex', alignItems: 'stretch', paddingBottom: 'env(safe-area-inset-bottom)', zIndex: 100 }}>
          {BOTTOM_TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', background: 'none', border: 'none', cursor: 'pointer', color: tab === id ? SB.gold : SB.muted, minHeight: 60, position: 'relative' }}
            >
              {tab === id && (
                <span style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 24, height: 1.5, background: SB.accent }} />
              )}
              <span style={{ fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: 18, lineHeight: 1 }}>{icon}</span>
              <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, marginTop: 3, letterSpacing: '0.04em', fontWeight: tab === id ? 600 : 400 }}>{label}</span>
            </button>
          ))}
          {isAdmin && (
            <a href="/admin" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '10px 4px', color: SB.muted, textDecoration: 'none', minHeight: 60 }}>
              <span style={{ fontSize: 18, lineHeight: 1 }}>⚙</span>
              <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, marginTop: 3 }}>Admin</span>
            </a>
          )}
        </nav>
      )}

      {/* ── Modal покупки ── */}
      {modal && (
        <div onClick={() => setModal(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(10,8,7,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#faf5e8', border: `1px solid ${D.border}`, padding: isMobile ? '32px 24px' : '44px 48px', width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.5)' }}>
            <div style={{ fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: 56, color: D.gold, lineHeight: 1, marginBottom: 16 }}>{modal.kanji}</div>
            <div style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: 20, letterSpacing: '0.06em', color: D.dark, marginBottom: 6, textTransform: 'uppercase' }}>{modal.label}</div>
            <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, color: D.muted, marginBottom: 20, letterSpacing: '0.06em' }}>{modal.sublabel} · {modal.techniques} техник</div>
            <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 42, fontWeight: 300, color: D.dark, marginBottom: 8, lineHeight: 1 }}>{modal.price}</div>
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: 14, color: D.sub, lineHeight: 1.7, marginBottom: 28 }}>Разовая оплата — постоянный доступ без ограничений.</p>
            <button style={{ width: '100%', padding: '14px', background: D.dark, color: '#ede5d3', border: 'none', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: 10, minHeight: 44 }}>
              Перейти к оплате
            </button>
            <button onClick={() => setModal(null)}
              style={{ width: '100%', padding: '10px', background: 'none', border: 'none', fontFamily: "var(--font-jost), 'Jost', sans-serif", color: D.muted, fontSize: 12, cursor: 'pointer', minHeight: 44 }}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Вкладка: Месяцы ──────────────────────────────────────────────
function TabMonths({ nav, watched, user, userAccess, accessLoading, isMobile }) {
  const { months,   loading: monthsLoading }   = useMonths();
  const { products, loading: productsLoading } = useProducts();

  if (monthsLoading) return <div style={{ color: D.muted, fontSize: 13 }}>Загрузка…</div>;

  const productByRef = {};
  (products ?? []).forEach(p => { if (p.type === 'month') productByRef[p.reference] = p; });

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, letterSpacing: '0.28em', color: D.muted, textTransform: 'uppercase', marginBottom: 8 }}>02 · Учебный год</div>
        <h2 style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 28 : 38, color: D.dark, letterSpacing: '0.03em', lineHeight: 1.1, marginBottom: 8 }}>Месяцы Дайто-рю</h2>
        <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: 15, color: D.sub, lineHeight: 1.6 }}>
          Программа от Введения через Иккаджо к экзамену 3 кю. 1 990 ₽ за месяц.
        </div>
        <div style={{ height: 1, background: D.border, marginTop: 20 }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(190px, 1fr))', gap: isMobile ? 8 : 10 }}>
        {(months ?? []).map((m, idx) => (
          <MonthCard
            key={m.id}
            month={m}
            monthIndex={idx + 1}
            nav={nav}
            watched={watched}
            userAccess={userAccess}
            accessLoading={accessLoading}
            product={productByRef[m.id] ?? null}
            isMobile={isMobile}
          />
        ))}
      </div>
    </div>
  );
}

function MonthCard({ month: m, monthIndex, nav, watched, userAccess, accessLoading, product, isMobile }) {
  const { lessons } = useLessons(m.id);
  const [buying,   setBuying]   = useState(false);
  const [buyError, setBuyError] = useState('');

  const watchedCount = (lessons ?? []).filter(l => watched[l.id]).length;
  const hasProg      = (lessons ?? []).length > 0 && watchedCount > 0;

  const hasAccess = !accessLoading && hasMonthAccess(userAccess ?? [], m.id);

  const handleBuy = async () => {
    if (!product || buying) return;
    setBuying(true);
    setBuyError('');
    try {
      const res  = await fetch('/api/yookassa/create-payment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ product_id: product.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBuyError(res.status === 409 ? 'Доступ уже есть' : (data.error || 'Ошибка'));
        return;
      }
      window.location.href = data.confirmation_url;
    } catch {
      setBuyError('Ошибка соединения');
    } finally {
      setBuying(false);
    }
  };

  const locked   = !accessLoading && !hasAccess;
  const cardBg   = m.current
    ? 'linear-gradient(155deg, #fdfcf4 0%, #faf6e8 60%, #f5efd8 100%)'
    : locked ? '#f5f2eb' : '#faf6ec';
  const cardBorder = m.current
    ? '1px solid #c8a84a'
    : locked ? '1px dashed #d2c7b0' : '1px solid #d8cdb8';
  const kanjiOp  = locked ? 0.12 : m.current ? 0.15 : 0.13;
  const shadow   = m.current
    ? '0 1px 0 #c8a84a inset, 0 8px 32px -8px rgba(139,105,20,0.18)'
    : locked ? 'none' : '0 2px 12px -4px rgba(20,16,10,0.08)';

  const totalLessons = (lessons ?? []).length;
  const progress = totalLessons > 0 ? watchedCount / totalLessons : 0;

  return (
    <div style={{ position: 'relative', padding: isMobile ? '14px 12px' : '20px 18px', minHeight: isMobile ? 160 : 210, background: cardBg, border: cardBorder, display: 'flex', flexDirection: 'column', gap: 6, boxShadow: shadow, overflow: 'hidden' }}>

      <div style={{ position: 'absolute', top: -6, right: 6, fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: isMobile ? 72 : 100, color: m.current ? '#c8a84a' : '#8B6914', opacity: kanjiOp, lineHeight: 1, pointerEvents: 'none', fontWeight: 300 }}>{m.kanji}</div>

      {m.current && (
        <div style={{ position: 'absolute', top: 12, left: 12, width: 6, height: 6, background: '#c8a84a', transform: 'rotate(45deg)' }} />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 18, position: 'relative', marginTop: m.current ? 6 : 0 }}>
        <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, letterSpacing: '0.22em', color: m.current ? '#8B6914' : '#b0a080', fontWeight: 600 }}>
          {monthIndex?.toString().padStart(2, '0')} / 12
        </span>
        {m.current && (
          <span style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: 8, letterSpacing: '0.28em', color: '#8B6914', textTransform: 'uppercase', border: '1px solid #c8a84a', padding: '2px 8px' }}>текущий</span>
        )}
        {locked && !m.current && (
          <span style={{ fontSize: 10, color: '#c8c0b0' }}>🔒</span>
        )}
        {hasAccess && !m.current && (
          <span style={{ fontSize: 10, color: '#5a8a6a' }}>✓</span>
        )}
      </div>

      <div style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 20 : 26, letterSpacing: '0.04em', textTransform: 'uppercase', color: locked ? '#b0a080' : D.dark, position: 'relative', fontWeight: 500, lineHeight: 0.95, marginTop: 2 }}>{m.label}</div>
      <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: isMobile ? 13 : 14, color: locked ? '#c0b89a' : D.sub, position: 'relative', marginTop: 2 }}>{m.subtitle || m.description || m.desc}</div>

      <div style={{ marginTop: 'auto', paddingTop: isMobile ? 10 : 14, position: 'relative' }}>
        {hasAccess && hasProg ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: D.muted, letterSpacing: '0.1em' }}>{watchedCount} / {totalLessons} уроков</span>
              <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: D.crimson, letterSpacing: '0.1em', fontWeight: 600 }}>{Math.round(progress * 100)}%</span>
            </div>
            <div style={{ height: 2, background: '#e0d8c8' }}>
              <div style={{ height: '100%', width: `${progress * 100}%`, background: D.crimson, transition: 'width 0.4s ease' }} />
            </div>
          </>
        ) : hasAccess ? (
          <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: '#b0a080', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {totalLessons > 0 ? `${totalLessons} уроков · не начат` : 'Скоро'}
          </span>
        ) : product ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 15, color: D.sub }}>{product.price?.toLocaleString('ru-RU')} ₽</span>
            <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: D.gold, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Открыть →</span>
          </div>
        ) : null}
      </div>

      <div style={{ paddingTop: 8 }}>
        {accessLoading ? (
          <div style={{ height: 36, background: '#ece8e0', width: isMobile ? '100%' : 80 }} />
        ) : hasAccess ? (
          <button
            onClick={() => nav.month(m.id)}
            style={{ padding: isMobile ? '11px 12px' : '8px 16px', background: D.dark, color: '#ede5d3', border: 'none', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 13 : 11, letterSpacing: '0.1em', cursor: 'pointer', minHeight: 44, width: isMobile ? '100%' : 'auto' }}>
            Войти →
          </button>
        ) : product ? (
          <div>
            <button
              onClick={handleBuy}
              disabled={buying}
              style={{ padding: isMobile ? '11px 12px' : '8px 16px', background: buying ? '#f0ebe0' : 'transparent', color: buying ? D.muted : D.gold, border: `1px solid ${buying ? D.border : '#c8a84a'}`, fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 13 : 11, letterSpacing: '0.08em', cursor: buying ? 'default' : 'pointer', minHeight: 44, width: isMobile ? '100%' : 'auto', transition: 'all 0.15s' }}>
              {buying ? 'Переход к оплате…' : `Купить — ${product.price?.toLocaleString('ru-RU')} ₽`}
            </button>
            {buyError && <div style={{ fontSize: 10, color: D.crimson, marginTop: 4 }}>{buyError}</div>}
          </div>
        ) : (
          <span style={{ fontSize: 11, color: '#c0b89a' }}>Недоступно</span>
        )}
      </div>
    </div>
  );
}

// ── Вкладка: База знаний ─────────────────────────────────────────
function TabKnowledge({ nav, isMobile }) {
  const { items, loading } = useKnowledge();
  if (loading) return <div style={{ color: D.muted, fontSize: 13 }}>Загрузка…</div>;
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, letterSpacing: '0.28em', color: D.muted, textTransform: 'uppercase', marginBottom: 8 }}>01 · Открыто для всех</div>
        <h2 style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 28 : 38, color: D.dark, letterSpacing: '0.03em', lineHeight: 1.1 }}>База знаний</h2>
        <div style={{ height: 1, background: D.border, marginTop: 16 }} />
      </div>
      {items.length === 0 && <div style={{ fontSize: 13, color: D.muted }}>Материалы скоро появятся</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {items.map(item => (
          <div key={item.id}
            onClick={() => nav.knowledgeItem(item.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: isMobile ? '14px 12px' : '18px 16px', background: D.card, border: `1px solid ${D.border}`, borderTop: 'none', cursor: 'pointer', transition: 'background 0.1s' }}
            onMouseEnter={e => { e.currentTarget.style.background = D.bg; }}
            onMouseLeave={e => { e.currentTarget.style.background = D.card; }}>
            {item.video_id && (
              <div style={{ width: isMobile ? 48 : 60, height: isMobile ? 34 : 42, background: '#13110e', border: `1px solid #2a2218`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: D.gold, fontSize: 12 }}>▶</span>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 15 : 15, fontWeight: 500, color: D.dark, marginBottom: 2 }}>{item.title}</div>
              {item.subtitle && <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: 13, color: D.muted }}>{item.subtitle}</div>}
            </div>
            <span style={{ color: D.gold, fontSize: 14, flexShrink: 0 }}>→</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Вкладка: База техник ──────────────────────────────────────────
function TabDatabase({ nav, setModal, user, userAccess, isMobile }) {
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, letterSpacing: '0.28em', color: D.muted, textTransform: 'uppercase', marginBottom: 8 }}>03 · Разовая покупка</div>
        <h2 style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 28 : 38, color: D.dark, letterSpacing: '0.03em', lineHeight: 1.1 }}>База техник</h2>
        <div style={{ height: 1, background: D.border, marginTop: 16 }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {(DB_SECTIONS ?? []).map(sec => {
          const avail  = hasLevel(user?.level || '6kyu', sec.requiredLevel);
          const ua = userAccess ?? [];
          const hasFullIkkajo      = ua.some(a => a.type === 'section' && a.reference === 'ikkajo');
          const hasAnyIkkajoSection = sec.id === 'ikkajo' &&
            IKKAJO_SECTIONS.some(k => ua.some(a => a.type === 'section' && a.reference === k));
          const bought =
            sec.id === 'ikkajo'
              ? hasFullIkkajo || hasAnyIkkajoSection
              : ua.some(a => a.type === 'section' && a.reference === sec.id);
          return (
            <div key={sec.id} style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 12 : 20, padding: isMobile ? '16px' : '22px 20px', background: D.card, border: `1px solid ${D.border}`, borderTop: 'none', opacity: avail ? 1 : 0.45, flexWrap: isMobile ? 'wrap' : 'nowrap', transition: 'background 0.1s' }}>
              <div style={{ fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: isMobile ? 28 : 36, minWidth: 40, textAlign: 'center', color: bought ? D.gold : avail ? D.dark : '#b0a080', lineHeight: 1, flexShrink: 0 }}>{sec.kanji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 16 : 18, letterSpacing: '0.04em', color: D.dark }}>{sec.label}</span>
                  <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, color: D.muted, background: D.bg, border: `1px solid ${D.border}`, padding: '2px 8px', letterSpacing: '0.08em' }}>{sec.sublabel}</span>
                </div>
                <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: 14, color: D.sub, lineHeight: 1.6 }}>{sec.desc}</div>
                <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: D.muted, marginTop: 4, letterSpacing: '0.06em' }}>{sec.techniques} техник</div>
              </div>
              <div style={{ flexShrink: 0, width: isMobile ? '100%' : 'auto', marginTop: isMobile ? 8 : 0 }}>
                {bought
                  ? <button onClick={sec.id === 'ikkajo' ? nav.ikkajo : undefined} style={{ padding: isMobile ? '11px 20px' : '9px 18px', background: D.dark, color: '#ede5d3', border: 'none', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 12, letterSpacing: '0.08em', cursor: 'pointer', minHeight: 44, width: isMobile ? '100%' : 'auto' }}>Открыть →</button>
                  : avail
                    ? <button onClick={() => setModal(sec)} style={{ padding: isMobile ? '11px 20px' : '9px 18px', background: 'transparent', color: D.gold, border: `1px solid #c8a84a`, fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 12, letterSpacing: '0.06em', cursor: 'pointer', minHeight: 44, width: isMobile ? '100%' : 'auto' }}>Купить — {sec.price}</button>
                    : <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, color: '#c0b89a', letterSpacing: '0.06em' }}>🔒 Нет доступа</span>
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Вкладка: Профиль ─────────────────────────────────────────────
function TabProfile({ user: u, userAccess, accessLoading, isMobile, onLogout }) {
  const [sub, setSub] = useState('info');
  const { exams: userExams, loading: examsLoading }  = useUserExams();
  const { payments: userPays, loading: paysLoading } = useUserPayments();
  const usr   = u || {};
  const curLv = LEVELS.find(l => l.id === usr.level);
  const selfLvLabel = SELF_LEVELS.find(l => l.id === usr.selfLevel)?.label;

  const grouped = [];
  const seen = {};
  (userExams ?? []).forEach(ex => {
    if (!seen[ex.level]) { seen[ex.level] = []; grouped.push({ level: ex.level, attempts: seen[ex.level] }); }
    seen[ex.level].push(ex);
  });

  const SUB_TABS = [
    { id:'info',     label:'Обо мне'  },
    { id:'exams',    label:'Экзамены' },
    { id:'access',   label:'Доступ'   },
    { id:'unlock',   label:'Купить'   },
    { id:'payments', label:'Оплаты'   },
  ];

  // for level card
  const LEVEL_KANJI_MAP = { '6kyu':'六','5kyu':'五','4kyu':'四','3kyu':'三','2kyu':'二','1kyu':'一','1dan':'初','2dan':'弐','3dan':'参' };
  const KYU_STEPS = ['6kyu','5kyu','4kyu','3kyu','2kyu','1kyu','1dan'];

  const lvIndex  = levelIndex(usr.level ?? '6kyu');
  const lvTotal  = (LEVELS ?? []).length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, letterSpacing: '0.28em', color: D.muted, textTransform: 'uppercase', marginBottom: 8 }}>04 · Аккаунт</div>
        <h2 style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 28 : 38, color: D.dark, letterSpacing: '0.03em', lineHeight: 1.1 }}>Личный кабинет</h2>
        <div style={{ height: 1, background: D.border, marginTop: 16 }} />
      </div>

      {/* Profile hero card */}
      <div style={{ background: D.card, border: `1px solid ${D.border}`, marginBottom: 24, overflow: 'hidden' }}>
        {/* Top strip */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${D.dark}, ${D.gold} 40%, ${D.dark})`, opacity: 0.6 }} />
        <div style={{ padding: isMobile ? '20px 16px' : '28px 28px', display: 'flex', alignItems: 'flex-start', gap: isMobile ? 14 : 22, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>

          {/* Avatar */}
          <div style={{ width: isMobile ? 56 : 72, height: isMobile ? 56 : 72, borderRadius: '50%', border: `2px solid ${D.gold}`, background: '#f5f0e8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: isMobile ? 22 : 30, color: D.gold, flexShrink: 0 }}>
            {(usr.name || '?')[0]}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 20 : 26, letterSpacing: '0.04em', color: D.dark, lineHeight: 1.1, marginBottom: 4 }}>{usr.name || '—'}</div>
            <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, color: D.muted, marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usr.email}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {curLv && (
                <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, color: D.gold, background: D.amberBg, border: `1px solid ${D.amberBd}`, padding: '3px 12px', letterSpacing: '0.08em' }}>{curLv.label}</span>
              )}
              {usr.joinedAt && (
                <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: D.muted, letterSpacing: '0.04em' }}>в школе с {usr.joinedAt}</span>
              )}
            </div>
          </div>

          {/* Level card (desktop) */}
          {!isMobile && (
            <div style={{ width: 200, flexShrink: 0, background: '#f5f0e8', border: `1px solid ${D.border}`, position: 'relative', padding: '18px 18px 14px', overflow: 'hidden', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {/* kanji watermark */}
              <div style={{ position: 'absolute', right: 6, bottom: -10, fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: 64, color: D.gold, opacity: 0.1, pointerEvents: 'none', lineHeight: 1, userSelect: 'none' }}>
                {LEVEL_KANJI_MAP[usr.level] || '段'}
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, letterSpacing: '0.2em', color: D.muted, textTransform: 'uppercase', marginBottom: 8 }}>Текущий уровень</div>
                <div style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: 38, color: D.dark, lineHeight: 1, letterSpacing: '0.02em', marginBottom: 4 }}>
                  {curLv?.label || '—'}
                </div>
                <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: 13, color: D.sub }}>
                  {curLv?.program ? (DB_SECTIONS.find(d => d.id === curLv.program)?.label || 'Иккаджо') : '—'}
                </div>
              </div>
              <div>
                <div style={{ height: 1, background: D.border, margin: '14px 0 10px' }} />
                <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, letterSpacing: '0.18em', color: D.muted, textTransform: 'uppercase', marginBottom: 8 }}>Путь к Сёдан</div>
                <div style={{ display: 'flex', gap: 2, marginBottom: 5 }}>
                  {KYU_STEPS.map(stepId => {
                    const stepIdx  = LEVELS.findIndex(l => l.id === stepId);
                    const done     = stepIdx >= 0 && stepIdx < lvIndex;
                    const current  = stepId === usr.level;
                    return (
                      <div key={stepId} style={{ flex: 1, height: 3, background: done ? D.crimson : current ? D.gold : D.border, position: 'relative' }}>
                        {current && <div style={{ position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: D.gold, border: '2px solid #f5f0e8', zIndex: 1 }} />}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, color: D.muted, letterSpacing: '0.1em' }}>6 КЮ</span>
                  <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, color: D.muted, letterSpacing: '0.1em' }}>СЁДАН</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Level progress bar (mobile) — segmented */}
        {isMobile && (
          <div style={{ padding: '0 16px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, color: D.muted, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Путь к Сёдан</span>
              <span style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: 10, color: D.gold, letterSpacing: '0.06em' }}>{curLv?.label || '—'}</span>
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              {KYU_STEPS.map(stepId => {
                const stepIdx = LEVELS.findIndex(l => l.id === stepId);
                const done    = stepIdx >= 0 && stepIdx < lvIndex;
                const current = stepId === usr.level;
                return (
                  <div key={stepId} style={{ flex: 1, height: 3, background: done ? D.crimson : current ? D.gold : '#e0d8c8', position: 'relative' }}>
                    {current && <div style={{ position: 'absolute', top: -2.5, left: '50%', transform: 'translateX(-50%)', width: 8, height: 8, borderRadius: '50%', background: D.gold, border: '2px solid #faf8f4' }} />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', background: D.card, border: `1px solid ${D.border}`, borderBottom: 'none', overflowX: 'auto' }}>
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSub(t.id)}
            style={{ padding: isMobile ? '13px 12px' : '13px 18px', background: 'none', border: 'none', borderBottom: `2px solid ${sub === t.id ? D.crimson : 'transparent'}`, color: sub === t.id ? D.dark : D.muted, fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 10 : 11, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: -1, whiteSpace: 'nowrap', minHeight: 44, transition: 'color 0.12s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {sub === 'info' && (
        <div style={{ border: `1px solid ${D.border}`, borderTop: 'none', background: D.card }}>
          {[
            { label: 'Уровень (подтверждён)',     value: curLv?.label,    show: !!curLv },
            { label: 'Уровень (при регистрации)', value: selfLvLabel,     show: !!selfLvLabel && selfLvLabel !== curLv?.label },
            { label: 'Имя сэнсэя',               value: usr.senseiName || 'Станислав Копин', show: true },
          ].filter(r => r.show).map(row => (
            <div key={row.label} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '220px 1fr', padding: '14px 20px', borderBottom: `1px solid ${D.border}`, alignItems: 'start', gap: isMobile ? 2 : 0 }}>
              <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: D.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{row.label}</span>
              <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 13, color: D.dark }}>{row.value}</span>
            </div>
          ))}
          {usr.experience && (
            <div style={{ padding: '20px' }}>
              <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, color: D.muted, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>Об опыте</div>
              <p style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: 15, color: D.sub, lineHeight: 1.85, borderLeft: `2px solid ${D.border}`, paddingLeft: 16, margin: 0 }}>{usr.experience}</p>
            </div>
          )}
          {isMobile && (
            <div style={{ padding: '14px 16px', borderTop: `1px solid ${D.border}` }}>
              <button onClick={onLogout} style={{ width: '100%', padding: '10px', background: 'none', border: `1px solid ${D.border}`, fontFamily: "var(--font-jost), 'Jost', sans-serif", color: D.muted, fontSize: 12, cursor: 'pointer', minHeight: 44, letterSpacing: '0.06em' }}>
                Выйти из аккаунта
              </button>
            </div>
          )}
        </div>
      )}

      {/* Exams tab */}
      {sub === 'exams' && (
        <div style={{ border: `1px solid ${D.border}`, borderTop: 'none' }}>
          {examsLoading && (
            <div style={{ padding: '24px 20px', color: D.muted, fontSize: 13, background: D.card }}>Загрузка…</div>
          )}
          {!examsLoading && grouped.length === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center', background: D.card }}>
              <div style={{ fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: 32, color: D.border, marginBottom: 12 }}>段</div>
              <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: 15, color: D.muted }}>Экзаменов пока нет</div>
            </div>
          )}
          {!examsLoading && grouped.map((g, gi) => {
            const lv     = LEVELS.find(l => l.id === g.level);
            const passed = g.attempts.some(a => a.status === 'approved');
            const isDan  = g.level.includes('dan');
            const grpKanji = LEVEL_KANJI_MAP[g.level] || '段';
            return (
              <div key={g.level} style={{ borderTop: `1px solid ${D.border}`, background: isDan ? '#faf5e8' : D.card }}>
                {/* Group header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: 18, color: isDan ? D.gold : D.crimson, lineHeight: 1 }}>{grpKanji}</span>
                    <span style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 15 : 17, letterSpacing: '0.06em', color: isDan ? D.gold : D.dark }}>{lv?.label}</span>
                    <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: passed ? D.green : D.muted, background: passed ? D.greenBg : 'transparent', border: `1px solid ${passed ? D.greenBd : D.border}`, padding: '2px 8px' }}>
                      {passed ? 'Сдан' : 'Не сдан'}
                    </span>
                  </div>
                  <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: D.muted, letterSpacing: '0.06em' }}>{g.attempts.length} попыток</span>
                </div>

                {/* Attempt rows */}
                {g.attempts.map((ex) => {
                  const isApproved = ex.status === 'approved';
                  const isPending  = ex.status === 'pending';
                  const statusColor = isApproved ? D.green : isPending ? '#8a6814' : D.crimson;
                  const statusBg    = isApproved ? D.greenBg : isPending ? D.amberBg : '#fdf2f0';
                  const statusBd    = isApproved ? D.greenBd : isPending ? D.amberBd : '#e8c4be';
                  const statusLabel = isApproved ? 'СДАН' : isPending ? 'ПРОВЕРКА' : 'ОТКЛОНЁН';
                  return (
                    <div key={ex.id} style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '80px 1fr 100px' : '100px 1fr 110px',
                      gap: isMobile ? 8 : 12,
                      padding: isMobile ? '10px 16px 10px 20px' : '10px 20px 10px 28px',
                      borderTop: `1px solid ${D.border}`,
                      background: D.bg,
                      alignItems: 'center',
                    }}>
                      {/* date */}
                      <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: D.muted, letterSpacing: '0.04em' }}>{ex.date}</span>
                      {/* comment */}
                      <span style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: isMobile ? 13 : 14, color: D.sub }}>{ex.comment || '—'}</span>
                      {/* status badge */}
                      <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, color: statusColor, background: statusBg, border: `1px solid ${statusBd}`, padding: '3px 7px', letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', whiteSpace: 'nowrap' }}>{statusLabel}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Payments tab */}
      {sub === 'payments' && (
        <div style={{ border: `1px solid ${D.border}`, borderTop: 'none', background: D.card }}>
          {paysLoading && (
            <div style={{ padding: '24px 20px', color: D.muted, fontSize: 13 }}>Загрузка…</div>
          )}
          {!paysLoading && userPays.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: 32, color: D.border, marginBottom: 12 }}>円</div>
              <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: 15, color: D.muted }}>Оплат пока нет</div>
            </div>
          )}
          {!paysLoading && userPays.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16, padding: isMobile ? '14px 16px' : '16px 20px', borderBottom: `1px solid ${D.border}`, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
              {/* Status badge */}
              <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: D.green, background: D.greenBg, border: `1px solid ${D.greenBd}`, padding: '2px 8px', letterSpacing: '0.04em', flexShrink: 0 }}>✓ Оплачено</span>
              {/* Description */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 14 : 13, color: D.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.desc}</div>
                <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: D.muted, marginTop: 2, letterSpacing: '0.04em' }}>{p.date}</div>
              </div>
              {/* Amount */}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: isMobile ? 17 : 18, fontWeight: 600, color: D.dark }}>{p.amount}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MyAccess tab */}
      {sub === 'access' && (
        <TabMyAccess userAccess={userAccess} loading={accessLoading} isMobile={isMobile} />
      )}

      {/* UnlockAccess tab */}
      {sub === 'unlock' && (
        <TabUnlockAccess userAccess={userAccess} isMobile={isMobile} />
      )}
    </div>
  );
}

// ── Вкладка: Мой доступ ──────────────────────────────────────────
const MONTH_LABELS = {
  jan:'Январь', feb:'Февраль', mar:'Март',    apr:'Апрель',
  may:'Май',    jun:'Июнь',    jul:'Июль',    aug:'Август',
  sep:'Сентябрь', oct:'Октябрь', nov:'Ноябрь', dec:'Декабрь',
};
const MONTH_KANJI = {
  jan:'一', feb:'二', mar:'三', apr:'四',
  may:'五', jun:'六', jul:'七', aug:'八',
  sep:'九', oct:'十', nov:'十一', dec:'十二',
};
const ALL_MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

function TabMyAccess({ userAccess, loading, isMobile }) {
  if (loading) return (
    <div style={{ border: `1px solid ${D.border}`, borderTop: 'none', padding: '24px 20px', background: D.card, color: D.muted, fontSize: 13 }}>
      Загрузка…
    </div>
  );

  const ua = userAccess || [];
  const fullIkkajo = hasIkkajoFullAccess(ua);

  // DEBUG: диагностика фантомных доступов
  const displayedAccess = {
    months:   ALL_MONTHS.filter(m => hasMonthAccess(ua, m)),
    sections: IKKAJO_SECTIONS.filter(s => hasIkkajoSectionAccess(ua, s)),
    fullIkkajo,
  };
  console.log('[TabMyAccess] accessRows (raw):', JSON.stringify(ua));
  console.log('[TabMyAccess] displayedAccess:', JSON.stringify(displayedAccess));

  const cols = isMobile ? 'repeat(3, 1fr)' : 'repeat(6, 1fr)';

  return (
    <div style={{ border: `1px solid ${D.border}`, borderTop: 'none' }}>

      {/* Months */}
      <div style={{ padding: '16px 20px 12px', background: D.card, borderBottom: `1px solid ${D.border}` }}>
        <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, color: D.muted, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 2 }}>Месяцы обучения</div>
        <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: 12, color: D.muted }}>
          {displayedAccess.months.length} из 12 открыто
        </div>
      </div>

      <div style={{ padding: '14px 16px', background: D.bg, borderBottom: `1px solid ${D.border}` }}>
        <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 6 }}>
          {ALL_MONTHS.map(m => {
            const has = hasMonthAccess(ua, m);
            return (
              <div key={m} style={{
                padding: '10px 8px',
                background: has ? D.card : 'transparent',
                border: has ? `1px solid ${D.gold}` : `1px dashed ${D.border}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                opacity: has ? 1 : 0.55,
                transition: 'all 0.12s',
              }}>
                <span style={{ fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: 14, color: has ? D.gold : D.muted, lineHeight: 1 }}>{MONTH_KANJI[m]}</span>
                <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, color: has ? D.dark : D.muted, letterSpacing: '0.06em', textAlign: 'center', lineHeight: 1.3 }}>{MONTH_LABELS[m]}</span>
                {has ? (
                  <span style={{ fontSize: 8, color: D.green }}>✓</span>
                ) : (
                  <span style={{ fontSize: 8, color: D.border }}>🔒</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ikkajo */}
      <div style={{ padding: '16px 20px 12px', background: D.card, borderBottom: `1px solid ${D.border}` }}>
        <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, color: D.muted, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 2 }}>Иккаджо</div>
        {fullIkkajo && (
          <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: D.gold, background: D.amberBg, border: `1px solid ${D.amberBd}`, padding: '2px 8px', letterSpacing: '0.06em' }}>Полный доступ</span>
        )}
      </div>

      <div style={{ padding: '14px 16px', background: D.bg }}>
        {fullIkkajo ? (
          <div style={{ padding: '16px 20px', background: D.card, border: `1px solid ${D.gold}`, display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: 28, color: D.gold }}>一</span>
            <div>
              <div style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: 15, color: D.dark, letterSpacing: '0.04em' }}>Весь Иккаджо</div>
              <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: 13, color: D.muted, marginTop: 2 }}>Все разделы открыты</div>
            </div>
            <span style={{ marginLeft: 'auto', fontSize: 18, color: D.green }}>✓</span>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 6 }}>
            {IKKAJO_SECTIONS.map(s => {
              const has = hasIkkajoSectionAccess(ua, s);
              return (
                <div key={s} style={{
                  padding: '14px 12px',
                  background: has ? D.card : 'transparent',
                  border: has ? `1px solid ${D.gold}` : `1px dashed ${D.border}`,
                  textAlign: 'center',
                  opacity: has ? 1 : 0.55,
                }}>
                  <div style={{ fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: 20, color: has ? D.gold : D.muted, marginBottom: 6, lineHeight: 1 }}>一</div>
                  <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: has ? D.dark : D.muted, letterSpacing: '0.04em', lineHeight: 1.4 }}>{IKKAJO_SECTION_LABELS[s] || s}</div>
                  <div style={{ marginTop: 6, fontSize: 10, color: has ? D.green : D.border }}>{has ? '✓' : '🔒'}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {ua.length === 0 && (
        <div style={{ padding: '20px', textAlign: 'center', color: D.muted, borderTop: `1px solid ${D.border}`, background: D.card }}>
          <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: 14, marginBottom: 8 }}>Нет активных доступов</div>
          <button onClick={() => {}} style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", color: D.gold, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, textDecoration: 'underline', letterSpacing: '0.06em' }}>
            Перейти к покупке →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Вкладка: Купить доступ ───────────────────────────────────────
function TabUnlockAccess({ userAccess, isMobile }) {
  const { products, loading } = useProducts();
  const [buyingId, setBuyingId] = useState(null);
  const [buyError, setBuyError] = useState('');
  const ua = userAccess || [];

  const handleBuy = async (product) => {
    setBuyingId(product.id);
    setBuyError('');
    try {
      const res = await fetch('/api/yookassa/create-payment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setBuyError(res.status === 409 ? 'У вас уже есть этот доступ' : (data.error || 'Ошибка при создании платежа'));
        return;
      }
      window.location.href = data.confirmation_url;
    } catch (err) {
      console.error('[handleBuy]', err);
      setBuyError('Ошибка соединения');
    } finally {
      setBuyingId(null);
    }
  };

  if (loading) return (
    <div style={{ border: `1px solid ${D.border}`, borderTop: 'none', padding: '24px 20px', background: D.card, color: D.muted, fontSize: 13 }}>Загрузка…</div>
  );

  const monthProducts   = products.filter(p => p.type === 'month');
  const sectionProducts = products.filter(p => p.type === 'section' && p.reference !== 'ikkajo');
  const ikkajoFull      = products.find(p => p.reference === 'ikkajo');
  const hasFull         = hasIkkajoFullAccess(ua);

  const CardBtn = ({ product, hasAccess }) => {
    const isBuying = buyingId === product.id;
    return (
      <>
        <button
          disabled={hasAccess || isBuying}
          onClick={() => !hasAccess && !isBuying && handleBuy(product)}
          style={{
            marginTop: 14, padding: '10px 18px',
            fontFamily: "var(--font-jost), 'Jost', sans-serif",
            fontSize: 12, letterSpacing: '0.08em',
            cursor: (hasAccess || isBuying) ? 'default' : 'pointer',
            background: hasAccess ? D.greenBg : isBuying ? '#3a3028' : D.dark,
            color:      hasAccess ? D.green : '#ede5d3',
            border:     hasAccess ? `1px solid ${D.greenBd}` : 'none',
            fontWeight: 500, width: '100%', minHeight: 42, transition: 'background 0.15s',
          }}>
          {hasAccess ? '✓ Уже доступно' : isBuying ? 'Переход к оплате…' : `Купить — ${product.price?.toLocaleString()} ₽`}
        </button>
        {buyError && buyingId === null && (
          <div style={{ marginTop: 6, fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, color: D.crimson }}>{buyError}</div>
        )}
      </>
    );
  };

  const SectionHead = ({ title, sub }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, paddingBottom: 10, borderBottom: `1px solid ${D.border}` }}>
        <span style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 16 : 18, letterSpacing: '0.04em', color: D.dark }}>{title}</span>
        {sub && <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, color: D.muted }}>{sub}</span>}
      </div>
    </div>
  );

  return (
    <div style={{ border: `1px solid ${D.border}`, borderTop: 'none', background: D.card, padding: isMobile ? '16px' : '24px 28px' }}>

      {/* Блок 1: Месяцы */}
      <div style={{ marginBottom: 32 }}>
        <SectionHead title="Месяцы обучения" sub="1 990 ₽ / месяц" />
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
          {monthProducts.map(p => {
            const has = hasMonthAccess(ua, p.reference);
            return (
              <div key={p.id} style={{ padding: '16px 14px', background: has ? D.greenBg : D.bg, border: `1px solid ${has ? D.greenBd : D.border}` }}>
                <div style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: 14, letterSpacing: '0.04em', color: D.dark, marginBottom: 4 }}>{p.title}</div>
                {p.description && <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: 12, color: D.sub, lineHeight: 1.5, minHeight: 28 }}>{p.description}</div>}
                <CardBtn product={p} hasAccess={has} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Блок 2: Разделы Иккаджо */}
      <div style={{ marginBottom: 32 }}>
        <SectionHead title="Разделы Иккаджо" sub="3 000 ₽ / раздел" />
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 8 }}>
          {sectionProducts.map(p => {
            const has = hasFull || hasIkkajoSectionAccess(ua, p.reference);
            return (
              <div key={p.id} style={{ padding: '16px 14px', background: has ? D.greenBg : D.bg, border: `1px solid ${has ? D.greenBd : D.border}` }}>
                <div style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: 14, letterSpacing: '0.04em', color: D.dark, marginBottom: 4 }}>{p.title}</div>
                {p.description && <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: 12, color: D.sub, lineHeight: 1.5 }}>{p.description}</div>}
                <CardBtn product={p} hasAccess={has} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Блок 3: Весь Иккаджо */}
      {ikkajoFull && (
        <div>
          <SectionHead title="Весь Иккаджо" sub={null} />
          <div style={{ position: 'relative', padding: '20px', background: hasFull ? D.greenBg : D.bg, border: `1px solid ${hasFull ? D.greenBd : D.gold}`, overflow: 'hidden' }}>
            {/* Kanji watermark */}
            <div style={{ position: 'absolute', right: -8, top: -12, fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: 80, color: D.gold, opacity: 0.07, lineHeight: 1, pointerEvents: 'none' }}>一</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 17 : 20, letterSpacing: '0.04em', color: D.dark }}>{ikkajoFull.title}</span>
              <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: D.gold, background: D.amberBg, border: `1px solid ${D.amberBd}`, padding: '2px 8px', letterSpacing: '0.06em' }}>Выгодно</span>
            </div>
            {ikkajoFull.description && (
              <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: 14, color: D.sub, lineHeight: 1.6, marginBottom: 12 }}>{ikkajoFull.description}</div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
              {IKKAJO_SECTIONS.map(s => (
                <span key={s} style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: D.gold, background: D.amberBg, border: `1px solid ${D.amberBd}`, padding: '3px 10px', letterSpacing: '0.04em' }}>
                  {IKKAJO_SECTION_LABELS[s]}
                </span>
              ))}
            </div>
            <CardBtn product={ikkajoFull} hasAccess={hasFull} />
          </div>
        </div>
      )}
    </div>
  );
}
