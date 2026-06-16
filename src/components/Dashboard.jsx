'use client';

import { useState, useEffect } from 'react';
import { C, hasLevel, levelIndex } from '@/lib/utils';
import { useIsMobile } from '@/lib/mobile';
import { LEVELS, SELF_LEVELS } from '@/data/users';
import { DB_SECTIONS } from '@/data/techniques';
import { useMonths, useLessons, useUserAccessRows, hasMonthAccess, useKnowledge, useUserExams, useUserPayments, useTechniques } from '@/lib/db';
import TakedaMon from '@/components/TakedaMon';
import Sidebar from '@/components/Sidebar';
import { MobileBottomNav } from '@/components/BottomNav';
import { hasIkkajoFullAccess, hasIkkajoSectionAccess, IKKAJO_SECTIONS, IKKAJO_SECTION_LABELS, getAccessibleIkkajoSections } from '@/lib/access';
import { IKKAJO_SECTION_KEYS } from '@/lib/ikkajoSections';
import { useProducts } from '@/lib/useProducts';

// Срок программы пока не хранится в БД — единственный явный источник здесь.
// TODO: перенести в Product.durationMonths + админку, когда появится экран управления Product.
const PROGRAM_DURATION_MONTHS = { ikkajo: 12, nikkajo: 8, sankajo: 8 };

const TABS = [
  { id: 'knowledge', label: 'База знаний',    num: '01', kanji: '智' },
  { id: 'months',    label: 'Месяцы 2026',    num: '02', kanji: '月' },
  { id: 'database',  label: 'База техник',    num: '03', kanji: '技' },
  { id: 'profile',   label: 'Личный кабинет', num: '04', kanji: '人' },
];

// BOTTOM_TABS removed — replaced by MobileBottomNav component

