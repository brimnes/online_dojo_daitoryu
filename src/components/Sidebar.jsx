'use client';

import { C } from '@/lib/utils';
import { LEVELS } from '@/data/users';
import { DB_SECTIONS } from '@/data/techniques';
import TakedaMon from '@/components/TakedaMon';

const TABS = [
  { id: 'knowledge', label: 'База знаний',    num: '01', kanji: '智' },
  { id: 'months',    label: 'Месяцы 2026',    num: '02', kanji: '月' },
  { id: 'database',  label: 'База техник',    num: '03', kanji: '技' },
  { id: 'profile',   label: 'Личный кабинет', num: '04', kanji: '人' },
];

const LEVEL_KANJI = {
  '6kyu': '六級', '5kyu': '五級', '4kyu': '四級',
  '3kyu': '三級', '2kyu': '二級', '1kyu': '一級',
  '1dan': '初段', '2dan': '二段', '3dan': '三段',
};
const LEVEL_SHORT = {
  '6kyu': '6 КЮ', '5kyu': '5 КЮ', '4kyu': '4 КЮ',
  '3kyu': '3 КЮ', '2kyu': '2 КЮ', '1kyu': '1 КЮ',
  '1dan': '1 ДАН', '2dan': '2 ДАН', '3dan': '3 ДАН',
};

/**
 * Shared dark sidebar.
 * Props:
 *   activeTab  — id of currently active tab ('months', 'knowledge', etc.)
 *   onTabClick — (tabId) => void  — called when a nav item is clicked
 *   user       — { name, email, level, role }
 *   onLogout   — () => void
 */
export default function Sidebar({ activeTab, onTabClick, user = {}, onLogout }) {
  const curLv   = LEVELS.find(l => l.id === user.level);
  const isAdmin = user.role === 'admin';

  return (
    <aside style={{
      width: 260, flexShrink: 0, height: '100vh',
      background: '#0a0807',
      backgroundImage: 'linear-gradient(180deg, #16130f 0%, #0a0807 30%, #13110e 100%)',
      borderRight: '1px solid #1f1a16',
      display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0,
      boxShadow: 'inset -1px 0 0 rgba(184,146,58,0.06)',
      overflow: 'hidden',
    }}>
      {/* top accent stripe — gradient */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${C.accent} 30%, #b8923a 70%, transparent)`,
        opacity: 0.5, flexShrink: 0,
      }} />
      {/* grain overlay */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
          `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.7  0 0 0 0 0.6  0 0 0 0 0.4  0 0 0 0.08 0'/></filter><rect width='200' height='200' filter='url(%23n)'/></svg>`
        )}")`,
        opacity: 0.5, mixBlendMode: 'screen',
      }} />

      {/* Brand */}
      <div style={{ padding: '32px 28px 24px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', flexShrink: 0 }}>
        <TakedaMon size={28} color='#b8923a' />
        <div>
          <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 10, letterSpacing: '0.22em', color: '#ede5d3', fontWeight: 600 }}>
            ONLINE DAITO-RYU
          </div>
          <div style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 10, color: '#b8923a', letterSpacing: '0.18em', marginTop: 3, opacity: 0.75 }}>
            合気柔術
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: '#1f1a16', position: 'relative', flexShrink: 0 }} />

      {/* User card */}
      <div style={{ padding: '20px 28px', position: 'relative', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: '#13110e', border: `1px solid #b8923a`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            fontStyle: 'italic', fontSize: 18, color: '#b8923a', flexShrink: 0,
          }}>
            {(user.name || '?')[0]}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500, color: '#ede5d3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 10, color: '#7a6c52', letterSpacing: '0.06em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
          </div>
        </div>
        {curLv && (
          <div style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid #1f1a16', padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.18em', color: '#7a6c52', textTransform: 'uppercase' }}>текущий уровень</span>
              <span style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 12, color: '#b8923a' }}>{LEVEL_KANJI[user.level] || ''}</span>
            </div>
            <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 16, letterSpacing: '0.05em', color: '#ede5d3', fontWeight: 500 }}>
              {LEVEL_SHORT[user.level] || curLv.label}
            </div>
            {curLv.program && (
              <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontStyle: 'italic', fontSize: 11, color: '#7a6c52', marginTop: 2 }}>
                {DB_SECTIONS.find(d => d.id === curLv.program)?.label}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ height: 1, background: '#1f1a16', position: 'relative', flexShrink: 0 }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 0', position: 'relative', overflow: 'hidden' }}>
        {TABS.map(({ id, label, num, kanji }) => {
          const isA = activeTab === id;
          return (
            <button key={id} onClick={() => onTabClick(id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 28px',
                background: isA ? 'rgba(0,0,0,0.3)' : 'transparent',
                border: 'none',
                borderLeft: `2px solid ${isA ? C.accent : 'transparent'}`,
                cursor: 'pointer',
              }}>
              <span style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 10, color: isA ? C.accent : '#7a6c52', letterSpacing: '0.06em' }}>{num}</span>
              <span style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 13, color: isA ? '#ede5d3' : '#c2b59c', fontWeight: isA ? 600 : 400, letterSpacing: '0.02em' }}>{label}</span>
              <span style={{ marginLeft: 'auto', fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 12, color: isA ? '#b8923a' : '#7a6c52', opacity: 0.8 }}>{kanji}</span>
            </button>
          );
        })}
      </nav>

      <div style={{ height: 1, background: '#1f1a16', position: 'relative', flexShrink: 0 }} />
      <div style={{ padding: '14px 28px', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', flexShrink: 0 }}>
        {isAdmin && (
          <a href="/admin" style={{ display: 'block', fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 11, color: '#7a6c52', letterSpacing: '0.06em', cursor: 'pointer', textDecoration: 'none' }}>
            ⚙ Панель управления
          </a>
        )}
        <button onClick={onLogout} style={{ background: 'none', border: 'none', fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 11, color: '#7a6c52', letterSpacing: '0.06em', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
          ↳ Выйти
        </button>
      </div>
      {/* 武道 watermark */}
      <div style={{ position: 'absolute', bottom: 12, right: 14, fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 11, color: '#b8923a', letterSpacing: '0.2em', opacity: 0.35, pointerEvents: 'none' }}>
        武道
      </div>
    </aside>
  );
}
