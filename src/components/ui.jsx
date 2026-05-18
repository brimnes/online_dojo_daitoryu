'use client';
// ─── Shared Design Components — Online Dojo / Daito-ryu ──────────────────────
// Based on Claude Design prototype tokens. Import what you need.

import { C } from '@/lib/utils';

// ─── WashiBg ─────────────────────────────────────────────────────────────────
// Layered background: film grain + soft vignette. Keeps palette honest.
export function WashiBg({ children, style, grainOpacity = 0.6, dark = false }) {
  return (
    <div style={{
      position: 'relative',
      background: dark ? '#0d0b08' : C.bg,
      color: dark ? '#ede5d3' : C.ink,
      ...style
    }}>
      {/* film grain */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(
          `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 ${dark ? '0.55' : '0.25'}  0 0 0 0 ${dark ? '0.48' : '0.22'}  0 0 0 0 ${dark ? '0.36' : '0.18'}  0 0 0 ${dark ? 0.10 : 0.05} 0'/></filter><rect width='220' height='220' filter='url(%23n)'/></svg>`
        )}")`,
        opacity: grainOpacity * 0.6,
        mixBlendMode: dark ? 'screen' : 'multiply',
      }} />
      {/* soft vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: dark
          ? 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.45) 100%)'
          : 'radial-gradient(ellipse at center, transparent 50%, rgba(20,16,10,0.10) 100%)',
      }} />
      <div style={{ position: 'relative' }}>{children}</div>
    </div>
  );
}

// ─── TakedaMon ───────────────────────────────────────────────────────────────
// 4-diamond family crest
export function TakedaMon({ size = 40, color = C.accent, style }) {
  const W = 19.1, H = 11.8, g = 3.2;
  const r = (cx, cy) => `${cx},${cy - H} ${cx + W},${cy} ${cx},${cy + H} ${cx - W},${cy}`;
  const c = 50, d = H + g / 2, s = W + g / 2;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0, ...style }}
      aria-label="Takeda mon">
      <polygon points={r(c, c - d)} fill={color} />
      <polygon points={r(c - s, c)} fill={color} />
      <polygon points={r(c + s, c)} fill={color} />
      <polygon points={r(c, c + d)} fill={color} />
    </svg>
  );
}

// ─── TakedaMonHero ───────────────────────────────────────────────────────────
// Large hero variant with concentric ring outlines
export function TakedaMonHero({ size = 200, color = C.accent, ringColor, opacity = 1, style }) {
  const W = 19.1, H = 11.8, g = 3.2;
  const r = (cx, cy) => `${cx},${cy - H} ${cx + W},${cy} ${cx},${cy + H} ${cx - W},${cy}`;
  const c = 50, d = H + g / 2, s = W + g / 2;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0, opacity, ...style }}
      aria-label="Takeda mon hero">
      <circle cx="50" cy="50" r="46" fill="none" stroke={ringColor || color} strokeWidth="0.4" opacity="0.5" />
      <circle cx="50" cy="50" r="38" fill="none" stroke={ringColor || color} strokeWidth="0.3" opacity="0.35" />
      <polygon points={r(c, c - d)} fill={color} />
      <polygon points={r(c - s, c)} fill={color} />
      <polygon points={r(c + s, c)} fill={color} />
      <polygon points={r(c, c + d)} fill={color} />
      <circle cx="50" cy="50" r="1.2" fill={color} />
    </svg>
  );
}

// ─── SumiStroke ──────────────────────────────────────────────────────────────
// Sumi-e brush stroke decorative divider
export function SumiStroke({ color = C.border, width = 200, height = 24, style }) {
  return (
    <svg width={width} height={height} viewBox="0 0 200 24"
      style={{ display: 'block', ...style }}>
      <defs>
        <linearGradient id="sumi-grad" x1="0" x2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.0" />
          <stop offset="8%"   stopColor={color} stopOpacity="0.5" />
          <stop offset="60%"  stopColor={color} stopOpacity="0.95" />
          <stop offset="95%"  stopColor={color} stopOpacity="0.4" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M2 14 C 30 4, 70 22, 110 10 S 180 16, 198 8"
        stroke="url(#sumi-grad)" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M6 16 C 36 9, 72 23, 112 12 S 178 18, 195 11"
        stroke="url(#sumi-grad)" strokeWidth="0.6" fill="none" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

// ─── KanjiRail ───────────────────────────────────────────────────────────────
// Vertical kanji margin decoration
export function KanjiRail({ text = '大東流合気柔術', size = 18, opacity = 0.5, color = C.muted, style }) {
  return (
    <div style={{
      writingMode: 'vertical-rl',
      textOrientation: 'upright',
      fontFamily: 'var(--font-noto), "Noto Serif JP", serif',
      fontSize: size,
      color,
      letterSpacing: '0.4em',
      opacity,
      lineHeight: 1.1,
      userSelect: 'none',
      ...style
    }}>{text}</div>
  );
}

// ─── Hinomaru ────────────────────────────────────────────────────────────────
// Small disc / sun element
export function Hinomaru({ size = 12, color = C.accent, style }) {
  return (
    <span style={{
      display: 'inline-block',
      width: size, height: size,
      borderRadius: '50%',
      background: color,
      flexShrink: 0,
      ...style
    }} />
  );
}

// ─── Eyebrow ─────────────────────────────────────────────────────────────────
// Tiny mono uppercase label, optionally with leading diamond
export function Eyebrow({ children, color = C.muted, diamond = false, style }) {
  return (
    <div style={{
      fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
      fontSize: 10,
      letterSpacing: '0.18em',
      textTransform: 'uppercase',
      color,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      ...style
    }}>
      {diamond && (
        <svg width="6" height="6" viewBox="0 0 6 6">
          <polygon points="3,0 6,3 3,6 0,3" fill={color} />
        </svg>
      )}
      {children}
    </div>
  );
}

// ─── DisplayTitle ─────────────────────────────────────────────────────────────
// Large Cormorant SC heading
export function DisplayTitle({ children, size = 32, color = C.ink, style }) {
  return (
    <div style={{
      fontFamily: 'var(--font-cormorant-sc), var(--font-cormorant), "Cormorant Garamond", serif',
      fontSize: size,
      fontWeight: 400,
      letterSpacing: '0.05em',
      lineHeight: 1.15,
      color,
      ...style
    }}>
      {children}
    </div>
  );
}

// ─── SectionDivider ──────────────────────────────────────────────────────────
// Thin hairline + optional label
export function SectionDivider({ label, style }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      ...style
    }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      {label && (
        <Eyebrow color={C.muted}>{label}</Eyebrow>
      )}
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

// ─── Belt ─────────────────────────────────────────────────────────────────────
// Kyu/dan belt color strip
const BELT_COLORS = {
  '6kyu': '#e8e0d0',
  '5kyu': '#f5c842',
  '4kyu': '#f5a800',
  '3kyu': '#4a8c3f',
  '2kyu': '#4a8c3f',
  '1kyu': '#2a3a7a',
  '1dan': '#1a1a1a',
  '2dan': '#1a1a1a',
  '3dan': '#1a1a1a',
};

export function Belt({ level, width = 28, height = 6, style }) {
  return (
    <div style={{
      width, height,
      borderRadius: 2,
      background: BELT_COLORS[level] || C.border,
      flexShrink: 0,
      ...style
    }} />
  );
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value = 0, color = C.accent, trackColor = C.border, height = 3, style }) {
  return (
    <div style={{
      width: '100%', height,
      background: trackColor,
      borderRadius: height,
      overflow: 'hidden',
      ...style
    }}>
      <div style={{
        width: `${Math.min(100, Math.max(0, value))}%`,
        height: '100%',
        background: color,
        borderRadius: height,
        transition: 'width 0.4s ease',
      }} />
    </div>
  );
}

// ─── MonoLabel ────────────────────────────────────────────────────────────────
// JetBrains Mono small label — for counters, codes, technical labels
export function MonoLabel({ children, size = 11, color = C.muted, style }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono), "JetBrains Mono", monospace',
      fontSize: size,
      letterSpacing: '0.06em',
      color,
      ...style
    }}>
      {children}
    </span>
  );
}
