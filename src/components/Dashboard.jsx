'use client';

import { useState } from 'react';
import { C, hasLevel, levelIndex } from '@/lib/utils';
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

// ── Sidebar palette (всегда тёмная, независимо от темы) ──────────
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
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 24px', background: 'none', border: 'none', borderLeft: `2px solid ${isA ? SB.accent : 'transparent'}`, background: isA ? 'rgba(0,0,0,0.3)' : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
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
      <main style={{ flex: 1, background: '#f0ebe0', minHeight: '100vh' }}>

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
          <header style={{ display: 'flex', alignItems: 'center', padding: '18px 40px', background: '#faf5e8', borderBottom: '1px solid #d2c7b0', position: 'sticky', top: 0, zIndex: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, letterSpacing: '0.22em', color: '#9a8860', textTransform: 'uppercase', marginBottom: 2 }}>
                {TABS.find(t => t.id === tab)?.num} / 04
              </div>
              <span style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: 14, letterSpacing: '0.12em', color: '#15120e', textTransform: 'uppercase' }}>
                {TABS.find(t => t.id === tab)?.label}
              </span>
            </div>
            {curLv && (
              <span style={{ padding: '4px 12px', background: 'transparent', border: '1px solid #c8a84a', color: '#8B6914', fontSize: 11, fontFamily: "var(--font-jost), 'Jost', sans-serif", letterSpacing: '0.06em' }}>
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
            {tab === 'profile'  && <TabProfile user={u} userAccess={userAccess} accessLoading={accessLoading} isMobile={isMobile} onLogout={onLogout} />}
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
            style={{ background: '#faf5e8', border: '1px solid #d2c7b0', padding: isMobile ? '32px 24px' : '44px 48px', width: '100%', maxWidth: 400, textAlign: 'center', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.5)' }}>
            <div style={{ fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: 56, color: '#c8a84a', lineHeight: 1, marginBottom: 16 }}>{modal.kanji}</div>
            <div style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: 20, letterSpacing: '0.06em', color: '#15120e', marginBottom: 6, textTransform: 'uppercase' }}>{modal.label}</div>
            <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, color: '#9a8860', marginBottom: 20, letterSpacing: '0.06em' }}>{modal.sublabel} · {modal.techniques} техник</div>
            <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 42, fontWeight: 300, color: '#15120e', marginBottom: 8, lineHeight: 1 }}>{modal.price}</div>
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: 14, color: '#6f6452', lineHeight: 1.7, marginBottom: 28 }}>Разовая оплата — постоянный доступ без ограничений.</p>
            <button style={{ width: '100%', padding: '14px', background: '#15120e', color: '#ede5d3', border: 'none', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', marginBottom: 10, minHeight: 44 }}>
              Перейти к оплате
            </button>
            <button onClick={() => setModal(null)}
              style={{ width: '100%', padding: '10px', background: 'none', border: 'none', fontFamily: "var(--font-jost), 'Jost', sans-serif", color: '#b0a080', fontSize: 12, cursor: 'pointer', minHeight: 44 }}>
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

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, letterSpacing: '0.28em', color: '#9a8860', textTransform: 'uppercase', marginBottom: 8 }}>02 · Учебный год</div>
        <h2 style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 28 : 38, color: '#15120e', letterSpacing: '0.03em', lineHeight: 1.1, marginBottom: 8 }}>Месяцы Дайто-рю</h2>
        <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: 15, color: '#6f6452', lineHeight: 1.6 }}>
          Программа от Введения через Иккаджо к экзамену 3 кю. 1 990 ₽ за месяц.
        </div>
        <div style={{ height: 1, background: '#d2c7b0', marginTop: 20 }} />
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

      {/* Кандзи водяной знак */}
      <div style={{ position: 'absolute', top: -6, right: 6, fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: isMobile ? 72 : 100, color: m.current ? '#c8a84a' : '#8B6914', opacity: kanjiOp, lineHeight: 1, pointerEvents: 'none', fontWeight: 300 }}>{m.kanji}</div>

      {/* Текущий — маленький ромб */}
      {m.current && (
        <div style={{ position: 'absolute', top: 12, left: 12, width: 6, height: 6, background: '#c8a84a', transform: 'rotate(45deg)' }} />
      )}

      {/* Статус-бейдж */}
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

      {/* Название */}
      <div style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 20 : 26, letterSpacing: '0.04em', textTransform: 'uppercase', color: locked ? '#b0a080' : '#15120e', position: 'relative', fontWeight: 500, lineHeight: 0.95, marginTop: 2 }}>{m.label}</div>
      <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: isMobile ? 13 : 14, color: locked ? '#c0b89a' : '#6f6452', position: 'relative', marginTop: 2 }}>{m.subtitle || m.description || m.desc}</div>

      {/* Прогресс */}
      <div style={{ marginTop: 'auto', paddingTop: isMobile ? 10 : 14, position: 'relative' }}>
        {hasAccess && hasProg ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: '#9a8860', letterSpacing: '0.1em' }}>{watchedCount} / {totalLessons} уроков</span>
              <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: '#b73828', letterSpacing: '0.1em', fontWeight: 600 }}>{Math.round(progress * 100)}%</span>
            </div>
            <div style={{ height: 2, background: '#e0d8c8' }}>
              <div style={{ height: '100%', width: `${progress * 100}%`, background: '#b73828', transition: 'width 0.4s ease' }} />
            </div>
          </>
        ) : hasAccess ? (
          <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: '#b0a080', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {totalLessons > 0 ? `${totalLessons} уроков · не начат` : 'Скоро'}
          </span>
        ) : product ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 15, color: '#6f6452' }}>{product.price?.toLocaleString('ru-RU')} ₽</span>
            <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: '#8B6914', letterSpacing: '0.16em', textTransform: 'uppercase' }}>Открыть →</span>
          </div>
        ) : null}
      </div>

      {/* CTA */}
      <div style={{ paddingTop: 8 }}>
        {accessLoading ? (
          <div style={{ height: 36, background: '#ece8e0', width: isMobile ? '100%' : 80 }} />
        ) : hasAccess ? (
          <button
            onClick={() => nav.month(m.id)}
            style={{ padding: isMobile ? '11px 12px' : '8px 16px', background: '#15120e', color: '#ede5d3', border: 'none', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 13 : 11, letterSpacing: '0.1em', cursor: 'pointer', minHeight: 44, width: isMobile ? '100%' : 'auto' }}>
            Войти →
          </button>
        ) : product ? (
          <div>
            <button
              onClick={handleBuy}
              disabled={buying}
              style={{ padding: isMobile ? '11px 12px' : '8px 16px', background: buying ? '#f0ebe0' : 'transparent', color: buying ? '#b0a080' : '#8B6914', border: `1px solid ${buying ? '#d8cdb8' : '#c8a84a'}`, fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 13 : 11, letterSpacing: '0.08em', cursor: buying ? 'default' : 'pointer', minHeight: 44, width: isMobile ? '100%' : 'auto', transition: 'all 0.15s' }}>
              {buying ? 'Переход к оплате…' : `Купить — ${product.price?.toLocaleString('ru-RU')} ₽`}
            </button>
            {buyError && <div style={{ fontSize: 10, color: '#a03030', marginTop: 4 }}>{buyError}</div>}
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
  if (loading) return <div style={{ color: C.muted, fontSize: 13 }}>Загрузка…</div>;
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, letterSpacing: '0.28em', color: '#9a8860', textTransform: 'uppercase', marginBottom: 8 }}>01 · Открыто для всех</div>
        <h2 style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 28 : 38, color: '#15120e', letterSpacing: '0.03em', lineHeight: 1.1 }}>База знаний</h2>
        <div style={{ height: 1, background: '#d2c7b0', marginTop: 16 }} />
      </div>
      {items.length === 0 && <div style={{ fontSize: 13, color: C.muted }}>Материалы скоро появятся</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {items.map(item => (
          <div key={item.id}
            onClick={() => nav.knowledgeItem(item.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: isMobile ? '14px 12px' : '18px 16px', background: C.white, border: `1px solid ${C.border}`, borderTop: 'none', cursor: 'pointer' }}>
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
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, letterSpacing: '0.28em', color: '#9a8860', textTransform: 'uppercase', marginBottom: 8 }}>03 · Разовая покупка</div>
        <h2 style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 28 : 38, color: '#15120e', letterSpacing: '0.03em', lineHeight: 1.1 }}>База техник</h2>
        <div style={{ height: 1, background: '#d2c7b0', marginTop: 16 }} />
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
            <div key={sec.id} style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? 12 : 18, padding: isMobile ? '16px' : '20px 18px', background: C.white, border: `1px solid ${C.border}`, borderTop: 'none', opacity: avail ? 1 : 0.4, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
              <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: isMobile ? 24 : 32, minWidth: 36, textAlign: 'center', color: bought ? C.gold : avail ? C.dark : '#bbb', lineHeight: 1, flexShrink: 0 }}>{sec.kanji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 16 : 18, fontWeight: 600, color: C.dark }}>{sec.label}</span>
                  <span style={{ fontSize: 9, color: C.gold, background: C.light, border: `1px solid ${C.goldBorder}`, padding: '2px 7px', letterSpacing: 0.5 }}>{sec.sublabel}</span>
                </div>
                <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{sec.desc}</div>
                <div style={{ fontSize: 10, color: '#bbb', marginTop: 4 }}>{sec.techniques} техник</div>
              </div>
              <div style={{ flexShrink: 0, width: isMobile ? '100%' : 'auto', marginTop: isMobile ? 8 : 0 }}>
                {bought
                  ? <button onClick={sec.id === 'ikkajo' ? nav.ikkajo : undefined} style={{ padding: '9px 16px', background: C.dark, color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer', minHeight: 44, width: isMobile ? '100%' : 'auto' }}>Открыть →</button>
                  : avail
                    ? <button onClick={() => setModal(sec)} style={{ padding: '9px 16px', background: 'transparent', color: C.gold, border: '1px solid #c8a84a', fontSize: 12, cursor: 'pointer', minHeight: 44, width: isMobile ? '100%' : 'auto' }}>Купить — {sec.price}</button>
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
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: `2px solid ${C.border}`, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 18 : 22, fontWeight: 600, color: '#1a1a1a' }}>Личный кабинет</h2>
      </div>

      {/* Profile card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 16, padding: isMobile ? '16px' : '20px 22px', background: C.white, border: `1px solid ${C.border}`, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: `2px solid ${C.goldBorder}`, background: C.light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 19, color: C.gold, flexShrink: 0 }}>{(usr.name||'?')[0]}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 18 : 20, fontWeight: 600, color: C.dark }}>{usr.name}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{usr.email}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {curLv && <span style={{ padding: '3px 10px', background: C.light, border: `1px solid ${C.goldBorder}`, color: C.gold, fontSize: 11, fontWeight: 600 }}>{curLv.label}</span>}
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
      <div style={{ display: 'flex', background: C.white, border: `1px solid ${C.border}`, borderBottom: 'none', overflowX: 'auto' }}>
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSub(t.id)}
            style={{ padding: isMobile ? '12px 14px' : '11px 18px', background: 'none', border: 'none', color: sub === t.id ? C.dark : C.muted, fontSize: 12, borderBottom: `2px solid ${sub === t.id ? C.gold : 'transparent'}`, cursor: 'pointer', fontWeight: sub === t.id ? 600 : 400, marginBottom: -1, whiteSpace: 'nowrap', minHeight: 44 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Info tab */}
      {sub === 'info' && (
        <div style={{ border: `1px solid ${C.border}`, borderTop: 'none', background: C.white }}>
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

  const rowStyle = { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: `1px solid ${C.border}`, fontSize: 13, background: C.white };
  const tick = (has) => (
    <span style={{ fontSize: 13, color: has ? '#2d7a4a' : '#ccc', flexShrink: 0 }}>{has ? '✓' : '✗'}</span>
  );

  return (
    <div style={{ border: `1px solid ${C.border}`, borderTop: 'none' }}>
      {/* Months */}
      <div style={{ padding: '12px 16px', background: '#faf8f4', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 9, color: C.gold, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>Месяцы обучения</div>
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
      <div style={{ padding: '12px 16px', background: '#faf8f4', borderBottom: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}`, marginTop: 8 }}>
        <div style={{ fontSize: 9, color: C.gold, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>Иккаджо</div>
      </div>
      {fullIkkajo ? (
        <div style={{ ...rowStyle }}>
          {tick(true)}
          <span style={{ color: C.dark }}>Весь Иккаджо</span>
          <span style={{ fontSize: 10, color: C.gold, background: '#faf6ee', border: '1px solid #e8dcc8', padding: '2px 8px', marginLeft: 'auto' }}>полный доступ</span>
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
    <div style={{ border: `1px solid ${C.border}`, borderTop: 'none', padding: '24px 16px', background: C.white, color: C.muted, fontSize: 13 }}>Загрузка…</div>
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
            background: hasAccess ? '#f0faf4' : isBuying ? '#555' : C.dark,
            color:      hasAccess ? '#2d7a4a' : '#fff',
            border:     hasAccess ? '1px solid #b8e0c8' : 'none',
            fontWeight: 600, width: '100%', minHeight: 40, transition: 'background 0.15s',
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
  const headerStyle  = { padding: '10px 0', marginBottom: 12, borderBottom: `2px solid ${C.border}` };
  const labelStyle   = { fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 15 : 17, fontWeight: 600, color: '#1a1a1a' };

  return (
    <div style={{ border: `1px solid ${C.border}`, borderTop: 'none', background: C.white, padding: isMobile ? '16px' : '20px 24px' }}>

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
              <div key={p.id} style={{ padding: '14px', background: has ? '#f0faf4' : '#faf8f4', border: `1px solid ${has ? '#b8e0c8' : C.border}` }}>
                <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 15, fontWeight: 600, color: C.dark, marginBottom: 4 }}>{p.title}</div>
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
              <div key={p.id} style={{ padding: '14px', background: has ? '#f0faf4' : '#faf8f4', border: `1px solid ${has ? '#b8e0c8' : C.border}` }}>
                <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 15, fontWeight: 600, color: C.dark, marginBottom: 4 }}>{p.title}</div>
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
            <span style={{ fontSize: 12, color: C.gold, marginLeft: 12, background: '#faf6ee', border: '1px solid #e8dcc8', padding: '2px 10px' }}>Выгодно</span>
          </div>
          <div style={{ padding: '18px', background: hasFull ? '#f0faf4' : '#faf8f4', border: `1px solid ${hasFull ? '#b8e0c8' : C.goldBorder}` }}>
            <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 18, fontWeight: 600, color: C.dark, marginBottom: 8 }}>{ikkajoFull.title}</div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>{ikkajoFull.description}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
              {IKKAJO_SECTIONS.map(s => (
                <span key={s} style={{ fontSize: 10, color: C.gold, background: '#faf6ee', border: '1px solid #e8dcc8', padding: '3px 10px' }}>
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
