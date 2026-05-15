'use client';

import { useState } from 'react';
import { C, hasLevel, levelIndex } from '@/lib/utils';
import { useIsMobile } from '@/lib/mobile';
import { LEVELS, SELF_LEVELS } from '@/data/users';
import { DB_SECTIONS } from '@/data/techniques';
import { useMonths, useLessons, useUserAccessRows, hasMonthAccess, useKnowledge, useUserExams, useUserPayments } from '@/lib/db';
import TakedaMon from '@/components/TakedaMon';
import Sidebar from '@/components/Sidebar';
import { hasIkkajoFullAccess, hasIkkajoSectionAccess, IKKAJO_SECTIONS, IKKAJO_SECTION_LABELS, getAccessibleIkkajoSections } from '@/lib/access';
import { useProducts } from '@/lib/useProducts';

const TABS = [
  { id: 'knowledge', label: 'База знаний',    num: '01', kanji: '智' },
  { id: 'months',    label: 'Месяцы 2026',    num: '02', kanji: '月' },
  { id: 'database',  label: 'База техник',    num: '03', kanji: '技' },
  { id: 'profile',   label: 'Личный кабинет', num: '04', kanji: '人' },
];

// ── Bottom nav items ──────────────────────────────────────────────
const BOTTOM_TABS = [
  { id: 'knowledge', label: 'Знания', icon: '📖' },
  { id: 'months',    label: 'Месяцы', icon: '📅' },
  { id: 'database',  label: 'База',   icon: '⛩' },
  { id: 'profile',   label: 'Профиль',icon: '👤' },
];

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
        <Sidebar activeTab={tab} onTabClick={setTab} user={u} onLogout={onLogout} />
      )}

      {/* ── Main content ── */}
      <main style={{ flex: 1, background: C.bg, minHeight: '100vh' }}>

        {/* Mobile top header */}
        {isMobile && (
          <header style={{
            display: 'flex',
            alignItems: 'center',
            padding: `max(12px, env(safe-area-inset-top)) 16px 12px`,
            background: C.surface,
            borderBottom: `1px solid ${C.border}`,
            position: 'sticky',
            top: 0,
            zIndex: 50,
            gap: 10,
          }}>
            <TakedaMon size={26} color={C.accent} />
            <span style={{ fontFamily: "var(--font-cormorant-sc), var(--font-cormorant), serif", fontSize: 15, letterSpacing: '0.06em', color: C.ink, flex: 1 }}>
              {TABS.find(t => t.id === tab)?.label}
            </span>
            {curLv && (
              <span style={{ fontFamily: "var(--font-mono), monospace", padding: '3px 8px', background: C.surface2, border: `1px solid ${C.border}`, color: C.muted, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {curLv.label}
              </span>
            )}
          </header>
        )}

        {/* Desktop header */}
        {!isMobile && (
          <header style={{ display: 'flex', alignItems: 'center', padding: '14px 36px', background: C.surface, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 10 }}>
            <span style={{ fontFamily: "var(--font-cormorant-sc), var(--font-cormorant), serif", fontSize: 16, letterSpacing: '0.06em', color: C.ink, flex: 1 }}>
              {TABS.find(t => t.id === tab)?.label}
            </span>
            {curLv && (
              <span style={{ fontFamily: "var(--font-mono), monospace", padding: '3px 9px', background: C.surface2, border: `1px solid ${C.border}`, color: C.muted, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {curLv.label}
              </span>
            )}
          </header>
        )}

        <div
          style={{ padding: isMobile ? '16px' : '32px 36px' }}
          className={isMobile ? 'has-bottom-nav' : ''}
          key={tab}
        >
          <div className="fade">
            {tab === 'knowledge' && <TabKnowledge nav={nav} isMobile={isMobile} />}
            {tab === 'months'    && <TabMonths   nav={nav} watched={watched} user={u} userAccess={userAccess} accessLoading={accessLoading} isMobile={isMobile} />}
            {tab === 'database'  && <TabDatabase nav={nav} setModal={setModal} user={u} userAccess={userAccess} isMobile={isMobile} />}
            {tab === 'profile'  && <TabProfile user={u} userAccess={userAccess} accessLoading={accessLoading} isMobile={isMobile} onLogout={onLogout} />}
          </div>
        </div>
      </main>

      {/* ── Bottom navigation (mobile only) ── */}
      {isMobile && (
        <nav className="mobile-bottom-nav">
          {BOTTOM_TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              className="mobile-bottom-nav-item"
              onClick={() => setTab(id)}
              style={{ color: tab === id ? C.accent : C.muted }}
            >
              <span style={{ fontSize: 20 }}>{icon}</span>
              <span className="nav-label" style={{ fontSize: 11, fontWeight: tab === id ? 600 : 400 }}>{label}</span>
              {tab === id && (
                <span style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 24, height: 2, background: C.accent, borderRadius: 1 }} />
              )}
            </button>
          ))}
          {isAdmin && (
            <a href="/admin" className="mobile-bottom-nav-item" style={{ color: C.muted, textDecoration: 'none' }}>
              <span style={{ fontSize: 20 }}>⚙️</span>
              <span className="nav-label" style={{ fontSize: 11 }}>Admin</span>
            </a>
          )}
        </nav>
      )}

      {/* ── Modal покупки ── */}
      {modal && (
        <div onClick={() => setModal(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: C.white, border: `1px solid ${C.border}`, padding: isMobile ? '32px 24px' : '44px 40px', width: '100%', maxWidth: 380, textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
            <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 48, color: C.gold, lineHeight: 1, marginBottom: 12 }}>{modal.kanji}</div>
            <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 18, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>{modal.label}</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>{modal.sublabel} · {modal.techniques} техник</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, color: C.dark, marginBottom: 6 }}>{modal.price}</div>
            <p style={{ fontSize: 11, color: '#888', lineHeight: 1.7, marginBottom: 20 }}>Разовая оплата — постоянный доступ без ограничений.</p>
            <button style={{ width: '100%', padding: '12px', background: C.dark, color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer', marginBottom: 8, minHeight: 44 }}>
              Перейти к оплате
            </button>
            <button onClick={() => setModal(null)}
              style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: '#ccc', fontSize: 12, cursor: 'pointer', minHeight: 44 }}>
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

  if (monthsLoading) return <div style={{ color: C.muted, fontSize: 13 }}>Загрузка…</div>;

  // Индекс продуктов по reference для быстрого поиска
  const productByRef = {};
  (products ?? []).forEach(p => { if (p.type === 'month') productByRef[p.reference] = p; });

  const openedCount  = (months ?? []).filter(m => hasMonthAccess(userAccess ?? [], m.id)).length;
  const watchedCount = Object.keys(watched || {}).length;

  return (
    <div>
      {/* ── Top strip: каnji + title + count ── */}
      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40, paddingBottom: 20, borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 13, color: C.muted, letterSpacing: '0.15em' }}>月 二〇二六</span>
            <span style={{ fontFamily: "var(--font-cormorant-sc), var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 12, letterSpacing: '0.18em', color: C.ink, fontWeight: 600 }}>
              МЕСЯЦЫ 2026
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            <span style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 10, color: C.muted, letterSpacing: '0.12em' }}>{openedCount} / 12 МЕСЯЦЕВ ОТКРЫТО</span>
          </div>
        </div>
      )}

      {/* ── Hero section ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: isMobile ? 16 : 12, flexWrap: 'wrap', gap: 16 }}>
        <div>
          {/* Eyebrow */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isMobile ? 10 : 14 }}>
            <span style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 10, color: C.accent, letterSpacing: '0.06em' }}>02</span>
            <span style={{ width: 1, height: 12, background: C.border, display: 'inline-block' }} />
            <span style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 10, color: C.muted, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Учебный год · 12 месяцев</span>
          </div>
          {/* Main title */}
          <div style={{ fontFamily: "var(--font-cormorant-sc), var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: isMobile ? 36 : 56, letterSpacing: '0.04em', color: C.ink, lineHeight: 0.95, fontWeight: 400 }}>
            Месяцы<br />Дайто-рю
          </div>
          {/* Subtitle */}
          {!isMobile && (
            <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 16, color: C.muted, marginTop: 12, maxWidth: 480, lineHeight: 1.55 }}>
              Программа от Введения через Иккаджо к экзамену 3 кю. 1 990 ₽ за месяц.
            </div>
          )}
        </div>
        {/* Lesson counter */}
        {watchedCount > 0 && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 11, letterSpacing: '0.2em', color: C.muted, marginBottom: 6 }}>進捗</div>
            <div style={{ fontFamily: "var(--font-cormorant-sc), var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: isMobile ? 36 : 56, letterSpacing: '0.02em', color: C.accent, lineHeight: 1 }}>
              {watchedCount}
            </div>
            <div style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.2em', color: C.muted, marginTop: 4, textTransform: 'uppercase' }}>уроков просмотрено</div>
          </div>
        )}
      </div>

      {/* Sumi stroke divider */}
      {!isMobile && (
        <div style={{ margin: '12px 0 36px' }}>
          <svg width="100%" height="20" viewBox="0 0 800 20" preserveAspectRatio="none">
            <defs>
              <linearGradient id="sumi-grad-m" x1="0" x2="1">
                <stop offset="0%" stopColor={C.ink2} stopOpacity="0.0" />
                <stop offset="5%" stopColor={C.ink2} stopOpacity="0.4" />
                <stop offset="60%" stopColor={C.ink2} stopOpacity="0.85" />
                <stop offset="95%" stopColor={C.ink2} stopOpacity="0.3" />
                <stop offset="100%" stopColor={C.ink2} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M8 14 C 80 4, 280 18, 440 10 S 720 16, 792 8" stroke="url(#sumi-grad-m)" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.3" />
          </svg>
        </div>
      )}

      {/* Months grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 10 : 16 }}>
        {(months ?? []).map(m => (
          <MonthCard
            key={m.id}
            month={m}
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

function MonthCard({ month: m, nav, watched, userAccess, accessLoading, product, isMobile }) {
  const { lessons } = useLessons(m.id);
  const [buying,   setBuying]   = useState(false);
  const [buyError, setBuyError] = useState('');

  const watchedCount = (lessons ?? []).filter(l => watched[l.id]).length;
  const hasProg      = (lessons ?? []).length > 0 && watchedCount > 0;

  // ─── SOURCE OF TRUTH для доступа ────────────────────────────────
  // ТОЛЬКО user_access из БД: type='month', reference=m.id.
  // Никаких bypass: ни isAdmin, ни mock, ни products, ни is_open.
  // Пока accessLoading=true — доступ неизвестен, CTA нейтральный.
  const hasAccess = !accessLoading && hasMonthAccess(userAccess ?? [], m.id);

  // ─── Оплата конкретного месяца ───────────────────────────────────
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

  // ─── Визуальные состояния ────────────────────────────────────────
  const locked    = !hasAccess && !accessLoading;
  const pct       = (lessons ?? []).length ? Math.round((watchedCount / (lessons ?? []).length) * 100) : 0;

  const cardBg     = locked
    ? C.bg2
    : m.current
      ? `linear-gradient(155deg, ${C.surface2} 0%, ${C.surface} 60%, ${C.bg2} 100%)`
      : C.surface;
  const cardBorder = m.current
    ? `1px solid ${C.accent}`
    : locked
      ? `1px dashed ${C.hairline2}`
      : `1px solid ${C.border}`;
  const cardShadow = m.current
    ? `0 1px 0 ${C.accent} inset, 0 30px 60px -28px ${C.accent}55, 0 12px 32px -10px rgba(0,0,0,0.15)`
    : locked ? 'none' : C.shadow;
  const kanjiWatermarkColor = locked ? C.hairline2 : m.current ? C.accent : C.goldSoft;

  return (
    <div style={{
      position: 'relative',
      padding: isMobile ? '16px 14px' : '22px 20px',
      minHeight: isMobile ? 170 : 220,
      background: cardBg,
      border: cardBorder,
      display: 'flex', flexDirection: 'column', gap: 6,
      boxShadow: cardShadow,
      opacity: locked ? 0.6 : 1,
      overflow: 'hidden',
      transition: 'transform 0.25s ease, box-shadow 0.25s ease',
    }}>

      {/* Kanji watermark — absolute background */}
      <div style={{
        position: 'absolute', top: -8, right: 8,
        fontFamily: "'Noto Serif JP', var(--font-noto), serif",
        fontSize: isMobile ? 64 : 100,
        color: kanjiWatermarkColor,
        opacity: locked ? 0.4 : m.current ? 0.18 : 0.16,
        lineHeight: 1, pointerEvents: 'none', fontWeight: 300, userSelect: 'none',
      }}>{m.kanji}</div>

      {/* Current month diamond */}
      {m.current && (
        <div style={{ position: 'absolute', top: 12, left: 12, width: 6, height: 6, background: C.accent, transform: 'rotate(45deg)' }} />
      )}

      {/* Top row: number + badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', marginBottom: 4, marginTop: m.current ? 6 : 0 }}>
        <span style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.22em', color: m.current ? C.accent : C.muted, fontWeight: 600 }}>
          {m.sort_order ? `${String(m.sort_order).padStart(2, '0')} / 12` : '– / 12'}
        </span>
        {m.current && (
          <span style={{
            fontFamily: "var(--font-cormorant-sc), var(--font-cormorant), 'Cormorant Garamond', serif",
            fontSize: 9, letterSpacing: '0.28em',
            color: C.accent, textTransform: 'uppercase', fontWeight: 600,
            padding: '3px 9px', border: `1px solid ${C.accent}`,
          }}>текущий</span>
        )}
        {locked && !accessLoading && (
          <span style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 11, color: C.muted, letterSpacing: '0.1em' }}>🔒</span>
        )}
      </div>

      {/* Month title — Cormorant SC large */}
      <div style={{
        fontFamily: "var(--font-cormorant-sc), var(--font-cormorant), 'Cormorant Garamond', serif",
        fontSize: isMobile ? 26 : 32,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        color: locked ? C.muted : C.ink,
        position: 'relative', fontWeight: 500, lineHeight: 0.95,
      }}>{m.label}</div>

      {/* Italic subtitle */}
      <div style={{
        fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
        fontStyle: 'italic',
        fontSize: isMobile ? 13 : 15,
        color: locked ? C.muted : C.ink2,
        position: 'relative', marginTop: 2,
      }}>{m.subtitle || m.description || m.desc}</div>

      {/* Description (desktop only) */}
      {!isMobile && (m.description || m.desc) && (m.subtitle !== (m.description || m.desc)) && (
        <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 12, color: C.muted, lineHeight: 1.55, marginTop: 4, flex: 1, position: 'relative' }}>
          {m.description || m.desc}
        </div>
      )}

      {/* Bottom area: progress or CTA */}
      <div style={{ marginTop: 'auto', paddingTop: isMobile ? 10 : 14, position: 'relative' }}>
        {accessLoading ? (
          <div style={{ height: 12, background: C.border, borderRadius: 2, width: '60%', opacity: 0.5 }} />
        ) : hasAccess && hasProg ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 10, color: C.muted, letterSpacing: '0.1em', fontWeight: 500 }}>
                {watchedCount} / {(lessons ?? []).length} уроков
              </span>
              <span style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 10, color: C.accent, letterSpacing: '0.1em', fontWeight: 600 }}>
                {pct}%
              </span>
            </div>
            <div style={{ height: 2, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: C.accent, borderRadius: 2, transition: 'width 0.4s ease' }} />
            </div>
            <div style={{ marginTop: 10 }}>
              <button onClick={() => nav.month(m.id)}
                style={{ background: 'none', border: 'none', padding: 0, fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 10, color: C.accent, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}>
                Продолжить →
              </button>
            </div>
          </>
        ) : hasAccess ? (
          <>
            <span style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 10, color: C.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              {(lessons ?? []).length > 0 ? `${(lessons ?? []).length} уроков · не начат` : 'не начат'}
            </span>
            <div style={{ marginTop: 10 }}>
              <button onClick={() => nav.month(m.id)}
                style={{ background: 'none', border: 'none', padding: 0, fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 10, color: C.accent, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer' }}>
                Открыть урок →
              </button>
            </div>
          </>
        ) : product ? (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 13, color: C.muted }}>
                {product.price?.toLocaleString('ru-RU')} ₽
              </span>
              <button onClick={handleBuy} disabled={buying}
                style={{ background: 'none', border: 'none', padding: 0, fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 10, color: buying ? C.muted : C.gold, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: buying ? 'default' : 'pointer' }}>
                {buying ? 'Переход…' : 'Открыть →'}
              </button>
            </div>
            {buyError && <div style={{ fontSize: 10, color: '#a03030', marginTop: 4 }}>{buyError}</div>}
          </div>
        ) : (
          <span style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 10, color: C.muted, letterSpacing: '0.12em' }}>недоступно</span>
        )}
      </div>
    </div>
  );
}

