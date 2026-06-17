'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import GlobalSearch from '@/components/GlobalSearch';
import { C } from '@/lib/utils';
import { useIsMobile } from '@/lib/mobile';
import { BELT, KYU_DATA, FLAT_INDEX } from '@/data/techniques';
import { useTechniques, useUserAccessRows, hasIkkajoSectionAccess } from '@/lib/db';
import { IKKAJO_SECTION_KEYS as IKKAJO_SECTIONS } from '@/lib/ikkajoSections';
import { hasIkkajoFullAccess } from '@/lib/access';
import { useProducts } from '@/lib/useProducts';
import Sidebar from '@/components/Sidebar';
import { MobileBottomNav } from '@/components/BottomNav';

// Kanji glyphs for section IDs (not stored in data)
const SECTION_KANJI = {
  tachiai:       '立合',
  idori:         '居取',
  ushirodori:    '後取',
  hanzahandachi: '半座半立',
  hanmihandachi: '半身半立',
  suwariwaza:    '座技',
  torifune:      '鳥船',
};

export default function IkkajoPage({ nav, user = {}, onLogout, initialKyu }) {
  const isMobile = useIsMobile();
  const [activeKyu, setActiveKyu] = useState(initialKyu || '6kyu');

  const switchKyu = (id) => {
    setActiveKyu(id);
    nav.setIkkajoKyu?.(id);
  };
  const cur = KYU_DATA.find(k => k.id === activeKyu);
  const { videos } = useTechniques();
  const { rows: userAccess, loading: accessLoading } = useUserAccessRows();
  const { products } = useProducts();
  const [modal,     setModal]     = useState(null); // { product } | null
  const [buying,    setBuying]    = useState(false);
  const [buyError,  setBuyError]  = useState('');

  const ikkajoFullProduct   = products?.find(p => p.reference === 'ikkajo');
  const sectionProductFor   = (sectionKey) => products?.find(p => p.type === 'section' && p.reference === sectionKey);
  const hasFull             = hasIkkajoFullAccess(userAccess);

  const handleBuy = async (product) => {
    if (!product || buying) return;
    setBuying(true);
    setBuyError('');
    try {
      const res  = await fetch('/api/yookassa/create-payment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      });
      const data = await res.json();
      if (!res.ok) { setBuyError(data.error || 'Ошибка при создании платежа'); return; }
      if (data.payment_id) { try { sessionStorage.setItem('yk_pending_pid', data.payment_id); } catch {} }
      window.location.href = data.confirmation_url;
    } catch { setBuyError('Ошибка соединения'); }
    finally { setBuying(false); }
  };

  const videoCountByTech = useMemo(() => {
    const map = {};
    videos.forEach(v => { map[v.technique_id] = (map[v.technique_id] || 0) + 1; });
    return map;
  }, [videos]);

  const totalTechs = FLAT_INDEX.length;

  return (
    <div className="fade" style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Sidebar (desktop only) ── */}
      {!isMobile && (
        <Sidebar activeTab="database" onTabClick={id => nav.dashboard(id)} user={user} onLogout={onLogout} />
      )}

      {/* ── Page content ── */}
      <div style={{ flex: 1, background: C.bg, minHeight: '100vh', paddingLeft: isMobile ? 0 : 260 }}>

        {/* ── Mobile sticky header ── */}
        {isMobile && (
          <header style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: `max(12px, env(safe-area-inset-top)) 16px 12px`,
            background: C.surface, borderBottom: `1px solid ${C.border}`,
            position: 'sticky', top: 0, zIndex: 50,
          }}>
            <button onClick={nav.back} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: C.accent, padding: '0 4px', display: 'flex', alignItems: 'center', minWidth: 36, minHeight: 44 }}>‹</button>
            <span style={{
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              fontSize: 15, letterSpacing: '0.12em', color: C.ink, flex: 1, textTransform: 'uppercase',
            }}>Иккаджо</span>
          </header>
        )}

        {/* ── Desktop breadcrumb ── */}
        {!isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '20px 48px', borderBottom: `1px solid ${C.border}`, background: C.surface,
          }}>
            <button onClick={nav.back} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
              fontSize: 11, letterSpacing: '0.1em', color: C.accent,
              textTransform: 'uppercase', padding: 0,
            }}>← БАЗА ТЕХНИК</button>
            <span style={{ color: C.border }}>/</span>
            <span style={{
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              fontSize: 13, letterSpacing: '0.18em', color: C.ink, fontWeight: 600,
            }}>ИККАДЖО</span>
            <div style={{ marginLeft: 'auto' }}>
              <GlobalSearch
                userAccess={userAccess}
                accessLoading={accessLoading}
                onSelect={({ kyu, section, tech }) => nav.technique(kyu, section, tech)}
                placeholder="Поиск техники, кю или раздела…"
                maxWidth={380}
              />
            </div>
          </div>
        )}

        <div className={isMobile ? 'page-has-bottom-nav' : ''} style={{ padding: isMobile ? '20px 18px 24px' : '48px 48px 60px' }}>

          {/* ── Hero ── */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: isMobile ? 14 : 32, marginBottom: isMobile ? 16 : 28 }}>
            {/* 一 kanji watermark */}
            <div style={{
              fontFamily: "'Noto Serif JP', var(--font-noto), serif",
              fontSize: isMobile ? 64 : 140, lineHeight: 0.85,
              color: C.accent, opacity: 0.18, flexShrink: 0,
            }}>一</div>

            <div style={{ flex: 1 }}>
              {/* Eyebrow */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                fontSize: 11, letterSpacing: '0.24em', color: C.muted,
                textTransform: 'uppercase', marginBottom: isMobile ? 8 : 14,
              }}>
                <span style={{ color: C.accent, fontWeight: 600 }}>03</span>
                <span>·</span>
                <span>БАЗА ТЕХНИК · РАЗДЕЛ ПЕРВЫЙ</span>
              </div>

              {/* Title */}
              <div style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: isMobile ? 32 : 64, letterSpacing: '0.04em',
                color: C.ink, fontWeight: 500, lineHeight: 0.92,
              }}>ИККАДЖО</div>

              {/* Description */}
              <div style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: isMobile ? 16 : 20,
                color: C.muted, marginTop: isMobile ? 8 : 10, maxWidth: 540, lineHeight: 1.55,
              }}>
                Программа ученических степеней от 6 кю до 1 кю.{!isMobile && ' Семь разделов, сто восемнадцать техник.'}
              </div>
            </div>

            {/* 進度 counter — desktop only */}
            {!isMobile && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontFamily: "'Noto Serif JP', var(--font-noto), serif",
                  fontSize: 11, color: C.muted, letterSpacing: '0.2em', marginBottom: 6,
                }}>進度</div>
                <div style={{
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                  fontSize: 36, color: C.ink, letterSpacing: '0.04em',
                }}>–– / {totalTechs}</div>
              </div>
            )}
          </div>

          {/* Купить весь Иккаджо — если нет полного доступа и продукт найден */}
          {!hasFull && ikkajoFullProduct && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 12,
              padding: isMobile ? '14px 0 4px' : '16px 0 4px',
            }}>
              <div style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 11, color: C.muted, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
                Полный доступ · все разделы · {ikkajoFullProduct.price?.toLocaleString('ru-RU')} ₽
              </div>
              <button
                onClick={() => setModal({ product: ikkajoFullProduct })}
                style={{
                  padding: '9px 22px', minHeight: 40, border: `1px solid ${C.ink}`,
                  background: C.ink, color: '#ede5d3', cursor: 'pointer',
                  fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                  fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase',
                  transition: 'opacity 0.15s', flexShrink: 0,
                }}>
                Купить весь Иккаджо
              </button>
            </div>
          )}

          {/* Sumi brush stroke divider — desktop only */}
          {!isMobile && (
            <div style={{ margin: '0 0 36px', opacity: 0.3 }}>
              <svg viewBox="0 0 800 12" width="100%" height="12" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <path d="M0 6 Q200 2.5 400 6.5 Q600 10 800 5" stroke={C.ink2} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
          )}


          {/* ── Kyu tabs ── */}
          <div style={{
            display: 'flex', gap: isMobile ? 0 : 8,
            marginBottom: isMobile ? 24 : 36,
            padding: '4px',
            background: C.surface, border: `1px solid ${C.border}`,
            overflowX: isMobile ? 'auto' : 'visible',
          }}>
            {KYU_DATA.map(k => {
              const active = activeKyu === k.id;
              const b = BELT[k.belt] || {};
              return (
                <button key={k.id} onClick={() => switchKyu(k.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: isMobile ? 6 : 10,
                    padding: isMobile ? '10px 14px' : '14px 8px',
                    flex: isMobile ? '0 0 auto' : 1,
                    background: active ? C.ink : 'transparent',
                    border: 'none',
                    color: active ? '#ede5d3' : C.muted,
                    cursor: 'pointer', transition: 'all 0.15s',
                    minHeight: 44, flexShrink: 0,
                  }}>
                  <span style={{
                    width: active ? 10 : 8, height: active ? 10 : 8,
                    borderRadius: '50%',
                    background: active ? 'rgba(255,255,255,0.3)' : b.color,
                    border: `2px solid ${active ? 'rgba(255,255,255,0.3)' : b.border}`,
                    flexShrink: 0, transition: 'all 0.15s',
                  }} />
                  {!isMobile && (
                    <span style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 13, opacity: 0.8 }}>{k.kanji}</span>
                  )}
                  <span style={{
                    fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                    fontSize: isMobile ? 11 : 12, letterSpacing: '0.16em', fontWeight: 500,
                  }}>{k.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── Sections ── */}
          <div key={activeKyu} className="fade" style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 24 : 32 }}>
            {cur?.note && (
              <div style={{ padding: '10px 14px', background: C.surface, border: `1px solid ${C.goldBorder}`, fontSize: isMobile ? 13 : 12, color: C.gold }}>↳ {cur.note}</div>
            )}
            {cur?.sections.map(sec => {
              const sectionKey = sec.id?.toLowerCase();
              const sectionKanji = SECTION_KANJI[sectionKey] || '';
              const isIkkajoSection = IKKAJO_SECTIONS.includes(sectionKey);
              const canAccess = !accessLoading && (!isIkkajoSection || hasIkkajoSectionAccess(userAccess, sectionKey));
              console.log(`[IkkajoPage] sec=${sectionKey} isIkkajoSection=${isIkkajoSection} canAccess=${canAccess} loading=${accessLoading} ua=`, userAccess);
              return (
                <div key={sec.id}>

                  {/* Section header */}
                  <div style={{
                    display: 'flex', alignItems: 'baseline', gap: isMobile ? 10 : 16,
                    padding: '8px 0', borderBottom: `1px solid ${C.border}`, marginBottom: 12,
                    flexWrap: 'wrap',
                  }}>
                    {sectionKanji && (
                      <span style={{
                        fontFamily: "'Noto Serif JP', var(--font-noto), serif",
                        fontSize: isMobile ? 22 : 28,
                        color: canAccess ? C.accent : C.muted,
                        lineHeight: 1, letterSpacing: '0.1em',
                      }}>{sectionKanji}</span>
                    )}
                    <span style={{
                      fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                      fontSize: isMobile ? 16 : 22,
                      color: canAccess ? C.ink : C.muted,
                      letterSpacing: '0.05em', fontWeight: 500,
                    }}>{sec.nameRu}</span>
                    <span style={{
                      fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                      fontSize: isMobile ? 13 : 15, color: C.muted, letterSpacing: '0.03em',
                    }}>{sec.name}</span>
                    <span style={{
                      marginLeft: 'auto',
                      fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                      fontSize: isMobile ? 9 : 10, color: C.muted, letterSpacing: '0.12em',
                    }}>{sec.subtitle}</span>
                    {!canAccess && <span style={{ fontSize: 13 }}>🔒</span>}
                  </div>

                  {canAccess ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                      gap: 1, background: C.border,
                    }}>
                      {sec.techniques.map((tech, i) => (
                        <TechCard
                          key={tech.id}
                          tech={tech}
                          index={i}
                          isMobile={isMobile}
                          videoCount={videoCountByTech[`${sectionKey}_${tech.name}`] || 0}
                          onClick={() => nav.technique(cur, sec, tech)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      background: C.bg2, border: `1px solid ${C.border}`,
                      padding: isMobile ? '24px 18px' : '32px 24px', textAlign: 'center',
                    }}>
                      {sectionKanji && (
                        <div style={{
                          fontFamily: "'Noto Serif JP', var(--font-noto), serif",
                          fontSize: 40, color: C.muted, opacity: 0.5, marginBottom: 10,
                        }}>{sectionKanji}</div>
                      )}
                      <div style={{
                        fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                        fontSize: isMobile ? 16 : 17, color: C.ink2, marginBottom: 6,
                      }}>Раздел недоступен</div>
                      <div style={{
                        fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                        fontSize: 11, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase',
                        marginBottom: 16,
                      }}>Приобретите доступ к разделу «{sec.nameRu}»</div>
                      {(() => {
                        const sp = sectionProductFor(sectionKey);
                        if (!sp) return null;
                        return (
                          <button
                            onClick={() => setModal({ product: sp })}
                            style={{
                              padding: '9px 22px', minHeight: 40,
                              border: `1px solid ${C.ink}`,
                              background: 'transparent', color: C.ink, cursor: 'pointer',
                              fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                              fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase',
                            }}>
                            Купить раздел — {sp.price?.toLocaleString('ru-RU')} ₽
                          </button>
                        );
                      })()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {isMobile && <MobileBottomNav nav={nav} active="database" isAdmin={user?.role === 'admin'} />}

      {/* ── Purchase modal ── */}
      {modal && (
        <IkkajoPurchaseModal
          product={modal.product}
          buying={buying}
          error={buyError}
          onBuy={() => handleBuy(modal.product)}
          onClose={() => { setModal(null); setBuyError(''); }}
        />
      )}
    </div>
  );
}

// ── Technique card ────────────────────────────────────────────────
function TechCard({ tech, index, videoCount, onClick, isMobile }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => !isMobile && setHover(true)}
      onMouseLeave={() => !isMobile && setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: isMobile ? '14px 14px' : '16px 18px',
        background: hover ? C.surface2 : C.surface,
        cursor: 'pointer', transition: 'background 0.1s',
        minHeight: isMobile ? 56 : 'auto',
      }}>
      {/* Number */}
      <span style={{
        fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
        fontSize: 11, color: C.muted, letterSpacing: '0.06em',
        minWidth: 22, flexShrink: 0,
      }}>
        {String(index + 1).padStart(2, '0')}
      </span>
      {/* Name + romanization */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
          fontSize: 15, fontWeight: 500, color: C.ink, letterSpacing: '0.01em',
        }}>{tech.nameRu}</div>
        <div style={{
          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
          fontSize: 15, color: C.muted, marginTop: 1, letterSpacing: '0.03em',
        }}>
          {isMobile && videoCount > 0
            ? `${tech.name} · ${videoCount} видео`
            : tech.name
          }
        </div>
      </div>
      {/* Video count — desktop */}
      {!isMobile && videoCount > 0 && (
        <span style={{
          fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
          fontSize: 11, color: C.accent, letterSpacing: '0.06em', flexShrink: 0,
        }}>{videoCount} видео</span>
      )}
      {/* Arrow */}
      <span style={{
        color: hover ? C.accent : C.muted,
        fontSize: 15, transition: 'color 0.15s', flexShrink: 0,
      }}>→</span>
    </div>
  );
}


