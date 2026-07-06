'use client';

import { useIsMobile } from '@/lib/mobile';
import { C } from '@/lib/utils';
import { OFERTA_CONTENT } from '@/data/ofertaContent';

export default function OfertaPage() {
  const isMobile = useIsMobile();

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: isMobile ? '32px 20px 60px' : '56px 24px 80px' }}>

        <a href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
          fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: C.muted, textDecoration: 'none', marginBottom: 32,
        }}>← На главную</a>

        {OFERTA_CONTENT.map((item, i) => {
          if (item.type === 'title') {
            return (
              <h1 key={i} style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: isMobile ? 30 : 40, fontWeight: 600, color: C.ink,
                letterSpacing: '0.02em', margin: 0, lineHeight: 1.15,
              }}>{item.text}</h1>
            );
          }
          if (item.type === 'subtitle') {
            return (
              <p key={i} style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: isMobile ? 16 : 19, color: C.muted,
                margin: '6px 0 36px', lineHeight: 1.4,
              }}>{item.text}</p>
            );
          }
          if (item.type === 'section') {
            return (
              <h2 key={i} style={{
                fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase',
                color: C.accent, fontWeight: 600,
                margin: i === 2 ? '0 0 14px' : '40px 0 14px',
                paddingBottom: 10, borderBottom: `1px solid ${C.border}`,
              }}>{item.text}</h2>
            );
          }
          if (item.type === 'subsection') {
            return (
              <h3 key={i} style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: isMobile ? 17 : 19, fontWeight: 600, color: C.ink,
                margin: '22px 0 10px',
              }}>{item.text}</h3>
            );
          }
          if (item.type === 'li') {
            return (
              <div key={i} style={{ display: 'flex', gap: 10, margin: '0 0 10px' }}>
                <span style={{ color: C.goldBorder, flexShrink: 0, lineHeight: 1.7 }}>—</span>
                <p style={{
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                  fontSize: isMobile ? 15 : 16, color: C.ink2, lineHeight: 1.7, margin: 0,
                }}>{item.text}</p>
              </div>
            );
          }
          // paragraph
          return (
            <p key={i} style={{
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              fontSize: isMobile ? 15 : 16, color: C.ink2, lineHeight: 1.7,
              margin: '0 0 12px',
            }}>{item.text}</p>
          );
        })}
      </div>
    </div>
  );
}
