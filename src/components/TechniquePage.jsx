'use client';

import { useState } from 'react';
import { useIsMobile } from '@/lib/mobile';
import { BELT, VIDEO_CATS } from '@/data/techniques';
import KinescopePlayer from '@/components/KinescopePlayer';
import { useTechniques, useUserAccessRows } from '@/lib/db';
import { hasIkkajoSectionAccess } from '@/lib/access';
import { IKKAJO_SECTION_KEYS as IKKAJO_SECTIONS } from '@/lib/ikkajoSections';

export default function TechniquePage({ kyu, section, tech, onBack, viewerId }) {
  const isMobile = useIsMobile();
  const belt = BELT[kyu.belt] || { color: '#ccc', border: '#aaa', label: '' };
  const [cat, setCat] = useState('overview');
  const [vid, setVid] = useState(null);

  const { getTechContent, loading } = useTechniques();
  const { rows: userAccess, loading: accessLoading } = useUserAccessRows();

  const sectionKey = section?.id?.toLowerCase();
  const isIkkajoSection = IKKAJO_SECTIONS.includes(sectionKey);
  const canAccess = !accessLoading && (!isIkkajoSection || hasIkkajoSectionAccess(userAccess, sectionKey));

  const content = loading ? { description:'', principles:[], senseiQuote:'', mistakes:[], videos:{} }
                          : getTechContent(tech.name);

  const byC    = content.videos || {};
  const curV   = byC[cat] || [];
  const curCat = VIDEO_CATS.find(c => c.id === cat);

  if (!accessLoading && !canAccess) {
    return (
      <div style={{ padding: '60px 32px', textAlign: 'center', background: '#f0ebe0', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: 48, color: '#d8cdb8', marginBottom: 8 }}>🔒</div>
        <div style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: 20, color: '#15120e', letterSpacing: '0.04em' }}>Нет доступа к разделу</div>
        <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: 15, color: '#9a8860', maxWidth: 320, lineHeight: 1.7 }}>Приобретите доступ к разделу «{section?.nameRu}» чтобы просматривать техники.</div>
        <button onClick={onBack} style={{ marginTop: 8, padding: '10px 28px', background: '#13110e', color: '#ede5d3', border: 'none', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 12, letterSpacing: '0.1em', cursor: 'pointer' }}>
          ← Назад к Иккаджо
        </button>
      </div>
    );
  }

  return (
    <div className="fade" style={{ minHeight: '100vh', background: '#f0ebe0' }}>
      <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, fontSize: 11, flexWrap: 'wrap' }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, letterSpacing: '0.1em', color: '#9a8860', cursor: 'pointer', padding: '4px 0', minHeight: 44, display: 'flex', alignItems: 'center' }}>← Иккаджо</button>
          <span style={{ color: '#d2c7b0' }}>/</span>
          <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, color: '#7a6e5a', letterSpacing: '0.06em' }}>{kyu.label}</span>
          <span style={{ color: '#d2c7b0' }}>/</span>
          <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, color: '#7a6e5a', letterSpacing: '0.06em' }}>{section.nameRu}</span>
          <span style={{ color: '#d2c7b0' }}>/</span>
          <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, color: '#15120e', letterSpacing: '0.06em' }}>{tech.nameRu}</span>
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: isMobile ? 24 : 32, paddingBottom: isMobile ? 20 : 28, borderBottom: '1px solid #d2c7b0' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: '#9a8860', marginBottom: 12, letterSpacing: '0.1em' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: belt.color, border: `2px solid ${belt.border}`, display: 'inline-block' }} />
              {belt.label} · {kyu.label} · {section.nameRu}
            </div>
            <h1 style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: 34, letterSpacing: '0.03em', color: '#15120e', marginBottom: 6, lineHeight: 1.1 }}>{tech.nameRu}</h1>
            <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: 16, color: '#9a8860', marginBottom: content.description ? 16 : 0 }}>{tech.name}</div>
            {content.description && <p style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 16, color: '#5a4e3a', lineHeight: 1.75, maxWidth: 560 }}>{content.description}</p>}
          </div>
          <div style={{ fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: 80, color: '#d8cdb8', lineHeight: 1, flexShrink: 0, fontWeight: 300 }}>{kyu.kanji}</div>
        </div>

        {/* Video player area */}
        {vid ? (
          <div style={{ position: 'relative', marginBottom: 0 }}>
            <KinescopePlayer
              videoId={vid.video_id}
              videoStatus={vid.video_status}
              viewerId={viewerId}
              title={vid.title}
              duration={vid.duration}
            />
            <button onClick={() => setVid(null)}
              style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 13 }}>
              ✕
            </button>
          </div>
        ) : (
          <div style={{ height: 56, background: '#e8e0cc', border: '1px solid #d2c7b0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", color: '#b0a080', fontSize: 12, letterSpacing: '0.08em' }}>Выберите видео ниже</span>
          </div>
        )}

        {/* Category tabs */}
        <div style={{ display: 'flex', background: '#faf8f4', border: '1px solid #d2c7b0', borderTop: 'none', overflowX: 'auto' }}>
          {VIDEO_CATS.map(c => (
            <button key={c.id} onClick={() => { setCat(c.id); setVid(null); }}
              style={{ padding: '11px 16px', background: 'none', border: 'none', borderBottom: `2px solid ${cat === c.id ? c.color : 'transparent'}`, color: cat === c.id ? c.color : '#9a8860', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', cursor: 'pointer', fontWeight: cat === c.id ? 600 : 400, marginBottom: -1 }}>
              <span style={{ fontSize: 10 }}>{c.icon}</span>{c.label}
              <span style={{ marginLeft: 3, fontSize: 10, background: '#e8e0cc', padding: '1px 5px', color: '#9a8860', borderRadius: 8 }}>{(byC[c.id] || []).length}</span>
            </button>
          ))}
        </div>

        {/* Video list */}
        <div style={{ border: '1px solid #d2c7b0', borderTop: 'none', marginBottom: 24 }}>
          {curV.length === 0
            ? <div style={{ padding: '16px', fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', color: '#b0a080', fontSize: 14 }}>Видео пока нет.</div>
            : curV.map(v => {
                const active = vid?.id === v.id;
                return (
                  <div key={v.id} onClick={() => setVid(v)}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: active ? '#f0ebe0' : '#faf8f4', cursor: 'pointer', borderBottom: '1px solid #e8e0cc', transition: 'background 0.1s' }}
                    onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#f0ebe0'; }}
                    onMouseLeave={e => { if (!active) e.currentTarget.style.background = '#faf8f4'; }}>
                    <div style={{ width: 34, height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? curCat?.color || '#b73828' : '#13110e' }}>
                      <span style={{ color: '#fff', fontSize: 10 }}>▶</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 13, color: '#15120e', fontWeight: active ? 600 : 400 }}>{v.title}</div>
                      <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: 12, color: '#9a8860', marginTop: 2 }}>Сэнсэй Копин · {v.duration}</div>
                    </div>
                    <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, color: '#d2c7b0', letterSpacing: '0.06em' }}>{v.duration}</div>
                  </div>
                );
              })
          }
        </div>

        {/* Principles */}
        {content.principles?.length > 0 && (
          <div style={{ background: '#faf8f4', border: '1px solid #d2c7b0', padding: '22px 24px', marginBottom: 12 }}>
            <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, color: '#9a8860', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: '#b8923a', fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: 14 }}>道</span>Ключевые принципы
            </div>
            {content.principles.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
                <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, color: '#c8b99a', minWidth: 22, fontWeight: 600, flexShrink: 0, letterSpacing: '0.1em' }}>{String(i+1).padStart(2,'0')}</div>
                <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 15, color: '#3d3228', lineHeight: 1.75 }}>{p}</div>
              </div>
            ))}
          </div>
        )}

        {/* Mistakes */}
        {content.mistakes?.length > 0 && (
          <div style={{ background: '#faf8f4', border: '1px solid #d2c7b0', borderLeft: '3px solid #b73828', padding: '22px 24px', marginBottom: 12 }}>
            <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, color: '#9a8860', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ color: '#b73828', fontSize: 11 }}>✕</span>Типичные ошибки
            </div>
            {content.mistakes.map((m, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: 12, letterSpacing: '0.04em', color: '#b73828', marginBottom: 4 }}>{m.title}</div>
                <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 14, color: '#7a6e5a', lineHeight: 1.7 }}>{m.description || m.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* Sensei quote */}
        {content.senseiQuote && (
          <div style={{ background: '#faf8f4', border: '1px solid #d2c7b0', padding: '22px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0ebe0', border: '1px solid #d2c7b0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: 14, color: '#b8923a' }}>К</div>
              <div>
                <div style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: 12, letterSpacing: '0.04em', color: '#15120e' }}>Сэнсэй Копин</div>
                <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: '#9a8860', letterSpacing: '0.08em' }}>Комментарий к технике</div>
              </div>
            </div>
            <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: 16, color: '#5a4e3a', lineHeight: 1.85, fontStyle: 'italic', borderLeft: '2px solid #d2c7b0', paddingLeft: 16 }}>
              «{content.senseiQuote}»
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
