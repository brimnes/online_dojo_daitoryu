'use client';

import { useState } from 'react';
import { C } from '@/lib/utils';
import { BELT, TECHNIQUE_VIDEOS, TECHNIQUE_CONTENT, VIDEO_CATS } from '@/data/techniques';

export default function TechniquePage({ kyu, section, tech, onBack }) {
  const belt   = BELT[kyu.belt] || { color: '#ccc', border: '#aaa', label: '' };
  const [cat, setCat] = useState('overview');
  const [vid, setVid] = useState(null);

  const allV = TECHNIQUE_VIDEOS[tech.name] || [];
  const byC  = {};
  VIDEO_CATS.forEach(c => { byC[c.id] = allV.filter(v => v.category === c.id); });
  const curV   = byC[cat] || [];
  const curCat = VIDEO_CATS.find(c => c.id === cat);

  const content = TECHNIQUE_CONTENT[tech.name] || { description:'', principles:[], mistakes:[], senseiQuote:'' };

  return (
    <div className="fade" style={{ padding: '32px 36px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 12 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', padding: 0 }}>← Иккаджо</button>
        <span style={{ color: '#ddd' }}>/</span><span style={{ color: C.muted }}>{kyu.label}</span>
        <span style={{ color: '#ddd' }}>/</span><span style={{ color: C.muted }}>{section.nameRu}</span>
        <span style={{ color: '#ddd' }}>/</span><span style={{ color: C.dark }}>{tech.nameRu}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 24, paddingBottom: 20, borderBottom: `2px solid ${C.border}` }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: C.muted, marginBottom: 10 }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: belt.color, border: `2px solid ${belt.border}`, display: 'inline-block' }} />
            {belt.label} · {kyu.label} · {section.nameRu}
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 600, color: C.dark, marginBottom: 4 }}>{tech.nameRu}</h1>
          <div style={{ fontSize: 14, color: '#bbb', marginBottom: content.description ? 12 : 0 }}>{tech.name}</div>
          {content.description && <p style={{ fontSize: 13, color: '#666', lineHeight: 1.7, maxWidth: 560 }}>{content.description}</p>}
        </div>
        <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 64, color: '#ece7de', lineHeight: 1, flexShrink: 0 }}>{kyu.kanji}</div>
      </div>

      {vid ? (
        <div style={{ position: 'relative', height: 340, background: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', marginBottom: 12 }}>▶</div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, textAlign: 'center', maxWidth: 400 }}>{vid.title}</div>
          <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, marginTop: 6 }}>{vid.duration}</div>
          <button onClick={() => setVid(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.5)', width: 30, height: 30, borderRadius: '50%', cursor: 'pointer' }}>✕</button>
        </div>
      ) : (
        <div style={{ height: 56, background: '#eeeae4', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: '#bbb', fontSize: 13 }}>Выберите видео ниже</span>
        </div>
      )}

      <div style={{ display: 'flex', background: '#fff', border: `1px solid ${C.border}`, borderTop: 'none', overflowX: 'auto' }}>
        {VIDEO_CATS.map(c => (
          <button key={c.id} onClick={() => { setCat(c.id); setVid(null); }}
            style={{ padding: '11px 16px', background: 'none', border: 'none', borderBottom: `2px solid ${cat === c.id ? c.color : 'transparent'}`, color: cat === c.id ? c.color : C.muted, fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', cursor: 'pointer', fontWeight: cat === c.id ? 600 : 400, marginBottom: -1 }}>
            <span style={{ fontSize: 10 }}>{c.icon}</span>{c.label}
            <span style={{ marginLeft: 3, fontSize: 10, background: '#f0ede8', padding: '1px 5px', color: '#aaa', borderRadius: 8 }}>{byC[c.id]?.length || 0}</span>
          </button>
        ))}
      </div>

      <div style={{ border: `1px solid ${C.border}`, borderTop: 'none', marginBottom: 20 }}>
        {curV.length === 0
          ? <div style={{ padding: '16px', color: '#bbb', fontSize: 13 }}>Видео пока нет.</div>
          : curV.map(v => {
              const active = vid?.id === v.id;
              return (
                <div key={v.id} onClick={() => setVid(v)}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', background: active ? C.light : '#fff', cursor: 'pointer', borderBottom: '1px solid #f5f2ec' }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.light; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = '#fff'; }}>
                  <div style={{ width: 34, height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? curCat.color : '#1a1a1a' }}>
                    <span style={{ color: '#fff', fontSize: 10 }}>▶</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, color: C.dark, fontWeight: active ? 600 : 400 }}>{v.title}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Сэнсэй Копин · {v.duration}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#ddd' }}>{v.duration}</div>
                </div>
              );
            })
        }
      </div>

      {content.principles.length > 0 && (
        <div style={{ background: '#fff', border: `1px solid ${C.border}`, padding: '22px 24px', marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: C.gold, fontFamily: "'Noto Serif JP', serif", fontSize: 13 }}>道</span>Ключевые принципы
          </div>
          {content.principles.map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: '#ddd', minWidth: 22, fontWeight: 600, flexShrink: 0 }}>{String(i+1).padStart(2,'0')}</div>
              <div style={{ fontSize: 13, color: '#444', lineHeight: 1.7 }}>{p}</div>
            </div>
          ))}
        </div>
      )}

      {content.mistakes.length > 0 && (
        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderLeft: '3px solid #b04030', padding: '22px 24px', marginBottom: 12 }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#b04030', fontSize: 11 }}>✕</span>Типичные ошибки
          </div>
          {content.mistakes.map((m, i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#b04030', marginBottom: 4 }}>{m.title}</div>
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.65 }}>{m.desc}</div>
            </div>
          ))}
        </div>
      )}

      {content.senseiQuote && (
        <div style={{ background: '#fff', border: `1px solid ${C.border}`, padding: '22px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.light, border: `1px solid ${C.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: C.gold }}>К</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>Сэнсэй Копин</div>
              <div style={{ fontSize: 11, color: C.muted }}>Комментарий к технике</div>
            </div>
          </div>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: '#555', lineHeight: 1.85, fontStyle: 'italic', borderLeft: `2px solid ${C.goldBorder}`, paddingLeft: 16 }}>
            «{content.senseiQuote}»
          </div>
        </div>
      )}
    </div>
  );
}
