'use client';

import { useState } from 'react';
import { C, hasLevel, levelIndex } from '@/lib/utils';
import { USER, LEVELS, SELF_LEVELS, EXAMS, PAYS } from '@/data/users';
import { DB_SECTIONS } from '@/data/techniques';
import { MONTHS, MONTH_LESSONS } from '@/data/months';

const TABS = [
  { id: 'months',   label: 'Месяцы 2026'    },
  { id: 'database', label: 'База техник'     },
  { id: 'profile',  label: 'Личный кабинет'  },
];

export default function Dashboard({ nav, watched, user: userProp, onLogout }) {
  const [tab, setTab]     = useState('months');
  const [modal, setModal] = useState(null);
  const u     = userProp || USER;
  const curLv = LEVELS.find(l => l.id === u.level);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Сайдбар ── */}
      <aside style={{ width: 240, background: C.white, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '22px 20px 18px' }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 28, color: C.gold, lineHeight: 1 }}>合</div>
          <div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, fontWeight: 600, letterSpacing: 3, color: C.dark }}>ONLINE DOJO</div>
            <div style={{ fontSize: 9, color: '#b0a080', marginTop: 2 }}>Дайто-рю Айкидзюдзюцу</div>
          </div>
        </div>

        <div style={{ height: 1, background: '#ede8e0' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${C.goldBorder}`, background: C.light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: C.gold, flexShrink: 0 }}>
            {u.name[0]}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 500, color: C.dark }}>{u.name}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 1 }}>{u.email}</div>
          </div>
        </div>

        {curLv && (
          <div style={{ margin: '0 14px 12px', padding: '10px 12px', background: C.light, border: `1px solid ${C.goldBorder}` }}>
            <div style={{ fontSize: 9, color: '#b0a080', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 3 }}>Текущий уровень</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 600, color: C.dark }}>{curLv.label}</div>
            {curLv.program && (
              <div style={{ fontSize: 10, color: C.gold, marginTop: 2 }}>
                Программа: {DB_SECTIONS.find(d => d.id === curLv.program)?.label}
              </div>
            )}
          </div>
        )}

        <div style={{ height: 1, background: '#ede8e0' }} />

        <nav style={{ flex: 1, paddingTop: 6 }}>
          {TABS.map(({ id, label }) => (
            <button key={id} onClick={() => setTab(id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', background: 'none', border: 'none', color: tab === id ? C.dark : C.muted, fontSize: 12, textAlign: 'left', cursor: 'pointer', fontWeight: tab === id ? 600 : 400 }}>
              {tab === id && <span style={{ width: 4, height: 4, borderRadius: '50%', background: C.gold, flexShrink: 0 }} />}
              {label}
            </button>
          ))}
        </nav>

        <div style={{ height: 1, background: '#ede8e0' }} />
        <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* Кнопка видна только для роли admin — в будущем проверять через Supabase */}
          <a href="/admin"
            style={{ display: 'block', padding: '7px 12px', background: 'none', border: `1px solid #c8a84a`, color: '#8B6914', fontSize: 11, cursor: 'pointer', textAlign: 'left', textDecoration: 'none' }}>
            ⚙ Панель управления
          </a>
          <button onClick={onLogout} style={{ padding: '7px 12px', background: 'none', border: `1px solid ${C.border}`, color: '#bbb', fontSize: 11, cursor: 'pointer', textAlign: 'left' }}>
            Выйти
          </button>
        </div>
      </aside>

      {/* ── Контент ── */}
      <main style={{ flex: 1, background: C.bg, minHeight: '100vh' }}>
        <header style={{ display: 'flex', alignItems: 'center', padding: '16px 36px', background: C.white, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 10 }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: C.dark, flex: 1, letterSpacing: 0.5 }}>
            {TABS.find(t => t.id === tab)?.label}
          </span>
          {curLv && (
            <span style={{ padding: '3px 9px', background: C.light, border: `1px solid ${C.goldBorder}`, color: C.gold, fontSize: 11 }}>
              {curLv.label}
            </span>
          )}
        </header>

        <div style={{ padding: '32px 36px' }} key={tab} className="fade">
          {tab === 'months'   && <TabMonths   nav={nav} watched={watched} />}
          {tab === 'database' && <TabDatabase nav={nav} setModal={setModal} />}
          {tab === 'profile'  && <TabProfile user={u} />}
        </div>
      </main>

      {/* ── Модал покупки ── */}
      {modal && (
        <div onClick={() => setModal(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: C.white, border: `1px solid ${C.border}`, padding: '44px 40px', minWidth: 300, maxWidth: 380, textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.12)' }}>
            <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 48, color: C.gold, lineHeight: 1, marginBottom: 12 }}>{modal.kanji}</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 600, color: C.dark, marginBottom: 4 }}>{modal.label}</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>{modal.sublabel} · {modal.techniques} техник</div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 300, color: C.dark, marginBottom: 6 }}>{modal.price}</div>
            <p style={{ fontSize: 11, color: '#888', lineHeight: 1.7, marginBottom: 20 }}>Разовая оплата — постоянный доступ без ограничений.</p>
            <button style={{ width: '100%', padding: '10px', background: C.dark, color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer', marginBottom: 8 }}>
              Перейти к оплате
            </button>
            <button onClick={() => setModal(null)}
              style={{ width: '100%', padding: '8px', background: 'none', border: 'none', color: '#ccc', fontSize: 12, cursor: 'pointer' }}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Вкладка: Месяцы ──────────────────────────────────────────────────────────
function TabMonths({ nav, watched }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: `2px solid ${C.border}` }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: C.dark }}>Месяцы 2026</h2>
        <span style={{ fontSize: 12, color: C.muted }}>1 990 ₽ / месяц</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10 }}>
        {MONTHS.map(m => {
          const lessons = MONTH_LESSONS[m.id] || [];
          const watchedCount = lessons.filter(l => watched[l.id]).length;
          const hasProg = lessons.length > 0 && watchedCount > 0;
          return (
            <div key={m.id} style={{ padding: '18px 16px', minHeight: 200, background: m.current ? '#fff' : m.paid ? '#fdfcf8' : C.white, border: m.current ? '2px solid #c8a84a' : `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 6, boxShadow: m.current ? '0 2px 16px rgba(139,105,20,0.07)' : 'none' }}>
              {m.current && <div style={{ fontSize: 8, color: C.gold, background: '#faf0d8', border: '1px solid #e0c870', padding: '2px 7px', letterSpacing: 1, textTransform: 'uppercase', alignSelf: 'flex-start' }}>Текущий</div>}
              <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 20, color: '#e0e0e0', lineHeight: 1 }}>{m.kanji}</div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 600, color: C.dark }}>{m.label}</div>
              <div style={{ fontSize: 11, color: '#888', lineHeight: 1.6, flex: 1 }}>{m.desc}</div>
              {hasProg && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 9, color: C.muted }}>{watchedCount} / {lessons.length} уроков</span>
                  </div>
                  <div style={{ height: 2, background: '#e8e0d0', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${(watchedCount / lessons.length) * 100}%`, background: C.gold, borderRadius: 2 }} />
                  </div>
                </div>
              )}
              <div style={{ marginTop: 8 }}>
                {m.paid
                  ? <button onClick={() => nav.month(m.id)} style={{ padding: '7px 14px', background: C.dark, color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer' }}>Войти →</button>
                  : <button style={{ padding: '7px 14px', background: 'transparent', color: '#888', border: `1px solid ${C.border}`, fontSize: 12, cursor: 'pointer' }}>Оплатить — 1 990 ₽</button>
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Вкладка: База техник ──────────────────────────────────────────────────────
function TabDatabase({ nav, setModal }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: `2px solid ${C.border}` }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: C.dark }}>База техник</h2>
        <span style={{ fontSize: 12, color: C.muted }}>Разовая покупка · Постоянный доступ</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {DB_SECTIONS.map(sec => {
          const avail  = hasLevel(USER.level, sec.requiredLevel);
          const bought = USER.purchasedSections.includes(sec.id);
          return (
            <div key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '20px 18px', background: C.white, border: `1px solid ${C.border}`, borderTop: 'none', opacity: avail ? 1 : 0.4 }}>
              <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 32, minWidth: 40, textAlign: 'center', color: bought ? C.gold : avail ? C.dark : '#bbb', lineHeight: 1 }}>{sec.kanji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, color: C.dark }}>{sec.label}</span>
                  <span style={{ fontSize: 9, color: C.gold, background: C.light, border: `1px solid ${C.goldBorder}`, padding: '2px 7px', letterSpacing: 0.5 }}>{sec.sublabel}</span>
                </div>
                <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>{sec.desc}</div>
                <div style={{ fontSize: 10, color: '#bbb', marginTop: 4 }}>{sec.techniques} техник</div>
              </div>
              <div style={{ flexShrink: 0 }}>
                {bought
                  ? <button onClick={sec.id === 'ikkajo' ? nav.ikkajo : undefined} style={{ padding: '8px 16px', background: C.dark, color: '#fff', border: 'none', fontSize: 12, cursor: 'pointer' }}>Открыть →</button>
                  : avail
                    ? <button onClick={() => setModal(sec)} style={{ padding: '8px 16px', background: 'transparent', color: C.gold, border: '1px solid #c8a84a', fontSize: 12, cursor: 'pointer' }}>Купить — {sec.price}</button>
                    : <span style={{ fontSize: 11, color: '#ccc' }}>Нет доступа</span>
                }
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Вкладка: Профиль ──────────────────────────────────────────────────────────
function TabProfile({ user: u }) {
  const [sub, setSub] = useState('info');
  const usr   = u || USER;
  const curLv = LEVELS.find(l => l.id === usr.level);
  const selfLvLabel = SELF_LEVELS.find(l => l.id === usr.selfLevel)?.label;

  const grouped = [];
  const seen = {};
  EXAMS.forEach(ex => {
    if (!seen[ex.level]) { seen[ex.level] = []; grouped.push({ level: ex.level, attempts: seen[ex.level] }); }
    seen[ex.level].push(ex);
  });

  const SUB_TABS = [
    { id:'info',     label:'Обо мне'  },
    { id:'exams',    label:'Экзамены' },
    { id:'payments', label:'Оплаты'   },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: `2px solid ${C.border}` }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 600, color: C.dark }}>Личный кабинет</h2>
      </div>

      {/* Карточка пользователя */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 22px', background: C.white, border: `1px solid ${C.border}`, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', border: `2px solid ${C.goldBorder}`, background: C.light, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: C.gold, flexShrink:0 }}>{(usr.name||'?')[0]}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: C.dark }}>{usr.name}</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{usr.email}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap:'wrap' }}>
            {curLv && <span style={{ padding: '3px 10px', background: C.light, border: `1px solid ${C.goldBorder}`, color: C.gold, fontSize: 11, fontWeight: 600 }}>{curLv.label}</span>}
            {usr.joinedAt && <span style={{ fontSize: 10, color: C.muted }}>в школе с {usr.joinedAt}</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: '#bbb', letterSpacing: 0.5, marginBottom: 6 }}>Прогресс</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end' }}>
            {LEVELS.map(lv => (
              <div key={lv.id} style={{ borderRadius: '50%', background: hasLevel(usr.level, lv.id) ? C.gold : '#e0e0e0', width: lv.id.includes('dan') ? 11 : 7, height: lv.id.includes('dan') ? 11 : 7 }} />
            ))}
          </div>
          <div style={{ fontSize: 10, color: '#aaa', marginTop: 3 }}>{levelIndex(usr.level) + 1} / {LEVELS.length}</div>
        </div>
      </div>

      {/* Подвкладки */}
      <div style={{ display: 'flex', background: C.white, border: `1px solid ${C.border}`, borderBottom: 'none' }}>
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setSub(t.id)}
            style={{ padding: '11px 18px', background: 'none', border: 'none', color: sub === t.id ? C.dark : C.muted, fontSize: 12, borderBottom: `2px solid ${sub === t.id ? C.gold : 'transparent'}`, cursor: 'pointer', fontWeight: sub === t.id ? 600 : 400, marginBottom: -1 }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Обо мне ── */}
      {sub === 'info' && (
        <div style={{ border: `1px solid ${C.border}`, borderTop: 'none', background: C.white }}>
          {[
            { label: 'Уровень (подтверждён)', value: curLv?.label,                  show: !!curLv },
            { label: 'Уровень (при регистрации)', value: selfLvLabel,               show: !!selfLvLabel && selfLvLabel !== curLv?.label },
            { label: 'Имя сэнсэя',           value: usr.senseiName || 'Станислав Копин', show: true },
          ].filter(r => r.show).map(row => (
            <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', padding: '14px 20px', borderBottom: `1px solid ${C.border}`, fontSize: 13, alignItems: 'start' }}>
              <span style={{ color: C.muted, fontSize: 11 }}>{row.label}</span>
              <span style={{ color: C.dark }}>{row.value}</span>
            </div>
          ))}
          {usr.experience && (
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Об опыте</div>
              <p style={{ fontSize: 13, color: '#555', lineHeight: 1.85, borderLeft: `2px solid ${C.goldBorder}`, paddingLeft: 14 }}>{usr.experience}</p>
            </div>
          )}
          {!usr.experience && !selfLvLabel && !usr.senseiName && (
            <div style={{ padding: '24px 20px', textAlign: 'center', color: C.muted, fontSize: 13 }}>
              Анкета не заполнена
            </div>
          )}
        </div>
      )}

      {/* ── Экзамены ── */}
      {sub === 'exams' && (
        <div style={{ border: `1px solid ${C.border}`, borderTop: 'none' }}>
          {grouped.map((g, gi) => {
            const lv     = LEVELS.find(l => l.id === g.level);
            const passed = g.attempts.some(a => a.result);
            const isDan  = g.level.includes('dan');
            return (
              <div key={g.level} style={{ borderTop: gi === 0 ? `1px solid ${C.border}` : '1px solid #ece8e0', background: isDan ? '#fdfcf8' : C.white }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 700, color: isDan ? C.dark : C.gold }}>{lv?.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: passed ? '#3a8a5a' : '#b04030' }}>{passed ? '✓ Сдан' : '✗ Не сдан'}</span>
                  </div>
                  <span style={{ fontSize: 10, color: '#bbb' }}>{g.attempts.length} попыток</span>
                </div>
                {g.attempts.map((ex) => (
                  <div key={ex.id} style={{ display: 'flex', gap: 10, padding: '8px 18px 8px 30px', borderTop: '1px solid #f5f2ec', background: ex.result ? 'transparent' : '#fff8f7' }}>
                    <div style={{ fontSize: 11, color: C.muted, minWidth: 74 }}>{ex.date}</div>
                    <div style={{ fontSize: 11, color: ex.result ? '#3a8a5a' : '#b04030', fontWeight: 600, marginRight: 8 }}>{ex.result ? '✓' : '✗'}</div>
                    <div style={{ fontSize: 11, color: '#888' }}>{ex.comment}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Оплаты ── */}
      {sub === 'payments' && (
        <div style={{ border: `1px solid ${C.border}`, borderTop: 'none' }}>
          {PAYS.map(p => (
            <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 100px', padding: '13px 18px', fontSize: 12, background: C.white, borderBottom: '1px solid #f5f5f5', alignItems: 'center' }}>
              <span style={{ color: C.muted }}>{p.date}</span>
              <span style={{ color: C.dark }}>{p.desc}</span>
              <span style={{ color: C.dark, fontWeight: 600, textAlign: 'right' }}>{p.amount}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