// ── Вкладка: База знаний ─────────────────────────────────────────
function TabKnowledge({ nav, isMobile }) {
  const { items, loading } = useKnowledge();
  if (loading) return <div style={{ color: C.muted, fontSize: 13 }}>Загрузка…</div>;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: "var(--font-cormorant-sc), var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: isMobile ? 22 : 28, color: C.ink, letterSpacing: '0.05em', fontWeight: 400 }}>База знаний</h2>
        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 10, color: C.muted, letterSpacing: '0.1em' }}>БЕСПЛАТНО</span>
      </div>
      {items.length === 0 && <div style={{ fontSize: 13, color: C.muted }}>Материалы скоро появятся</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {items.map(item => (
          <div key={item.id}
            onClick={() => nav.knowledgeItem(item.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: isMobile ? '14px 12px' : '18px 16px', background: C.surface, border: `1px solid ${C.border}`, borderTop: 'none', cursor: 'pointer' }}>
            {item.video_id && (
              <div style={{ width: isMobile ? 48 : 60, height: isMobile ? 34 : 42, background: C.goldBg, border: `1px solid ${C.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>▶</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 15 : 17, fontWeight: 600, color: C.dark, marginBottom: 2 }}>{item.title}</div>
              {item.subtitle && <div style={{ fontSize: 11, color: C.muted }}>{item.subtitle}</div>}
            </div>
            <span style={{ color: C.muted, fontSize: 14, flexShrink: 0 }}>→</span>
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
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: "var(--font-cormorant-sc), var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: isMobile ? 22 : 28, color: C.ink, letterSpacing: '0.05em', fontWeight: 400 }}>База техник</h2>
        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 10, color: C.muted, letterSpacing: '0.1em' }}>РАЗОВАЯ ПОКУПКА</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {(DB_SECTIONS ?? []).map(sec => {
          const avail  = hasLevel(user?.level || '6kyu', sec.requiredLevel);
          const ua = userAccess ?? [];
          // SOURCE OF TRUTH: только user_access из БД. Никаких bypass.
          //
          // Для Иккаджо: "открыт" если есть полный доступ (reference=ikkajo)
          // ИЛИ куплен хотя бы один из разделов (tachiai/idori/ushirodori/hanzahandachi).
          // В этом случае пользователь может войти в IkkajoPage и открытые разделы.
          //
          // Для остальных программ (nikkajo, sankajo): проверяем reference напрямую.
          const hasFullIkkajo      = ua.some(a => a.type === 'section' && a.reference === 'ikkajo');
          const hasAnyIkkajoSection = sec.id === 'ikkajo' &&
            IKKAJO_SECTIONS.some(k => ua.some(a => a.type === 'section' && a.reference === k));
          const bought =
            sec.id === 'ikkajo'
              ? hasFullIkkajo || hasAnyIkkajoSection
              : ua.some(a => a.type === 'section' && a.reference === sec.id);
          return (
            <div key={sec.id} style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 12 : 18, padding: isMobile ? '16px' : '20px 18px', background: C.surface, border: `1px solid ${C.border}`, borderTop: 'none', opacity: avail ? 1 : 0.4, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
              <div style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: isMobile ? 24 : 32, minWidth: 36, textAlign: 'center', color: bought ? C.gold : avail ? C.ink2 : C.muted, lineHeight: 1, flexShrink: 0 }}>{sec.kanji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 16 : 18, fontWeight: 600, color: C.dark }}>{sec.label}</span>
                  <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, color: C.muted, background: C.surface2, border: `1px solid ${C.border}`, padding: '2px 7px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{sec.sublabel}</span>
                </div>
                <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{sec.desc}</div>
                <div style={{ fontSize: 10, color: '#bbb', marginTop: 4 }}>{sec.techniques} техник</div>
              </div>
              <div style={{ flexShrink: 0, width: isMobile ? '100%' : 'auto', marginTop: isMobile ? 8 : 0 }}>
                {bought
                  ? <button onClick={sec.id === 'ikkajo' ? nav.ikkajo : undefined} style={{ padding: '9px 16px', background: C.accent, color: C.onAccent, border: 'none', fontSize: 12, cursor: 'pointer', minHeight: 44, width: isMobile ? '100%' : 'auto', letterSpacing: '0.04em' }}>Открыть →</button>
                  : avail
                    ? <button onClick={() => setModal(sec)} style={{ padding: '9px 16px', background: 'transparent', color: C.gold, border: `1px solid ${C.goldBorder}`, fontSize: 12, cursor: 'pointer', minHeight: 44, width: isMobile ? '100%' : 'auto' }}>Купить — {sec.price}</button>
                    : <span style={{ fontSize: 11, color: '#ccc' }}>🔒 Нет доступа</span>
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Вкладка: Профиль ──────────────────────────────────────────────
// userAccess и accessLoading приходят из Dashboard (единственный useUserAccessRows).
// Это исключает двойной fetch и гарантирует единый источник данных по всему Dashboard.
function TabProfile({ user: u, userAccess, accessLoading, isMobile, onLogout }) {
  const [sub, setSub] = useState('info');
  const { exams: userExams, loading: examsLoading }   = useUserExams();
  const { payments: userPays, loading: paysLoading }  = useUserPayments();
  const usr   = u || {};
  const curLv = LEVELS.find(l => l.id === usr.level);
  const selfLvLabel = SELF_LEVELS.find(l => l.id === usr.selfLevel)?.label;

  // Группируем экзамены по уровню для отображения
  const grouped = [];
  const seen = {};
  (userExams ?? []).forEach(ex => {
    if (!seen[ex.level]) { seen[ex.level] = []; grouped.push({ level: ex.level, attempts: seen[ex.level] }); }
    seen[ex.level].push(ex);
  });

  const SUB_TABS = [
    { id:'info',     label:'Обо мне'    },
    { id:'exams',    label:'Экзамены'   },
    { id:'access',   label:'Мой доступ' },
    { id:'unlock',   label:'Купить'     },
    { id:'payments', label:'Оплаты'     },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: "var(--font-cormorant-sc), var(--font-cormorant), serif", fontSize: isMobile ? 22 : 28, color: C.ink, letterSpacing: '0.05em', fontWeight: 400 }}>Личный кабинет</h2>
      </div>

      {/* Profile card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 16, padding: isMobile ? '16px' : '20px 22px', background: C.surface, border: `1px solid ${C.border}`, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${C.accent}40`, background: C.surface2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "var(--font-cormorant-sc), serif", fontSize: 20, color: C.accent, flexShrink: 0 }}>{(usr.name||'?')[0]}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 18 : 20, fontWeight: 600, color: C.dark }}>{usr.name}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usr.email}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {curLv && <span style={{ fontFamily: "var(--font-mono), monospace", padding: '3px 10px', background: C.surface2, border: `1px solid ${C.border}`, color: C.muted, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{curLv.label}</span>}
            {usr.joinedAt && <span style={{ fontSize: 10, color: C.muted }}>в школе с {usr.joinedAt}</span>}
          </div>
        </div>
        {!isMobile && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: '#bbb', letterSpacing: 0.5, marginBottom: 6 }}>Прогресс</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
              {(LEVELS ?? []).map(lv => (
                <div key={lv.id} style={{ borderRadius: '50%', background: hasLevel(usr.level, lv.id) ? C.gold : '#e0e0e0', width: lv.id.includes('dan') ? 11 : 7, height: lv.id.includes('dan') ? 11 : 7 }} />
              ))}
            </div>
            <div style={{ fontSize: 10, color: '#aaa', marginTop: 3 }}>{levelIndex(usr.level) + 1} / {(LEVELS ?? []).length}</div>
          </div>
        )}
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', background: C.surface, border: `1px solid ${C.border}`, borderBottom: 'none', overflowX: 'auto' }}>
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSub(t.id)}
            style={{ padding: isMobile ? '12px 14px' : '11px 18px', background: 'none', border: 'none', color: sub === t.id ? C.ink : C.muted, fontSize: 12, borderBottom: `2px solid ${sub === t.id ? C.accent : 'transparent'}`, cursor: 'pointer', fontWeight: sub === t.id ? 600 : 400, marginBottom: -1, whiteSpace: 'nowrap', minHeight: 44 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {sub === 'info' && (
        <div style={{ border: `1px solid ${C.border}`, borderTop: 'none', background: C.surface }}>
          {[
            { label: 'Уровень (подтверждён)',     value: curLv?.label,    show: !!curLv },
            { label: 'Уровень (при регистрации)', value: selfLvLabel,     show: !!selfLvLabel && selfLvLabel !== curLv?.label },
            { label: 'Имя сэнсэя',               value: usr.senseiName || 'Станислав Копин', show: true },
          ].filter(r => r.show).map(row => (
            <div key={row.label} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '200px 1fr', padding: '14px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 13, alignItems: 'start', gap: isMobile ? 2 : 0 }}>
              <span style={{ color: C.muted, fontSize: 11 }}>{row.label}</span>
              <span style={{ color: C.dark }}>{row.value}</span>
            </div>
          ))}
          {usr.experience && (
            <div style={{ padding: '16px' }}>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Об опыте</div>
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.85, borderLeft: `2px solid ${C.goldBorder}`, paddingLeft: 14 }}>{usr.experience}</p>
            </div>
          )}
          {/* Mobile: logout button */}
          {isMobile && (
            <div style={{ padding: '14px 16px', borderTop: `1px solid ${C.border}` }}>
              <button onClick={onLogout} style={{ width: '100%', padding: '10px', background: 'none', border: `1px solid ${C.border}`, color: '#bbb', fontSize: 12, cursor: 'pointer', minHeight: 44 }}>
                Выйти из аккаунта
              </button>
            </div>
          )}
        </div>
      )}

      {/* Exams tab */}
      {sub === 'exams' && (
        <div style={{ border: `1px solid ${C.border}`, borderTop: 'none' }}>
          {examsLoading && (
            <div style={{ padding: '24px 16px', color: C.muted, fontSize: 13, background: C.white }}>Загрузка…</div>
          )}
          {!examsLoading && grouped.length === 0 && (
            <div style={{ padding: '24px 16px', color: C.muted, fontSize: 13, background: C.white }}>Экзаменов пока нет</div>
          )}
          {!examsLoading && grouped.map((g, gi) => {
            const lv     = LEVELS.find(l => l.id === g.level);
            // passed если хотя бы одна попытка approved
            const passed = g.attempts.some(a => a.status === 'approved');
            const isDan  = g.level.includes('dan');
            return (
              <div key={g.level} style={{ borderTop: gi === 0 ? `1px solid ${C.border}` : '1px solid #ece8e0', background: isDan ? '#fdfcf8' : C.white }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 17, fontWeight: 700, color: isDan ? C.dark : C.gold }}>{lv?.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: passed ? '#3a8a5a' : '#b04030' }}>{passed ? '✓ Сдан' : '✗ Не сдан'}</span>
                  </div>
                  <span style={{ fontSize: 10, color: '#bbb' }}>{g.attempts.length} попыток</span>
                </div>
                {g.attempts.map((ex) => {
                  const isApproved = ex.status === 'approved';
                  const isPending  = ex.status === 'pending';
                  const statusColor = isApproved ? '#3a8a5a' : isPending ? '#b08030' : '#b04030';
                  const statusIcon  = isApproved ? '✓' : isPending ? '⏳' : '✗';
                  return (
                    <div key={ex.id} style={{ display: 'flex', gap: 10, padding: '8px 16px 8px 28px', borderTop: '1px solid #f5f2ec', background: isApproved ? 'transparent' : isPending ? '#fffdf5' : '#fff8f7', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                      <div style={{ fontSize: 11, color: C.muted, minWidth: 74 }}>{ex.date}</div>
                      <div style={{ fontSize: 11, color: statusColor, fontWeight: 600, marginRight: 8 }}>{statusIcon}</div>
                      <div style={{ fontSize: 11, color: '#888' }}>{ex.comment}</div>
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
        <div style={{ border: `1px solid ${C.border}`, borderTop: 'none' }}>
          {paysLoading && (
            <div style={{ padding: '24px 16px', color: C.muted, fontSize: 13, background: C.white }}>Загрузка…</div>
          )}
          {!paysLoading && userPays.length === 0 && (
            <div style={{ padding: '24px 16px', color: C.muted, fontSize: 13, background: C.white }}>Оплат пока нет</div>
          )}
          {!paysLoading && userPays.map(p => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: isMobile ? 'auto 1fr auto' : '90px 1fr 100px', padding: '13px 16px', fontSize: 12, background: C.white, borderBottom: '1px solid #f5f5f5', alignItems: 'center', gap: 8 }}>
              <span style={{ color: C.muted, fontSize: isMobile ? 10 : 12, whiteSpace: 'nowrap' }}>{p.date}</span>
              <span style={{ color: C.dark, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.desc}</span>
              <span style={{ color: C.dark, fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>{p.amount}</span>
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

// ── Вкладка: Мой доступ ──────────────────────────────────────────────────────
const MONTH_LABELS = {
  jan:'Январь', feb:'Февраль', mar:'Март',    apr:'Апрель',
  may:'Май',    jun:'Июнь',    jul:'Июль',    aug:'Август',
  sep:'Сентябрь', oct:'Октябрь', nov:'Ноябрь', dec:'Декабрь',
};
const ALL_MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

function TabMyAccess({ userAccess, loading, isMobile }) {
  if (loading) return (
    <div style={{ border: `1px solid ${C.border}`, borderTop: 'none', padding: '24px 16px', background: C.white, color: C.muted, fontSize: 13 }}>
      Загрузка…
    </div>
  );

  const ua = userAccess || [];
  const fullIkkajo = hasIkkajoFullAccess(ua);

  // ── DEBUG: лог для диагностики фантомных доступов ──────────────
  // Убрать после подтверждения что phantom-access исчезли.
  const displayedAccess = {
    months:   ALL_MONTHS.filter(m => hasMonthAccess(ua, m)),
    sections: IKKAJO_SECTIONS.filter(s => hasIkkajoSectionAccess(ua, s)),
    fullIkkajo,
  };
  console.log('[TabMyAccess] accessRows (raw):', JSON.stringify(ua));
  console.log('[TabMyAccess] displayedAccess:', JSON.stringify(displayedAccess));
  // ────────────────────────────────────────────────────────────────

  const rowStyle = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 13, background: C.surface };
  const tick = (has) => (
    <span style={{ fontSize: 13, color: has ? '#2d7a4a' : '#ccc', flexShrink: 0 }}>{has ? '✓' : '✗'}</span>
  );

  return (
    <div style={{ border: `1px solid ${C.border}`, borderTop: 'none' }}>
      {/* Months */}
      <div style={{ padding: '12px 16px', background: C.surface2, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, color: C.muted, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Месяцы обучения</div>
      </div>
      {ALL_MONTHS.map(m => {
        const has = hasMonthAccess(ua, m);
        return (
          <div key={m} style={{ ...rowStyle, opacity: has ? 1 : 0.45 }}>
            {tick(has)}
            <span style={{ color: has ? C.dark : C.muted }}>{MONTH_LABELS[m]}</span>
          </div>
        );
      })}

      {/* Ikkajo */}
      <div style={{ padding: '12px 16px', background: C.surface2, borderBottom: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}`, marginTop: 8 }}>
        <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, color: C.muted, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Иккаджо</div>
      </div>
      {fullIkkajo ? (
        <div style={{ ...rowStyle }}>
          {tick(true)}
          <span style={{ color: C.dark }}>Весь Иккаджо</span>
          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, color: C.accent, background: `${C.accent}10`, border: `1px solid ${C.accent}30`, padding: '2px 8px', marginLeft: 'auto', letterSpacing: '0.1em', textTransform: 'uppercase' }}>полный доступ</span>
        </div>
      ) : (
        IKKAJO_SECTIONS.map(s => {
          const has = hasIkkajoSectionAccess(ua, s);
          return (
            <div key={s} style={{ ...rowStyle, opacity: has ? 1 : 0.45 }}>
              {tick(has)}
              <span style={{ color: has ? C.dark : C.muted }}>{IKKAJO_SECTION_LABELS[s] || s}</span>
            </div>
          );
        })
      )}

      {ua.length === 0 && (
        <div style={{ padding: '20px 16px', textAlign: 'center', color: C.muted, fontSize: 12, borderTop: `1px solid ${C.border}` }}>
          Нет активных доступов.{' '}
          <button onClick={() => {}} style={{ color: C.gold, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}>
            Перейти к покупке →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Вкладка: Купить доступ ───────────────────────────────────────────────────
function TabUnlockAccess({ userAccess, isMobile }) {
  const { products, loading } = useProducts();
  const [buyingId, setBuyingId] = useState(null); // id продукта в процессе оплаты
  const [buyError, setBuyError] = useState('');
  const ua = userAccess || [];

  const handleBuy = async (product) => {
    setBuyingId(product.id);
    setBuyError('');
    try {
      // Авторизация через httpOnly cookie — заголовок Authorization не нужен
      const res = await fetch('/api/yookassa/create-payment', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          setBuyError('У вас уже есть этот доступ');
        } else {
          setBuyError(data.error || 'Ошибка при создании платежа');
        }
        return;
      }

      // Редиректим на страницу оплаты ЮKassa
      window.location.href = data.confirmation_url;

    } catch (err) {
      console.error('[handleBuy]', err);
      setBuyError('Ошибка соединения');
    } finally {
      setBuyingId(null);
    }
  };

  if (loading) return (
    <div style={{ border: `1px solid ${C.border}`, borderTop: 'none', padding: '24px 16px', background: C.surface, color: C.muted, fontSize: 13 }}>Загрузка…</div>
  );

  const monthProducts   = products.filter(p => p.type === 'month');
  const sectionProducts = products.filter(p => p.type === 'section' && p.reference !== 'ikkajo');
  const ikkajoFull      = products.find(p => p.reference === 'ikkajo');

  const hasFull = hasIkkajoFullAccess(ua);

  const CardBtn = ({ product, hasAccess }) => {
    const isBuying = buyingId === product.id;
    return (
      <>
        <button
          disabled={hasAccess || isBuying}
          onClick={() => !hasAccess && !isBuying && handleBuy(product)}
          style={{
            marginTop: 12, padding: '9px 18px', fontSize: 12,
            cursor: (hasAccess || isBuying) ? 'default' : 'pointer',
            background: hasAccess ? `${C.success}18` : isBuying ? C.muted : C.accent,
            color:      hasAccess ? C.success : '#fff',
            border:     hasAccess ? `1px solid ${C.success}40` : 'none',
            fontWeight: 500, width: '100%', minHeight: 40, transition: 'background 0.15s',
            letterSpacing: '0.03em',
          }}>
          {hasAccess ? '✓ Уже доступно' : isBuying ? 'Переход к оплате…' : `Купить — ${product.price?.toLocaleString()} ₽`}
        </button>
        {buyError && buyingId === null && (
          <div style={{ marginTop: 6, fontSize: 11, color: '#a03030' }}>{buyError}</div>
        )}
      </>
    );
  };

  const sectionStyle = { marginBottom: 24 };
  const headerStyle  = { padding: '10px 0', marginBottom: 12, borderBottom: `1px solid ${C.border}` };
  const labelStyle   = { fontFamily: "var(--font-cormorant-sc), var(--font-cormorant), serif", fontSize: isMobile ? 17 : 20, fontWeight: 400, color: C.ink, letterSpacing: '0.04em' };

  return (
    <div style={{ border: `1px solid ${C.border}`, borderTop: 'none', background: C.surface, padding: isMobile ? '16px' : '20px 24px' }}>

      {/* Блок 1: Месяцы */}
      <div style={sectionStyle}>
        <div style={headerStyle}>
          <span style={labelStyle}>Месяцы обучения</span>
          <span style={{ fontSize: 12, color: C.muted, marginLeft: 12 }}>1 990 ₽ / месяц</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
          {monthProducts.map(p => {
            const has = hasMonthAccess(ua, p.reference);
            return (
              <div key={p.id} style={{ padding: '14px', background: has ? `${C.success}10` : C.surface2, border: `1px solid ${has ? C.success + '40' : C.border}` }}>
                <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 15, fontWeight: 500, color: C.ink, marginBottom: 4 }}>{p.title}</div>
                <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, minHeight: 32 }}>{p.description}</div>
                <CardBtn product={p} hasAccess={has} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Блок 2: Разделы Ikkajo */}
      <div style={sectionStyle}>
        <div style={headerStyle}>
          <span style={labelStyle}>Разделы Иккаджо</span>
          <span style={{ fontSize: 12, color: C.muted, marginLeft: 12 }}>3 000 ₽ / раздел</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 8 }}>
          {sectionProducts.map(p => {
            const has = hasFull || hasIkkajoSectionAccess(ua, p.reference);
            return (
              <div key={p.id} style={{ padding: '14px', background: has ? `${C.success}10` : C.surface2, border: `1px solid ${has ? C.success + '40' : C.border}` }}>
                <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 15, fontWeight: 500, color: C.ink, marginBottom: 4 }}>{p.title}</div>
                <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{p.description}</div>
                <CardBtn product={p} hasAccess={has} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Блок 3: Весь Ikkajo */}
      {ikkajoFull && (
        <div style={sectionStyle}>
          <div style={headerStyle}>
            <span style={labelStyle}>Весь Иккаджо</span>
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, color: C.gold, marginLeft: 12, background: `${C.gold}15`, border: `1px solid ${C.goldBorder}`, padding: '2px 10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Выгодно</span>
          </div>
          <div style={{ padding: '18px', background: hasFull ? `${C.success}10` : C.surface2, border: `1px solid ${hasFull ? C.success + '40' : C.goldBorder}` }}>
            <div style={{ fontFamily: "var(--font-cormorant-sc), var(--font-cormorant), serif", fontSize: 20, fontWeight: 400, color: C.ink, marginBottom: 8, letterSpacing: '0.04em' }}>{ikkajoFull.title}</div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>{ikkajoFull.description}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
              {IKKAJO_SECTIONS.map(s => (
                <span key={s} style={{ fontFamily: "var(--font-mono), monospace", fontSize: 9, color: C.muted, background: C.surface2, border: `1px solid ${C.border}`, padding: '3px 10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
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
