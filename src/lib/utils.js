export const LEVEL_ORDER = ['6kyu','5kyu','4kyu','3kyu','2kyu','1kyu','1dan','2dan','3dan'];

export function levelIndex(id) {
  return LEVEL_ORDER.indexOf(id);
}

export function hasLevel(userLevel, requiredLevel) {
  return levelIndex(userLevel) >= levelIndex(requiredLevel);
}

export const C = {
  // Backgrounds
  bg:         '#e6e0d2',  // cool stone / rice paper
  bg2:        '#d8d0bf',  // deeper stone
  surface:    '#f1ece0',  // muted ivory sheet
  surface2:   '#f7f2e7',  // raised paper
  white:      '#fff',
  // Text
  ink:        '#15120e',  // graphite-black
  ink2:       '#3a342b',  // strong body text
  dark:       '#15120e',
  muted:      '#6f6452',  // bronze-gray secondary
  // Borders
  border:     '#bab09a',  // stone divider (hairline)
  hairline2:  '#cec3ac',
  // Accent — CRIMSON (primary brand color)
  accent:     '#9e2f1f',  // deep crimson
  accentSoft: '#d4b8b0',  // soft crimson tint
  // Gold — decorative only
  gold:       '#8a6e2a',  // muted bronze gold
  goldLight:  '#b8923a',  // for dark backgrounds
  goldBorder: '#c8a978',  // gold border/line
  goldSoft:   '#c8a978',
  // Utility
  light:      '#f7f2e7',
  success:    '#4d6a4a',
  danger:     '#8a2a20',
  overlay:    'rgba(15,12,8,0.55)',
  onAccent:   '#f1ece0',
  shadow:     '0 1px 0 rgba(0,0,0,0.04), 0 8px 24px -8px rgba(20,16,10,0.25)',
  shadowDeep: '0 30px 80px -20px rgba(20,16,10,0.45)',
};

// Font tokens — единая typography system
// serif → hero titles, section titles, technique names, body text (Cormorant Garamond)
// mono  → labels, UI, metadata, breadcrumbs, UPPERCASE (JetBrains Mono)
// kanji → японские иероглифы (Noto Serif JP)
// sys   → системный sans для форм/inputs
export const F = {
  serif: "var(--font-cormorant), 'Cormorant Garamond', serif",
  mono:  "var(--font-mono), 'JetBrains Mono', monospace",
  kanji: "var(--font-noto), 'Noto Serif JP', 'Hiragino Mincho Pro', serif",
  sys:   "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};


// Returns null for empty or zero-duration strings ("00:00", "0:00", "")
// so UI can show "—" instead of a meaningless zero.
export function validDur(d) {
  if (!d || d === '00:00' || d === '0:00') return null;
  return d;
}
