'use client';

// ── MobileBottomNav — shared bottom navigation ───────────────────
// Dark espresso palette, kanji icons, no emoji.
// Usage: <MobileBottomNav nav={nav} active="months" isAdmin={false} />
// active: 'knowledge' | 'months' | 'database' | 'profile'

const NB = '#0a0807';       // nav background (espresso)
const NB2 = '#13110e';      // nav bg2
const NBR = '#1f1a16';      // nav border
const NG  = '#b8923a';      // nav gold (active kanji)
const NM  = '#5a4f3c';      // nav muted (inactive)
const NT  = '#c2b59c';      // nav text (active label)
const NA  = '#9e2f1f';      // nav accent (active stripe)

const ITEMS = [
  { id: 'knowledge', label: 'Знания',  kanji: '智' },
  { id: 'months',    label: 'Месяцы',  kanji: '月' },
  { id: 'database',  label: 'База',    kanji: '技' },
  { id: 'profile',   label: 'Профиль', kanji: '人' },
];

export function MobileBottomNav({ nav, active, isAdmin }) {
  function goTo(id) {
    // nav.dashboard(tab) navigates to Dashboard and opens given tab
    if (nav?.dashboard) nav.dashboard(id);
  }

  const items = isAdmin
    ? [...ITEMS, { id: 'admin', label: 'Адм.', kanji: '管', href: '/admin' }]
    : ITEMS;

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      background: NB,
      borderTop: `1px solid ${NBR}`,
      display: 'flex',
      alignItems: 'stretch',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      zIndex: 200,
      boxShadow: '0 -1px 0 rgba(184,146,58,0.07), 0 -8px 24px rgba(0,0,0,0.45)',
    }}>
      {items.map(item => {
        const isA = active === item.id;
        const content = (
          <>
            {/* active indicator stripe */}
            {isA && (
              <span style={{
                position: 'absolute', top: 0, left: '50%',
                transform: 'translateX(-50%)',
                width: 28, height: 2,
                background: NA,
              }} />
            )}
            {/* kanji icon */}
            <span style={{
              fontFamily: "'Noto Serif JP', 'Yu Mincho', serif",
              fontSize: 19,
              color: isA ? NG : NM,
              lineHeight: 1,
              transition: 'color 0.15s',
              letterSpacing: 0,
            }}>{item.kanji}</span>
            {/* label */}
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, 'Courier New', monospace",
              fontSize: 10,
              letterSpacing: '0.1em',
              color: isA ? NT : NM,
              textTransform: 'uppercase',
              transition: 'color 0.15s',
            }}>{item.label}</span>
          </>
        );

        const sharedStyle = {
          flex: 1,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 4,
          padding: '9px 4px 11px',
          minHeight: 58,
          background: isA ? NB2 : 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          textDecoration: 'none',
        };

        if (item.href) {
          return (
            <a key={item.id} href={item.href} style={sharedStyle}>
              {content}
            </a>
          );
        }

        return (
          <button key={item.id} onClick={() => goTo(item.id)} style={sharedStyle}>
            {content}
          </button>
        );
      })}
    </nav>
  );
}