// ── IkkajoPurchaseModal ───────────────────────────────────────────
function IkkajoPurchaseModal({ product, buying, error, onBuy, onClose }) {
  if (!product) return null;
  const isFullIkkajo = product.reference === 'ikkajo';
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 400, padding: 20,
      }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#f5f3ee', border: `1px solid ${C.border}`,
          padding: '40px 36px', width: '100%', maxWidth: 360,
          textAlign: 'center', boxShadow: '0 12px 48px rgba(0,0,0,0.14)',
        }}>
        {/* Каnji */}
        <div style={{
          fontFamily: "'Noto Serif JP', var(--font-noto), serif",
          fontSize: 52, color: C.accent, lineHeight: 1, marginBottom: 16, opacity: 0.85,
        }}>{isFullIkkajo ? '一教' : '技'}</div>

        {/* Название */}
        <div style={{
          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
          fontSize: 22, fontWeight: 500, color: C.ink, marginBottom: 4, letterSpacing: '0.03em',
        }}>{product.title}</div>

        {product.description && (
          <div style={{
            fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            fontSize: 15, color: C.muted, marginBottom: 16, lineHeight: 1.5,
          }}>{product.description}</div>
        )}

        {/* Цена */}
        <div style={{
          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
          fontSize: 40, fontWeight: 300, color: C.ink, marginBottom: 6, lineHeight: 1,
        }}>{product.price?.toLocaleString('ru-RU')} ₽</div>

        <div style={{
          fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
          fontSize: 11, color: C.muted, marginBottom: 24, letterSpacing: '0.12em',
        }}>РАЗОВАЯ ОПЛАТА · ПОСТОЯННЫЙ ДОСТУП</div>

        {/* Кнопка оплаты */}
        <button
          disabled={buying}
          onClick={onBuy}
          style={{
            width: '100%', padding: '13px', minHeight: 48,
            background: buying ? C.muted : C.ink, color: '#ede5d3',
            border: 'none', cursor: buying ? 'default' : 'pointer',
            fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
            fontSize: 13, letterSpacing: '0.12em', textTransform: 'uppercase',
            marginBottom: 8, transition: 'background 0.15s',
          }}>
          {buying ? 'Переход к оплате…' : 'Перейти к оплате'}
        </button>

        {error && (
          <div style={{
            fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
            fontSize: 11, color: '#a03030', marginBottom: 8,
          }}>{error}</div>
        )}

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '10px', minHeight: 44,
            background: 'none', border: 'none', color: C.muted,
            cursor: 'pointer', fontSize: 13,
            fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
            letterSpacing: '0.08em',
          }}>
          Отмена
        </button>
      </div>
    </div>
  );
}