export default function Dashboard({ nav, watched, user: userProp, onLogout, initialTab }) {
  const [tab, setTab]     = useState(initialTab || 'months');
  const [modal, setModal] = useState(null);

  // Sync tab when navigating back to dashboard with specific tab
  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  // Меняем таб локально И сообщаем App.jsx через nav.dashboard,
  // чтобы route.tab обновился и сохранился в localStorage.
  const changeTab = (id) => {
    setTab(id);
    nav.dashboard?.(id);
  };
  const isMobile          = useIsMobile();
  const u     = userProp || {};
  const curLv = LEVELS.find(l => l.id === u.level);
  const isAdmin = u.role === 'admin';
  const { rows: userAccess, loading: accessLoading } = useUserAccessRows();

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Sidebar (desktop only) ── */}
      {!isMobile && (
        <Sidebar activeTab={tab} onTabClick={changeTab} user={u} onLogout={onLogout} />
      )}

      {/* ── Main content ── */}
      <main style={{ flex: 1, background: C.bg, minHeight: '100vh', minWidth: 0, paddingLeft: isMobile ? 0 : 260 }}>

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
            <span style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 15, letterSpacing: '0.06em', color: C.ink, flex: 1 }}>
              {TABS.find(t => t.id === tab)?.label}
            </span>
            {curLv && (
              <span style={{ fontFamily: "var(--font-mono), monospace", padding: '3px 8px', background: C.surface2, border: `1px solid ${C.border}`, color: C.muted, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {curLv.label}
              </span>
            )}
          </header>
        )}

        {/* Desktop header */}
        {!isMobile && (
          <header style={{ display: 'flex', alignItems: 'center', padding: '14px 36px', background: C.surface, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 10 }}>
            <span style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 15, letterSpacing: '0.06em', color: C.ink, flex: 1 }}>
              {TABS.find(t => t.id === tab)?.label}
            </span>
            {curLv && (
              <span style={{ fontFamily: "var(--font-mono), monospace", padding: '3px 9px', background: C.surface2, border: `1px solid ${C.border}`, color: C.muted, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
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
        <MobileBottomNav
          nav={{ dashboard: changeTab }}
          active={tab}
          isAdmin={isAdmin}
        />
      )}

      {/* ── Modal покупки ── */}
      {modal && (
        <div onClick={() => setModal(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: C.white, border: `1px solid ${C.border}`, padding: isMobile ? '32px 24px' : '44px 40px', width: '100%', maxWidth: 380, textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
            <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 48, color: C.gold, lineHeight: 1, marginBottom: 12 }}>{modal.kanji}</div>
            <div style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 18, fontWeight: 600, color: '#1a1a1a', marginBottom: 4 }}>{modal.label}</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>{modal.sublabel} · {modal.techniques} техник</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, color: C.dark, marginBottom: 6 }}>{modal.price}</div>
            <p style={{ fontSize: 11, color: '#888', lineHeight: 1.7, marginBottom: 20 }}>Разовая оплата — постоянный доступ без ограничений.</p>
            <button style={{ width: '100%', padding: '12px', background: C.dark, color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer', marginBottom: 8, minHeight: 44 }}>
              Перейти к оплате
            </button>
            <button onClick={() => setModal(null)}
              style={{ width: '100%', padding: '10px', background: 'none', border: 'none', color: '#ccc', fontSize: 13, cursor: 'pointer', minHeight: 44 }}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── helpers ──────────────────────────────────────────────────────
function tryParseJSON(str, fallback = []) {
  if (!str) return fallback;
  try { return JSON.parse(str); } catch { return fallback; }
}

const MODAL_KANJI_NUM = ['一','二','三','四','五','六','七','八','九','十'];

// ── MonthPurchaseModal ───────────────────────────────────────────
function MonthPurchaseModal({ month, product, onClose, isMobile }) {
  const [buying,   setBuying]   = useState(false);
  const [buyError, setBuyError] = useState('');

  const handleBuy = async () => {
    if (!product || buying) return;
    setBuying(true); setBuyError('');
    try {
      const res  = await fetch('/api/yookassa/create-payment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      });
      const data = await res.json();
      if (!res.ok) { setBuyError(data.error || 'Ошибка'); return; }
      if (data.payment_id) { try { sessionStorage.setItem('yk_pending_pid', data.payment_id); } catch {} }
      window.location.href = data.confirmation_url;
    } catch { setBuyError('Ошибка соединения'); }
    finally { setBuying(false); }
  };

  const topics  = tryParseJSON(month.modal_topics,  []);
  const results = tryParseJSON(month.modal_results, []);

  // Static access format block
  const accessItems = ['Бессрочный доступ', 'Просмотр с любого устройства', 'Всегда можно вернуться к урокам'];

  const leftBg   = 'linear-gradient(160deg,#1a1510 0%,#0d0b08 60%,#13110e 100%)';
  const goldClr  = '#b8923a';
  const sideText = '#ede5d3';
  const sideMuted= '#7a6c52';

  const content = (
    <div onClick={e => e.stopPropagation()}
      style={{
        display: 'flex', flexDirection: isMobile ? 'column' : 'row',
        background: C.surface, border: `1px solid ${C.border}`,
        width: '100%', maxWidth: isMobile ? '100%' : 780,
        maxHeight: isMobile ? '92vh' : '88vh',
        overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.28)',
      }}>

      {/* ── Left panel ── */}
      <div style={{
        width: isMobile ? '100%' : 240, flexShrink: 0,
        background: leftBg, padding: isMobile ? '24px 24px 20px' : '36px 28px 28px',
        display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
      }}>
        {/* kanji watermark */}
        <div style={{
          position: 'absolute', bottom: -20, right: -10,
          fontFamily: "var(--font-noto),'Noto Serif JP',serif",
          fontSize: 140, color: goldClr, opacity: 0.08,
          lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
        }}>{month.kanji || '月'}</div>

        {/* top label */}
        <div style={{
          fontFamily: "var(--font-mono),'JetBrains Mono',monospace",
          fontSize: 11, letterSpacing: '0.22em', color: sideMuted,
          textTransform: 'uppercase', marginBottom: isMobile ? 12 : 20,
        }}>
          МЕСЯЦ {String(month.sort_order || '').padStart(2, '0')} · ДАЙТО-РЮ
        </div>

        {/* month name */}
        <div style={{
          fontFamily: "var(--font-cormorant),'Cormorant Garamond',serif",
          fontSize: isMobile ? 42 : 52, letterSpacing: '0.05em',
          textTransform: 'uppercase', color: sideText, lineHeight: 0.9,
          fontWeight: 400, position: 'relative', marginBottom: 16,
        }}>{month.label}</div>

        {/* subtitle */}
        {(month.subtitle || month.description) && (
          <div style={{
            fontFamily: "var(--font-cormorant),'Cormorant Garamond',serif",
            fontSize: 15, color: sideMuted, lineHeight: 1.55, position: 'relative',
            marginBottom: 16,
          }}>{month.subtitle || month.description}</div>
        )}

        {/* modal theme teaser */}
        {month.modal_theme && (
          <div style={{
            fontFamily: "var(--font-cormorant),'Cormorant Garamond',serif",
            fontSize: 15, color: `${sideText}99`, lineHeight: 1.5,
            position: 'relative', marginBottom: 20,
          }}>{month.modal_theme}</div>
        )}

        <div style={{ flex: 1 }} />

        {/* price */}
        {product && (
          <div style={{ position: 'relative' }}>
            <div style={{
              fontFamily: "var(--font-mono),'JetBrains Mono',monospace",
              fontSize: 11, letterSpacing: '0.22em', color: sideMuted,
              textTransform: 'uppercase', marginBottom: 6,
            }}>ЦЕНА</div>
            <div style={{
              fontFamily: "var(--font-cormorant),'Cormorant Garamond',serif",
              fontSize: 36, color: goldClr, letterSpacing: '0.03em', lineHeight: 1,
            }}>{product.price?.toLocaleString('ru-RU')} ₽</div>
          </div>
        )}
      </div>

      {/* ── Right panel ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        minWidth: 0, overflow: 'hidden',
      }}>
        {/* Right header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 24px 14px', borderBottom: `1px solid ${C.border}`, flexShrink: 0,
        }}>
          <span style={{
            fontFamily: "var(--font-mono),'JetBrains Mono',monospace",
            fontSize: 11, letterSpacing: '0.22em', color: C.muted, textTransform: 'uppercase',
          }}>ПРИОБРЕТЕНИЕ МЕСЯЦА</span>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: C.muted, fontSize: 18, lineHeight: 1, padding: '2px 4px',
          }}>✕</button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '20px 20px' : '28px 32px' }}>

          {/* ЧТО ВХОДИТ heading */}
          <div style={{
            fontFamily: "var(--font-cormorant),'Cormorant Garamond',serif",
            fontSize: isMobile ? 28 : 34, fontWeight: 300, color: C.ink,
            letterSpacing: '0.04em', marginBottom: 24,
          }}>ЧТО ВХОДИТ</div>

          {/* Topics block */}
          {topics.length > 0 ? (
            <div style={{ marginBottom: 24 }}>
              {topics.map((t, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'baseline', gap: 14,
                  padding: '12px 0', borderBottom: `1px solid ${C.border}`,
                }}>
                  <span style={{
                    fontFamily: "var(--font-noto),'Noto Serif JP',serif",
                    fontSize: 15, color: C.accent, flexShrink: 0, minWidth: 16,
                  }}>{MODAL_KANJI_NUM[i] || String(i+1)}</span>
                  <div>
                    <div style={{ fontFamily: "var(--font-mono),'JetBrains Mono',monospace", fontSize: 13, color: C.ink, fontWeight: 500 }}>
                      {typeof t === 'object' ? t.title : t}
                    </div>
                    {typeof t === 'object' && t.desc && (
                      <div style={{ fontFamily: "var(--font-cormorant),'Cormorant Garamond',serif", fontSize: 15, color: C.muted, marginTop: 2 }}>{t.desc}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Static default items when no topics set */
            <div style={{ marginBottom: 24 }}>
              {[
                { title: 'Постоянный доступ', desc: 'Без срока действия' },
                { title: 'Видеоуроки в HD', desc: 'Подробный разбор техники сэнсэем' },
                { title: 'Личные комментарии', desc: 'Сэнсэй отвечает на ваши вопросы' },
              ].map((t, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'baseline', gap: 14,
                  padding: '12px 0', borderBottom: `1px solid ${C.border}`,
                }}>
                  <span style={{ fontFamily: "var(--font-noto),'Noto Serif JP',serif", fontSize: 15, color: C.accent, flexShrink: 0, minWidth: 16 }}>
                    {MODAL_KANJI_NUM[i]}
                  </span>
                  <div>
                    <div style={{ fontFamily: "var(--font-mono),'JetBrains Mono',monospace", fontSize: 13, color: C.ink, fontWeight: 500 }}>{t.title}</div>
                    <div style={{ fontFamily: "var(--font-cormorant),'Cormorant Garamond',serif", fontSize: 15, color: C.muted, marginTop: 2 }}>{t.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lessons description */}
          {month.modal_lessons_desc && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "var(--font-mono),'JetBrains Mono',monospace", fontSize: 11, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase', marginBottom: 10 }}>УРОКИ МЕСЯЦА</div>
              <div style={{ fontFamily: "var(--font-cormorant),'Cormorant Garamond',serif", fontSize: 15, color: C.ink2, lineHeight: 1.6 }}>{month.modal_lessons_desc}</div>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "var(--font-mono),'JetBrains Mono',monospace", fontSize: 11, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase', marginBottom: 10 }}>РЕЗУЛЬТАТ</div>
              {results.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                  <span style={{ color: C.accent, fontSize: 13, marginTop: 3, flexShrink: 0 }}>—</span>
                  <span style={{ fontFamily: "var(--font-cormorant),'Cormorant Garamond',serif", fontSize: 15, color: C.ink2, lineHeight: 1.5 }}>{r}</span>
                </div>
              ))}
            </div>
          )}

          {/* Access format */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: "var(--font-mono),'JetBrains Mono',monospace", fontSize: 11, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase', marginBottom: 10 }}>ФОРМАТ ДОСТУПА</div>
            {accessItems.map((a, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                <span style={{ color: C.accent, fontSize: 13, marginTop: 3, flexShrink: 0 }}>—</span>
                <span style={{ fontFamily: "var(--font-cormorant),'Cormorant Garamond',serif", fontSize: 15, color: C.ink2, lineHeight: 1.5 }}>{a}</span>
              </div>
            ))}
          </div>

          {/* Extras */}
          {month.modal_extras && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: "var(--font-mono),'JetBrains Mono',monospace", fontSize: 11, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase', marginBottom: 10 }}>ДОПОЛНИТЕЛЬНО</div>
              <div style={{ fontFamily: "var(--font-cormorant),'Cormorant Garamond',serif", fontSize: 15, color: C.ink2, lineHeight: 1.6 }}>{month.modal_extras}</div>
            </div>
          )}
        </div>

        {/* CTA area */}
        <div style={{ padding: isMobile ? '16px 20px' : '20px 32px', borderTop: `1px solid ${C.border}`, flexShrink: 0, background: C.surface }}>
          {product ? (
            <button onClick={handleBuy} disabled={buying}
              style={{
                width: '100%', padding: '14px', minHeight: 52,
                background: buying ? C.muted : C.accent, color: '#fff',
                border: 'none', cursor: buying ? 'default' : 'pointer',
                fontFamily: "var(--font-mono),'JetBrains Mono',monospace",
                fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase',
                marginBottom: 8, transition: 'background 0.15s',
              }}>
              {buying ? 'Переход к оплате…' : `ПЕРЕЙТИ К ОПЛАТЕ · ЮKASSA →`}
            </button>
          ) : (
            <div style={{ fontFamily: "var(--font-mono),'JetBrains Mono',monospace", fontSize: 13, color: C.muted, textAlign: 'center', marginBottom: 8 }}>
              Продукт недоступен для покупки
            </div>
          )}
          <button onClick={onClose}
            style={{
              width: '100%', padding: '10px', minHeight: 40,
              background: 'none', border: `1px solid ${C.border}`, cursor: 'pointer',
              fontFamily: "var(--font-mono),'JetBrains Mono',monospace",
              fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: C.muted, marginBottom: 10,
            }}>
            ОТМЕНА
          </button>
          {buyError && <div style={{ fontSize: 11, color: '#a03030', textAlign: 'center' }}>{buyError}</div>}
          <div style={{
            fontFamily: "var(--font-mono),'JetBrains Mono',monospace",
            fontSize: 11, letterSpacing: '0.18em', color: C.muted,
            textTransform: 'uppercase', textAlign: 'center',
          }}>БЕЗОПАСНАЯ ОПЛАТА · СБП · КАРТА · БАНК</div>
        </div>
      </div>
    </div>
  );

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 400,
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center',
      padding: isMobile ? 0 : 20,
    }}>
      {content}
    </div>
  );
}

// ── Вкладка: Месяцы ──────────────────────────────────────────────
function TabMonths({ nav, watched, user, userAccess, accessLoading, isMobile }) {
  const { months,   loading: monthsLoading }   = useMonths();
  const { products, loading: productsLoading } = useProducts();
  const [purchaseMonth, setPurchaseMonth] = useState(null); // month object for modal

  if (monthsLoading) return <div style={{ color: C.muted, fontSize: 13 }}>Загрузка…</div>;

  // Индекс продуктов по reference для быстрого поиска
  const productByRef = {};
  (products ?? []).forEach(p => { if (p.type === 'month') productByRef[p.reference] = p; });

  const openedCount  = (months ?? []).filter(m => hasMonthAccess(userAccess ?? [], m.id)).length;
  const watchedCount = Object.keys(watched || {}).length;

  return (
    <div>
      {/* ── Desktop hero ── */}
      {!isMobile && (
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginBottom: 16 }}>
            <div style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 160, lineHeight: 0.85, color: C.accent, opacity: 0.1, flexShrink: 0, marginLeft: -8, marginBottom: -8 }}>月</div>
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <div style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.28em', color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>02 · МЕСЯЦЫ 2026 · ИЮНЬ–ДЕКАБРЬ</div>
              <h1 style={{ margin: 0, fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 60, lineHeight: 0.9, letterSpacing: '0.04em', color: C.ink, fontWeight: 400, textTransform: 'uppercase' }}>Месяцы Дайто-рю</h1>
              <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 15, color: C.muted, marginTop: 14, maxWidth: 540, lineHeight: 1.55 }}>
                Программа от Введения через Иккаджо к экзамену 3 кю. 1 990 ₽ за месяц.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, paddingBottom: 8, flexShrink: 0 }}>
              <span style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 11, color: C.muted, letterSpacing: '0.22em' }}>進度</span>
              <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 42, color: C.accent, lineHeight: 1, fontWeight: 500 }}>
                {openedCount} <span style={{ fontSize: 24, color: C.ink2 }}>/ {(months ?? []).length}</span>
              </div>
              <span style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.18em', color: C.muted, textTransform: 'uppercase' }}>месяцев открыто</span>
            </div>
          </div>
          <svg viewBox="0 0 800 20" style={{ width: '100%', height: 20, opacity: 0.22, display: 'block', marginBottom: 36 }}>
            <path d="M0,10 Q200,4 400,10 Q600,16 800,10" stroke={C.ink2} strokeWidth="1.2" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* ── Mobile hero ── */}
      {isMobile && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase', marginBottom: 10 }}>
            02 · Месяцы 2026
          </div>
          <h1 style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 48, letterSpacing: '0.01em', color: C.ink, lineHeight: 0.95, fontWeight: 300, margin: 0, textTransform: 'uppercase' }}>
            Месяцы<br />Дайто-рю
          </h1>
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
            onBuyClick={() => setPurchaseMonth({ month: m, product: productByRef[m.id] ?? null })}
          />
        ))}
      </div>

      {/* Purchase modal */}
      {purchaseMonth && (
        <MonthPurchaseModal
          month={purchaseMonth.month}
          product={purchaseMonth.product}
          onClose={() => setPurchaseMonth(null)}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

function getMonthVisuals(state) {
  switch (state) {
    case 'bought': return {
      surface: '#0f0d0a', grad: 'linear-gradient(155deg, #18130d 0%, #0f0c08 60%, #0a0805 100%)',
      ink: '#ede5d3', ink2: '#c2b59c', muted: '#7a6c52', hairline: 'rgba(184,146,58,0.18)',
      kanjiColor: C.accent, badgeFg: C.goldLight, badgeBorder: 'rgba(184,146,58,0.45)',
      borderTop: `2px solid ${C.accent}`,
      ctaBg: C.accent, ctaColor: C.onAccent, ctaBorder: C.accent,
      shadow: '0 24px 60px -24px rgba(0,0,0,0.55)',
    };
    case 'purchase': return {
      surface: C.surface, grad: `linear-gradient(155deg, ${C.surface2} 0%, ${C.surface} 60%, ${C.bg2} 100%)`,
      ink: C.ink, ink2: C.ink2, muted: C.muted, hairline: C.border,
      kanjiColor: C.gold, badgeFg: C.gold, badgeBorder: C.goldBorder,
      borderTop: `2px solid ${C.gold}`,
      ctaBg: C.gold, ctaColor: '#fff', ctaBorder: C.gold,
      shadow: 'none',
    };
    default: return { // closed
      surface: C.bg2, grad: C.bg2,
      ink: C.ink2, ink2: C.muted, muted: C.muted, hairline: C.hairline2,
      kanjiColor: C.hairline2, badgeFg: C.muted, badgeBorder: C.hairline2,
      borderTop: `1px dashed ${C.hairline2}`,
      ctaBg: 'transparent', ctaColor: C.muted, ctaBorder: C.hairline2,
      shadow: 'none',
    };
  }
}

function MonthCard({ month: m, nav, watched, userAccess, accessLoading, product, isMobile, onBuyClick }) {
  const { lessons } = useLessons(m.id);

  const watchedCount = (lessons ?? []).filter(l => watched[l.id]).length;
  const hasProg      = (lessons ?? []).length > 0 && watchedCount > 0;
  const hasAccess    = !accessLoading && hasMonthAccess(userAccess ?? [], m.id);
  const pct          = (lessons ?? []).length ? Math.round((watchedCount / (lessons ?? []).length) * 100) : 0;

  // Месяц.is_open — управляется админом отдельно от доступа конкретного пользователя
  const state    = accessLoading ? null : hasAccess ? 'bought' : m.is_open ? 'purchase' : 'closed';
  const v        = getMonthVisuals(state);
  const isOpen   = state === 'bought';
  const isBuy    = state === 'purchase';
  const isClosed = state === 'closed';
  const badgeLabel = isOpen ? 'Куплен' : isBuy ? 'Доступен к покупке' : 'Закрыт';

  return (
    <div style={{
      position: 'relative',
      padding: isMobile ? '14px 12px' : '18px 18px 16px',
      height: isMobile ? 'auto' : 240,
      minHeight: isMobile ? 168 : 240,
      background: v.surface, backgroundImage: v.grad,
      border: `1px solid ${v.hairline}`, borderTop: v.borderTop,
      boxShadow: v.shadow,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>

      {/* Kanji watermark */}
      <div style={{
        position: 'absolute', top: -8, right: 6,
        fontFamily: "'Noto Serif JP',var(--font-noto),serif",
        fontSize: isMobile ? 60 : 90,
        color: v.kanjiColor,
        opacity: isOpen ? 0.22 : isBuy ? 0.16 : 0.3,
        lineHeight: 1, pointerEvents: 'none', userSelect: 'none',
      }}>{m.kanji}</div>

      {/* Number row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', marginBottom: 10 }}>
        <span style={{ fontFamily: "var(--font-mono),'JetBrains Mono',monospace", fontSize: 11, letterSpacing: '0.22em', color: v.muted, fontWeight: 600 }}>
          {m.sort_order ? `${String(m.sort_order).padStart(2,'0')} / 12` : '– / 12'}
        </span>
      </div>

      {/* Status badge */}
      {!accessLoading && (
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
          padding: '4px 9px', marginBottom: 10, position: 'relative',
          color: v.badgeFg, border: `1px solid ${v.badgeBorder}`,
          fontFamily: "var(--font-mono),'JetBrains Mono',monospace", fontSize: 10,
          letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600,
        }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: v.badgeFg, flexShrink: 0 }} />
          {badgeLabel}
        </div>
      )}

      {/* Month name */}
      <div style={{
        fontFamily: "var(--font-cormorant),'Cormorant Garamond',serif",
        fontSize: isMobile ? 24 : 28,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        color: v.ink,
        position: 'relative', fontWeight: 500, lineHeight: 0.95,
        marginBottom: 8,
      }}>{m.label}</div>

      {/* Subtitle — clamped to 2 lines */}
      {(m.subtitle || m.description) && (
        <div style={{
          fontFamily: "var(--font-cormorant),'Cormorant Garamond',serif",
          fontSize: isMobile ? 14 : 15,
          color: v.ink2,
          position: 'relative', lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{m.subtitle || m.description}</div>
      )}

      {/* Bottom CTA */}
      <div style={{ marginTop: 'auto', paddingTop: 10, position: 'relative' }}>
        {accessLoading ? (
          <div style={{ height: 10, background: C.border, width: '55%', opacity: 0.4 }} />
        ) : (
          <>
            {isOpen && hasProg && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontFamily: "var(--font-mono),'JetBrains Mono',monospace", fontSize: 11, color: v.muted, letterSpacing: '0.1em' }}>{watchedCount} / {(lessons ?? []).length} уроков</span>
                  <span style={{ fontFamily: "var(--font-mono),'JetBrains Mono',monospace", fontSize: 11, color: C.accent, letterSpacing: '0.1em', fontWeight: 600 }}>{pct}%</span>
                </div>
                <div style={{ height: 2, background: 'rgba(184,146,58,0.15)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: C.accent, transition: 'width 0.4s ease' }} />
                </div>
              </div>
            )}
            {isBuy && product && (
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: "var(--font-mono),'JetBrains Mono',monospace", fontSize: 11, color: v.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Стоимость</span>
                <span style={{ fontFamily: "var(--font-cormorant),'Cormorant Garamond',serif", fontSize: 18, color: v.ink, fontWeight: 500 }}>{product.price?.toLocaleString()} ₽</span>
              </div>
            )}
            {isClosed ? (
              <div style={{ fontFamily: "var(--font-mono),'JetBrains Mono',monospace", fontSize: 11, color: v.muted, letterSpacing: '0.12em', textAlign: 'center', padding: '9px 0' }}>
                Покупка пока недоступна
              </div>
            ) : (
              <button
                onClick={() => { if (isOpen) nav.month(m.id); else onBuyClick(); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  width: '100%', minHeight: 38, padding: '9px 14px',
                  background: v.ctaBg, color: v.ctaColor, border: `1px solid ${v.ctaBorder}`,
                  fontFamily: "var(--font-mono),'JetBrains Mono',monospace", fontSize: 11, fontWeight: 600,
                  letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer',
                }}>
                {isOpen ? (hasProg ? 'Продолжить →' : 'Открыть →') : 'Купить →'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Вкладка: База знаний ─────────────────────────────────────────
const KNOWLEDGE_CATS = [
  { id: null,        label: 'ВСЕ'      },
  { id: 'история',   label: 'ИСТОРИЯ'  },
  { id: 'принципы',  label: 'ПРИНЦИПЫ' },
  { id: 'этикет',    label: 'ЭТИКЕТ'   },
  { id: 'теория',    label: 'ТЕОРИЯ'   },
  { id: 'словарь',   label: 'СЛОВАРЬ'  },
  { id: 'школа',     label: 'ШКОЛА'    },
];
const KNOWLEDGE_TAG_KANJI = {
  история: '史', принципы: '合', этикет: '礼',
  теория:  '論', словарь:  '辞', школа:  '道',
};

function TabKnowledge({ nav, isMobile }) {
  const { items, loading } = useKnowledge();
  const [activeTag, setActiveTag] = useState(null);

  const filtered = activeTag ? items.filter(it => it.tag === activeTag) : items;

  // ── MOBILE layout — clean, no negative-margin hacks ──────────────
  if (isMobile) {
    return (
      <div>
        {/* Hero — compact, no quote block */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
            fontSize: 11, letterSpacing: '0.2em', color: C.muted,
            textTransform: 'uppercase', marginBottom: 10,
          }}>
            01 · Архив · Открыто для всех
          </div>
          <h1 style={{
            fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            fontSize: 36, color: C.ink, lineHeight: 1.05, fontWeight: 300,
            letterSpacing: '0.01em', margin: 0,
          }}>
            База знаний
          </h1>
        </div>

        {/* Filter chips — wrap to 2 rows so all are visible without scrolling */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {KNOWLEDGE_CATS.map(cat => {
            const isA = activeTag === cat.id;
            return (
              <button key={String(cat.id)} onClick={() => setActiveTag(cat.id)} style={{
                padding: '6px 12px', minHeight: 34,
                background: isA ? C.ink : 'transparent',
                color: isA ? C.onAccent : C.muted,
                border: `1px solid ${isA ? C.ink : C.border}`,
                fontFamily: "var(--font-mono), monospace",
                fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ color: C.muted, fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '24px 0' }}>
            Загрузка
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: C.muted, fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 15 }}>
            {activeTag ? 'В этой категории пока нет материалов' : 'Материалов пока нет'}
          </div>
        )}

        {/* Items list */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map((item, i) => {
            const kanji = KNOWLEDGE_TAG_KANJI[item.tag] || '智';
            return (
              <div key={item.id}
                onClick={() => nav.knowledgeItem(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 0', borderTop: `1px solid ${C.border}`,
                  cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
                }}>
                <div style={{
                  width: 44, height: 44, flexShrink: 0,
                  background: C.surface, border: `1px solid ${C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: 18, color: C.accent, opacity: 0.85 }}>
                    {kanji}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 18, color: C.ink, fontWeight: 400, lineHeight: 1.25 }}>
                    {item.title}
                  </div>
                  {item.subtitle && (
                    <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 18, color: C.muted, marginTop: 2, lineHeight: 1.5 }}>
                      {item.subtitle}
                    </div>
                  )}
                </div>
                <span style={{ color: C.muted, fontSize: 15, flexShrink: 0, opacity: 0.5 }}>→</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── DESKTOP layout ────────────────────────────────────────────────
  return (
    <div style={{ overflow: 'hidden' }}>

      {/* Hero */}
      <div style={{ paddingTop: 32 }}>

        {/* Desktop hero */}
        {!isMobile && (
          <div style={{ marginBottom: 36 }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginBottom: 16 }}>
              <div style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 160, lineHeight: 0.85, color: C.accent, opacity: 0.1, flexShrink: 0, marginLeft: -8, marginBottom: -8 }}>智</div>
              <div style={{ flex: 1, paddingBottom: 4 }}>
                <div style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.28em', color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>01 · БАЗА ЗНАНИЙ · ОТКРЫТО ДЛЯ ВСЕХ</div>
                <h1 style={{ margin: 0, fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 60, lineHeight: 0.9, letterSpacing: '0.04em', color: C.ink, fontWeight: 400, textTransform: 'uppercase' }}>База знаний</h1>
                <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 15, color: C.muted, marginTop: 14, maxWidth: 540, lineHeight: 1.55 }}>
                  История, философия и базовая терминология школы. Открытый архив для всех учеников.
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, paddingBottom: 8, flexShrink: 0 }}>
                <span style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 11, color: C.muted, letterSpacing: '0.22em' }}>知識</span>
                <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 42, color: C.accent, lineHeight: 1, fontWeight: 500 }}>
                  {items.length}
                </div>
                <span style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.18em', color: C.muted, textTransform: 'uppercase' }}>материалов</span>
              </div>
            </div>
            <svg viewBox="0 0 800 20" style={{ width: '100%', height: 20, opacity: 0.22, display: 'block', marginBottom: 36 }}>
              <path d="M0,10 Q200,4 400,10 Q600,16 800,10" stroke={C.ink2} strokeWidth="1.2" fill="none" strokeLinecap="round" />
            </svg>
          </div>
        )}

        {/* Filter bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {KNOWLEDGE_CATS.map(cat => {
            const isA = activeTag === cat.id;
            return (
              <button key={String(cat.id)} onClick={() => setActiveTag(cat.id)} style={{
                padding: '8px 16px', flexShrink: 0,
                background: isA ? C.ink : 'transparent',
                color: isA ? C.onAccent : C.ink2,
                border: `1px solid ${isA ? C.ink : C.border}`,
                fontFamily: "var(--font-mono), monospace",
                fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase',
                cursor: 'pointer',
              }}>
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Items */}
        {loading && (
          <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 15, color: C.muted, padding: '24px 0' }}>Загрузка…</div>
        )}
        {!loading && filtered.length === 0 && (
          <div style={{ padding: '40px 0', textAlign: 'center', color: C.muted, fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 15 }}>
            Материалов пока нет
          </div>
        )}
        {!loading && filtered.length > 0 && (
          <div style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            {filtered.map((item, i) => {
              const kanji    = KNOWLEDGE_TAG_KANJI[item.tag] || '智';
              const tagLabel = item.tag ? (item.tag.charAt(0).toUpperCase() + item.tag.slice(1)) : '';
              return (
                <div key={item.id}
                  onClick={() => nav.knowledgeItem(item.id)}
                  style={{ cursor: 'pointer', borderBottom: i < filtered.length - 1 ? `1px solid ${C.hairline2}` : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background = C.bg2}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'grid', gridTemplateColumns: '60px 88px 1fr 120px 24px', gap: 24, alignItems: 'center', padding: '22px 28px' }}>
                    <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, letterSpacing: '0.1em' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div style={{ width: 64, height: 64, background: C.bg2, border: `1px solid ${C.border}`, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: 24, color: C.accent, opacity: 0.85 }}>{kanji}</span>
                      {item.video_id && (
                        <span style={{ position: 'absolute', bottom: 2, right: 4, fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted }}>▷</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 18, color: C.ink, letterSpacing: '0.02em', fontWeight: 500 }}>{item.title}</div>
                      {item.subtitle && <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 18, color: C.muted, marginTop: 4 }}>{item.subtitle}</div>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                      {tagLabel && (
                        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.accent, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '2px 8px', border: `1px solid ${C.accent}` }}>
                          {tagLabel}
                        </span>
                      )}
                    </div>
                    <span style={{ color: C.muted, fontSize: 18 }}>→</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Вкладка: База техник ──────────────────────────────────────────
function TabDatabase({ nav, setModal, user, userAccess, isMobile }) {
  const [search, setSearch] = useState('');
  const [ikkajoChoiceOpen, setIkkajoChoiceOpen] = useState(false);
  const ua = userAccess ?? [];
  const { products: allProducts } = useProducts();

  // Доступ к Иккаджо считается «есть», если куплен весь раздел ИЛИ
  // хотя бы один из 4 подразделов (татиай/идори/усиродори/хандза-хандати)
  const hasFullIkkajo     = ua.some(a => a.type === 'section' && a.reference === 'ikkajo');
  const hasAnyIkkajoSect  = IKKAJO_SECTIONS.some(k => ua.some(a => a.type === 'section' && a.reference === k));
  const hasAnyIkkajoAccess = hasFullIkkajo || hasAnyIkkajoSect;

  // ── Реальные данные по техникам Иккаджо (вместо хардкода) ──────────
  const { techniques: dbTechs, videos: dbVideos } = useTechniques();
  const ikkajoTechs   = (dbTechs ?? []).filter(t => IKKAJO_SECTION_KEYS.includes(t.section));
  const ikkajoTechIds = new Set(ikkajoTechs.map(t => t.id));
  const ikkajoVideoCount = (dbVideos ?? []).filter(v => v.video_id && ikkajoTechIds.has(v.technique_id)).length;

  const REAL_STATS = {
    ikkajo: {
      techniques: ikkajoTechs.length,
      lessons:    ikkajoVideoCount,
      sections:   IKKAJO_SECTION_KEYS.length,
    },
  };

  const SECTION_EXTRA = {
    ikkajo:  { nameRomaji: 'Ikkajō',  nameJa: '一教', programLabel: 'Программа ученических степеней', program: '6 кю → 1 кю',   duration: `${PROGRAM_DURATION_MONTHS.ikkajo} мес.` },
    nikkajo: { nameRomaji: 'Nikajō',  nameJa: '二教', programLabel: 'Программа дан, ступень II',       program: '1 дан → 2 дан', lessons: 64, sections: 6, duration: `${PROGRAM_DURATION_MONTHS.nikkajo} мес.`,  soon: true },
    sankajo: { nameRomaji: 'Sankajō', nameJa: '三教', programLabel: 'Программа дан, ступень III',      program: '2 дан → 3 дан', lessons: 56, sections: 5, duration: `${PROGRAM_DURATION_MONTHS.sankajo} мес.`,  soon: true },
  };

  function getAccessState(sec) {
    const avail = hasLevel(user?.level || '6kyu', sec.requiredLevel);
    const bought = sec.id === 'ikkajo' ? hasAnyIkkajoAccess : ua.some(a => a.type === 'section' && a.reference === sec.id);
    if (bought) return 'open';
    if (SECTION_EXTRA[sec.id]?.soon) return 'soon';
    if (!avail) return 'locked';
    return 'purchase';
  }

  function getVisuals(state) {
    switch (state) {
      case 'open': return {
        surface: '#0f0d0a', grad: 'linear-gradient(155deg, #18130d 0%, #0f0c08 60%, #0a0805 100%)',
        ink: '#ede5d3', ink2: '#c2b59c', muted: '#7a6c52', hairline: 'rgba(184,146,58,0.18)',
        kanjiBg: 'linear-gradient(170deg, #1f1812 0%, #0d0a07 100%)',
        kanjiColor: C.accent, kanjiRing: C.goldLight,
        tagFg: C.goldLight, tagBorder: 'rgba(184,146,58,0.45)',
        borderTop: `1px solid ${C.accent}`,
        ctaBg: C.accent, ctaColor: C.onAccent, ctaBorder: C.accent,
        rightBg: 'rgba(0,0,0,0.18)',
      };
      case 'purchase': return {
        surface: C.surface, grad: `linear-gradient(155deg, ${C.surface2} 0%, ${C.surface} 60%, ${C.bg2} 100%)`,
        ink: C.ink, ink2: C.ink2, muted: C.muted, hairline: C.border,
        kanjiBg: C.bg2, kanjiColor: C.gold, kanjiRing: C.border,
        tagFg: C.gold, tagBorder: C.goldBorder,
        borderTop: `1px solid ${C.border}`,
        ctaBg: 'transparent', ctaColor: C.ink, ctaBorder: C.ink2,
        rightBg: 'transparent',
      };
      default: return {
        surface: C.bg2, grad: C.bg2,
        ink: C.ink2, ink2: C.muted, muted: C.muted, hairline: C.hairline2,
        kanjiBg: C.bg2, kanjiColor: C.hairline2, kanjiRing: C.hairline2,
        tagFg: C.muted, tagBorder: C.hairline2,
        borderTop: `1px solid ${C.hairline2}`,
        ctaBg: 'transparent', ctaColor: C.muted, ctaBorder: C.hairline2,
        rightBg: 'transparent',
      };
    }
  }

  const allSecs = (DB_SECTIONS ?? []).map((sec, i) => ({
    ...sec, ...(SECTION_EXTRA[sec.id] || {}), ...(REAL_STATS[sec.id] || {}),
    num: String(i + 1).padStart(2, '0'),
    accessState: getAccessState(sec),
  }));

  const openCount  = allSecs.filter(s => s.accessState === 'open').length;
  const totalTechs = allSecs.reduce((sum, s) => sum + (s.techniques || 0), 0);

  const filtered = search.trim()
    ? allSecs.filter(s =>
        s.label.toLowerCase().includes(search.toLowerCase()) ||
        s.desc.toLowerCase().includes(search.toLowerCase()) ||
        (s.nameRomaji || '').toLowerCase().includes(search.toLowerCase()))
    : allSecs;

  function handleCta(sec) {
    if (sec.id === 'ikkajo') {
      if (hasAnyIkkajoAccess) nav.ikkajo();
      else if (sec.accessState === 'purchase') setIkkajoChoiceOpen(true);
      return;
    }
    if (sec.accessState === 'purchase') setModal(sec);
  }

  const statusBadgeLabel = (sec) => {
    if (sec.id === 'ikkajo') {
      if (hasFullIkkajo) return 'Куплен';
      if (hasAnyIkkajoAccess) return 'Частично открыт';
    }
    if (sec.accessState === 'open')     return 'Открыт';
    if (sec.accessState === 'soon')     return 'Скоро';
    if (sec.accessState === 'locked')   return 'Нет доступа';
    return sec.id === 'ikkajo' ? 'Доступно к покупке' : 'К покупке';
  };

  const ctaLabel = (sec) => {
    if (sec.id === 'ikkajo') {
      if (hasAnyIkkajoAccess) return 'Перейти';
      if (sec.accessState === 'locked') return '🔒 Нет доступа';
      if (sec.accessState === 'purchase') return 'Выбрать раздел';
    }
    if (sec.accessState === 'open')     return 'Открыть';
    if (sec.accessState === 'soon')     return 'Скоро';
    if (sec.accessState === 'locked')   return '🔒 Нет доступа';
    return `Купить — ${sec.price}`;
  };

  // ── Desktop card render ──────────────────────────────────────────
  const renderCard = (sec) => {
    const v      = getVisuals(sec.accessState);
    const isOpen = sec.accessState === 'open';
    const isSoon = sec.accessState === 'soon';
    const isLocked = sec.accessState === 'locked';
    return (
      <article key={sec.id} style={{
        display: 'grid', gridTemplateColumns: '200px 1fr 260px',
        background: v.surface, backgroundImage: v.grad,
        border: `1px solid ${v.hairline}`, borderTop: v.borderTop,
        boxShadow: isOpen ? '0 30px 80px -28px rgba(0,0,0,0.55)' : 'none',
        minHeight: 200, overflow: 'hidden',
      }}>
        {/* kanji panel */}
        <div style={{
          position: 'relative', background: v.kanjiBg,
          borderRight: `1px solid ${v.hairline}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}>
          <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35 }}>
            <circle cx="50" cy="50" r="46" fill="none" stroke={v.kanjiRing} strokeWidth="0.3" />
            <circle cx="50" cy="50" r="38" fill="none" stroke={v.kanjiRing} strokeWidth="0.2" />
          </svg>
          <div style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 120, lineHeight: 0.85, color: v.kanjiColor, fontWeight: 300, position: 'relative', zIndex: 1 }}>{sec.kanji}</div>
          <div style={{ position: 'absolute', top: 12, left: 14, fontFamily: "var(--font-mono), monospace", fontSize: 11, color: v.muted, letterSpacing: '0.2em' }}>
            {sec.num} / {String(allSecs.length).padStart(2, '0')}
          </div>
          {sec.nameJa && (
            <div style={{ position: 'absolute', bottom: 10, left: 14, fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 13, color: v.muted, letterSpacing: '0.25em' }}>{sec.nameJa}</div>
          )}
          {!isOpen && (
            <div style={{ position: 'absolute', top: 12, right: 14, width: 26, height: 26, border: `1px solid ${v.hairline}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: v.muted }}>
              {isSoon ? '◷' : '⌬'}
            </div>
          )}
        </div>

        {/* middle content */}
        <div style={{ padding: '26px 28px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: '0.2em', color: v.muted, textTransform: 'uppercase' }}>{sec.programLabel}</span>
            <span style={{ width: 20, height: 1, background: v.hairline, flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 11, letterSpacing: '0.18em', color: isOpen ? C.goldLight : v.ink2, fontWeight: 600 }}>{sec.program}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <h2 style={{ margin: 0, fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 44, lineHeight: 0.95, letterSpacing: '0.04em', color: v.ink, fontWeight: 500, textTransform: 'uppercase' }}>{sec.label}</h2>
            {sec.nameRomaji && <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: v.muted, letterSpacing: '0.04em' }}>{sec.nameRomaji}</span>}
          </div>
          <p style={{ margin: 0, fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 15, color: v.ink2, lineHeight: 1.65, maxWidth: 480 }}>{sec.desc}</p>
          <div style={{ display: 'flex', borderTop: `1px solid ${v.hairline}`, paddingTop: 12, marginTop: 4 }}>
            {[
              { label: 'Техник',   val: sec.techniques },
              { label: 'Видео',    val: sec.lessons },
              { label: 'Разделов', val: sec.sections },
              { label: 'Срок',     val: sec.duration },
            ].map((s, i, arr) => (
              <div key={s.label} style={{ flex: 1, paddingLeft: i === 0 ? 0 : 14, paddingRight: 14, borderLeft: i > 0 ? `1px solid ${v.hairline}` : 'none' }}>
                <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: '0.16em', color: v.muted, textTransform: 'uppercase', marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 18, fontWeight: 500, color: v.ink }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* right CTA panel */}
        <div style={{ padding: '24px 22px 20px', borderLeft: `1px solid ${v.hairline}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: v.rightBg }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 10px', color: v.tagFg, border: `1px solid ${v.tagBorder}`, fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: v.tagFg, flexShrink: 0 }} />
              {statusBadgeLabel(sec)}
            </div>

            {isOpen && (
              <div style={{ marginTop: 22 }}>
                <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: v.muted, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 }}>Прогресс</div>
                <div style={{ width: '100%', height: 2, background: 'rgba(184,146,58,0.15)' }}>
                  <div style={{ height: 2, width: '36%', background: C.accent }} />
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: v.muted, marginTop: 5 }}>изучение в процессе</div>
              </div>
            )}

            {sec.accessState === 'purchase' && (
              <div style={{ marginTop: 22 }}>
                <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: v.muted, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 5 }}>Стоимость</div>
                <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 24, color: v.ink, fontWeight: 500 }}>{sec.price}</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: v.muted, marginTop: 3 }}>навсегда · без подписки</div>
              </div>
            )}

            {isSoon && (
              <div style={{ marginTop: 22 }}>
                <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: v.muted, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 5 }}>Релиз</div>
                <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 15, color: v.ink, fontWeight: 500, textTransform: 'uppercase' }}>осень 2026</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: v.muted, marginTop: 3 }}>программа разрабатывается</div>
              </div>
            )}
          </div>

          <button onClick={() => handleCta(sec)} disabled={isSoon || isLocked} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', minHeight: 46, padding: '12px 16px', background: v.ctaBg, color: v.ctaColor, border: `1px solid ${v.ctaBorder}`, fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', cursor: (isSoon || isLocked) ? 'default' : 'pointer', opacity: (isSoon || isLocked) ? 0.65 : 1 }}>
            {ctaLabel(sec)}
          </button>
        </div>
      </article>
    );
  };

  // ── Mobile card render ───────────────────────────────────────────
  const renderMobileCard = (sec) => {
    const v      = getVisuals(sec.accessState);
    const isOpen = sec.accessState === 'open';
    const isSoon = sec.accessState === 'soon';
    const isLocked = sec.accessState === 'locked';
    return (
      <article key={sec.id} style={{
        background: v.surface, backgroundImage: v.grad,
        border: `1px solid ${C.border}`, borderTop: v.borderTop,
        boxShadow: isOpen ? '0 20px 50px -20px rgba(0,0,0,0.5)' : 'none',
        overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: `1px solid ${v.hairline}` }}>
          <div style={{ width: 90, position: 'relative', background: v.kanjiBg, borderRight: `1px solid ${v.hairline}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg viewBox="0 0 100 100" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.3 }}>
              <circle cx="50" cy="50" r="46" fill="none" stroke={v.kanjiRing} strokeWidth="0.3" />
            </svg>
            <div style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 68, lineHeight: 0.85, color: v.kanjiColor, position: 'relative' }}>{sec.kanji}</div>
          </div>
          <div style={{ flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: '0.18em', color: v.muted }}>{sec.num} / {String(allSecs.length).padStart(2, '0')}</span>
              {sec.nameJa && <span style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 11, color: v.muted }}>· {sec.nameJa}</span>}
            </div>
            <h3 style={{ margin: 0, fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 24, letterSpacing: '0.04em', color: v.ink, fontWeight: 500, lineHeight: 0.95, textTransform: 'uppercase' }}>{sec.label}</h3>
            {sec.nameRomaji && (
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: v.muted }}>{sec.nameRomaji} · {sec.program}</div>
            )}
          </div>
        </div>
        <div style={{ padding: '14px 16px 16px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', color: v.tagFg, border: `1px solid ${v.tagBorder}`, fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', fontWeight: 600, marginBottom: 10 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: v.tagFg }} />
            {statusBadgeLabel(sec)}
          </div>
          <p style={{ margin: '0 0 12px', fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 13, color: v.ink2, lineHeight: 1.55 }}>{sec.desc}</p>
          <div style={{ display: 'flex', padding: '10px 0', borderTop: `1px solid ${v.hairline}`, borderBottom: `1px solid ${v.hairline}`, marginBottom: 14 }}>
            {[
              { label: 'Техник', val: sec.techniques },
              { label: 'Видео',  val: sec.lessons },
              { label: 'Мес.',   val: (sec.duration || '').replace(/\D/g, '') },
            ].map((s, i) => (
              <div key={s.label} style={{ flex: 1, paddingLeft: i === 0 ? 0 : 12, borderLeft: i > 0 ? `1px solid ${v.hairline}` : 'none' }}>
                <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: v.muted, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 15, color: v.ink, fontWeight: 500 }}>{s.val}</div>
              </div>
            ))}
          </div>
          {sec.accessState === 'purchase' && (
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: v.muted, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Стоимость</span>
              <span style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 24, color: v.ink, fontWeight: 500 }}>{sec.price}</span>
            </div>
          )}
          {isSoon && (
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: v.muted, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Релиз</span>
              <span style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 13, color: v.ink, fontWeight: 500, textTransform: 'uppercase' }}>осень 2026</span>
            </div>
          )}
          <button onClick={() => handleCta(sec)} disabled={isSoon || isLocked} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', minHeight: 48, padding: '13px 16px', background: v.ctaBg, color: v.ctaColor, border: `1px solid ${v.ctaBorder}`, fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', cursor: (isSoon || isLocked) ? 'default' : 'pointer', opacity: (isSoon || isLocked) ? 0.65 : 1 }}>
            {ctaLabel(sec)}
          </button>
        </div>
      </article>
    );
  };

  return (
    <div>
      {/* ── Top bar with breadcrumb + search ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginTop: isMobile ? -16 : -32, marginLeft: isMobile ? -16 : -36, marginRight: isMobile ? -16 : -36,
        padding: isMobile ? '12px 16px' : '14px 36px',
        borderBottom: `1px solid ${C.border}`, background: C.surface,
        marginBottom: isMobile ? 20 : 36, gap: 12, flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 13, color: C.muted, letterSpacing: '0.18em' }}>技 · 大東流</span>
          <span style={{ color: C.hairline2, fontSize: 13 }}>/</span>
          <span style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 11, letterSpacing: '0.18em', color: C.ink, fontWeight: 600 }}>БАЗА ТЕХНИК</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, letterSpacing: '0.12em' }}>
            {openCount} / {allSecs.length} РАЗДЕЛОВ ДОСТУПНО
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.bg, border: `1px solid ${C.border}`, padding: '7px 12px', width: isMobile ? '100%' : 256 }}>
            <span style={{ color: C.muted, fontSize: 13, flexShrink: 0 }}>⌕</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск техники или раздела…" style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: C.ink }} />
          </div>
        </div>
      </div>

      {/* ── Desktop hero ── */}
      {!isMobile && (
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24, marginBottom: 16 }}>
            <div style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 160, lineHeight: 0.85, color: C.accent, opacity: 0.1, flexShrink: 0, marginLeft: -8, marginBottom: -8 }}>技</div>
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <div style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.28em', color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>03 · БАЗА ТЕХНИК · ПРОГРАММЫ ШКОЛЫ</div>
              <h1 style={{ margin: 0, fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 60, lineHeight: 0.9, letterSpacing: '0.04em', color: C.ink, fontWeight: 400, textTransform: 'uppercase' }}>База техник</h1>
              <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 15, color: C.muted, marginTop: 14, maxWidth: 540, lineHeight: 1.55 }}>
                Полное собрание программ Дайто-рю — от ученических кю до старших данов. Каждый раздел открывается отдельно.
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, paddingBottom: 8, flexShrink: 0 }}>
              <span style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 11, color: C.muted, letterSpacing: '0.22em' }}>進度</span>
              <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 42, color: C.accent, lineHeight: 1, fontWeight: 500 }}>
                — <span style={{ fontSize: 24, color: C.ink2 }}>/ {totalTechs}</span>
              </div>
              <span style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.18em', color: C.muted, textTransform: 'uppercase' }}>техник всего</span>
            </div>
          </div>
          <svg viewBox="0 0 800 20" style={{ width: '100%', height: 20, opacity: 0.22, display: 'block', marginBottom: 36 }}>
            <path d="M0,10 Q200,4 400,10 Q600,16 800,10" stroke={C.ink2} strokeWidth="1.2" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* ── Mobile hero ── */}
      {isMobile && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginBottom: 20 }}>
          <span style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 80, lineHeight: 0.85, color: C.accent, opacity: 0.13, flexShrink: 0 }}>技</span>
          <div style={{ paddingBottom: 4 }}>
            <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: '0.22em', color: C.muted, textTransform: 'uppercase', marginBottom: 8 }}>03 · БАЗА ТЕХНИК</div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 36, color: C.ink, fontWeight: 400, textTransform: 'uppercase', lineHeight: 0.95 }}>База<br />техник</h1>
          </div>
        </div>
      )}

      {/* ── Section cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 16 : 20 }}>
        {filtered.map(sec => isMobile ? renderMobileCard(sec) : renderCard(sec))}
      </div>

      {/* ── Future strip ── */}
      <div style={{ marginTop: isMobile ? 20 : 28, padding: isMobile ? '18px 16px' : '22px 28px', border: `1px dashed ${C.hairline2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: 'transparent', flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: isMobile ? 22 : 28, color: C.hairline2, lineHeight: 1 }}>四 五 六 …</span>
          <div>
            <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: isMobile ? 12 : 13, letterSpacing: '0.16em', color: C.ink2, textTransform: 'uppercase', fontWeight: 500 }}>Ёнкаджо · Гокаджо · Роккаджо</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: C.muted, marginTop: 3 }}>Старшие даны — программа разрабатывается</div>
          </div>
        </div>
        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, letterSpacing: '0.2em', textTransform: 'uppercase', flexShrink: 0 }}>2026 — 2028</span>
      </div>

      {/* ── Выбор покупки Иккаджо (раздел / весь сразу) ── */}
      {ikkajoChoiceOpen && (
        <IkkajoChoiceModal
          products={allProducts}
          onClose={() => setIkkajoChoiceOpen(false)}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

// ── Модалка выбора покупки Иккаджо (отдельный раздел / весь сразу) ──
function IkkajoChoiceModal({ products, onClose, isMobile }) {
  const [buyingId, setBuyingId] = useState(null);
  const [error,    setError]    = useState('');

  const sectionProducts = IKKAJO_SECTIONS
    .map(key => (products ?? []).find(p => p.type === 'section' && p.reference === key))
    .filter(Boolean);
  const fullProduct = (products ?? []).find(p => p.type === 'section' && p.reference === 'ikkajo');

  const handleBuy = async (product) => {
    if (!product || buyingId) return;
    setBuyingId(product.id);
    setError('');
    try {
      const res = await fetch('/api/yookassa/create-payment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Ошибка при создании платежа'); setBuyingId(null); return; }
      if (data.payment_id) { try { sessionStorage.setItem('yk_pending_pid', data.payment_id); } catch {} }
      window.location.href = data.confirmation_url;
    } catch {
      setError('Ошибка соединения');
      setBuyingId(null);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.surface, border: `1px solid ${C.border}`,
        width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.28)',
      }}>
        {/* Header */}
        <div style={{ padding: isMobile ? '24px 20px 16px' : '32px 36px 20px', borderBottom: `1px solid ${C.border}`, position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: isMobile ? 16 : 24, right: isMobile ? 16 : 24, background: 'none', border: 'none', color: C.muted, fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4, minWidth: 32, minHeight: 32 }}>✕</button>
          <div style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 13, color: C.accent, letterSpacing: '0.18em', marginBottom: 8 }}>一教</div>
          <div style={{ fontFamily: "var(--font-cormorant),'Cormorant Garamond',serif", fontSize: isMobile ? 30 : 38, color: C.ink, fontWeight: 500, letterSpacing: '0.03em', lineHeight: 1, marginBottom: 10 }}>Иккаджо</div>
          <div style={{ fontFamily: "var(--font-cormorant),'Cormorant Garamond',serif", fontSize: 15, color: C.muted, lineHeight: 1.55, maxWidth: 440 }}>
            Иккаджо — базовый раздел Дайто-рю Айкидзюдзюцу, включающий ключевые формы работы из разных положений и ситуаций.
          </div>
        </div>

        {/* Sections list */}
        <div style={{ padding: isMobile ? '16px 20px 20px' : '20px 36px 28px' }}>
          <div style={{ fontFamily: "var(--font-mono),'JetBrains Mono',monospace", fontSize: 11, color: C.muted, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 12 }}>
            Купить раздел отдельно
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: C.border, marginBottom: 24 }}>
            {sectionProducts.map(p => {
              const isBuying = buyingId === p.id;
              return (
                <div key={p.reference} style={{
                  display: 'flex', alignItems: 'center', gap: 14, flexWrap: isMobile ? 'wrap' : 'nowrap',
                  padding: isMobile ? '14px 14px' : '16px 18px', background: C.surface,
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "var(--font-cormorant),'Cormorant Garamond',serif", fontSize: 18, color: C.ink, fontWeight: 500 }}>{IKKAJO_SECTION_LABELS[p.reference] || p.title}</div>
                    {p.description && <div style={{ fontFamily: "var(--font-mono),'JetBrains Mono',monospace", fontSize: 12, color: C.muted, marginTop: 2 }}>{p.description}</div>}
                  </div>
                  <div style={{ fontFamily: "var(--font-cormorant),'Cormorant Garamond',serif", fontSize: 17, color: C.ink, fontWeight: 500, flexShrink: 0 }}>{p.price?.toLocaleString('ru-RU')} ₽</div>
                  <button
                    onClick={() => handleBuy(p)} disabled={!!buyingId}
                    style={{
                      flexShrink: 0, padding: '9px 18px', minHeight: 38,
                      background: isBuying ? C.muted : 'transparent', color: isBuying ? '#fff' : C.ink,
                      border: `1px solid ${C.ink}`, cursor: buyingId ? 'default' : 'pointer',
                      fontFamily: "var(--font-mono),'JetBrains Mono',monospace", fontSize: 11,
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                    }}>
                    {isBuying ? '…' : 'Купить'}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Купить весь Иккаджо */}
          {fullProduct && (
            <div style={{ background: '#15120e', padding: isMobile ? '20px 18px' : '24px 28px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -10, right: -6, fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 90, color: '#b8923a', opacity: 0.12, lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>一</div>
              <div style={{ position: 'relative' }}>
                <div style={{ fontFamily: "var(--font-mono),'JetBrains Mono',monospace", fontSize: 11, color: '#b8923a', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>Купить весь раздел Иккаджо</div>
                <div style={{ fontFamily: "var(--font-cormorant),'Cormorant Garamond',serif", fontSize: 14, color: '#c2b59c', lineHeight: 1.6, marginBottom: 16 }}>
                  Включает: {IKKAJO_SECTIONS.map(k => IKKAJO_SECTION_LABELS[k]).join(', ')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ fontFamily: "var(--font-cormorant),'Cormorant Garamond',serif", fontSize: 28, color: '#ede5d3', fontWeight: 500 }}>{fullProduct.price?.toLocaleString('ru-RU')} ₽</div>
                  <button
                    onClick={() => handleBuy(fullProduct)} disabled={!!buyingId}
                    style={{
                      padding: '12px 24px', minHeight: 44,
                      background: buyingId === fullProduct.id ? '#7a6c52' : '#b8923a', color: '#15120e',
                      border: 'none', cursor: buyingId ? 'default' : 'pointer',
                      fontFamily: "var(--font-mono),'JetBrains Mono',monospace", fontSize: 12, fontWeight: 600,
                      letterSpacing: '0.14em', textTransform: 'uppercase',
                    }}>
                    {buyingId === fullProduct.id ? 'Переход к оплате…' : 'Купить весь Иккаджо'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div style={{ marginTop: 16, fontFamily: "var(--font-mono),'JetBrains Mono',monospace", fontSize: 12, color: '#a03030' }}>{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Вкладка: Профиль ──────────────────────────────────────────────
// userAccess и accessLoading приходят из Dashboard (единственный useUserAccessRows).
// Это исключает двойной fetch и гарантирует единый источник данных по всему Dashboard.
function TabProfile({ user: u, userAccess, accessLoading, isMobile, onLogout }) {
  const [sub, setSub] = useState('exams');
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
    { id: 'info',     label: 'Обо мне',   short: 'Обо мне'  },
    { id: 'exams',    label: 'Экзамены',  short: 'Экзамены' },
    { id: 'access',   label: 'Мой доступ',short: 'Доступ'   },
    { id: 'payments', label: 'Оплаты',    short: 'Оплаты'   },
    { id: 'unlock',   label: 'Купить',    short: 'Купить'   },
  ];

  // Level kanji
  const LEVEL_KANJI_FULL = { '6kyu':'六級', '5kyu':'五級', '4kyu':'四級', '3kyu':'三級', '2kyu':'二級', '1kyu':'一級', '1dan':'初段', '2dan':'二段', '3dan':'三段' };
  const LEVEL_KANJI_SHORT = { '6kyu':'六', '5kyu':'五', '4kyu':'四', '3kyu':'三', '2kyu':'二', '1kyu':'一', '1dan':'初', '2dan':'二', '3dan':'三' };
  const curKanji = LEVEL_KANJI_SHORT[usr.level] || '';

  // Progress track
  const TRACK = ['6kyu','5kyu','4kyu','3kyu','2kyu','1kyu','1dan'];
  const curIdx = TRACK.indexOf(usr.level);

  // Level card (reused on desktop and mobile)
  const renderLevelCard = (compact) => (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: compact ? '16px' : '22px', position: 'relative', overflow: 'hidden', width: '100%', boxSizing: 'border-box' }}>
      <div style={{ position: 'absolute', top: compact ? 8 : 12, right: compact ? 10 : 14, fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: compact ? 48 : 56, color: C.goldSoft, opacity: 0.45, lineHeight: 1 }}>{curKanji}</div>
      <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: compact ? 6 : 8 }}>Текущий уровень</div>
      <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: compact ? 38 : 52, color: C.ink, letterSpacing: '0.03em', lineHeight: 1, marginBottom: 4 }}>
        {curLv?.label?.toUpperCase() || '—'}
      </div>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: C.muted, marginBottom: compact ? 12 : 16 }}>
        {curLv?.program === 'ikkajo' ? 'Иккаджо · Татиай' : curLv?.label || ''}
      </div>
      <div style={{ height: 1, background: C.border, marginBottom: compact ? 10 : 14 }} />
      <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: compact ? 8 : 10 }}>Путь к Сёдан</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginBottom: 6 }}>
        {TRACK.map((id, i) => {
          const filled = i <= curIdx;
          const isCur  = i === curIdx;
          return (
            <div key={id} style={{ flex: 1, minWidth: 0, height: 4, background: filled ? C.accent : C.bg2, position: 'relative' }}>
              {/* marker: centered on the segment, not sticking out right */}
              {isCur && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 10, height: 10, borderRadius: '50%', background: C.accent, zIndex: 1 }} />}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, letterSpacing: '0.1em' }}>
        <span>6 КЮ</span><span>СЁДАН</span>
      </div>
    </div>
  );

  // Format joinedAt → "МАР. 2026" (short, avoids raw ISO string overflow)
  const joinedStr = usr.joinedAt
    ? new Date(usr.joinedAt).toLocaleDateString('ru-RU', { year: 'numeric', month: 'short' }).toUpperCase().replace('.', '')
    : null;

  return (
    <div>
      {/* ── Top bar ── */}
      {isMobile ? (
        /* Mobile: no negative margins, fits within 16px parent padding */
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          paddingBottom: 12, marginBottom: 20,
          borderBottom: `1px solid ${C.border}`,
          gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 11, color: C.muted }}>個人</span>
            <span style={{ color: C.hairline2, fontSize: 13 }}>/</span>
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: '0.14em', color: C.muted, textTransform: 'uppercase' }}>Профиль</span>
          </div>
          {joinedStr && (
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0 }}>
              С {joinedStr}
            </span>
          )}
        </div>
      ) : (
        /* Desktop: edge-to-edge with negative margins */
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: -32, marginLeft: -36, marginRight: -36,
          padding: '14px 36px',
          borderBottom: `1px solid ${C.border}`, background: C.surface,
          marginBottom: 36, gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 13, color: C.muted, letterSpacing: '0.15em' }}>個人</span>
            <span style={{ color: C.hairline2, fontSize: 13 }}>/</span>
            <span style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 11, letterSpacing: '0.18em', color: C.ink, fontWeight: 600 }}>ЛИЧНЫЙ КАБИНЕТ</span>
          </div>
          {joinedStr && (
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              В ШКОЛЕ С {joinedStr}
            </span>
          )}
        </div>
      )}

      {/* ── Desktop hero: 3-col grid ── */}
      {!isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 260px', gap: 28, marginBottom: 36 }}>
          {/* portrait placeholder */}
          <div style={{ background: C.ink, minHeight: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(45deg, #1a1510 0, #1a1510 2px, #0f0c08 2px, #0f0c08 10px)', opacity: 0.7 }} />
            <div style={{ position: 'relative', zIndex: 1, width: 56, height: 56, borderRadius: '50%', border: `1px solid rgba(200,169,74,0.4)`, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 24, color: C.goldLight }}>
              {(usr.name || '?')[0].toUpperCase()}
            </div>
            <div style={{ position: 'relative', zIndex: 1, fontFamily: "var(--font-mono), monospace", fontSize: 11, color: 'rgba(200,169,74,0.45)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Портрет студента</div>
          </div>

          {/* info */}
          <div>
            <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: '0.28em', color: C.muted, textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", color: C.gold, fontSize: 13 }}>04</span>
              Студент додзё
            </div>
            <h2 style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 44, color: C.ink, letterSpacing: '0.04em', fontWeight: 400, lineHeight: 0.92, textTransform: 'uppercase', marginBottom: 12 }}>
              {(usr.name || 'Студент').toUpperCase()}
            </h2>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.muted, marginBottom: 18 }}>
              {usr.email || ''}{usr.city ? ` · ${usr.city}` : ''}
            </div>
            <svg viewBox="0 0 260 18" style={{ width: 260, height: 18, opacity: 0.25, display: 'block', marginBottom: 18 }}>
              <path d="M0,9 Q65,4 130,9 Q195,14 260,9" stroke={C.ink2} strokeWidth="1" fill="none" strokeLinecap="round" />
            </svg>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, lineHeight: 1.75, color: C.ink2, maxWidth: 520, margin: 0 }}>
              {usr.experience || 'Профиль студента. Расскажите о вашем опыте айкидо и целях.'}
            </p>
          </div>

          {/* level card */}
          {renderLevelCard(false)}
        </div>
      )}

      {/* ── Mobile hero ── */}
      {isMobile && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: C.ink, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 24, color: C.goldLight }}>
                {(usr.name || '?')[0].toUpperCase()}
              </div>
              <span style={{ position: 'absolute', bottom: -4, right: -4, width: 22, height: 22, borderRadius: '50%', background: C.accent, color: '#fff', fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {curKanji}
              </span>
            </div>
            <div>
              <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 24, color: C.ink, fontWeight: 400, textTransform: 'uppercase', lineHeight: 0.95 }}>
                {(usr.name || 'Студент').toUpperCase()}
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: C.muted, marginTop: 4 }}>{usr.email}</div>
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>{renderLevelCard(true)}</div>
        </>
      )}

      {/* ── Sub-tabs ── */}
      <div className="chips-scroll" style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSub(t.id)}
            style={{
              padding: isMobile ? '12px 12px' : '13px 20px',
              background: 'none', border: 'none',
              borderBottom: `2px solid ${sub === t.id ? C.accent : 'transparent'}`,
              color: sub === t.id ? C.ink : C.muted,
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: 'pointer', fontWeight: sub === t.id ? 600 : 400,
              marginBottom: -1, whiteSpace: 'nowrap', minHeight: 48,
              WebkitTapHighlightColor: 'transparent',
            }}>{isMobile ? t.short : t.label}</button>
        ))}
      </div>

      {/* ── Info tab ── */}
      {sub === 'info' && (
        <div style={{ border: `1px solid ${C.border}`, borderTop: 'none', background: C.surface }}>
          {[
            { label: 'Уровень (подтверждён)',     value: curLv?.label,    show: !!curLv },
            { label: 'Уровень (при регистрации)', value: selfLvLabel,     show: !!selfLvLabel && selfLvLabel !== curLv?.label },
            { label: 'Имя сэнсэя',               value: usr.senseiName || 'Станислав Копин', show: true },
          ].filter(r => r.show).map(row => (
            <div key={row.label} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '200px 1fr', padding: '14px 18px', borderBottom: `1px solid ${C.border}`, alignItems: 'start', gap: isMobile ? 2 : 0 }}>
              <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{row.label}</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.ink }}>{row.value}</span>
            </div>
          ))}
          {usr.experience && (
            <div style={{ padding: '18px' }}>
              <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>Об опыте</div>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.ink2, lineHeight: 1.85, borderLeft: `2px solid ${C.goldBorder}`, paddingLeft: 14, margin: 0 }}>{usr.experience}</p>
            </div>
          )}
          {isMobile && (
            <div style={{ padding: '14px 16px', borderTop: `1px solid ${C.border}` }}>
              <button onClick={onLogout} style={{ width: '100%', padding: '10px', background: 'none', border: `1px solid ${C.border}`, color: C.muted, fontSize: 13, cursor: 'pointer', minHeight: 44, fontFamily: "var(--font-mono), monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Выйти из аккаунта
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Exams tab ── */}
      {sub === 'exams' && (
        <div>
          {examsLoading && (
            <div style={{ padding: '24px 18px', color: C.muted, fontSize: 13, background: C.surface, border: `1px solid ${C.border}`, borderTop: 'none', fontFamily: "var(--font-mono), monospace" }}>Загрузка…</div>
          )}
          {!examsLoading && grouped.length === 0 && (
            <div style={{ padding: '24px 18px', color: C.muted, fontSize: 13, background: C.surface, border: `1px solid ${C.border}`, borderTop: 'none', fontFamily: "'Cormorant Garamond', serif" }}>Экзаменов пока нет</div>
          )}
          {!examsLoading && grouped.length > 0 && (
            <>
              {!isMobile && (
                <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '16px 0 12px' }}>
                  ИСТОРИЯ ЭКЗАМЕНОВ
                </div>
              )}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: isMobile ? `1px solid ${C.border}` : 'none' }}>
                {grouped.map((g, gi) => {
                  const lv     = LEVELS.find(l => l.id === g.level);
                  const passed  = g.attempts.some(a => a.status === 'approved');
                  const pending = !passed && g.attempts.some(a => a.status === 'pending');
                  const statusLabel = passed ? 'СДАН' : pending ? 'ПРЕДСТОИТ' : 'НЕ СДАН';
                  const statusColor = passed ? C.success : pending ? C.accent : C.danger;
                  const bestAttempt = g.attempts.find(a => a.status === 'approved')
                    || g.attempts.find(a => a.status === 'pending')
                    || g.attempts[0];
                  const kanjiShort = LEVEL_KANJI_SHORT[g.level] || '';
                  const kanjiFull  = LEVEL_KANJI_FULL[g.level]  || '';

                  if (isMobile) {
                    return (
                      <div key={g.level} style={{ padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: gi < grouped.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                        <span style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 24, color: C.accent, opacity: 0.7, minWidth: 26, textAlign: 'center' }}>{kanjiShort}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 15, letterSpacing: '0.04em', color: C.ink, fontWeight: 500 }}>{lv?.label?.toUpperCase()}</div>
                          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: C.muted, marginTop: 1 }}>
                            {bestAttempt?.comment || ''}{bestAttempt?.date ? ` · ${bestAttempt.date}` : ''}
                          </div>
                        </div>
                        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: statusColor, padding: '3px 8px', border: `1px solid ${statusColor}`, fontWeight: 600, flexShrink: 0 }}>{statusLabel}</span>
                      </div>
                    );
                  }

                  return (
                    <div key={g.level} style={{ display: 'grid', gridTemplateColumns: '140px 110px 1fr 120px', padding: '17px 22px', alignItems: 'center', gap: 16, borderBottom: gi < grouped.length - 1 ? `1px solid ${C.hairline2}` : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 18, color: C.accent, opacity: 0.7 }}>{kanjiFull}</span>
                        <span style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 15, color: C.ink, letterSpacing: '0.04em', fontWeight: 500 }}>{lv?.label?.toUpperCase()}</span>
                      </div>
                      <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, letterSpacing: '0.06em' }}>{bestAttempt?.date || '—'}</span>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.ink2 }}>{bestAttempt?.comment || '—'}</span>
                      <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: statusColor, padding: '4px 10px', border: `1px solid ${statusColor}`, textAlign: 'center', fontWeight: 600 }}>{statusLabel}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Payments tab ── */}
      {sub === 'payments' && (
        <div style={{ border: `1px solid ${C.border}`, borderTop: 'none' }}>
          {paysLoading && (
            <div style={{ padding: '24px 18px', color: C.muted, fontSize: 13, background: C.surface, fontFamily: "var(--font-mono), monospace" }}>Загрузка…</div>
          )}
          {!paysLoading && userPays.filter(p => !HIDDEN_MONTH_IDS.includes(p.reference)).length === 0 && (
            <div style={{ padding: '24px 18px', color: C.muted, fontSize: 13, background: C.surface, fontFamily: "'Cormorant Garamond', serif" }}>Оплат пока нет</div>
          )}
          {!paysLoading && userPays.filter(p => !HIDDEN_MONTH_IDS.includes(p.reference)).map(p => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: isMobile ? 'auto 1fr auto' : '90px 1fr 100px', padding: '13px 18px', background: C.surface, borderBottom: `1px solid ${C.border}`, alignItems: 'center', gap: 8 }}>
              <span style={{ color: C.muted, fontFamily: "var(--font-mono), monospace", fontSize: 11, whiteSpace: 'nowrap' }}>{p.date}</span>
              <span style={{ color: C.ink, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.desc}</span>
              <span style={{ color: C.ink, fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 15, textAlign: 'right', whiteSpace: 'nowrap' }}>{p.amount}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── MyAccess tab ── */}
      {sub === 'access' && (
        <TabMyAccess userAccess={userAccess} loading={accessLoading} isMobile={isMobile} />
      )}

      {/* ── UnlockAccess tab ── */}
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
// Месяцы скрытые из публичного списка (sortOrder < 6 — январь–май)
const HIDDEN_MONTH_IDS = ['jan', 'feb', 'mar', 'apr', 'may'];

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
        <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Месяцы обучения</div>
      </div>
      {ALL_MONTHS.filter(m => !HIDDEN_MONTH_IDS.includes(m)).map(m => {
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
        <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Иккаджо</div>
      </div>
      {fullIkkajo ? (
        <div style={{ ...rowStyle }}>
          {tick(true)}
          <span style={{ color: C.dark }}>Весь Иккаджо</span>
          <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.accent, background: `${C.accent}10`, border: `1px solid ${C.accent}30`, padding: '2px 8px', marginLeft: 'auto', letterSpacing: '0.1em', textTransform: 'uppercase' }}>полный доступ</span>
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
        <div style={{ padding: '20px 16px', textAlign: 'center', color: C.muted, fontSize: 13, borderTop: `1px solid ${C.border}` }}>
          Нет активных доступов.{' '}
          <button onClick={() => {}} style={{ color: C.gold, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, textDecoration: 'underline' }}>
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
  const { months } = useMonths();
  const [buyingId, setBuyingId] = useState(null); // id продукта в процессе оплаты
  const [buyError, setBuyError] = useState('');
  const ua = userAccess || [];

  // Индекс month.description по id месяца (совпадает с product.reference)
  const monthDescByRef = {};
  (months ?? []).forEach(m => { monthDescByRef[m.id] = m.description; });

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

      // Сохраняем provider_payment_id в sessionStorage — success-страница прочитает его
      if (data.payment_id) {
        try { sessionStorage.setItem('yk_pending_pid', data.payment_id); } catch {}
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

  const monthProducts   = products.filter(p => p.type === 'month' && !HIDDEN_MONTH_IDS.includes(p.reference));
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
            marginTop: 12, padding: '9px 18px', fontSize: 13,
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
  const labelStyle   = { fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: isMobile ? 17 : 20, fontWeight: 400, color: C.ink, letterSpacing: '0.04em' };

  return (
    <div style={{ border: `1px solid ${C.border}`, borderTop: 'none', background: C.surface, padding: isMobile ? '16px' : '20px 24px' }}>

      {/* Блок 1: Месяцы */}
      <div style={sectionStyle}>
        <div style={headerStyle}>
          <span style={labelStyle}>Месяцы обучения</span>
          <span style={{ fontSize: 13, color: C.muted, marginLeft: 12 }}>1 990 ₽ / месяц</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8 }}>
          {monthProducts.map(p => {
            const has = hasMonthAccess(ua, p.reference);
            return (
              <div key={p.id} style={{ padding: '14px', background: has ? `${C.success}10` : C.surface2, border: `1px solid ${has ? C.success + '40' : C.border}` }}>
                <div style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 15, fontWeight: 500, color: C.ink, marginBottom: 4 }}>{p.title}</div>
                <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, minHeight: 32 }}>{monthDescByRef[p.reference] || p.description}</div>
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
          <span style={{ fontSize: 13, color: C.muted, marginLeft: 12 }}>3 000 ₽ / раздел</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 8 }}>
          {sectionProducts.map(p => {
            const has = hasFull || hasIkkajoSectionAccess(ua, p.reference);
            return (
              <div key={p.id} style={{ padding: '14px', background: has ? `${C.success}10` : C.surface2, border: `1px solid ${has ? C.success + '40' : C.border}` }}>
                <div style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 15, fontWeight: 500, color: C.ink, marginBottom: 4 }}>{p.title}</div>
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
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.gold, marginLeft: 12, background: `${C.gold}15`, border: `1px solid ${C.goldBorder}`, padding: '2px 10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Выгодно</span>
          </div>
          <div style={{ padding: '18px', background: hasFull ? `${C.success}10` : C.surface2, border: `1px solid ${hasFull ? C.success + '40' : C.goldBorder}` }}>
            <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 18, fontWeight: 400, color: C.ink, marginBottom: 8, letterSpacing: '0.04em' }}>{ikkajoFull.title}</div>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 12 }}>{ikkajoFull.description}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
              {IKKAJO_SECTIONS.map(s => (
                <span key={s} style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, background: C.surface2, border: `1px solid ${C.border}`, padding: '3px 10px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
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
