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
  { id: 'knowledge', label: 'База знаний'   },
  { id: 'months',    label: 'Месяцы 2026'   },
  { id: 'database',  label: 'База техник'   },
  { id: 'profile',   label: 'Личный кабинет'},
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

      {/* ── Sidebar (desktop only) — dark charcoal ── */}
      {!isMobile && (
        <aside style={{ width: 240, background: '#0e0c09', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', borderRight: '1px solid #1e1a14' }}>
          {/* Crimson top stripe */}
          <div style={{ height: 3, background: C.accent, flexShrink: 0 }} />

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '18px 20px 16px' }}>
            <TakedaMon size={34} color={C.accent} />
            <div>
              <div style={{ fontFamily: "var(--font-cormorant-sc), var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 13, letterSpacing: '0.14em', color: '#ede5d3', textTransform: 'uppercase' }}>Online Dojo</div>
              <div style={{ fontSize: 9, color: '#5e5040', marginTop: 2, letterSpacing: '0.06em' }}>Дайто-рю Айкидзюдзюцу</div>
            </div>
          </div>

          <div style={{ height: 1, background: '#1e1a14' }} />

          {/* User */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1e1812', border: `1px solid ${C.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "var(--font-cormorant-sc), serif", fontSize: 15, color: C.accent, flexShrink: 0 }}>
              {(u.name || '?')[0]}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#ede5d3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
              <div style={{ fontSize: 10, color: '#4a3f30', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
            </div>
          </div>

          {curLv && (
            <div style={{ margin: '0 14px 12px', padding: '9px 12px', background: '#1a1410', border: `1px solid #2a2218` }}>
              <div style={{ fontSize: 9, color: '#5e5040', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 3, fontFamily: "var(--font-mono), monospace" }}>Уровень</div>
              <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 13, fontWeight: 600, color: C.goldLight }}>{curLv.label}</div>
              {curLv.program && (
                <div style={{ fontSize: 10, color: '#5e5040', marginTop: 2 }}>
                  {DB_SECTIONS.find(d => d.id === curLv.program)?.label}
                </div>
              )}
            </div>
          )}

          <div style={{ height: 1, background: '#1e1a14' }} />

          {/* Nav */}
          <nav style={{ flex: 1, paddingTop: 4 }}>
            {TABS.map(({ id, label }) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '11px 20px', background: tab === id ? '#1a1410' : 'none', border: 'none', borderLeft: `2px solid ${tab === id ? C.accent : 'transparent'}`, color: tab === id ? '#ede5d3' : '#4a3f30', fontSize: 12, textAlign: 'left', cursor: 'pointer', fontWeight: tab === id ? 500 : 400, transition: 'all 0.15s' }}>
                {label}
              </button>
            ))}
          </nav>

          <div style={{ height: 1, background: '#1e1a14' }} />
          <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {isAdmin && (
              <a href="/admin"
                style={{ display: 'block', padding: '7px 12px', background: 'none', border: `1px solid ${C.accent}50`, color: C.accent, fontSize: 11, cursor: 'pointer', textAlign: 'left', textDecoration: 'none', opacity: 0.8 }}>
                ⚙ Панель управления
              </a>
            )}
            <button onClick={onLogout} style={{ padding: '7px 12px', background: 'none', border: `1px solid #1e1a14`, color: '#3a3028', fontSize: 11, cursor: 'pointer', textAlign: 'left' }}>
              Выйти
            </button>
          </div>
        </aside>
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

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: "var(--font-cormorant-sc), var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: isMobile ? 22 : 28, color: C.ink, letterSpacing: '0.05em', fontWeight: 400 }}>Месяцы 2026</h2>
        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 10, color: C.muted, letterSpacing: '0.1em' }}>1 990 ₽ / МЕС</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(190px, 1fr))', gap: isMobile ? 8 : 10 }}>
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
  const cardBg     = hasAccess ? C.surface : C.bg;
  const cardBorder = m.current  ? `2px solid ${C.accent}`
                   : hasAccess  ? `1px solid ${C.border}`
                   :              `1px solid ${C.hairline2}`;
  const kanjiColor = hasAccess ? C.goldBorder : '#c8c0b0';
  const shadow     = m.current ? `0 2px 16px ${C.accent}15` : 'none';

  return (
    <div style={{ padding: isMobile ? '14px 12px' : '18px 16px', minHeight: isMobile ? 160 : 200, background: cardBg, border: cardBorder, display: 'flex', flexDirection: 'column', gap: 6, boxShadow: shadow }}>

      {/* Статус-бейдж */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 18 }}>
        {m.current && (
          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: isMobile ? 9 : 8, color: C.accent, background: `${C.accent}12`, border: `1px solid ${C.accent}40`, padding: '2px 7px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Текущий</span>
        )}
        {!hasAccess && (
          <span style={{ fontSize: isMobile ? 12 : 9, color: '#bbb', marginLeft: 'auto' }}>🔒</span>
        )}
        {hasAccess && !m.current && (
          <span style={{ fontSize: isMobile ? 12 : 9, color: '#4a8a5a', marginLeft: 'auto' }}>✓ открыт</span>
        )}
      </div>

      {/* Кандзи и название */}
      <div style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: isMobile ? 16 : 20, color: kanjiColor, lineHeight: 1 }}>{m.kanji}</div>
      <div style={{ fontFamily: "var(--font-cormorant-sc), var(--font-cormorant), serif", fontSize: isMobile ? 15 : 17, color: hasAccess ? C.ink : C.muted, letterSpacing: '0.04em' }}>{m.label}</div>

      {!isMobile && (
        <div style={{ fontSize: 11, color: hasAccess ? '#888' : '#bbb', lineHeight: 1.6, flex: 1 }}>{m.description || m.desc}</div>
      )}

      {/* Прогресс (только для открытых) */}
      {hasAccess && hasProg && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 9, color: C.muted }}>{watchedCount} / {(lessons ?? []).length} уроков</span>
          </div>
          <div style={{ height: 2, background: C.border, borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${(lessons ?? []).length ? (watchedCount / (lessons ?? []).length) * 100 : 0}%`, background: C.accent, borderRadius: 2 }} />
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{ marginTop: 'auto', paddingTop: 8 }}>
        {/* Пока грузится access state — нейтральная заглушка, без мигания */}
        {accessLoading ? (
          <div style={{ height: 36, background: '#eeebe5', borderRadius: 2, width: isMobile ? '100%' : 80 }} />
        ) : hasAccess ? (
          <button
            onClick={() => nav.month(m.id)}
            style={{ padding: isMobile ? '11px 12px' : '7px 14px', background: C.accent, color: C.onAccent, border: 'none', fontSize: isMobile ? 14 : 12, cursor: 'pointer', minHeight: 44, width: isMobile ? '100%' : 'auto', fontWeight: 500, letterSpacing: '0.04em' }}>
            Войти →
          </button>
        ) : product ? (
          <div>
            <button
              onClick={handleBuy}
              disabled={buying}
              style={{ padding: isMobile ? '11px 12px' : '7px 14px', background: buying ? C.surface2 : 'transparent', color: buying ? C.muted : C.gold, border: `1px solid ${buying ? C.border : C.goldBorder}`, fontSize: isMobile ? 13 : 12, cursor: buying ? 'default' : 'pointer', minHeight: 44, width: isMobile ? '100%' : 'auto', transition: 'all 0.15s' }}>
              {buying ? 'Переход к оплате…' : `Купить — ${product.price?.toLocaleString('ru-RU')} ₽`}
            </button>
            {buyError && (
              <div style={{ fontSize: 10, color: '#a03030', marginTop: 4 }}>{buyError}</div>
            )}
          </div>
        ) : (
          <span style={{ fontSize: 11, color: '#bbb' }}>Недоступно</span>
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
