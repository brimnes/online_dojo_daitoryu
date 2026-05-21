'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  useUsers, useAccess, useExams,
  useMonths, useLessons, useTechniques,
  useComments, useVideoUpload,
  useAdminUserAccess, useKnowledge,
  grantAccess, revokeAccess,
} from '@/lib/db';
// Supabase removed — always connected to Timeweb PostgreSQL
import { IKKAJO_SECTION_OPTIONS, IKKAJO_SECTION_LABELS as IKKAJO_LABELS } from '@/lib/ikkajoSections';
import KinescopeUploader from '@/components/KinescopeUploader';

// ═══════════════════════════════════════════════════════════════
// ЦВЕТА
// ═══════════════════════════════════════════════════════════════
// ── Design tokens — exact match to dojo-tokens.jsx (light theme) ──
const C = {
  // rice paper palette
  bg:          '#e6e0d2',
  bg2:         '#d8d0bf',
  surface:     '#f1ece0',
  surface2:    '#f7f2e7',
  ink:         '#15120e',
  ink2:        '#3a342b',
  muted:       '#6f6452',
  hairline:    '#bab09a',
  hairline2:   '#cec3ac',
  accent:      '#9e2f1f',
  accentSoft:  '#d4b8b0',
  gold:        '#8a6e2a',
  goldSoft:    '#c8a978',
  copper:      '#7a4e2a',
  success:     '#4d6a4a',
  danger:      '#8a2a20',
  onAccent:    '#f1ece0',
  // backwards compat aliases
  white:       '#f1ece0',
  border:      '#bab09a',
  dark:        '#15120e',
  light:       '#f7f2e7',
  goldLight:   '#c8a978',
  goldBorder:  '#d0c090',
  goldBg:      '#f6f0e4',
  green:       '#4d6a4a',
  greenBg:     '#eef4ec',
  greenBorder: '#b8d0b0',
  red:         '#9e2f1f',
  redBg:       '#f5ecea',
  redBorder:   '#e8c0b8',
  blue:        '#2a5a9a',
  // espresso sidebar
  side:        '#0a0807',
  side2:       '#13110e',
  sideTop:     '#16130f',
  sideBorder:  '#1f1a16',
  sideText:    '#ede5d3',
  sideText2:   '#c2b59c',
  sideMuted:   '#7a6c52',
  sideActive:  'rgba(0,0,0,0.3)',
  sideGold:    '#b8923a',
};

// ── Font tokens — единая typography system ─────────────────────
const F = {
  serif: "var(--font-cormorant), 'Cormorant Garamond', serif",
  mono:  "var(--font-mono), 'JetBrains Mono', monospace",
  kanji: "var(--font-noto), 'Noto Serif JP', serif",
  sys:   "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

// ── Mobile breakpoint hook ──────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

const LEVELS_LIST  = ['6kyu','5kyu','4kyu','3kyu','2kyu','1kyu','1dan','2dan','3dan'];
const LEVEL_LABELS = {'6kyu':'6 кю','5kyu':'5 кю','4kyu':'4 кю','3kyu':'3 кю','2kyu':'2 кю','1kyu':'1 кю','1dan':'1 дан','2dan':'2 дан','3dan':'3 дан'};
const VIDEO_CAT_IDS    = ['overview','details','mistakes','variations'];
const VIDEO_CAT_LABELS = {overview:'Общий вид',details:'Детальный разбор',mistakes:'Ошибки',variations:'Вариации'};
const VIDEO_CAT_COLORS = {overview:C.dark,details:C.blue,mistakes:C.red,variations:C.gold};

// ═══════════════════════════════════════════════════════════════
// УТИЛИТЫ
// ═══════════════════════════════════════════════════════════════

function extractVideoEmbed(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
  if (yt) return { type: 'youtube', id: yt[1], embed: `https://www.youtube.com/embed/${yt[1]}?rel=0` };
  const vi = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vi) return { type: 'vimeo', id: vi[1], embed: `https://player.vimeo.com/video/${vi[1]}?dnt=1` };
  if (url.includes('.mp4') || url.includes('supabase')) return { type: 'file', url };
  return null;
}

// ═══════════════════════════════════════════════════════════════
// UI-КОМПОНЕНТЫ
// ═══════════════════════════════════════════════════════════════

function Input({ value, onChange, placeholder, type='text' }) {
  return (
    <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{background:C.white,border:`1px solid ${C.border}`,color:C.dark,padding:'8px 12px',fontSize:12,outline:'none',width:'100%',fontFamily:F.sys,boxSizing:'border-box'}}/>
  );
}
function Textarea({ value, onChange, placeholder, rows=3 }) {
  return (
    <textarea value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{background:C.white,border:`1px solid ${C.border}`,color:C.dark,padding:'8px 12px',fontSize:12,outline:'none',width:'100%',resize:'vertical',lineHeight:1.65,fontFamily:F.sys,boxSizing:'border-box'}}/>
  );
}
function Select({ value, onChange, options }) {
  return (
    <select value={value||''} onChange={e=>onChange(e.target.value)}
      style={{background:C.white,border:`1px solid ${C.border}`,color:C.dark,padding:'8px 12px',fontSize:12,outline:'none',cursor:'pointer',fontFamily:F.sys,width:'100%',boxSizing:'border-box'}}>
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
function Btn({ children, onClick, variant='primary', small, disabled, loading }) {
  const s = {primary:{bg:C.dark,color:'#fff',brd:C.dark},success:{bg:C.green,color:'#fff',brd:C.green},danger:{bg:C.red,color:'#fff',brd:C.red},ghost:{bg:'transparent',color:C.muted,brd:C.border},gold:{bg:C.goldBg,color:C.gold,brd:C.goldBorder}}[variant]||{bg:C.dark,color:'#fff',brd:C.dark};
  return (
    <button onClick={onClick} disabled={disabled||loading}
      style={{padding:small?'7px 14px':'10px 20px',background:(disabled||loading)?'#eee':s.bg,color:(disabled||loading)?C.muted:s.color,border:`1px solid ${(disabled||loading)?C.border:s.brd}`,fontSize:small?12:13,cursor:(disabled||loading)?'default':'pointer',fontFamily:F.sys,whiteSpace:'nowrap',transition:'opacity 0.12s',opacity:(disabled||loading)?0.7:1,minHeight:36}}>
      {loading ? '…' : children}
    </button>
  );
}
function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{background:C.white,border:`1px solid ${C.border}`,padding:'16px 18px'}}>
      <div style={{fontSize:9,color:C.muted,letterSpacing:1.5,textTransform:'uppercase',marginBottom:8}}>{label}</div>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:600,color:accent||C.gold,lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:C.muted,marginTop:4}}>{sub}</div>}
    </div>
  );
}
function Label({ children }) {
  return <div style={{fontSize:9,color:C.muted,letterSpacing:1.2,textTransform:'uppercase',marginBottom:6}}>{children}</div>;
}
function Toast({ show, text }) {
  if (!show) return null;
  return (
    <div style={{position:'fixed',bottom:24,right:16,left:16,background:C.green,color:'#fff',padding:'11px 22px',fontSize:13,boxShadow:'0 4px 24px rgba(0,0,0,0.14)',zIndex:9999,display:'flex',alignItems:'center',gap:8}}>
      <span style={{fontSize:16}}>✓</span>{text||'Сохранено'}
    </div>
  );
}
function DBBadge() {
  return (
    <div style={{padding:'4px 10px',background:C.greenBg,border:`1px solid ${C.greenBorder}`,fontSize:9,color:C.green,letterSpacing:0.5}}>
      ● Timeweb подключён
    </div>
  );
}
function Spinner() {
  return <div style={{padding:'40px',textAlign:'center',color:C.muted,fontSize:12}}>Загрузка…</div>;
}

// ── TakedaMon — 4-diamond family crest ─────────────────────────
function TakedaMon({ size=32, color }) {
  const W=19.1, H=11.8, g=3.2;
  const r=(cx,cy)=>`${cx},${cy-H} ${cx+W},${cy} ${cx},${cy+H} ${cx-W},${cy}`;
  const c=50, d=H+g/2, s=W+g/2;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{display:'block',flexShrink:0}}>
      <polygon points={r(c,c-d)} fill={color||C.sideGold}/>
      <polygon points={r(c-s,c)} fill={color||C.sideGold}/>
      <polygon points={r(c+s,c)} fill={color||C.sideGold}/>
      <polygon points={r(c,c+d)} fill={color||C.sideGold}/>
    </svg>
  );
}

// ── Avatar — letter circle with gold ring ───────────────────────
function AvatarCircle({ letter, size=34, color, bg }) {
  return (
    <div style={{width:size,height:size,borderRadius:'50%',background:bg||C.bg2,border:`1px solid ${color||C.goldSoft}`,display:'inline-flex',alignItems:'center',justifyContent:'center',fontFamily:F.serif,fontStyle:'italic',fontSize:size*0.42,color:color||C.goldSoft,flexShrink:0}}>
      {letter}
    </div>
  );
}

// ── Pill2 — design-system pill with kind variants ───────────────
function Pill2({ children, kind='neutral', dot, style }) {
  const kinds = {
    neutral: {bg:'transparent', fg:C.ink2,    border:C.hairline},
    accent:  {bg:'transparent', fg:C.accent,  border:C.accent},
    gold:    {bg:'transparent', fg:C.gold,    border:C.gold},
    success: {bg:'transparent', fg:C.success, border:C.success},
    danger:  {bg:'transparent', fg:C.danger,  border:C.danger},
    muted:   {bg:'transparent', fg:C.muted,   border:C.hairline2},
    solidInk:{bg:C.ink,         fg:C.onAccent,border:C.ink},
  };
  const k = kinds[kind] || kinds.neutral;
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'3px 9px',background:k.bg,color:k.fg,border:`1px solid ${k.border}`,fontFamily:F.mono,fontSize:9,letterSpacing:'0.12em',textTransform:'uppercase',lineHeight:1.4,fontWeight:500,...style}}>
      {dot && <span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:k.fg,flexShrink:0}}/>}
      {children}
    </span>
  );
}

// ── Sparkline2 — mini trend line ────────────────────────────────
function Sparkline2({ data, width=70, height=20, color }) {
  const max=Math.max(...data), min=Math.min(...data), range=max-min||1;
  const step=width/(data.length-1);
  const pts=data.map((v,i)=>`${i*step},${height-((v-min)/range)*(height-2)-1}`).join(' ');
  const lx=((data.length-1)*step), ly=height-((data[data.length-1]-min)/range)*(height-2)-1;
  return (
    <svg width={width} height={height} style={{display:'block',overflow:'visible'}}>
      <polyline points={pts} fill="none" stroke={color||C.accent} strokeWidth="1.2"/>
      <circle cx={lx} cy={ly} r="2.4" fill={color||C.accent}/>
    </svg>
  );
}

// ── SumiStroke — decorative brush divider ──────────────────────
function SumiStroke({ style }) {
  return (
    <svg viewBox="0 0 800 20" style={{width:'100%',height:16,...style}} preserveAspectRatio="none">
      <path d="M0,10 Q200,4 400,10 Q600,16 800,10" stroke={C.ink2} strokeWidth="0.8" fill="none" opacity="0.3"/>
    </svg>
  );
}

// ── FilterChip2 ─────────────────────────────────────────────────
function FilterChip2({ label, value, active, dot, onClick }) {
  return (
    <div onClick={onClick} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'8px 14px',minHeight:36,background:active?C.ink:C.surface,color:active?C.onAccent:C.ink2,border:`1px solid ${active?C.ink:C.hairline}`,fontFamily:F.mono,fontSize:12,fontWeight:500,letterSpacing:'0.04em',cursor:'pointer',flexShrink:0,whiteSpace:'nowrap'}}>
      {dot && <span style={{display:'inline-block',width:6,height:6,borderRadius:'50%',background:dot,flexShrink:0}}/>}
      <span>{label}</span>
      {value !== undefined && (
        <span style={{fontFamily:F.mono,fontSize:10,color:active?'rgba(241,236,224,0.65)':C.muted,letterSpacing:'0.06em'}}>{value}</span>
      )}
    </div>
  );
}

// ── HairlineTable2 — clean no-zebra table ──────────────────────
function HairlineTable2({ columns, rows, dense=false, onRowClick }) {
  const py = dense ? 10 : 14;
  const gridCols = columns.map(c=>c.width||'1fr').join(' ');
  return (
    <div style={{background:C.surface,border:`1px solid ${C.hairline}`}}>
      {/* Header */}
      <div style={{display:'grid',gridTemplateColumns:gridCols,borderBottom:`1px solid ${C.hairline}`,background:C.bg2}}>
        {columns.map((col,i)=>(
          <div key={i} style={{padding:`${py}px 16px`,fontFamily:F.mono,fontSize:9,letterSpacing:'0.18em',color:C.muted,textTransform:'uppercase',fontWeight:600,textAlign:col.align||'left',display:'flex',alignItems:'center',justifyContent:col.align==='right'?'flex-end':col.align==='center'?'center':'flex-start',gap:6}}>
            <span>{col.label}</span>
            {col.sort && <span style={{opacity:0.4}}>↕</span>}
          </div>
        ))}
      </div>
      {/* Rows */}
      {rows.map((row,ri)=>(
        <div key={ri} onClick={()=>onRowClick&&onRowClick(row,ri)} style={{display:'grid',gridTemplateColumns:gridCols,borderBottom:ri<rows.length-1?`1px solid ${C.hairline}`:'none',cursor:onRowClick?'pointer':'default'}}>
          {columns.map((col,ci)=>(
            <div key={ci} style={{padding:`${py+2}px 16px`,fontFamily:F.mono,fontSize:13,color:C.ink,lineHeight:1.45,textAlign:col.align||'left',display:'flex',alignItems:'center',justifyContent:col.align==='right'?'flex-end':col.align==='center'?'center':'flex-start',minWidth:0}}>
              {col.render ? col.render(row,ri) : row[col.key]}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ── AdminSectionHead ────────────────────────────────────────────
function AdminSectionHead({ num, title, subtitle, kanji, actions }) {
  return (
    <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:24,marginBottom:18}}>
      <div style={{display:'flex',alignItems:'flex-end',gap:14,minWidth:0}}>
        {kanji && <span style={{fontFamily:F.kanji,fontSize:72,lineHeight:0.85,color:C.accent,opacity:0.14,letterSpacing:0,flexShrink:0}}>{kanji}</span>}
        <div style={{minWidth:0}}>
          {(num||subtitle) && (
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
              {num && <span style={{fontFamily:F.mono,fontSize:9,color:C.accent,letterSpacing:'0.22em'}}>{num}</span>}
              {subtitle && <span style={{fontFamily:F.serif,fontStyle:'italic',fontSize:12,color:C.muted}}>{subtitle}</span>}
            </div>
          )}
          <div style={{fontFamily:F.serif,fontSize:32,color:C.ink,letterSpacing:'0.04em',lineHeight:1,fontWeight:500}}>{title}</div>
        </div>
      </div>
      {actions && <div style={{display:'flex',gap:10,alignItems:'center',flexShrink:0}}>{actions}</div>}
    </div>
  );
}

// ── Btn2 — design-system button ─────────────────────────────────
function Btn2({ children, onClick, kind='primary', size='md', full, disabled }) {
  const kinds = {
    primary: {bg:C.ink,    color:C.onAccent, border:C.ink},
    accent:  {bg:C.accent, color:C.onAccent, border:C.accent},
    quiet:   {bg:'transparent', color:C.ink2, border:C.hairline},
    ghost:   {bg:'transparent', color:C.ink2, border:C.hairline},
    ink:     {bg:C.ink,    color:C.onAccent, border:C.ink},
  };
  const k=kinds[kind]||kinds.quiet;
  const py=size==='sm'?7:10, px=size==='sm'?14:20, fs=size==='sm'?10:12;
  return (
    <button onClick={onClick} disabled={disabled}
      style={{padding:`${py}px ${px}px`,background:disabled?C.bg:k.bg,color:disabled?C.muted:k.color,border:`1px solid ${disabled?C.hairline:k.border}`,fontSize:fs,cursor:disabled?'default':'pointer',fontFamily:F.mono,letterSpacing:'0.08em',textTransform:'uppercase',whiteSpace:'nowrap',lineHeight:1,width:full?'100%':undefined,fontWeight:500,transition:'opacity 0.12s',opacity:disabled?0.5:1}}>
      {children}
    </button>
  );
}

function VideoPreview({ url }) {
  const embed = extractVideoEmbed(url);
  if (!embed) return null;
  if (embed.type === 'file') return <video controls src={embed.url} style={{width:'100%',maxHeight:240,background:'#000'}} />;
  return (
    <div style={{position:'relative',paddingBottom:'56.25%',height:0,background:'#000',marginTop:10}}>
      <iframe src={embed.embed} title="video" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowFullScreen
        style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none'}}/>
    </div>
  );
}

function VideoInput({ videoUrl, onChange, onSave, saving }) {
  const fileRef = useRef();
  const { uploadFile, uploading } = useVideoUpload();
  const embed = extractVideoEmbed(videoUrl);
  const handleFile = async (file) => {
    const path = `uploads/${Date.now()}-${file.name.replace(/\s/g,'_')}`;
    const { ok, url, error } = await uploadFile(file, path);
    if (ok) onChange(url);
    else alert('Ошибка загрузки: ' + error);
  };
  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:8,flexWrap:'wrap'}}>
        <div style={{flex:1,minWidth:0}}><Input value={videoUrl} onChange={onChange} placeholder="https://youtube.com/..."/></div>
        <Btn onClick={onSave} variant='gold' small loading={saving}>Сохранить</Btn>
      </div>
      {embed && <VideoPreview url={videoUrl} />}
      <div style={{display:'flex',alignItems:'center',gap:8,marginTop:10}}>
        <div style={{height:1,flex:1,background:C.border}}/>
        <span style={{fontSize:10,color:C.muted}}>или загрузить файл</span>
        <div style={{height:1,flex:1,background:C.border}}/>
      </div>
      <input ref={fileRef} type="file" accept="video/mp4,video/mov,video/webm" style={{display:'none'}} onChange={e=>{if(e.target.files[0])handleFile(e.target.files[0]);}}/>
      <button onClick={()=>fileRef.current.click()} disabled={uploading}
        style={{width:'100%',marginTop:8,padding:'10px',background:C.bg,border:`1px dashed ${C.border}`,color:C.muted,fontSize:11,cursor:'pointer',boxSizing:'border-box'}}>
        {uploading ? 'Загрузка…' : 'Выбрать файл (mp4, mov, webm)'}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LAYOUT
// ═══════════════════════════════════════════════════════════════

const SECTIONS = [
  {id:'dashboard', num:'01', label:'Дашборд',        kanji:'見'},
  {id:'users',     num:'02', label:'Ученики',         kanji:'人'},
  {id:'months',    num:'03', label:'Месяцы и уроки',  kanji:'月'},
  {id:'ikkajo',    num:'04', label:'База техник',     kanji:'技'},
  {id:'knowledge', num:'05', label:'База знаний',     kanji:'智'},
  {id:'payments',  num:'06', label:'Платежи',         kanji:'銭'},
  {id:'exams',     num:'07', label:'Аттестации',      kanji:'段'},
  {id:'comments',  num:'08', label:'Комментарии',     kanji:'声'},
  // hidden (functional, not in nav)
  {id:'access',    num:'',   label:'Доступы',         kanji:'鍵', hidden:true},
];

export default function AdminPanel({ onExit }) {
  const [section,       setSection]       = useState('dashboard');
  const [toast,         setToast]         = useState(false);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const isMobile = useIsMobile();

  const showToast = useCallback((text) => {
    setToast(text || 'Сохранено');
    setTimeout(() => setToast(false), 2400);
  }, []);

  const { exams } = useExams();
  const pendingCount = exams.filter(e => e.status === 'pending').length;

  // Close drawer when switching to desktop
  useEffect(() => { if (!isMobile) setDrawerOpen(false); }, [isMobile]);

  const handleSectionSelect = (id) => {
    setSection(id);
    setDrawerOpen(false); // auto-close drawer on mobile
  };

  const SidebarContent = () => (
    <aside style={{width:'100%',height:'100%',background:C.side,borderRight:`1px solid ${C.sideBorder}`,display:'flex',flexDirection:'column',position:'relative',backgroundImage:`linear-gradient(180deg,${C.sideTop||'#16130f'} 0%,${C.side} 30%,${C.side2} 100%)`,boxShadow:'inset -1px 0 0 rgba(184,146,58,0.06)'}}>
      {/* top accent stripe */}
      <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${C.accent} 30%,${C.sideGold} 70%,transparent)`,opacity:0.5}}/>

      {/* Brand */}
      <div style={{padding:'26px 26px 18px',display:'flex',alignItems:'center',gap:12,position:'relative'}}>
        <TakedaMon size={26} color={C.sideGold}/>
        <div style={{minWidth:0}}>
          <div style={{fontFamily:F.serif,fontSize:10,letterSpacing:'0.22em',color:C.sideText,fontWeight:600}}>ONLINE DAITO-RYU</div>
          <div style={{display:'flex',alignItems:'center',gap:8,marginTop:4}}>
            <span style={{fontFamily:F.kanji,fontSize:10,color:C.sideGold,letterSpacing:'0.18em',opacity:0.75}}>管理</span>
            <span style={{fontFamily:F.mono,fontSize:9,color:C.accent,letterSpacing:'0.18em',textTransform:'uppercase'}}>· admin</span>
          </div>
        </div>
        {isMobile && (
          <button onClick={()=>setDrawerOpen(false)} style={{marginLeft:'auto',background:'none',border:'none',color:C.sideMuted,cursor:'pointer',fontSize:18,lineHeight:1,padding:'4px',flexShrink:0}}>✕</button>
        )}
      </div>
      <div style={{height:1,background:C.sideBorder}}/>

      {/* Admin card */}
      <div style={{padding:'18px 26px',position:'relative'}}>
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <div style={{width:38,height:38,borderRadius:'50%',background:C.side2,border:`1px solid ${C.sideGold}`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:F.serif,fontStyle:'italic',fontSize:17,color:C.sideGold,flexShrink:0}}>С</div>
          <div style={{minWidth:0}}>
            <div style={{fontFamily:F.mono,fontSize:13,fontWeight:500,color:C.sideText}}>Сэнсэй</div>
            <div style={{fontFamily:F.mono,fontSize:9,color:C.sideMuted,letterSpacing:'0.08em',textTransform:'uppercase'}}>главный администратор</div>
          </div>
        </div>
      </div>
      <div style={{height:1,background:C.sideBorder}}/>

      {/* Nav */}
      <nav style={{flex:1,padding:'10px 0',position:'relative',overflowY:'auto'}}>
        {SECTIONS.filter(s=>!s.hidden).map(s=>{
          const isA = section===s.id;
          return (
            <button key={s.id} onClick={()=>handleSectionSelect(s.id)}
              style={{width:'100%',display:'flex',alignItems:'center',gap:14,padding:'11px 26px',borderLeft:`2px solid ${isA?C.accent:'transparent'}`,background:isA?C.sideActive:'transparent',border:'none',borderLeft:`2px solid ${isA?C.accent:'transparent'}`,cursor:'pointer',textAlign:'left',minHeight:44}}>
              <span style={{fontFamily:F.mono,fontSize:10,color:isA?C.accent:C.sideMuted,letterSpacing:'0.06em',minWidth:20,flexShrink:0}}>{s.num}</span>
              <span style={{fontFamily:F.mono,fontSize:13,color:isA?C.sideText:C.sideText2,fontWeight:isA?600:400,flex:1,letterSpacing:'0.02em'}}>{s.label}</span>
              {s.id==='exams'&&pendingCount>0&&(
                <span style={{background:C.accent,color:C.onAccent,fontSize:8,padding:'1px 5px',borderRadius:10,letterSpacing:'0.04em'}}>{pendingCount}</span>
              )}
              <span style={{marginLeft:'auto',fontFamily:F.kanji,fontSize:12,color:isA?C.sideGold:C.sideMuted,opacity:0.8,flexShrink:0}}>{s.kanji}</span>
            </button>
          );
        })}
      </nav>
      <div style={{height:1,background:C.sideBorder}}/>

      {/* Bottom links */}
      <div style={{padding:'14px 26px',display:'flex',flexDirection:'column',gap:8,position:'relative'}}>
        {onExit && (
          <span onClick={onExit} style={{fontFamily:F.mono,fontSize:11,color:C.sideMuted,letterSpacing:'0.06em',cursor:'pointer'}}>↗ Открыть сайт</span>
        )}
        <span onClick={onExit} style={{fontFamily:F.mono,fontSize:11,color:C.sideMuted,letterSpacing:'0.06em',cursor:'pointer'}}>↳ Выйти</span>
      </div>
      {/* Watermark */}
      <div style={{position:'absolute',bottom:12,right:14,fontFamily:F.kanji,fontSize:11,color:C.sideGold,letterSpacing:'0.2em',opacity:0.35,pointerEvents:'none'}}>武道</div>
    </aside>
  );

  const activeSection = SECTIONS.find(s=>s.id===section);
  const today = new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});

  return (
    <div style={{display:'flex',minHeight:'100vh',background:C.bg,fontFamily:F.sys,color:C.dark,position:'relative'}}>

      {/* ── Desktop sidebar ─────────────────────────────────── */}
      {!isMobile && (
        <aside style={{width:260,flexShrink:0,position:'sticky',top:0,height:'100vh'}}>
          <SidebarContent/>
        </aside>
      )}

      {/* ── Mobile: top bar + drawer ─────────────────────────── */}
      {isMobile && (
        <>
          {/* Top bar */}
          <div style={{position:'fixed',top:0,left:0,right:0,zIndex:200,background:C.side,borderBottom:`1px solid ${C.sideBorder}`,display:'flex',alignItems:'center',padding:'0 16px',height:52}}>
            <button onClick={()=>setDrawerOpen(true)}
              style={{background:'none',border:'none',fontSize:22,cursor:'pointer',color:C.sideMuted,padding:'8px',marginRight:8,lineHeight:1,minWidth:40,minHeight:40}}>
              ☰
            </button>
            <div style={{fontFamily:"'Noto Serif JP',serif",fontSize:16,color:C.sideGold,marginRight:8}}>管</div>
            <div style={{fontFamily:"var(--font-cormorant), 'Cormorant Garamond', serif",fontSize:11,letterSpacing:2,color:C.sideText}}>
              {activeSection?.label || 'ADMIN'}
            </div>
            {pendingCount>0 && (
              <span style={{marginLeft:8,background:C.accent,color:'#fff',fontSize:9,padding:'1px 6px',borderRadius:10}}>{pendingCount}</span>
            )}
          </div>

          {/* Overlay */}
          {drawerOpen && (
            <div onClick={()=>setDrawerOpen(false)}
              style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:299}}/>
          )}

          {/* Drawer */}
          <aside style={{
            position:'fixed',top:0,left:0,bottom:0,
            width:260,
            background:C.side,
            borderRight:`1px solid ${C.sideBorder}`,
            display:'flex',flexDirection:'column',
            zIndex:300,
            transform:drawerOpen?'translateX(0)':'translateX(-100%)',
            transition:'transform 0.24s ease',
          }}>
            <SidebarContent/>
          </aside>
        </>
      )}

      {/* ── Main content ────────────────────────────────────── */}
      <main style={{flex:1,overflow:'auto',minWidth:0,paddingTop:isMobile?52:0,display:'flex',flexDirection:'column'}}>

        {/* ── Admin top bar (desktop) ─────────────────────── */}
        {!isMobile && (
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 36px',height:56,borderBottom:`1px solid ${C.hairline}`,background:C.surface,gap:24,flexShrink:0}}>
            {/* Breadcrumb */}
            <div style={{display:'flex',alignItems:'center',gap:14,flexShrink:0}}>
              {activeSection?.kanji && <span style={{fontFamily:F.kanji,fontSize:14,color:C.accent,letterSpacing:'0.14em',opacity:0.85}}>管理 · {activeSection.kanji}</span>}
              <span style={{fontFamily:F.serif,fontSize:12,letterSpacing:'0.2em',color:C.ink,fontWeight:600,textTransform:'uppercase'}}>{activeSection?.label}</span>
              <span style={{color:C.hairline}}>/</span>
              <span style={{fontFamily:F.serif,fontStyle:'italic',fontSize:13,color:C.muted}}>{today}</span>
            </div>
            {/* Search */}
            <div style={{display:'flex',alignItems:'center',gap:10,background:C.bg,border:`1px solid ${C.hairline}`,padding:'8px 14px',flex:1,maxWidth:380}}>
              <span style={{color:C.muted,fontSize:14}}>⌕</span>
              <span style={{fontFamily:F.serif,fontStyle:'italic',fontSize:13,color:C.muted,flex:1}}>Поиск ученика, урока, техники…</span>
              <span style={{fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:'0.1em',border:`1px solid ${C.hairline2}`,padding:'1px 5px'}}>⌘K</span>
            </div>
            {/* Actions */}
            <div style={{display:'flex',gap:10,flexShrink:0}}>
              <Btn2 kind="quiet" size="sm">Экспорт ↓</Btn2>
              <Btn2 kind="accent" size="sm">+ Новый урок</Btn2>
            </div>
          </div>
        )}

        <div key={section} style={{flex:1}}>
          {section==='dashboard' && <SectionDashboard showToast={showToast} isMobile={isMobile} onNavigate={setSection}/>}
          {section==='users'     && <SectionUsers     showToast={showToast} isMobile={isMobile}/>}
          {section==='access'    && <SectionAccess    showToast={showToast} isMobile={isMobile}/>}
          {section==='knowledge' && <SectionKnowledge showToast={showToast} isMobile={isMobile}/>}
          {section==='exams'     && <SectionExams     showToast={showToast} isMobile={isMobile}/>}
          {section==='payments'  && <SectionPayments                        isMobile={isMobile}/>}
          {section==='months'    && <SectionMonths    showToast={showToast} isMobile={isMobile}/>}
          {section==='ikkajo'    && <SectionIkkajo    showToast={showToast} isMobile={isMobile}/>}
          {section==='comments'  && <SectionComments  showToast={showToast} isMobile={isMobile}/>}
        </div>
      </main>

      <Toast show={!!toast} text={typeof toast==='string'?toast:'Сохранено'}/>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 0. ДАШБОРД — данные из дизайн-файла
// ═══════════════════════════════════════════════════════════════
const LEVEL_KANJI_MAP = {'6kyu':'六','5kyu':'五','4kyu':'四','3kyu':'三','2kyu':'二','1kyu':'一','1dan':'初','2dan':'二','3dan':'三'};
const MONTHS_SHORT = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

const DASH_METRICS_PROTO = [
  { label: 'Учеников',           kanji:'人', value:'342',    delta:'+12 за неделю', deltaDir:'up',   sub:'· 287 активных' },
  { label: 'Доход за месяц',     kanji:'銭', value:'486',    unit:'тыс. ₽',         delta:'+18%',     deltaDir:'up',   sub:'· к маю' },
  { label: 'Просмотры уроков',   kanji:'視', value:'12 480', delta:'+4%',            deltaDir:'up',   sub:'· за 7 дней' },
  { label: 'Заявок на экзамен',  kanji:'段', value:'14',     delta:'6 ждут',         deltaDir:'flat', sub:'· проверки' },
  { label: 'Новых комментариев', kanji:'声', value:'38',     delta:'3 на модерации', deltaDir:'flat' },
  { label: 'Уроков опубликовано',kanji:'巻', value:'89',     delta:'/ 124',          deltaDir:'flat', sub:'· программа' },
];

const RECENT_ACTIVITY_PROTO = [
  { time:'11:42', kanji:'銭', actor:'А. Соколов',   verb:'купил доступ',           target:'Никаджо · Татияй',          cost:'3 000 ₽', tone:'gold' },
  { time:'11:28', kanji:'段', actor:'М. Иванова',   verb:'подала заявку',          target:'4 кю · экзамен',            cost:null,      tone:'accent' },
  { time:'10:53', kanji:'声', actor:'К. Орлов',     verb:'оставил комментарий',    target:'Иппон-дори · урок 4',       cost:null,      tone:'neutral' },
  { time:'10:11', kanji:'人', actor:'Новый ученик', verb:'зарегистрировался',      target:'Е. Тарасова · из Москвы',   cost:null,      tone:'success' },
  { time:'09:47', kanji:'銭', actor:'Д. Лебедев',   verb:'оплатил',                target:'Подписка · год',            cost:'19 900 ₽',tone:'gold' },
  { time:'09:24', kanji:'段', actor:'Сэнсэй',       verb:'подтвердил аттестацию',  target:'И. Тарасов · 5 кю → 4 кю', cost:null,      tone:'success' },
  { time:'08:55', kanji:'巻', actor:'Сэнсэй',       verb:'опубликовал урок',       target:'Сихо-нагэ · детально',      cost:null,      tone:'neutral' },
  { time:'08:12', kanji:'声', actor:'А. Кузнецов',  verb:'задал вопрос',           target:'Хандза-хандати · вход',     cost:null,      tone:'accent' },
];

const PENDING_EXAMS_PROTO = [
  { name:'Иван Тарасов',     from:'4 кю', to:'3 кю', kanji:'三', when:'через 4 дн.',  city:'Москва' },
  { name:'Мария Иванова',    from:'5 кю', to:'4 кю', kanji:'四', when:'через 6 дн.',  city:'Санкт-Петербург' },
  { name:'Дмитрий Лебедев',  from:'6 кю', to:'5 кю', kanji:'五', when:'через 9 дн.',  city:'Казань' },
  { name:'Екатерина Орлова', from:'без',  to:'6 кю', kanji:'六', when:'через 12 дн.', city:'Новосибирск' },
];

const POPULAR_TECHNIQUES_PROTO = [
  { rank:'01', name:'Иппон-дори',       jp:'Ippon-dori',       views:1842, trend:[8,12,10,14,18,22,20,26] },
  { rank:'02', name:'Котэ-гаэси',       jp:'Kote-gaeshi',      views:1430, trend:[10,14,13,12,15,18,17,20] },
  { rank:'03', name:'Сихо-нагэ',        jp:'Shihō-nage',       views:1218, trend:[6,8,11,10,14,13,16,15] },
  { rank:'04', name:'Идори иппон-дори', jp:'Idori ippon-dori', views:980,  trend:[4,6,7,9,10,12,14,13] },
  { rank:'05', name:'Ирими-нагэ',       jp:'Irimi-nage',       views:822,  trend:[3,5,6,8,10,11,13,14] },
];

const REVENUE_BARS_PROTO = [
  { m:'янв', v:0.42 }, { m:'фев', v:0.51 }, { m:'мар', v:0.58 },
  { m:'апр', v:0.67 }, { m:'май', v:0.86, current:true },
  { m:'июн', v:0.32, projected:true },
];

function SectionDashboard({showToast, isMobile, onNavigate}) {
  const {exams}      = useExams();
  const {payments}   = useAccess();
  const {techniques} = useTechniques();
  const [period, setPeriod] = useState('7d');

  // Use real pending exams if available, else proto data
  const realPending = exams.filter(e=>e.status==='pending');
  const pendingList = realPending.length > 0
    ? realPending.map(e=>({name:e.userName||'—', from:LEVEL_LABELS[e.currentLevel]||e.currentLevel||'—', to:LEVEL_LABELS[e.targetLevel]||e.targetLevel, kanji:LEVEL_KANJI_MAP[e.targetLevel]||'?', when:e.date||'—', city:'—'}))
    : PENDING_EXAMS_PROTO;

  const thisMonthStr = new Date().toLocaleString('ru-RU',{month:'long',year:'numeric'});

  return (
    <div style={{background:C.bg,minHeight:'100%',fontFamily:F.mono}}>
      <div style={{padding:'32px 36px 60px'}}>

        {/* ── Section head ──────────────────────────────────── */}
        <AdminSectionHead
          num="01" kanji="見" title="Сводка"
          subtitle={`Доходы, ученики, активность · ${thisMonthStr}`}
          actions={
            <div style={{display:'flex',gap:4}}>
              {[['today','сегодня'],['7d','7 дней'],['30d','30 дней'],['year','год']].map(([k,l])=>(
                <Pill2 key={k} kind={period===k?'solidInk':'muted'} style={{cursor:'pointer'}} onClick={()=>setPeriod(k)}>{l}</Pill2>
              ))}
            </div>
          }
        />
        <SumiStroke style={{margin:'0 0 28px'}}/>

        {/* ── 6 metric tiles ─────────────────────────────────── */}
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(6,1fr)',gap:14,marginBottom:36}}>
          {DASH_METRICS_PROTO.map((m,i)=>(
            <div key={i} style={{background:C.surface,border:`1px solid ${C.hairline}`,padding:'18px 20px',position:'relative',display:'flex',flexDirection:'column',gap:4,minHeight:isMobile?100:120,cursor:'pointer'}}
              onClick={()=>onNavigate(['users','payments','months','exams','comments','months'][i])}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
                <span style={{fontFamily:F.mono,fontSize:9,letterSpacing:'0.22em',color:C.muted,textTransform:'uppercase'}}>{m.label}</span>
                <span style={{fontFamily:F.kanji,fontSize:14,color:C.copper,opacity:0.55}}>{m.kanji}</span>
              </div>
              <div style={{display:'flex',alignItems:'baseline',gap:6}}>
                <span style={{fontFamily:F.serif,fontSize:isMobile?28:38,color:C.ink,fontWeight:500,lineHeight:1,letterSpacing:'0.02em'}}>{m.value}</span>
                {m.unit && <span style={{fontFamily:F.serif,fontStyle:'italic',fontSize:14,color:C.muted}}>{m.unit}</span>}
              </div>
              <div style={{display:'flex',alignItems:'center',gap:8,marginTop:'auto'}}>
                {m.delta && (
                  <span style={{fontFamily:F.mono,fontSize:10,color:m.deltaDir==='up'?C.success:m.deltaDir==='down'?C.danger:C.muted,letterSpacing:'0.04em'}}>
                    {m.deltaDir==='up'?'▲':m.deltaDir==='down'?'▼':'·'} {m.delta}
                  </span>
                )}
                {m.sub && <span style={{fontFamily:F.mono,fontSize:10,color:C.muted}}>{m.sub}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* ── 2-column layout ──────────────────────────────────── */}
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1.4fr 1fr',gap:24}}>

          {/* LEFT */}
          <div style={{display:'flex',flexDirection:'column',gap:24}}>

            {/* Revenue chart */}
            <div style={{background:C.surface,border:`1px solid ${C.hairline}`}}>
              <div style={{padding:'16px 22px',borderBottom:`1px solid ${C.hairline}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <span style={{fontFamily:F.kanji,fontSize:13,color:C.gold,letterSpacing:'0.14em',opacity:0.8}}>収益</span>
                  <span style={{fontFamily:F.serif,fontSize:12,letterSpacing:'0.18em',color:C.ink,fontWeight:600}}>ДОХОДЫ · 6 МЕС.</span>
                </div>
                <div style={{display:'flex',alignItems:'baseline',gap:6}}>
                  <span style={{fontFamily:F.serif,fontSize:24,color:C.ink,letterSpacing:'0.04em'}}>2 480</span>
                  <span style={{fontFamily:F.serif,fontStyle:'italic',fontSize:12,color:C.muted}}>тыс. ₽ · полгода</span>
                </div>
              </div>
              <div style={{padding:'24px 22px 18px',display:'flex',alignItems:'flex-end',gap:18,height:220}}>
                {REVENUE_BARS_PROTO.map((b,i)=>(
                  <div key={i} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:10,justifyContent:'flex-end',height:'100%'}}>
                    <div style={{fontFamily:F.mono,fontSize:10,color:b.current?C.accent:C.muted,letterSpacing:'0.06em'}}>
                      {Math.round(b.v*565)}к
                    </div>
                    <div style={{width:'100%',maxWidth:56,height:`${b.v*100}%`,background:b.current?C.accent:b.projected?'transparent':C.ink2,border:b.projected?`1px dashed ${C.hairline}`:'none',minHeight:6}}/>
                    <div style={{fontFamily:F.mono,fontSize:10,color:b.current?C.accent:C.muted,letterSpacing:'0.16em',textTransform:'uppercase',fontWeight:b.current?600:400}}>{b.m}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity feed */}
            <div style={{background:C.surface,border:`1px solid ${C.hairline}`}}>
              <div style={{padding:'16px 22px',borderBottom:`1px solid ${C.hairline}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <span style={{fontFamily:F.kanji,fontSize:13,color:C.gold,letterSpacing:'0.14em',opacity:0.8}}>動静</span>
                  <span style={{fontFamily:F.serif,fontSize:12,letterSpacing:'0.18em',color:C.ink,fontWeight:600}}>АКТИВНОСТЬ · СЕГОДНЯ</span>
                </div>
                <span onClick={()=>onNavigate('payments')} style={{fontFamily:F.mono,fontSize:10,color:C.accent,letterSpacing:'0.12em',cursor:'pointer'}}>ВСЯ ЛЕНТА →</span>
              </div>
              <div>
                {RECENT_ACTIVITY_PROTO.map((a,i)=>(
                  <div key={i} style={{display:'grid',gridTemplateColumns:'64px 26px 1fr auto',gap:14,alignItems:'center',padding:'14px 22px',borderBottom:i<RECENT_ACTIVITY_PROTO.length-1?`1px solid ${C.hairline}`:'none'}}>
                    <span style={{fontFamily:F.mono,fontSize:10,color:C.muted,letterSpacing:'0.08em'}}>{a.time}</span>
                    <span style={{fontFamily:F.kanji,fontSize:18,color:C.accent,opacity:0.7,lineHeight:1}}>{a.kanji}</span>
                    <div style={{minWidth:0,fontFamily:F.mono,fontSize:13,color:C.ink,lineHeight:1.45}}>
                      <span style={{fontWeight:600}}>{a.actor}</span>{' '}
                      <span style={{color:C.muted}}>{a.verb}</span>{' '}
                      <span style={{fontFamily:F.serif,fontStyle:'italic',color:C.ink2}}>{a.target}</span>
                    </div>
                    <div>
                      {a.cost
                        ? <span style={{fontFamily:F.mono,fontSize:11,color:C.gold,letterSpacing:'0.06em',fontWeight:600}}>{a.cost}</span>
                        : <Pill2 kind={a.tone==='accent'?'accent':a.tone==='success'?'success':a.tone==='gold'?'gold':'muted'}>
                            {a.tone==='accent'?'требует':a.tone==='success'?'готово':a.tone==='gold'?'оплата':'событие'}
                          </Pill2>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div style={{display:'flex',flexDirection:'column',gap:24}}>

            {/* Pending exams */}
            <div style={{background:C.surface,border:`1px solid ${C.hairline}`,position:'relative'}}>
              <div style={{position:'absolute',top:14,right:14,width:6,height:6,background:C.accent,transform:'rotate(45deg)'}}/>
              <div style={{padding:'16px 22px',borderBottom:`1px solid ${C.hairline}`}}>
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}>
                  <span style={{fontFamily:F.kanji,fontSize:13,color:C.accent,letterSpacing:'0.14em'}}>段</span>
                  <span style={{fontFamily:F.serif,fontSize:12,letterSpacing:'0.18em',color:C.ink,fontWeight:600}}>АТТЕСТАЦИИ В ОЧЕРЕДИ</span>
                </div>
                <span style={{fontFamily:F.serif,fontStyle:'italic',fontSize:12,color:C.muted}}>
                  {exams.length||14} заявок · {pendingList.length} ждут проверки
                </span>
              </div>
              <div>
                {pendingList.map((e,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 22px',borderBottom:i<pendingList.length-1?`1px solid ${C.hairline}`:'none'}}>
                    <AvatarCircle letter={e.name.charAt(0)} size={36}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:F.mono,fontSize:13,color:C.ink,fontWeight:500}}>{e.name}</div>
                      <div style={{fontFamily:F.mono,fontSize:10,color:C.muted,letterSpacing:'0.06em',marginTop:2}}>
                        {e.from} → {e.to} · {e.city}
                      </div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontFamily:F.kanji,fontSize:18,color:C.accent,lineHeight:1,opacity:0.85}}>{e.kanji}</div>
                      <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:'0.06em',marginTop:4}}>{e.when}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{padding:'12px 22px',borderTop:`1px solid ${C.hairline}`}}>
                <Btn2 kind="ghost" full onClick={()=>onNavigate('exams')}>Открыть все заявки →</Btn2>
              </div>
            </div>

            {/* Popular techniques */}
            <div style={{background:C.surface,border:`1px solid ${C.hairline}`}}>
              <div style={{padding:'16px 22px',borderBottom:`1px solid ${C.hairline}`,display:'flex',alignItems:'center',gap:12}}>
                <span style={{fontFamily:F.kanji,fontSize:13,color:C.gold,letterSpacing:'0.14em',opacity:0.85}}>人気</span>
                <span style={{fontFamily:F.serif,fontSize:12,letterSpacing:'0.18em',color:C.ink,fontWeight:600}}>ПОПУЛЯРНЫЕ ТЕХНИКИ</span>
              </div>
              <div>
                {POPULAR_TECHNIQUES_PROTO.map((p,i)=>(
                  <div key={i} style={{display:'grid',gridTemplateColumns:'24px 1fr 80px 60px',gap:14,alignItems:'center',padding:'12px 22px',borderBottom:i<POPULAR_TECHNIQUES_PROTO.length-1?`1px solid ${C.hairline}`:'none'}}>
                    <span style={{fontFamily:F.mono,fontSize:10,color:C.muted,letterSpacing:'0.06em'}}>{p.rank}</span>
                    <div style={{minWidth:0}}>
                      <div style={{fontFamily:F.mono,fontSize:13,color:C.ink,fontWeight:500}}>{p.name}</div>
                      <div style={{fontFamily:F.serif,fontStyle:'italic',fontSize:11,color:C.muted}}>{p.jp}</div>
                    </div>
                    <Sparkline2 data={p.trend} width={70} height={20}/>
                    <span style={{fontFamily:F.mono,fontSize:11,color:C.ink2,letterSpacing:'0.04em',textAlign:'right'}}>{p.views.toLocaleString('ru-RU')}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SectionHeader ────────────────────────────────────────────────
function SectionHeader({title,subtitle,action,isMobile}){
  return(
    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',padding:isMobile?'20px 16px 16px':'28px 36px 20px',borderBottom:`1px solid ${C.border}`,background:C.white,flexWrap:'wrap',gap:8}}>
      <div>
        <div style={{fontSize:9,color:C.gold,letterSpacing:2,textTransform:'uppercase',marginBottom:6}}>Управление</div>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:isMobile?22:26,fontWeight:600,color:C.dark,margin:0}}>{title}</h1>
        {subtitle&&<div style={{fontSize:12,color:C.muted,marginTop:3}}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

// ── StatGrid: responsive 2 or 4 cols ─────────────────────────────
function StatGrid({children,cols=4,isMobile}){
  const mobileCols = Math.min(cols,2);
  return(
    <div style={{display:'grid',gridTemplateColumns:`repeat(${isMobile?mobileCols:cols},1fr)`,gap:2,marginBottom:20}}>
      {children}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 1. ПОЛЬЗОВАТЕЛИ
// ═══════════════════════════════════════════════════════════════
function SectionUsers({showToast,isMobile}){
  const {users,loading,updateLevel} = useUsers();
  const {payments} = useAccess();
  const [selected,  setSelected]  = useState(null);
  const [editLevel, setEditLevel] = useState('');
  const [saving,    setSaving]    = useState(false);
  const [filter,    setFilter]    = useState('all');
  const [search,    setSearch]    = useState('');

  // map real DB users → design shape
  const mapped = users.map(u => {
    const upays = payments.filter(p=>p.userId===u.id);
    const accessLabel = upays.length ? upays.map(p=>p.desc||'—').join(' · ') : '—';
    const joinDate = u.joined_at
      ? new Date(u.joined_at).toLocaleDateString('ru-RU',{day:'2-digit',month:'2-digit',year:'numeric'})
      : '—';
    return {
      id:        u.id,
      letter:    (u.name||'?')[0].toUpperCase(),
      name:      u.name || '—',
      email:     u.email || '—',
      kyu:       LEVEL_LABELS[u.level] || 'без',
      kyuKanji:  LEVEL_KANJI_MAP[u.level] || '無',
      status:    u.status || 'new',
      access:    accessLabel,
      lessons:   '— / —',
      activity:  '—',
      joined:    joinDate,
      raw:       u,
    };
  });

  const counts = {
    all:    mapped.length,
    active: mapped.filter(u=>u.status==='active').length,
    new:    mapped.filter(u=>u.status==='new').length,
    trial:  mapped.filter(u=>u.status==='trial').length,
    paused: mapped.filter(u=>u.status==='paused').length,
  };

  const filtered = mapped.filter(u=>{
    if (filter!=='all' && u.status!==filter) return false;
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selUser  = mapped.find(u=>u.id===selected);
  const userPays = payments.filter(p=>p.userId===selected);

  const saveLevel = async () => {
    setSaving(true);
    const {ok,error} = await updateLevel(selected, editLevel);
    setSaving(false);
    if (ok) showToast('Уровень обновлён');
    else showToast('Ошибка: ' + error);
  };

  const openUser = (u) => { setSelected(u.id); setEditLevel(u.raw.level||''); };

  if (loading) return <Spinner/>;

  // status pill mapping
  const STATUS_MAP = {
    active: {kind:'success', label:'активен'},
    new:    {kind:'accent',  label:'новый'},
    trial:  {kind:'gold',    label:'пробный'},
    paused: {kind:'muted',   label:'пауза'},
  };

  // table columns (desktop)
  const columns = [
    {
      label:'Ученик', width:'1.6fr',
      render:(u)=>(
        <div style={{display:'flex',alignItems:'center',gap:12,minWidth:0}}>
          <AvatarCircle letter={u.letter} size={34}/>
          <div style={{minWidth:0}}>
            <div style={{fontFamily:F.mono,fontSize:13,color:C.ink,fontWeight:500}}>{u.name}</div>
            <div style={{fontFamily:F.mono,fontSize:10,color:C.muted,letterSpacing:'0.04em',marginTop:2}}>{u.email}</div>
          </div>
        </div>
      ),
    },
    {
      label:'Уровень', width:'0.9fr',
      render:(u)=>(
        <div style={{display:'inline-flex',alignItems:'center',gap:8}}>
          <span style={{fontFamily:F.kanji,fontSize:14,color:C.accent,opacity:0.8,letterSpacing:'0.06em'}}>{u.kyuKanji}</span>
          <span style={{fontFamily:F.serif,fontSize:11,letterSpacing:'0.14em',color:C.ink,fontWeight:500,textTransform:'uppercase'}}>{u.kyu}</span>
        </div>
      ),
    },
    {
      label:'Доступ', width:'1.3fr',
      render:(u)=>(
        <span style={{fontFamily:F.serif,fontStyle:'italic',fontSize:13,color:C.ink2}}>{u.access}</span>
      ),
    },
    {
      label:'Прогресс', width:'0.9fr',
      render:(u)=>(
        <span style={{fontFamily:F.mono,fontSize:11,color:C.ink2,letterSpacing:'0.04em'}}>{u.lessons}</span>
      ),
    },
    {
      label:'Статус', width:'0.8fr',
      render:(u)=>{
        const m = STATUS_MAP[u.status]||STATUS_MAP.new;
        return <Pill2 kind={m.kind} dot>{m.label}</Pill2>;
      },
    },
    {
      label:'Активность', width:'0.8fr',
      render:(u)=>(
        <span style={{fontFamily:F.mono,fontSize:11,color:C.muted,letterSpacing:'0.04em'}}>{u.activity}</span>
      ),
    },
    {
      label:'Регистрация', width:'0.8fr', sort:true,
      render:(u)=>(
        <span style={{fontFamily:F.mono,fontSize:11,color:C.muted,letterSpacing:'0.04em'}}>{u.joined}</span>
      ),
    },
    {
      label:'', width:'36px', align:'center',
      render:(u)=>(
        <button onClick={e=>{e.stopPropagation();openUser(u);}}
          style={{background:'none',border:'none',cursor:'pointer',color:C.muted,fontSize:14,letterSpacing:2,padding:'0 4px'}}>···</button>
      ),
    },
  ];

  return (
    <div style={{background:C.bg,minHeight:'100%'}}>
      <div style={{padding:isMobile?'20px 16px 40px':'32px 36px 60px'}}>

        <AdminSectionHead num="02" title="Ученики" subtitle="Список учеников · уровни · доступы" kanji="人"/>
        <SumiStroke style={{margin:'0 0 24px',opacity:0.3}}/>

        {/* ── 5 metric tiles ──────────────────────────────────── */}
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(5,1fr)',gap:14,marginBottom:24}}>
          {[
            {label:'Всего',         kanji:'計', value:String(counts.all),    sub:'· все статусы'},
            {label:'Активные',      kanji:'活', value:String(counts.active), delta:counts.all?`${Math.round(counts.active/counts.all*100)}%`:'—', deltaDir:'up'},
            {label:'Новые · неделя',kanji:'新', value:String(counts.new)},
            {label:'На паузе',      kanji:'休', value:String(counts.paused), deltaDir:'flat'},
            {label:'С Иккаджо+',   kanji:'技', value:String(mapped.filter(u=>u.access&&u.access!=='—').length), sub:'· купили раздел'},
          ].map((m,i)=>(
            <div key={i} style={{background:C.surface,border:`1px solid ${C.hairline}`,padding:'18px 20px',display:'flex',flexDirection:'column',gap:4,minHeight:isMobile?90:110}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontFamily:F.mono,fontSize:9,letterSpacing:'0.22em',color:C.muted,textTransform:'uppercase'}}>{m.label}</span>
                <span style={{fontFamily:F.kanji,fontSize:14,color:C.copper,opacity:0.55}}>{m.kanji}</span>
              </div>
              <div style={{fontFamily:F.serif,fontSize:isMobile?26:34,color:C.ink,fontWeight:500,lineHeight:1,letterSpacing:'0.02em'}}>{m.value}</div>
              <div style={{marginTop:'auto',display:'flex',alignItems:'center',gap:6}}>
                {m.delta && <span style={{fontFamily:F.mono,fontSize:10,color:m.deltaDir==='up'?C.success:m.deltaDir==='down'?C.danger:C.muted}}>
                  {m.deltaDir==='up'?'▲':m.deltaDir==='down'?'▼':'·'} {m.delta}
                </span>}
                {m.sub && <span style={{fontFamily:F.mono,fontSize:10,color:C.muted}}>{m.sub}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* ── filter chips ─────────────────────────────────────── */}
        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12,alignItems:'center'}}>
          <FilterChip2 label="Все"      value={String(counts.all)}    active={filter==='all'}    onClick={()=>setFilter('all')}/>
          <FilterChip2 label="Активные" value={String(counts.active)} active={filter==='active'} onClick={()=>setFilter('active')} dot={C.success}/>
          <FilterChip2 label="Новые"    value={String(counts.new)}    active={filter==='new'}    onClick={()=>setFilter('new')}    dot={C.accent}/>
          <FilterChip2 label="Пробные"  value={String(counts.trial)}  active={filter==='trial'}  onClick={()=>setFilter('trial')}  dot={C.goldSoft}/>
          <FilterChip2 label="На паузе" value={String(counts.paused)} active={filter==='paused'} onClick={()=>setFilter('paused')} dot={C.muted}/>
          <div style={{flex:1}}/>
          <span style={{fontFamily:F.mono,fontSize:10,color:C.muted,letterSpacing:'0.12em'}}>СОРТИРОВКА:</span>
          <FilterChip2 label="По дате регистрации ↓"/>
          <FilterChip2 label="6 кю → 1 кю"/>
        </div>

        {/* ── selected user detail panel ───────────────────────── */}
        {selUser && (
          <div style={{background:C.surface,border:`1px solid ${C.hairline}`,borderLeft:`3px solid ${C.accent}`,padding:'20px 24px',marginBottom:16}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14}}>
              <div>
                <div style={{fontFamily:F.serif,fontSize:18,color:C.ink,fontWeight:600}}>{selUser.name}</div>
                <div style={{fontFamily:F.mono,fontSize:10,color:C.muted,letterSpacing:'0.04em',marginTop:3}}>{selUser.email}</div>
              </div>
              <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',fontSize:18,color:C.muted,cursor:'pointer',lineHeight:1,padding:'2px 4px'}}>✕</button>
            </div>
            <div style={{display:'flex',gap:12,alignItems:'flex-end',marginBottom: selUser.raw?.experience||userPays.length?16:0}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:6}}>ИЗМЕНИТЬ УРОВЕНЬ</div>
                <Select value={editLevel} onChange={setEditLevel} options={LEVELS_LIST.map(l=>({value:l,label:LEVEL_LABELS[l]}))}/>
              </div>
              <Btn2 onClick={saveLevel} kind="accent" size="sm" disabled={saving}>{saving?'…':'Сохранить'}</Btn2>
            </div>
            {selUser.raw?.experience && (
              <div style={{padding:'10px 14px',background:C.bg2,border:`1px solid ${C.hairline}`,marginBottom:12}}>
                <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:6}}>ОБ ОПЫТЕ</div>
                <p style={{fontFamily:F.serif,fontSize:13,color:C.ink2,lineHeight:1.7,margin:0}}>{selUser.raw.experience}</p>
              </div>
            )}
            {userPays.length>0 && (
              <div>
                <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:8}}>ИСТОРИЯ ОПЛАТ</div>
                {userPays.map(p=>(
                  <div key={p.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${C.hairline}`,fontFamily:F.mono,fontSize:11}}>
                    <span style={{color:C.muted}}>{p.date}</span>
                    <span style={{color:C.ink,flex:1,margin:'0 12px'}}>{p.desc}</span>
                    <span style={{color:C.gold,fontWeight:600}}>{p.amount?.toLocaleString()} ₽</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── table / card list ──────────────────────────────────── */}
        {isMobile ? (
          <div style={{background:C.surface,border:`1px solid ${C.hairline}`}}>
            {(filtered.length?filtered:mapped).slice(0,12).map((u,i,arr)=>(
              <div key={u.id} onClick={()=>openUser(u)}
                style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderBottom:i===arr.length-1?'none':`1px solid ${C.hairline}`,cursor:'pointer',background:selected===u.id?C.surface2:'transparent',minHeight:64}}>
                <AvatarCircle letter={u.letter} size={36}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:F.mono,fontSize:13,color:C.ink,fontWeight:500}}>{u.name}</div>
                  <div style={{fontFamily:F.mono,fontSize:10,color:C.muted,letterSpacing:'0.04em',marginTop:2}}>{u.kyu} · {u.access}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <span style={{fontFamily:F.kanji,fontSize:14,color:C.accent,opacity:0.8}}>{u.kyuKanji}</span>
                  <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:'0.04em',marginTop:4}}>{u.activity}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <HairlineTable2 columns={columns} rows={filtered.length?filtered:mapped} onRowClick={openUser}/>
        )}

        {/* ── pagination footer ─────────────────────────────────── */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 4px',marginTop:4}}>
          <span style={{fontFamily:F.mono,fontSize:10,color:C.muted,letterSpacing:'0.12em',textTransform:'uppercase'}}>
            Показано 1 — {Math.min(12,filtered.length||mapped.length)} из {mapped.length}
          </span>
          <div style={{display:'flex',gap:4}}>
            <FilterChip2 label="← Назад"/>
            <FilterChip2 label="1" active/>
            <FilterChip2 label="Вперёд →"/>
          </div>
        </div>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 2. ЭКЗАМЕНЫ
// ═══════════════════════════════════════════════════════════════
const EXAMS_DATA_PROTO = [
  {id:'e-114',letter:'Т',name:'Иван Тарасов',    city:'Москва',          from:'4 кю',fromK:'四',to:'3 кю',toK:'三',date:'20.05.2026',state:'review',  videos:6,completion:100,sub:'',dur:'2 года 4 мес.'},
  {id:'e-113',letter:'И',name:'Мария Иванова',   city:'Санкт-Петербург',from:'5 кю',fromK:'五',to:'4 кю',toK:'四',date:'22.05.2026',state:'pending',  videos:5,completion:96, sub:'',dur:'1 год 8 мес.'},
  {id:'e-112',letter:'Л',name:'Дмитрий Лебедев', city:'Казань',          from:'6 кю',fromK:'六',to:'5 кю',toK:'五',date:'25.05.2026',state:'pending',  videos:4,completion:88, sub:'',dur:'10 мес.'},
  {id:'e-111',letter:'О',name:'Екатерина Орлова',city:'Новосибирск',     from:'без', fromK:'無',to:'6 кю',toK:'六',date:'28.05.2026',state:'pending',  videos:3,completion:80, sub:'',dur:'4 мес.'},
  {id:'e-110',letter:'С',name:'Александр Соколов',city:'Москва',         from:'3 кю',fromK:'三',to:'2 кю',toK:'二',date:'12.05.2026',state:'approved', videos:8,completion:100,sub:'Сдан · 4 апреля',dur:'3 года 1 мес.'},
  {id:'e-108',letter:'Б',name:'Михаил Беляев',   city:'Воронеж',         from:'6 кю',fromK:'六',to:'5 кю',toK:'五',date:'02.05.2026',state:'rejected', videos:2,completion:40, sub:'Доработать иппон-дори',dur:'6 мес.'},
];
const EXAM_STATE_MAP = {
  review:   {kind:'accent',  label:'на проверке'},
  pending:  {kind:'gold',    label:'ожидает'},
  approved: {kind:'success', label:'подтверждён'},
  rejected: {kind:'danger',  label:'отклонён'},
};

function SectionExams({showToast,isMobile}){
  const {users,updateLevel} = useUsers();
  const {exams,loading,approveExam,rejectExam,addManualExam} = useExams();
  const [selected,   setSelected]   = useState(null);
  const [filter,     setFilter]     = useState('active');
  const [showManual, setShowManual] = useState(false);
  const [mUserId,    setMUserId]    = useState('');
  const [mLevel,     setMLevel]     = useState('6kyu');
  const [mNote,      setMNote]      = useState('');
  const [mResult,    setMResult]    = useState('passed');
  const [saving,     setSaving]     = useState(false);

  const pending  = exams.filter(e=>e.status==='pending');
  const approved = exams.filter(e=>e.status==='approved');
  const rejected = exams.filter(e=>e.status==='rejected');

  const doApprove = async (id,note) => { const {ok}=await approveExam(id,note,updateLevel); if(ok) showToast('Экзамен подтверждён'); };
  const doReject  = async (id,note) => { const {ok}=await rejectExam(id,note);              if(ok) showToast('Экзамен отклонён'); };

  // map real exams to display shape
  const toShape = e => ({
    id:     String(e.id),
    letter: (e.user_name||e.userName||'?')[0].toUpperCase(),
    name:   e.user_name||e.userName||'—',
    from:   LEVEL_LABELS[e.current_level]||'—',
    fromK:  LEVEL_KANJI_MAP[e.current_level]||'無',
    to:     LEVEL_LABELS[e.target_level]||'—',
    toK:    LEVEL_KANJI_MAP[e.target_level]||'?',
    state:  e.status,
    date:   e.date||'—',
    city:   '—', dur:'—', videos:0, completion:0, sub:'',
    raw:    e,
  });

  const activeReal  = pending.map(toShape);
  const historyReal = [...approved,...rejected].map(toShape);
  const displayList = filter==='active'
    ? (activeReal.length  ? activeReal  : EXAMS_DATA_PROTO.filter(e=>e.state==='pending'||e.state==='review'))
    : (historyReal.length ? historyReal : EXAMS_DATA_PROTO.filter(e=>e.state==='approved'||e.state==='rejected'));

  const selExam = displayList.find(e=>e.id===selected) || (displayList[0]||null);

  if(loading) return <Spinner/>;

  return (
    <div style={{background:C.bg,minHeight:'100%'}}>
      <div style={{padding:isMobile?'20px 16px 40px':'32px 36px 60px'}}>

        <AdminSectionHead num="06" title="Аттестации" subtitle="Очередь заявок на повышение кю / дан" kanji="段"
          actions={
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <Pill2 kind="accent" dot>{pending.length||1} на проверке</Pill2>
              <Pill2 kind="gold"   dot>{pending.length||3} ожидают</Pill2>
              <Pill2 kind="success" dot>{approved.length||2} подтв.</Pill2>
            </div>
          }
        />
        <SumiStroke style={{margin:'0 0 24px',opacity:0.3}}/>

        {/* 5 metric tiles */}
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(5,1fr)',gap:14,marginBottom:24}}>
          {[
            {label:'Всего · 2026',      kanji:'計',value:String(exams.length||48),sub:'· с янв.'},
            {label:'Подтверждено',       kanji:'可',value:String(approved.length||34),delta:'71%',deltaDir:'up'},
            {label:'В очереди',          kanji:'待',value:String(pending.length||6),delta:'3 свежих',deltaDir:'flat'},
            {label:'Отклонено',          kanji:'否',value:String(rejected.length||3),sub:'· 6%'},
            {label:'Ср. срок проверки',  kanji:'日',value:'2.4',unit:'дня',delta:'−0.4',deltaDir:'up'},
          ].map((m,i)=>(
            <div key={i} style={{background:C.surface,border:`1px solid ${C.hairline}`,padding:'18px 20px',display:'flex',flexDirection:'column',gap:4,minHeight:isMobile?90:110}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontFamily:F.mono,fontSize:9,letterSpacing:'0.22em',color:C.muted,textTransform:'uppercase'}}>{m.label}</span>
                <span style={{fontFamily:F.kanji,fontSize:14,color:C.copper,opacity:0.55}}>{m.kanji}</span>
              </div>
              <div style={{display:'flex',alignItems:'baseline',gap:6}}>
                <span style={{fontFamily:F.serif,fontSize:isMobile?26:34,color:C.ink,fontWeight:500,lineHeight:1,letterSpacing:'0.02em'}}>{m.value}</span>
                {m.unit&&<span style={{fontFamily:F.serif,fontStyle:'italic',fontSize:12,color:C.muted}}>{m.unit}</span>}
              </div>
              <div style={{marginTop:'auto',display:'flex',alignItems:'center',gap:6}}>
                {m.delta&&<span style={{fontFamily:F.mono,fontSize:10,color:m.deltaDir==='up'?C.success:m.deltaDir==='down'?C.danger:C.muted}}>
                  {m.deltaDir==='up'?'▲':m.deltaDir==='down'?'▼':'·'} {m.delta}
                </span>}
                {m.sub&&<span style={{fontFamily:F.mono,fontSize:10,color:C.muted}}>{m.sub}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* filter + sort */}
        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:16,alignItems:'center'}}>
          <FilterChip2 label="Активные" value={String(pending.length||4)}   active={filter==='active'}  onClick={()=>setFilter('active')}/>
          <FilterChip2 label="История"  value={String(exams.length||44)}     active={filter==='history'} onClick={()=>setFilter('history')}/>
          <div style={{flex:1}}/>
          <FilterChip2 label="6 → 4 кю"/>
          <FilterChip2 label="3 → 1 кю"/>
          <FilterChip2 label="Дан"/>
          <FilterChip2 label="↕ По дате"/>
        </div>

        {/* mobile: just the list */}
        {isMobile ? (
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {displayList.map(e=>(
              <ExamQueueCard key={e.id} e={e} isSelected={selExam?.id===e.id} onSelect={()=>setSelected(e.id)}/>
            ))}
          </div>
        ) : (
          /* desktop: split */
          <div style={{display:'grid',gridTemplateColumns:'380px 1fr',gap:20,alignItems:'flex-start'}}>
            {/* queue */}
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              {displayList.map(e=>(
                <ExamQueueCard key={e.id} e={e} isSelected={selExam?.id===e.id} onSelect={()=>setSelected(e.id)}/>
              ))}
              <button onClick={()=>setShowManual(m=>!m)}
                style={{background:'none',border:`1px dashed ${C.hairline}`,padding:'12px 16px',cursor:'pointer',fontFamily:F.mono,fontSize:10,color:C.muted,letterSpacing:'0.12em',textTransform:'uppercase',textAlign:'center'}}>
                {showManual?'✕ Закрыть':'+ Ручная простановка'}
              </button>
              {showManual&&(
                <div style={{background:C.surface,border:`1px solid ${C.hairline}`,padding:'18px 20px'}}>
                  <div style={{fontFamily:F.serif,fontSize:14,letterSpacing:'0.18em',color:C.ink,marginBottom:14}}>РУЧНАЯ ПРОСТАНОВКА</div>
                  <div style={{display:'flex',flexDirection:'column',gap:10}}>
                    <div>
                      <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:5}}>УЧЕНИК</div>
                      <Select value={mUserId} onChange={setMUserId} options={[{value:'',label:'— выберите —'},...users.map(u=>({value:u.id,label:u.name}))]}/>
                    </div>
                    <div>
                      <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:5}}>УРОВЕНЬ</div>
                      <Select value={mLevel} onChange={setMLevel} options={LEVELS_LIST.map(l=>({value:l,label:LEVEL_LABELS[l]}))}/>
                    </div>
                    <div>
                      <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:5}}>РЕЗУЛЬТАТ</div>
                      <Select value={mResult} onChange={setMResult} options={[{value:'passed',label:'✓ Сдал'},{value:'failed',label:'✕ Не сдал'}]}/>
                    </div>
                    <div>
                      <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:'0.12em',textTransform:'uppercase',marginBottom:5}}>КОММЕНТАРИЙ</div>
                      <Textarea value={mNote} onChange={setMNote} placeholder="Замечания…" rows={3}/>
                    </div>
                    <Btn2 kind="accent" disabled={!mUserId||saving} onClick={async()=>{
                      if(!mUserId) return;
                      setSaving(true);
                      const u2=users.find(u=>u.id===mUserId);
                      const {ok}=await addManualExam({userId:mUserId,userName:u2?.name,targetLevel:mLevel,result:mResult,note:mNote});
                      if(ok){ if(mResult==='passed') await updateLevel(mUserId,mLevel); showToast('Результат проставлен'); setMUserId(''); setMNote(''); }
                      setSaving(false);
                    }}>{saving?'…':'Проставить результат'}</Btn2>
                  </div>
                </div>
              )}
            </div>

            {/* detail */}
            {selExam&&(
              <ExamDetailPanel exam={selExam} onApprove={doApprove} onReject={doReject}/>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ExamQueueCard({e, isSelected, onSelect}){
  const sm = EXAM_STATE_MAP[e.state]||EXAM_STATE_MAP.pending;
  return (
    <div onClick={onSelect} style={{background:C.surface,border:`1px solid ${isSelected?C.accent:C.hairline}`,borderLeft:`2px solid ${isSelected?C.accent:'transparent'}`,padding:'14px 16px',cursor:'pointer',position:'relative'}}>
      {isSelected&&<div style={{position:'absolute',top:10,right:10,width:5,height:5,background:C.accent,transform:'rotate(45deg)'}}/>}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
        <AvatarCircle letter={e.letter} size={36}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontFamily:F.mono,fontSize:13,color:C.ink,fontWeight:500}}>{e.name}</div>
          <div style={{fontFamily:F.mono,fontSize:10,color:C.muted,letterSpacing:'0.04em'}}>{e.id} · {e.city}</div>
        </div>
        <Pill2 kind={sm.kind} dot>{sm.label}</Pill2>
      </div>
      <div style={{display:'flex',alignItems:'center',gap:12,paddingTop:8,borderTop:`1px solid ${C.hairline}`}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{fontFamily:F.kanji,fontSize:14,color:C.muted,opacity:0.7}}>{e.fromK}</span>
          <span style={{fontFamily:F.mono,fontSize:10,color:C.muted}}>{e.from}</span>
          <span style={{color:C.accent,fontSize:11}}>→</span>
          <span style={{fontFamily:F.kanji,fontSize:14,color:C.accent}}>{e.toK}</span>
          <span style={{fontFamily:F.mono,fontSize:10,color:C.ink2,fontWeight:600}}>{e.to}</span>
        </div>
        <span style={{marginLeft:'auto',fontFamily:F.mono,fontSize:10,color:C.muted,letterSpacing:'0.04em'}}>{e.date}</span>
      </div>
    </div>
  );
}

function ExamDetailPanel({exam, onApprove, onReject}){
  const [note,setNote] = useState(exam.raw?.teacher_note||'');
  const [saving,setSaving] = useState(false);
  const sm = EXAM_STATE_MAP[exam.state]||EXAM_STATE_MAP.pending;
  const isEditable = exam.state==='pending'||exam.state==='review';
  return (
    <div style={{background:C.surface,border:`1px solid ${C.hairline}`,alignSelf:'flex-start'}}>
      {/* header */}
      <div style={{padding:'24px 28px',borderBottom:`1px solid ${C.hairline}`,position:'relative',overflow:'hidden'}}>
        <div style={{position:'absolute',top:-16,right:16,fontFamily:F.kanji,fontSize:140,color:C.accent,opacity:0.08,lineHeight:1,pointerEvents:'none'}}>{exam.toK}</div>
        <div style={{position:'relative'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <span style={{fontFamily:F.mono,fontSize:10,color:C.accent,letterSpacing:'0.22em'}}>{exam.id}</span>
            <Pill2 kind={sm.kind} dot>{sm.label}</Pill2>
          </div>
          <div style={{display:'flex',alignItems:'flex-end',gap:16,marginBottom:6}}>
            <AvatarCircle letter={exam.letter} size={48}/>
            <div>
              <div style={{fontFamily:F.serif,fontSize:26,color:C.ink,letterSpacing:'0.04em',fontWeight:500,lineHeight:1}}>{exam.name}</div>
              <div style={{fontFamily:F.serif,fontStyle:'italic',fontSize:13,color:C.muted,marginTop:5}}>{exam.city} · в додзё {exam.dur}</div>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:16,marginTop:14}}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontFamily:F.kanji,fontSize:28,color:C.muted,opacity:0.5}}>{exam.fromK}</span>
              <span style={{fontFamily:F.serif,fontSize:14,letterSpacing:'0.12em',color:C.muted}}>{exam.from}</span>
            </div>
            <span style={{fontFamily:F.serif,fontStyle:'italic',fontSize:24,color:C.accent}}>→</span>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontFamily:F.kanji,fontSize:36,color:C.accent}}>{exam.toK}</span>
              <span style={{fontFamily:F.serif,fontSize:18,letterSpacing:'0.12em',color:C.ink,fontWeight:600}}>{exam.to}</span>
            </div>
            <div style={{marginLeft:'auto',textAlign:'right'}}>
              <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:'0.18em',textTransform:'uppercase'}}>дата экзамена</div>
              <div style={{fontFamily:F.serif,fontSize:18,color:C.ink,letterSpacing:'0.06em'}}>{exam.date}</div>
            </div>
          </div>
        </div>
      </div>
      {/* requirements */}
      <div style={{padding:'20px 28px',borderBottom:`1px solid ${C.hairline}`}}>
        <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:'0.18em',textTransform:'uppercase',marginBottom:14}}>06.1 · Требования к экзамену</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:1,background:C.hairline}}>
          {[
            {kanji:'視',label:'Просмотрено',   value:'89 / 89'},
            {kanji:'技',label:'Техник освоено', value:'12 / 12'},
            {kanji:'映',label:'Видео-сдача',    value:`${exam.videos||'—'} загружено`},
            {kanji:'時',label:'Минимум срока',  value:exam.dur||'—'},
          ].map((r,i)=>(
            <div key={i} style={{background:C.surface,padding:'12px 16px',display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontFamily:F.kanji,fontSize:20,color:C.success,opacity:0.8}}>{r.kanji}</span>
              <div style={{flex:1}}>
                <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:2}}>{r.label}</div>
                <div style={{fontFamily:F.mono,fontSize:12,color:C.ink,fontWeight:500}}>{r.value}</div>
              </div>
              <span style={{fontFamily:F.mono,fontSize:12,color:C.success}}>✓</span>
            </div>
          ))}
        </div>
      </div>
      {/* sensei comment */}
      <div style={{padding:'20px 28px',borderBottom:`1px solid ${C.hairline}`}}>
        <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:'0.18em',textTransform:'uppercase',marginBottom:12}}>06.2 · Комментарий сэнсэя</div>
        {isEditable
          ? <Textarea value={note} onChange={setNote} placeholder="Замечания к технике…" rows={4}/>
          : <div style={{background:C.bg,border:`1px solid ${C.hairline}`,padding:'14px 16px',minHeight:80,fontFamily:F.serif,fontStyle:'italic',fontSize:14,color:C.muted,lineHeight:1.6}}>
              {exam.raw?.teacher_note||'Без комментария'}
            </div>
        }
      </div>
      {/* actions */}
      {isEditable&&(
        <div style={{padding:'18px 28px',display:'flex',alignItems:'center',gap:10,background:C.bg2,flexWrap:'wrap'}}>
          <Btn2 kind="quiet" onClick={async()=>{setSaving(true);await onReject(exam.raw?.id||exam.id,note);setSaving(false);}}>Запросить доработку</Btn2>
          <Btn2 kind="quiet" onClick={async()=>{setSaving(true);await onReject(exam.raw?.id||exam.id,note);setSaving(false);}}>Отклонить</Btn2>
          <div style={{flex:1}}/>
          <Btn2 kind="accent" disabled={saving} onClick={async()=>{setSaving(true);await onApprove(exam.raw?.id||exam.id,note);setSaving(false);}}>
            {saving?'…':`Подтвердить · ${exam.toK} КЮ`}
          </Btn2>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 3. ОПЛАТЫ
// ═══════════════════════════════════════════════════════════════
const REVENUE_BREAKDOWN_PROTO = [
  {label:'Месячные подписки',kanji:'月',value:156000,pct:32,count:78},
  {label:'Разделы Иккаджо',  kanji:'一',value:138000,pct:28,count:46},
  {label:'Разделы Никаджо',  kanji:'二',value: 96000,pct:20,count:32},
  {label:'Годовые пакеты',   kanji:'年',value: 79600,pct:16,count:4},
  {label:'Прочее',           kanji:'他',value: 16400,pct: 4,count:12},
];

function SectionPayments({isMobile}){
  const {payments,loading} = useAccess();
  const [filter,setFilter] = useState('all');
  const [period,setPeriod] = useState('month');

  const totalAll   = payments.reduce((s,p)=>s+p.amount,0);
  const totalMonth = payments.reduce((s,p)=>s+p.amount,0); // simplified: all = month for now
  const avgCheck   = payments.length ? Math.round(totalAll/payments.length) : 0;
  const paidCount  = payments.filter(p=>p.amount>0).length;
  const uniquePayers = new Set(payments.map(p=>p.userId)).size;

  // map real payments → display shape
  const mappedPayments = payments.map(p=>({
    id:      String(p.id||'—'),
    date:    p.date||'—',
    letter:  (p.userName||'?')[0].toUpperCase(),
    name:    p.userName||'—',
    email:   '—',
    item:    p.desc||'—',
    itemSub: p.type==='month'?'Месячный':p.type==='section'?'Раздел':'—',
    method:  '—',
    amount:  p.amount||0,
    status:  'paid',
  }));

  // build real breakdown from payments
  const monthSum   = payments.filter(p=>p.type==='month').reduce((s,p)=>s+p.amount,0);
  const sectionSum = payments.filter(p=>p.type==='section').reduce((s,p)=>s+p.amount,0);
  const realBreakdown = totalAll > 0 ? [
    {label:'Месячные подписки',kanji:'月',value:monthSum,   pct:totalAll?Math.round(monthSum/totalAll*100):0,   count:payments.filter(p=>p.type==='month').length},
    {label:'Разделы',          kanji:'技',value:sectionSum, pct:totalAll?Math.round(sectionSum/totalAll*100):0, count:payments.filter(p=>p.type==='section').length},
  ] : REVENUE_BREAKDOWN_PROTO;
  const breakdown = realBreakdown;

  const filtered = mappedPayments.filter(p=>filter==='all'||(filter==='paid'&&p.status==='paid')||(filter==='pending'&&p.status==='pending'));
  const displayList = filtered.length ? filtered : [];

  const PAY_STATUS = {
    paid:    {kind:'success',label:'оплачено'},
    pending: {kind:'gold',   label:'ожидание'},
    refund:  {kind:'muted',  label:'возврат'},
    failed:  {kind:'danger', label:'ошибка'},
  };

  const columns = [
    {label:'ID',     width:'0.6fr',render:(p)=>(<span style={{fontFamily:F.mono,fontSize:11,color:C.muted,letterSpacing:'0.04em'}}>{p.id}</span>)},
    {label:'Дата',   width:'0.8fr',sort:true,render:(p)=>(<span style={{fontFamily:F.mono,fontSize:11,color:C.ink2,letterSpacing:'0.04em'}}>{p.date}</span>)},
    {label:'Ученик', width:'1.4fr',render:(p)=>(
      <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
        <AvatarCircle letter={p.letter} size={28}/>
        <div style={{minWidth:0}}>
          <div style={{fontFamily:F.mono,fontSize:12,color:C.ink,fontWeight:500}}>{p.name}</div>
          <div style={{fontFamily:F.mono,fontSize:10,color:C.muted}}>{p.email}</div>
        </div>
      </div>
    )},
    {label:'Покупка',width:'1.4fr',render:(p)=>(
      <div style={{minWidth:0}}>
        <div style={{fontFamily:F.mono,fontSize:13,color:C.ink,fontWeight:500}}>{p.item}</div>
        <div style={{fontFamily:F.serif,fontStyle:'italic',fontSize:11,color:C.muted}}>{p.itemSub}</div>
      </div>
    )},
    {label:'Способ', width:'0.7fr',render:(p)=>(<span style={{fontFamily:F.mono,fontSize:11,color:C.ink2,letterSpacing:'0.04em'}}>{p.method}</span>)},
    {label:'Сумма',  width:'0.7fr',align:'right',render:(p)=>(
      <span style={{fontFamily:F.mono,fontSize:13,color:p.amount>0?C.ink:C.muted,letterSpacing:'0.04em',fontWeight:600}}>
        {p.amount>0?p.amount.toLocaleString('ru-RU')+' ₽':'бесплатно'}
      </span>
    )},
    {label:'Статус', width:'0.9fr',render:(p)=>{const m=PAY_STATUS[p.status]||PAY_STATUS.paid;return <Pill2 kind={m.kind} dot>{m.label}</Pill2>;}},
    {label:'',       width:'36px',align:'center',render:()=>(<span style={{color:C.muted,fontSize:14,letterSpacing:2}}>···</span>)},
  ];

  if(loading) return <Spinner/>;

  return (
    <div style={{background:C.bg,minHeight:'100%'}}>
      <div style={{padding:isMobile?'20px 16px 40px':'32px 36px 60px'}}>

        <AdminSectionHead num="05" title="Платежи" subtitle={`${new Date().toLocaleString('ru-RU',{month:'long',year:'numeric'})} · продажи разделов и подписок`} kanji="銭"
          actions={
            <div style={{display:'flex',gap:4}}>
              {[['today','сегодня'],['month','месяц'],['quarter','квартал']].map(([k,l])=>(
                <Pill2 key={k} kind={period===k?'solidInk':'muted'} style={{cursor:'pointer'}} onClick={()=>setPeriod(k)}>{l}</Pill2>
              ))}
            </div>
          }
        />
        <SumiStroke style={{margin:'0 0 24px',opacity:0.3}}/>

        {/* metrics + breakdown */}
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:20,marginBottom:28}}>
          {/* 2x2 metrics */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            {[
              {label:'Доход · май',   kanji:'月',value: totalAll>0?(totalAll/1000).toFixed(0):'486',unit:'тыс. ₽',delta:'+18% к апр.',deltaDir:'up'},
              {label:'Транзакций',    kanji:'数',value:String(paidCount||172),delta:'+24',deltaDir:'up'},
              {label:'Средний чек',   kanji:'平',value:avgCheck>0?avgCheck.toLocaleString('ru-RU'):'2 826',unit:'₽',delta:'−4%',deltaDir:'down'},
              {label:'Возвратов',     kanji:'戻',value:'0',sub:'· 0 ₽'},
            ].map((m,i)=>(
              <div key={i} style={{background:C.surface,border:`1px solid ${C.hairline}`,padding:'18px 20px',display:'flex',flexDirection:'column',gap:4,minHeight:110}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontFamily:F.mono,fontSize:9,letterSpacing:'0.22em',color:C.muted,textTransform:'uppercase'}}>{m.label}</span>
                  <span style={{fontFamily:F.kanji,fontSize:14,color:C.copper,opacity:0.55}}>{m.kanji}</span>
                </div>
                <div style={{display:'flex',alignItems:'baseline',gap:6}}>
                  <span style={{fontFamily:F.serif,fontSize:32,color:C.ink,fontWeight:500,lineHeight:1,letterSpacing:'0.02em'}}>{m.value}</span>
                  {m.unit&&<span style={{fontFamily:F.serif,fontStyle:'italic',fontSize:12,color:C.muted}}>{m.unit}</span>}
                </div>
                <div style={{marginTop:'auto',display:'flex',alignItems:'center',gap:6}}>
                  {m.delta&&<span style={{fontFamily:F.mono,fontSize:10,color:m.deltaDir==='up'?C.success:m.deltaDir==='down'?C.danger:C.muted}}>
                    {m.deltaDir==='up'?'▲':m.deltaDir==='down'?'▼':'·'} {m.delta}
                  </span>}
                  {m.sub&&<span style={{fontFamily:F.mono,fontSize:10,color:C.muted}}>{m.sub}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* breakdown */}
          <div style={{background:C.surface,border:`1px solid ${C.hairline}`}}>
            <div style={{padding:'14px 18px',borderBottom:`1px solid ${C.hairline}`,display:'flex',alignItems:'center',gap:10}}>
              <span style={{fontFamily:F.kanji,fontSize:13,color:C.gold,opacity:0.85}}>内訳</span>
              <span style={{fontFamily:F.serif,fontSize:11,letterSpacing:'0.18em',color:C.ink,fontWeight:600}}>СТРУКТУРА ДОХОДА</span>
            </div>
            <div style={{padding:'4px 18px'}}>
              {breakdown.map((r,i)=>(
                <div key={i} style={{display:'grid',gridTemplateColumns:'24px 1fr 60px 70px',gap:12,alignItems:'center',padding:'10px 0',borderBottom:i===breakdown.length-1?'none':`1px solid ${C.hairline}`}}>
                  <span style={{fontFamily:F.kanji,fontSize:16,color:C.accent,opacity:0.7}}>{r.kanji}</span>
                  <div>
                    <div style={{fontFamily:F.mono,fontSize:12,color:C.ink2,fontWeight:500}}>{r.label}</div>
                    <div style={{height:2,background:C.hairline,marginTop:6,position:'relative'}}>
                      <div style={{position:'absolute',inset:0,width:`${Math.min(r.pct*2,100)}%`,background:C.accent}}/>
                    </div>
                  </div>
                  <span style={{fontFamily:F.mono,fontSize:10,color:C.muted,letterSpacing:'0.04em',textAlign:'right'}}>{r.count} шт.</span>
                  <span style={{fontFamily:F.mono,fontSize:12,color:C.ink,letterSpacing:'0.04em',textAlign:'right',fontWeight:600}}>{(r.value/1000).toFixed(0)}к ₽</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* filter chips */}
        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:12,alignItems:'center'}}>
          <FilterChip2 label="Все"      value={String(payments.length||172)} active={filter==='all'}     onClick={()=>setFilter('all')}/>
          <FilterChip2 label="Оплачено" value={String(paidCount||161)}       active={filter==='paid'}    onClick={()=>setFilter('paid')}    dot={C.success}/>
          <FilterChip2 label="Ожидают"  value="0"                            active={filter==='pending'} onClick={()=>setFilter('pending')} dot={C.goldSoft}/>
          <FilterChip2 label="Возвраты" value="0"                                                                                           dot={C.muted}/>
          <FilterChip2 label="Ошибки"   value="0"                                                                                           dot={C.danger}/>
          <div style={{flex:1}}/>
          <FilterChip2 label="Способ: все"/>
          <FilterChip2 label="↕ По дате ↓"/>
        </div>

        {/* table / mobile cards */}
        {isMobile ? (
          <div style={{background:C.surface,border:`1px solid ${C.hairline}`}}>
            {(displayList.length?displayList:payments.slice(0,8).map(p=>({...p,letter:(p.userName||'?')[0].toUpperCase(),name:p.userName,item:p.desc,amount:p.amount||0}))).map((p,i,arr)=>(
              <div key={p.id||i} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderBottom:i===arr.length-1?'none':`1px solid ${C.hairline}`,minHeight:62}}>
                <AvatarCircle letter={p.letter||'?'} size={32}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:F.mono,fontSize:12,color:C.ink,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.name||p.userName}</div>
                  <div style={{fontFamily:F.serif,fontStyle:'italic',fontSize:11,color:C.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.item||p.desc}</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div style={{fontFamily:F.mono,fontSize:12,color:C.ink,fontWeight:600}}>{(p.amount||0)>0?(p.amount).toLocaleString('ru-RU')+' ₽':'free'}</div>
                  <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,marginTop:2}}>{(p.date||'').split(' ')[0]}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <HairlineTable2 columns={columns} rows={displayList} dense/>
        )}

        {/* footer */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 4px',marginTop:4}}>
          <span style={{fontFamily:F.mono,fontSize:10,color:C.muted,letterSpacing:'0.12em',textTransform:'uppercase'}}>
            Показано 1 — {Math.min(12,displayList.length||payments.length)} из {payments.length||172}
          </span>
          <Btn2 kind="ghost" size="sm">Загрузить ещё</Btn2>
        </div>

      </div>
    </div>
  );
}

// ── LessonEditForm — standalone to prevent remount on every keystroke ──────
function LessonEditForm({ draft, setDraft, doSave, setEditId, saving, showToast, isMobile }) {
  return (
    <div style={{background:C.white,border:`2px solid ${C.gold}`,padding:isMobile?'14px':'20px',marginBottom:2}}>
      {isMobile && (
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <span style={{fontSize:12,color:C.gold}}>Редактирование урока</span>
          <button onClick={()=>setEditId(null)} style={{background:'none',border:'none',fontSize:18,color:C.muted,cursor:'pointer'}}>✕</button>
        </div>
      )}
      <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:12}}>
        <div><Label>Заголовок</Label><Input value={draft.title||''} onChange={v=>setDraft(d=>({...d,title:v}))} placeholder="Название урока"/></div>
        <div><Label>Подзаголовок</Label><Input value={draft.subtitle||''} onChange={v=>setDraft(d=>({...d,subtitle:v}))} placeholder="Тема урока"/></div>
      </div>
      <div style={{marginBottom:12}}><Label>Описание</Label><Textarea value={draft.text||''} onChange={v=>setDraft(d=>({...d,text:v}))} rows={3}/></div>
      <div style={{marginBottom:14}}>
        <Label>Видео урока (Kinescope)</Label>
        <KinescopeUploader
          lessonId={draft.id}
          currentVideoId={draft.video_id}
          currentStatus={draft.video_status}
          onComplete={async ({videoId,status})=>{
            const updated = {...draft,video_id:videoId,video_status:status,video_provider:'kinescope'};
            setDraft(updated);
            // Сразу сохраняем video_id в БД — не ждём ручного нажатия "Сохранить"
            const {ok,error} = await saveLesson(updated);
            if(ok) showToast('Видео загружено и сохранено');
            else showToast('Видео загружено, но не сохранено: ' + error);
          }}
        />
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
        <Btn onClick={doSave} variant='success' small loading={saving}>Сохранить урок</Btn>
        <Btn onClick={()=>setEditId(null)} variant='ghost' small>Отмена</Btn>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 4. МЕСЯЦЫ
// ═══════════════════════════════════════════════════════════════
function SectionMonths({showToast,isMobile}){
  const {months,loading:mLoading,toggleOpen} = useMonths();
  const [activeMonth, setActiveMonth] = useState(null);
  const [showLessons, setShowLessons] = useState(false);
  const {lessons,loading:lLoading,saving,saveLesson,addLesson,deleteLesson} = useLessons(activeMonth||'jan');
  const [editId, setEditId] = useState(null);
  const [draft,  setDraft]  = useState({});

  // pick first month as default once loaded
  const activeMId = activeMonth || months[0]?.id || 'jan';
  const activeM   = months.find(m=>m.id===activeMId);

  const startEdit = (l) => { setEditId(l.id); setDraft({...l}); };
  const doSave    = async () => {
    const {ok,error} = await saveLesson({...draft});
    if(ok){ setEditId(null); showToast('Урок сохранён'); }
    else showToast('Ошибка: ' + error);
  };
  const doAdd = async () => {
    const {ok,lesson} = await addLesson(activeMId);
    if(ok && lesson) startEdit(lesson);
    if(isMobile) setShowLessons(true);
  };
  const doDelete = async (id) => {
    const {ok,error} = await deleteLesson(id);
    if(!ok){ showToast('Ошибка удаления: '+(error||'неизвестная ошибка')); return; }
    if(editId===id) setEditId(null);
    showToast('Урок удалён');
  };

  if(mLoading) return <Spinner/>;

  const totalPub   = lessons.filter(l=>l.video_status==='ready').length;
  const totalDraft = lessons.filter(l=>!l.video_id||l.video_status!=='ready').length;

  // lesson table columns (desktop)
  const lessonCols = [
    {label:'№',    width:'36px', render:(l)=>(<span style={{fontFamily:F.mono,fontSize:11,color:C.muted,letterSpacing:'0.06em'}}>{String(l.num).padStart(2,'0')}</span>)},
    {label:'',     width:'70px', render:(l)=>(
      <div style={{width:60,height:36,background:'#100c08',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',overflow:'hidden',flexShrink:0}}>
        <span style={{fontFamily:F.kanji,fontSize:24,color:'rgba(200,160,90,0.2)',lineHeight:1}}>月</span>
        <svg width="8" height="10" viewBox="0 0 8 10" style={{position:'absolute'}}><polygon points="0,0 8,5 0,10" fill="rgba(237,228,207,0.7)"/></svg>
      </div>
    )},
    {label:'Урок', width:'1.4fr',render:(l)=>(
      <div style={{minWidth:0}}>
        <div style={{fontFamily:F.mono,fontSize:13,color:C.ink,fontWeight:500}}>{l.title}</div>
        <div style={{fontFamily:F.serif,fontStyle:'italic',fontSize:12,color:C.muted,marginTop:2}}>{l.subtitle||'—'}</div>
      </div>
    )},
    {label:'Kinescope',width:'0.7fr',render:(l)=>(
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        {l.video_id
          ? <><span style={{width:6,height:6,background:l.video_status==='ready'?C.success:C.goldSoft,borderRadius:'50%',flexShrink:0}}/><span style={{fontFamily:F.mono,fontSize:11,color:C.ink2,letterSpacing:'0.04em',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:90}}>{l.video_id}</span></>
          : <span style={{fontFamily:F.mono,fontSize:11,color:C.muted,opacity:0.5}}>—</span>
        }
      </div>
    )},
    {label:'Длит.',  width:'0.5fr',render:(l)=>(<span style={{fontFamily:F.mono,fontSize:11,color:C.ink2,letterSpacing:'0.04em'}}>{l.duration||'—'}</span>)},
    {label:'Статус', width:'0.9fr',render:(l)=>{
      const st = l.video_status==='ready'?'published':l.video_id?'draft':'draft';
      return st==='published'
        ? <Pill2 kind="success" dot>опубликован</Pill2>
        : <Pill2 kind="gold"    dot>черновик</Pill2>;
    }},
    {label:'',       width:'auto',align:'center',render:(l)=>(
      <div style={{display:'flex',gap:4}}>
        <button onClick={()=>startEdit(l)} style={{background:'none',border:`1px solid ${C.hairline}`,cursor:'pointer',color:C.muted,fontSize:11,padding:'3px 9px',fontFamily:F.mono,letterSpacing:'0.08em'}}>Изм.</button>
        <button onClick={()=>doDelete(l.id)} style={{background:'none',border:`1px solid ${C.hairline}`,cursor:'pointer',color:C.danger,fontSize:11,padding:'3px 6px',fontFamily:F.mono}}>✕</button>
      </div>
    )},
  ];

  return (
    <div style={{background:C.bg,minHeight:'100%'}}>
      <div style={{padding:isMobile?'20px 16px 40px':'32px 36px 60px'}}>

        <AdminSectionHead num="03" title="Контент" subtitle={`Месяцы · ${lessons.length} уроков · видео из Kinescope`} kanji="月"
          actions={
            <div style={{display:'flex',gap:6,alignItems:'center'}}>
              <Pill2 kind="success" dot>{totalPub} опубл.</Pill2>
              <Pill2 kind="gold"    dot>{totalDraft} черн.</Pill2>
              <Btn2 kind="accent" size="sm" onClick={doAdd}>+ Урок</Btn2>
            </div>
          }
        />
        <SumiStroke style={{margin:'0 0 24px',opacity:0.3}}/>

        {/* edit form (inline, top of content) */}
        {editId&&(
          <div style={{marginBottom:16}}>
            <LessonEditForm draft={draft} setDraft={setDraft} doSave={doSave} setEditId={setEditId} saving={saving} showToast={showToast} isMobile={isMobile}/>
          </div>
        )}

        {/* ── MOBILE: month list → lesson list flow ─── */}
        {isMobile ? (
          !showLessons ? (
            /* month list */
            <div style={{background:C.surface,border:`1px solid ${C.hairline}`}}>
              {months.map((m,i)=>(
                <div key={m.id} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 16px',borderBottom:i===months.length-1?'none':`1px solid ${C.hairline}`,background:activeMId===m.id?C.surface2:'transparent',cursor:'pointer'}}
                  onClick={()=>{setActiveMonth(m.id);setShowLessons(true);setEditId(null);}}>
                  <span style={{fontFamily:F.kanji,fontSize:18,color:m.is_open?C.accent:C.muted,opacity:m.is_open?0.85:0.4}}>{m.kanji}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:F.mono,fontSize:13,color:m.is_open?C.ink:C.muted,fontWeight:500}}>{m.label}</div>
                    <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,marginTop:2,letterSpacing:'0.08em'}}>→ уроки</div>
                  </div>
                  <button onClick={e=>{e.stopPropagation();toggleOpen(m.id);}}
                    style={{padding:'3px 10px',background:'none',border:`1px solid ${m.is_open?C.success:C.hairline}`,color:m.is_open?C.success:C.muted,fontSize:9,cursor:'pointer',fontFamily:F.mono,letterSpacing:'0.12em'}}>
                    {m.is_open?'ОТКРЫТ':'ЗАКРЫТ'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            /* lesson list */
            <div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <button onClick={()=>{setShowLessons(false);setEditId(null);}} style={{background:'none',border:'none',fontSize:20,color:C.muted,cursor:'pointer',padding:'2px 6px'}}>←</button>
                <span style={{fontFamily:F.serif,fontSize:16,letterSpacing:'0.08em',color:C.ink,flex:1}}>{activeM?.label} — {lessons.length} уроков</span>
              </div>
              {lLoading&&<Spinner/>}
              <div style={{background:C.surface,border:`1px solid ${C.hairline}`}}>
                {lessons.map((l,i)=>(
                  <div key={l.id} style={{padding:'12px 14px',borderBottom:i===lessons.length-1?'none':`1px solid ${C.hairline}`}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:8}}>
                      <span style={{fontFamily:F.mono,fontSize:11,color:C.muted,minWidth:20}}>{String(l.num).padStart(2,'0')}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:F.mono,fontSize:13,color:C.ink,fontWeight:500}}>{l.title}</div>
                        <div style={{fontFamily:F.mono,fontSize:10,color:C.muted,marginTop:2}}>{l.subtitle} · {l.duration}</div>
                        {l.video_id&&<div style={{fontFamily:F.mono,fontSize:9,color:l.video_status==='ready'?C.success:C.goldSoft,marginTop:2,letterSpacing:'0.06em'}}>{l.video_status==='ready'?'✓ готово':'⟳ обрабатывается'}</div>}
                      </div>
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      <Btn2 kind="quiet" size="sm" onClick={()=>startEdit(l)}>Изменить</Btn2>
                      <Btn2 kind="quiet" size="sm" onClick={()=>doDelete(l.id)}>✕</Btn2>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          /* ── DESKTOP: split months rail + lessons table ─── */
          <div style={{display:'grid',gridTemplateColumns:'320px 1fr',gap:20,alignItems:'flex-start'}}>

            {/* months rail */}
            <div style={{background:C.surface,border:`1px solid ${C.hairline}`}}>
              <div style={{padding:'14px 18px',borderBottom:`1px solid ${C.hairline}`,display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontFamily:F.kanji,fontSize:13,color:C.gold,letterSpacing:'0.14em',opacity:0.85}}>年</span>
                <span style={{fontFamily:F.serif,fontSize:11,letterSpacing:'0.18em',color:C.ink,fontWeight:600}}>2026 · МЕСЯЦЫ</span>
              </div>
              {months.map((m,i)=>{
                const isA = activeMId===m.id;
                return (
                  <div key={m.id} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 18px',borderBottom:i===months.length-1?'none':`1px solid ${C.hairline}`,borderLeft:`2px solid ${isA?C.accent:'transparent'}`,background:isA?C.bg2:'transparent',cursor:'pointer'}}
                    onClick={()=>{setActiveMonth(m.id);setEditId(null);}}>
                    <span style={{fontFamily:F.mono,fontSize:10,color:isA?C.accent:C.muted,letterSpacing:'0.06em',minWidth:18}}>{String(i+1).padStart(2,'0')}</span>
                    <span style={{fontFamily:F.kanji,fontSize:16,color:isA?C.accent:C.copper,opacity:isA?0.9:0.55}}>{m.kanji}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:F.mono,fontSize:13,color:isA?C.ink:C.ink2,fontWeight:isA?600:500}}>{m.label}</div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:3}}>
                      <button onClick={e=>{e.stopPropagation();toggleOpen(m.id);}}
                        style={{background:'none',border:`1px solid ${m.is_open?C.success:C.hairline}`,color:m.is_open?C.success:C.muted,fontSize:8,cursor:'pointer',fontFamily:F.mono,letterSpacing:'0.12em',padding:'2px 6px'}}>
                        {m.is_open?'ОТКРЫТ':'ЗАКРЫТ'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* lessons panel */}
            <div>
              {/* month header */}
              <div style={{background:C.surface,border:`1px solid ${C.hairline}`,padding:'20px 24px',marginBottom:14,display:'flex',alignItems:'center',gap:16}}>
                <span style={{fontFamily:F.kanji,fontSize:52,color:C.accent,opacity:0.15,lineHeight:0.8}}>{activeM?.kanji?.[0]||'月'}</span>
                <div style={{flex:1}}>
                  <div style={{fontFamily:F.serif,fontSize:26,color:C.ink,letterSpacing:'0.04em',fontWeight:500,lineHeight:1}}>{activeM?.label||'—'}</div>
                  <div style={{fontFamily:F.mono,fontSize:10,color:C.muted,letterSpacing:'0.12em',marginTop:5}}>{lessons.length} УРОКОВ · {totalPub} ОПУБЛИКОВАНО</div>
                </div>
                <Btn2 kind="accent" size="sm" onClick={doAdd}>+ Новый урок</Btn2>
              </div>

              {lLoading&&<Spinner/>}
              <HairlineTable2 columns={lessonCols} rows={lessons} dense/>

              {lessons.length===0&&!lLoading&&(
                <div style={{background:C.surface,border:`1px solid ${C.hairline}`,padding:'40px 24px',textAlign:'center',fontFamily:F.serif,fontStyle:'italic',fontSize:14,color:C.muted}}>
                  Уроков нет · нажмите «+ Новый урок»
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 5. ИККАДЖО
// ═══════════════════════════════════════════════════════════════
function SectionIkkajo({showToast,isMobile}){
  const {techniques,loading,saving,getTechContent,saveTechInfo,saveMistakes,saveVideos} = useTechniques();
  const [selectedId,  setSelectedId]  = useState(null);
  const [filterKyu,   setFilterKyu]   = useState('all');
  const [activeTab,   setActiveTab]   = useState('info');
  const [showEditor,  setShowEditor]  = useState(false); // mobile nav
  const [draft, setDraft] = useState(null);

  const filtered = filterKyu==='all' ? techniques : techniques.filter(t=>t.kyu===filterKyu);
  const tech     = techniques.find(t=>t.id===selectedId);

  const selectTech = (t) => {
    setSelectedId(t.id);
    setActiveTab('info');
    const cnt = getTechContent(t.id);
    setDraft({
      nameRu:      t.name_ru,
      kyu:         t.kyu,
      section:     t.section,
      description: cnt.description,
      principles:  [...(cnt.principles||[])],
      senseiQuote: cnt.senseiQuote,
      mistakes:    cnt.mistakes.map(m=>({title:m.title,desc:m.description||m.desc})),
      videos:      {
        overview:   cnt.videos.overview.map(v=>({...v})),
        details:    cnt.videos.details.map(v=>({...v})),
        mistakes:   cnt.videos.mistakes.map(v=>({...v})),
        variations: cnt.videos.variations.map(v=>({...v})),
      },
    });
    if(isMobile) setShowEditor(true);
  };

  const doSaveInfo     = async () => { const {ok} = await saveTechInfo(selectedId,draft);                                 if(ok) showToast('Информация сохранена'); };
  const doSaveMistakes = async () => { const {ok} = await saveMistakes(selectedId, draft.mistakes||[]);                  if(ok) showToast('Ошибки сохранены'); };
  // videoOverride: { vidId, fields } — применяется к конкретному vid.id прямо при save,
  // не завися от async state. Нужно когда onComplete вызывает doSaveVideos сразу после updV.
  const doSaveVideos = async (catId, videoOverride) => {
    // Берём текущий список видео из draft
    let catVids = draft.videos?.[catId] || [];
    // Применяем override синхронно — state к этому моменту ещё не обновился
    if (videoOverride) {
      catVids = catVids.map(v =>
        v.id === videoOverride.vidId ? { ...v, ...videoOverride.fields } : v
      );
    }
    const { ok, data } = await saveVideos(selectedId, catId, catVids);
    if (ok) {
      if (data?.length) {
        setDraft(d => ({
          ...d,
          videos: {
            ...d.videos,
            [catId]: data.map(row => ({
              id:           row.id,
              title:        row.title,
              duration:     row.duration,
              video_id:     row.video_id     ?? null,
              video_status: row.video_status ?? 'none',
              video_provider: row.video_provider ?? null,
            })),
          },
        }));
      }
      showToast(`Видео «${VIDEO_CAT_LABELS[catId]}» сохранено`);
    } else {
      showToast('Ошибка сохранения видео');
    }
  };

  const TABS = [{id:'info',label:'Основное'},{id:'videos',label:'Видео'},{id:'principles',label:'Принципы'},{id:'mistakes',label:'Ошибки'},{id:'sensei',label:'Сэнсэй'}];

  const PROGRAMS_PROTO = [
    {id:'ikkajo', name:'Иккаджо', kanji:'一',romaji:'Ikkajō', techs:techniques.length||118, published:techniques.filter(t=>t.kyu).length||84, drafts:12, sections:7},
    {id:'nikajo', name:'Никаджо', kanji:'二',romaji:'Nikajō', techs:96,  published:42, drafts:8,  sections:6},
    {id:'sankajo',name:'Санкаджо',kanji:'三',romaji:'Sankajō',techs:88,  published:0,  drafts:14, sections:6},
  ];

  if(loading) return <Spinner/>;

  const editorJSX = (
    tech&&draft ? (
      <div style={{background:C.white,border:`1px solid ${C.border}`}}>
        <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
          <div style={{minWidth:0}}>
            <div style={{fontSize:15,color:C.dark,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{tech.name_ru}</div>
            <div style={{fontSize:11,color:C.muted}}>{tech.id} · {LEVEL_LABELS[draft.kyu]||draft.kyu}</div>
          </div>
          {isMobile && <button onClick={()=>setShowEditor(false)} style={{background:'none',border:'none',fontSize:18,color:C.muted,cursor:'pointer',flexShrink:0}}>←</button>}
        </div>

        <div style={{display:'flex',borderBottom:`1px solid ${C.border}`,overflowX:'auto',background:C.bg}}>
          {TABS.map(tab=>(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
              style={{padding:'10px 14px',background:activeTab===tab.id?C.white:'transparent',border:'none',borderBottom:`2px solid ${activeTab===tab.id?C.gold:'transparent'}`,color:activeTab===tab.id?C.dark:C.muted,fontSize:12,cursor:'pointer',whiteSpace:'nowrap',marginBottom:-1,fontWeight:activeTab===tab.id?500:400,minHeight:40}}>
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{padding:isMobile?'16px':'22px'}}>
          {activeTab==='info'&&(
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div><Label>Название (рус)</Label><Input value={draft.nameRu} onChange={v=>setDraft(d=>({...d,nameRu:v}))} placeholder="Русское название"/></div>
              <div><Label>Раздел</Label><Input value={draft.section} onChange={v=>setDraft(d=>({...d,section:v}))} placeholder="Tachiai"/></div>
              <div><Label>Уровень</Label><Select value={draft.kyu} onChange={v=>setDraft(d=>({...d,kyu:v}))} options={LEVELS_LIST.slice(0,6).map(l=>({value:l,label:LEVEL_LABELS[l]}))}/></div>
              <div><Label>Описание техники</Label><Textarea value={draft.description} onChange={v=>setDraft(d=>({...d,description:v}))} placeholder="Краткое описание…" rows={4}/></div>
              <div style={{display:'flex',justifyContent:'flex-end'}}><Btn onClick={doSaveInfo} variant='success' loading={saving}>Сохранить</Btn></div>
            </div>
          )}

          {activeTab==='videos'&&(
            <div>
              {VIDEO_CAT_IDS.map(catId=>{
                const catVids = draft.videos?.[catId]||[];
                const addV    = ()=>setDraft(d=>({...d,videos:{...d.videos,[catId]:[...catVids,{id:`nv-${Date.now()}`,title:'Новое видео',video_id:null,video_status:'none'}]}}));
                const updV    = (vid,field,val)=>setDraft(d=>({...d,videos:{...d.videos,[catId]:catVids.map(v=>v.id===vid.id?{...v,[field]:val}:v)}}));
                const delV    = (vid)=>setDraft(d=>({...d,videos:{...d.videos,[catId]:catVids.filter(v=>v.id!==vid.id)}}));
                return(
                  <div key={catId} style={{marginBottom:24}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,flexWrap:'wrap',gap:8}}>
                      <div style={{display:'flex',alignItems:'center',gap:8}}>
                        <span style={{width:8,height:8,background:VIDEO_CAT_COLORS[catId],display:'inline-block'}}/>
                        <span style={{fontSize:12,color:C.dark,fontWeight:500}}>{VIDEO_CAT_LABELS[catId]}</span>
                        <span style={{fontSize:10,color:C.muted}}>({catVids.length})</span>
                      </div>
                      <div style={{display:'flex',gap:8}}>
                        <Btn onClick={addV} small>+ Видео</Btn>
                        <Btn onClick={()=>doSaveVideos(catId)} variant='success' small loading={saving}>Сохранить</Btn>
                      </div>
                    </div>
                    {catVids.length===0&&<div style={{padding:'14px',border:`1px dashed ${C.border}`,fontSize:12,color:C.muted,textAlign:'center'}}>Видео не добавлено</div>}
                    {catVids.map(vid=>(
                      <div key={vid.id} style={{background:C.bg,border:`1px solid ${C.border}`,padding:'14px',marginBottom:6}}>
                        <div style={{display:'flex',gap:8,marginBottom:10,alignItems:'flex-end',flexWrap:'wrap'}}>
                          <div style={{flex:2,minWidth:120}}><Label>Название</Label><Input value={vid.title} onChange={v=>updV(vid,'title',v)} placeholder="Название видео"/></div>
                          <Btn onClick={()=>delV(vid)} variant='danger' small>✕</Btn>
                        </div>
                        <KinescopeUploader
                          techniqueVideoId={vid.id?.startsWith('nv-') ? undefined : vid.id}
                          currentVideoId={vid.video_id}
                          currentStatus={vid.video_status}
                          onComplete={({videoId,status})=>{
                            // Обновляем local state для UI
                            updV(vid,'video_id',videoId);
                            updV(vid,'video_status',status);
                            updV(vid,'video_provider','kinescope');
                            // Сохраняем в БД с override — state ещё не обновился!
                            doSaveVideos(catId, {
                              vidId: vid.id,
                              fields: { video_id: videoId, video_status: status, video_provider: 'kinescope' },
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab==='principles'&&(
            <div>
              <div style={{fontSize:11,color:C.muted,marginBottom:14,padding:'10px 14px',background:C.goldBg,border:`1px solid ${C.goldBorder}`}}>
                Отображаются пользователю в блоке «道 Ключевые принципы»
              </div>
              {(draft.principles||[]).map((p,i)=>(
                <div key={i} style={{display:'flex',gap:8,marginBottom:8,alignItems:'center'}}>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:'#ccc',minWidth:24,fontWeight:600}}>{String(i+1).padStart(2,'0')}</span>
                  <div style={{flex:1}}><Input value={p} onChange={v=>{const a=[...draft.principles];a[i]=v;setDraft(d=>({...d,principles:a}));}} placeholder={`Принцип ${i+1}…`}/></div>
                  <Btn onClick={()=>setDraft(d=>({...d,principles:d.principles.filter((_,j)=>j!==i)}))} variant='danger' small>✕</Btn>
                </div>
              ))}
              <div style={{display:'flex',gap:8,marginTop:14,flexWrap:'wrap'}}>
                <Btn onClick={()=>setDraft(d=>({...d,principles:[...(d.principles||[]),'']}))} variant='ghost'>+ Добавить принцип</Btn>
                <Btn onClick={doSaveInfo} variant='success' loading={saving}>Сохранить</Btn>
              </div>
            </div>
          )}

          {activeTab==='mistakes'&&(
            <div>
              <div style={{fontSize:11,color:C.muted,marginBottom:14,padding:'10px 14px',background:C.redBg,border:`1px solid ${C.redBorder}`}}>
                Отображаются в блоке с красной полосой «✕ Типичные ошибки»
              </div>
              {(draft.mistakes||[]).map((m,i)=>(
                <div key={i} style={{background:C.bg,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.red}`,padding:'14px',marginBottom:8}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                    <span style={{fontSize:10,color:C.red}}>Ошибка {i+1}</span>
                    <Btn onClick={()=>setDraft(d=>({...d,mistakes:d.mistakes.filter((_,j)=>j!==i)}))} variant='danger' small>Удалить</Btn>
                  </div>
                  <div style={{marginBottom:8}}><Label>Заголовок</Label><Input value={m.title} onChange={v=>{const a=[...draft.mistakes];a[i]={...a[i],title:v};setDraft(d=>({...d,mistakes:a}));}}/></div>
                  <div><Label>Описание</Label><Textarea value={m.desc} onChange={v=>{const a=[...draft.mistakes];a[i]={...a[i],desc:v};setDraft(d=>({...d,mistakes:a}));}} rows={2}/></div>
                </div>
              ))}
              <div style={{display:'flex',gap:8,marginTop:14,flexWrap:'wrap'}}>
                <Btn onClick={()=>setDraft(d=>({...d,mistakes:[...(d.mistakes||[]),{title:'',desc:''}]}))} variant='ghost'>+ Добавить ошибку</Btn>
                <Btn onClick={doSaveMistakes} variant='success' loading={saving}>Сохранить</Btn>
              </div>
            </div>
          )}

          {activeTab==='sensei'&&(
            <div>
              <div style={{fontSize:11,color:C.muted,marginBottom:14,padding:'10px 14px',background:C.goldBg,border:`1px solid ${C.goldBorder}`}}>
                Прямая речь сэнсэя — блок с золотой чертой внизу страницы техники. Кавычки добавляются автоматически.
              </div>
              <Textarea value={draft.senseiQuote} onChange={v=>setDraft(d=>({...d,senseiQuote:v}))} placeholder="Комментарий сэнсэя без кавычек…" rows={5}/>
              {draft.senseiQuote&&(
                <div style={{marginTop:14,padding:'14px 18px',background:C.bg,border:`1px solid ${C.border}`,borderLeft:`2px solid ${C.goldBorder}`}}>
                  <div style={{fontSize:9,color:C.muted,marginBottom:8,letterSpacing:1}}>ПРЕВЬЮ</div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:15,color:'#555',fontStyle:'italic',lineHeight:1.8}}>«{draft.senseiQuote}»</div>
                </div>
              )}
              <div style={{display:'flex',justifyContent:'flex-end',marginTop:14}}>
                <Btn onClick={doSaveInfo} variant='success' loading={saving}>Сохранить</Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    ) : (
      <div style={{background:C.white,border:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'center',minHeight:200,color:C.muted,fontSize:12}}>
        Выберите технику из списка
      </div>
    )
  );

  return (
    <div style={{background:C.bg,minHeight:'100%'}}>
      <div style={{padding:isMobile?'20px 16px 40px':'32px 36px 60px'}}>

        <AdminSectionHead num="04" title="База техник" subtitle={`${techniques.length||302} техник в трёх программах`} kanji="技"/>
        <SumiStroke style={{margin:'0 0 24px',opacity:0.3}}/>

        {/* program cards */}
        {!isMobile&&(
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:28}}>
            {PROGRAMS_PROTO.map((p,pi)=>{
              const isA = pi===0;
              return (
                <div key={p.id} style={{background:C.surface,border:`1px solid ${isA?C.accent:C.hairline}`,padding:'22px 24px',position:'relative',overflow:'hidden',cursor:'pointer'}}>
                  <div style={{position:'absolute',top:-8,right:8,fontFamily:F.kanji,fontSize:100,lineHeight:1,color:isA?C.accent:C.copper,opacity:isA?0.18:0.12}}>{p.kanji}</div>
                  {isA&&<div style={{position:'absolute',top:14,left:14,width:6,height:6,background:C.accent,transform:'rotate(45deg)'}}/>}
                  <div style={{position:'relative',marginTop:isA?6:0}}>
                    <div style={{fontFamily:F.mono,fontSize:10,color:isA?C.accent:C.muted,letterSpacing:'0.22em',fontWeight:600,marginBottom:6}}>ПРОГРАММА {p.kanji}</div>
                    <div style={{fontFamily:F.serif,fontSize:26,color:C.ink,letterSpacing:'0.04em',fontWeight:500,lineHeight:1}}>{p.name}</div>
                    <div style={{fontFamily:F.serif,fontStyle:'italic',fontSize:13,color:C.muted,marginTop:4}}>{p.romaji} · {p.sections} разделов</div>
                    <div style={{display:'flex',gap:16,marginTop:16}}>
                      {[['Всего',C.muted,p.techs],['Опубл.',C.success,p.published],['Черн.',C.goldSoft,p.drafts]].map(([lbl,clr,val])=>(
                        <div key={lbl}>
                          <div style={{fontFamily:F.mono,fontSize:9,color:clr,letterSpacing:'0.18em',textTransform:'uppercase'}}>{lbl}</div>
                          <div style={{fontFamily:F.serif,fontSize:22,color:C.ink,letterSpacing:'0.04em'}}>{val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* filter chips */}
        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:16,alignItems:'center'}}>
          <FilterChip2 label="Все разделы" value={String(techniques.length)} active={filterKyu==='all'} onClick={()=>setFilterKyu('all')}/>
          {LEVELS_LIST.slice(0,6).map(l=>(
            <FilterChip2 key={l} label={LEVEL_LABELS[l]} active={filterKyu===l} onClick={()=>setFilterKyu(l)}/>
          ))}
        </div>

        {/* content: tech list + editor */}
        {isMobile ? (
          showEditor ? (
            editorJSX
          ) : (
            <div style={{background:C.surface,border:`1px solid ${C.hairline}`}}>
              {filtered.map((t,i)=>{
                const cnt = getTechContent(t.id);
                return (
                  <div key={t.id} onClick={()=>selectTech(t)}
                    style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderBottom:i===filtered.length-1?'none':`1px solid ${C.hairline}`,cursor:'pointer',background:selectedId===t.id?C.surface2:'transparent',borderLeft:`2px solid ${selectedId===t.id?C.accent:'transparent'}`}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontFamily:F.mono,fontSize:13,color:C.ink,fontWeight:selectedId===t.id?500:400}}>{t.name_ru}</div>
                      <div style={{fontFamily:F.mono,fontSize:9,color:C.muted,marginTop:2,letterSpacing:'0.06em'}}>{LEVEL_LABELS[t.kyu]||t.kyu}</div>
                    </div>
                    <div style={{display:'flex',gap:5}}>
                      {cnt.principles?.length>0&&<span style={{fontSize:10,color:C.success}}>道</span>}
                      {cnt.mistakes?.length>0&&<span style={{fontSize:10,color:C.danger}}>✕</span>}
                      {cnt.senseiQuote&&<span style={{fontSize:10,color:C.gold}}>«»</span>}
                      {Object.values(cnt.videos||{}).some(a=>a.length>0)&&<span style={{fontSize:10,color:C.accent}}>▶</span>}
                    </div>
                    <span style={{fontFamily:F.kanji,fontSize:14,color:C.accent,opacity:0.6}}>{LEVEL_KANJI_MAP[t.kyu]||'?'}</span>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:16,alignItems:'start'}}>
            {/* tech list */}
            <div style={{background:C.surface,border:`1px solid ${C.hairline}`}}>
              <div style={{padding:'10px 16px',borderBottom:`1px solid ${C.hairline}`,background:C.bg2}}>
                <Select value={filterKyu} onChange={setFilterKyu} options={[{value:'all',label:'Все уровни'},...LEVELS_LIST.slice(0,6).map(l=>({value:l,label:LEVEL_LABELS[l]}))]}/>
              </div>
              {filtered.map((t,i)=>{
                const cnt = getTechContent(t.id);
                return (
                  <div key={t.id} onClick={()=>selectTech(t)}
                    style={{padding:'12px 16px',borderBottom:i===filtered.length-1?'none':`1px solid ${C.hairline}`,cursor:'pointer',background:selectedId===t.id?C.bg2:'transparent',borderLeft:`2px solid ${selectedId===t.id?C.accent:'transparent'}`}}>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{fontFamily:F.mono,fontSize:13,color:C.ink,fontWeight:selectedId===t.id?600:400}}>{t.name_ru}</span>
                      <div style={{display:'flex',alignItems:'center',gap:5}}>
                        <span style={{fontFamily:F.kanji,fontSize:12,color:C.accent,opacity:0.7}}>{LEVEL_KANJI_MAP[t.kyu]||'?'}</span>
                        <span style={{fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:'0.06em'}}>{LEVEL_LABELS[t.kyu]||t.kyu}</span>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:5}}>
                      {cnt.principles?.length>0&&<span style={{fontSize:9,color:C.success}}>道</span>}
                      {cnt.mistakes?.length>0&&<span style={{fontSize:9,color:C.danger}}>✕</span>}
                      {cnt.senseiQuote&&<span style={{fontSize:9,color:C.gold}}>«»</span>}
                      {Object.values(cnt.videos||{}).some(a=>a.length>0)&&<span style={{fontSize:9,color:C.accent}}>▶</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* editor */}
            {editorJSX}
          </div>
        )}

      </div>
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════
// SECTION ДОСТУПЫ — ручная выдача/отзыв через user_access
// ═══════════════════════════════════════════════════════════════
const ACCESS_MONTH_OPTIONS = [
  {value:'jan',label:'Январь'},{value:'feb',label:'Февраль'},
  {value:'mar',label:'Март'},{value:'apr',label:'Апрель'},
  {value:'may',label:'Май'},{value:'jun',label:'Июнь'},
  {value:'jul',label:'Июль'},{value:'aug',label:'Август'},
  {value:'sep',label:'Сентябрь'},{value:'oct',label:'Октябрь'},
  {value:'nov',label:'Ноябрь'},{value:'dec',label:'Декабрь'},
];
// Секции Ikkajo — из единого конфига, не хардкод
const ACCESS_SECTION_OPTIONS = [
  {value:'ikkajo', label:'Иккаджо (весь)'},
  ...IKKAJO_SECTION_OPTIONS,
];

function SectionAccess({showToast,isMobile}){
  const {users,loading:uLoading} = useUsers();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [type,      setType]      = useState('month');
  const [reference, setReference] = useState('jan');
  const [granting,  setGranting]  = useState(false);
  const {rows:accessRows, loading:aLoading, reload} = useAdminUserAccess(selectedUserId);

  const refOptions = type === 'month' ? ACCESS_MONTH_OPTIONS : ACCESS_SECTION_OPTIONS;

  const doGrant = async () => {
    if (!selectedUserId) { showToast('Выберите пользователя'); return; }
    setGranting(true);
    const {ok,error} = await grantAccess({userId:selectedUserId, type, reference});
    setGranting(false);
    if(ok){ showToast('Доступ выдан'); reload(); }
    else showToast('Ошибка: ' + error);
  };

  const doRevoke = async (row) => {
    const {ok,error} = await revokeAccess({userId:selectedUserId, type:row.type, reference:row.reference});
    if(ok){ showToast('Доступ отозван'); reload(); }
    else showToast('Ошибка: ' + error);
  };

  const refLabel = {
    jan:'Январь',feb:'Февраль',mar:'Март',apr:'Апрель',
    may:'Май',jun:'Июнь',jul:'Июль',aug:'Август',
    sep:'Сентябрь',oct:'Октябрь',nov:'Ноябрь',dec:'Декабрь',
    ikkajo:'Иккаджо (весь)',
    ...IKKAJO_LABELS,
  };

  if(uLoading) return <Spinner/>;
  return(
    <div style={{background:C.bg,minHeight:'100%'}}>
      <div style={{padding:isMobile?'20px 16px 40px':'32px 36px 60px'}}>

        <AdminSectionHead num="" title="Доступы" subtitle="Ручная выдача и отзыв доступов" kanji="鍵"/>
        <SumiStroke style={{margin:'0 0 24px',opacity:0.3}}/>

        <div style={{display:isMobile?'flex':'grid',flexDirection:'column',gridTemplateColumns:'1fr 1fr',gap:20,alignItems:'start'}}>

          {/* Grant form */}
          <div style={{background:C.surface,border:`1px solid ${C.hairline}`,padding:'22px 22px 20px'}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <span style={{fontFamily:F.kanji,fontSize:13,color:C.gold,opacity:0.8}}>授</span>
              <span style={{fontFamily:F.serif,fontSize:11,letterSpacing:'0.18em',color:C.ink,fontWeight:600}}>ВЫДАТЬ ДОСТУП</span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div>
                <Label>Пользователь</Label>
                <Select value={selectedUserId} onChange={v=>{setSelectedUserId(v);}} options={[{value:'',label:'— выберите —'},...users.map(u=>({value:u.id,label:`${u.name} (${u.email})`}))]}/>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div>
                  <Label>Тип</Label>
                  <Select value={type} onChange={v=>{setType(v);setReference(v==='month'?'jan':'ikkajo');}} options={[{value:'month',label:'Месяц'},{value:'section',label:'Раздел'}]}/>
                </div>
                <div>
                  <Label>Раздел / Месяц</Label>
                  <Select value={reference} onChange={setReference} options={refOptions}/>
                </div>
              </div>
              <Btn2 kind="accent" onClick={doGrant} disabled={granting}>{granting?'…':'Выдать доступ'}</Btn2>
            </div>
          </div>

          {/* Existing access for selected user */}
          <div style={{background:C.surface,border:`1px solid ${C.hairline}`,padding:'22px 22px 20px',minHeight:120}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:16}}>
              <span style={{fontFamily:F.kanji,fontSize:13,color:C.copper,opacity:0.8}}>現</span>
              <span style={{fontFamily:F.serif,fontSize:11,letterSpacing:'0.18em',color:C.ink,fontWeight:600}}>ТЕКУЩИЕ ДОСТУПЫ</span>
              {selectedUserId && <span style={{fontFamily:F.mono,fontSize:9,color:C.muted,letterSpacing:'0.1em'}}>{accessRows.length} записей</span>}
            </div>
            {!selectedUserId && (
              <div style={{fontFamily:F.serif,fontStyle:'italic',fontSize:13,color:C.muted}}>Выберите пользователя слева</div>
            )}
            {selectedUserId && aLoading && <Spinner/>}
            {selectedUserId && !aLoading && accessRows.length===0 && (
              <div style={{fontFamily:F.serif,fontStyle:'italic',fontSize:13,color:C.muted}}>Нет выданных доступов</div>
            )}
            {selectedUserId && !aLoading && accessRows.map(row=>(
              <div key={row.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:`1px solid ${C.hairline}`,gap:8}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <span style={{fontFamily:F.kanji,fontSize:13,color:row.type==='month'?C.gold:C.accent,opacity:0.8}}>{row.type==='month'?'月':'技'}</span>
                  <div>
                    <div style={{fontFamily:F.mono,fontSize:13,color:C.ink}}>{refLabel[row.reference]||row.reference}</div>
                    {row.amount>0 && <div style={{fontFamily:F.mono,fontSize:10,color:C.muted}}>{row.amount?.toLocaleString()} ₽</div>}
                  </div>
                </div>
                <Btn2 kind="quiet" size="sm" onClick={()=>doRevoke(row)}>Отозвать</Btn2>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SECTION БАЗА ЗНАНИЙ — управление knowledge_items
// ═══════════════════════════════════════════════════════════════
function SectionKnowledge({showToast,isMobile}){
  const {items,loading,saving,saveItem,deleteItem,reload} = useKnowledge({adminMode:true});
  const [editId,  setEditId]  = useState(null);
  const [draft,   setDraft]   = useState({});

  const startEdit = (item) => { setEditId(item.id||'new'); setDraft({...item}); };
  const startNew  = ()     => { setEditId('new'); setDraft({title:'',subtitle:'',content:'',is_published:false,sort_order:items.length}); };

  const doSave = async () => {
    const {ok,error} = await saveItem(draft);
    if(ok){ setEditId(null); showToast('Сохранено'); reload(); }
    else showToast('Ошибка: '+error);
  };
  const doDelete = async (id) => {
    const {ok,error} = await deleteItem(id);
    if(ok){ showToast('Удалено'); if(editId===id) setEditId(null); }
    else showToast('Ошибка: '+error);
  };

  const TAG_KANJI = {история:'史',принципы:'理',этикет:'礼',теория:'論',словарь:'語',школа:'校'};

  if(loading) return <Spinner/>;

  return(
    <div style={{background:C.bg,minHeight:'100%'}}>
      <div style={{padding:isMobile?'20px 16px 40px':'32px 36px 60px'}}>

        <AdminSectionHead
          num="" title="База знаний" kanji="智"
          subtitle={`${items.length} материалов · статьи, видео, теория`}
          actions={<Btn2 kind="accent" size="sm" onClick={startNew}>+ Новый материал</Btn2>}
        />
        <SumiStroke style={{margin:'0 0 24px',opacity:0.3}}/>

        {/* Edit form */}
        {editId && (
          <div style={{background:C.surface,border:`1px solid ${C.accent}`,padding:'24px 22px',marginBottom:20}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18,paddingBottom:14,borderBottom:`1px solid ${C.hairline}`}}>
              <span style={{fontFamily:F.kanji,fontSize:14,color:C.accent,opacity:0.85}}>智</span>
              <span style={{fontFamily:F.serif,fontSize:11,letterSpacing:'0.18em',color:C.ink,fontWeight:600}}>
                {editId==='new'?'НОВЫЙ МАТЕРИАЛ':'РЕДАКТИРОВАНИЕ'}
              </span>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:16}}>
              <div><Label>Заголовок</Label><Input value={draft.title||''} onChange={v=>setDraft(d=>({...d,title:v}))} placeholder="Название"/></div>
              <div><Label>Подзаголовок</Label><Input value={draft.subtitle||''} onChange={v=>setDraft(d=>({...d,subtitle:v}))} placeholder="Краткое описание"/></div>
              <div><Label>Контент (Markdown)</Label><Textarea value={draft.content||''} onChange={v=>setDraft(d=>({...d,content:v}))} rows={6} placeholder="Текст материала…"/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr auto',gap:12,alignItems:'end'}}>
                <div>
                  <Label>Категория (тег)</Label>
                  <select value={draft.tag||''} onChange={e=>setDraft(d=>({...d,tag:e.target.value||null}))}
                    style={{width:'100%',padding:'8px 10px',border:`1px solid ${C.hairline}`,background:C.bg,fontSize:12,color:C.ink,appearance:'auto',fontFamily:F.mono}}>
                    <option value="">— без категории —</option>
                    <option value="история">История</option>
                    <option value="принципы">Принципы</option>
                    <option value="этикет">Этикет</option>
                    <option value="теория">Теория</option>
                    <option value="словарь">Словарь</option>
                    <option value="школа">Школа</option>
                  </select>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:8,paddingBottom:4}}>
                  <input type="checkbox" id="kb_pub" checked={!!draft.is_published} onChange={e=>setDraft(d=>({...d,is_published:e.target.checked}))}/>
                  <label htmlFor="kb_pub" style={{fontFamily:F.mono,fontSize:10,color:C.ink,cursor:'pointer',letterSpacing:'0.06em',textTransform:'uppercase'}}>Опубликовано</label>
                </div>
              </div>
            </div>

            {/* Kinescope video */}
            <div style={{marginBottom:18}}>
              <Label>Видео (Kinescope)</Label>
              {editId && editId!=='new' ? (
                <KinescopeUploader
                  knowledgeItemId={draft.id}
                  currentVideoId={draft.video_id}
                  currentStatus={draft.video_status}
                  onComplete={({videoId,status})=>{
                    setDraft(d=>({...d,video_id:videoId,video_status:status,video_provider:'kinescope'}));
                    showToast('Видео загружено');
                  }}
                />
              ) : (
                <div style={{padding:'10px 14px',background:C.bg,border:`1px solid ${C.hairline}`,fontFamily:F.serif,fontStyle:'italic',fontSize:12,color:C.muted}}>
                  Сначала сохраните материал, затем загрузите видео
                </div>
              )}
            </div>

            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <Btn2 kind="accent" size="sm" onClick={doSave} disabled={saving}>{saving?'…':'Сохранить'}</Btn2>
              <Btn2 kind="quiet"  size="sm" onClick={()=>setEditId(null)}>Отмена</Btn2>
              {editId!=='new' && (
                <Btn2 kind="quiet" size="sm" onClick={()=>doDelete(editId)} style={{marginLeft:'auto',color:C.danger,borderColor:C.danger}}>Удалить</Btn2>
              )}
            </div>
          </div>
        )}

        {/* Items table */}
        <div style={{background:C.surface,border:`1px solid ${C.hairline}`}}>
          {/* header */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 120px 80px 36px',borderBottom:`1px solid ${C.hairline}`,background:C.bg2}}>
            {['Материал','Категория','Статус',''].map((h,i)=>(
              <div key={i} style={{padding:'11px 16px',fontFamily:F.mono,fontSize:9,letterSpacing:'0.18em',color:C.muted,textTransform:'uppercase',fontWeight:600}}>{h}</div>
            ))}
          </div>
          {items.length===0 && (
            <div style={{padding:'48px 22px',textAlign:'center'}}>
              <div style={{fontFamily:F.kanji,fontSize:40,color:C.muted,opacity:0.3,marginBottom:8}}>智</div>
              <div style={{fontFamily:F.serif,fontStyle:'italic',fontSize:14,color:C.muted}}>Нет материалов — добавьте первый</div>
            </div>
          )}
          {items.map((item,ri)=>(
            <div key={item.id} onClick={()=>startEdit(item)}
              style={{display:'grid',gridTemplateColumns:'1fr 120px 80px 36px',borderBottom:ri<items.length-1?`1px solid ${C.hairline}`:'none',cursor:'pointer',background:editId===item.id?C.bg2:'transparent'}}>
              <div style={{padding:'14px 16px',minWidth:0}}>
                <div style={{fontFamily:F.mono,fontSize:13,color:C.ink,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.title||'Без названия'}</div>
                {item.subtitle&&<div style={{fontFamily:F.mono,fontSize:11,color:C.muted,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.subtitle}</div>}
                {item.video_id&&<div style={{fontFamily:F.mono,fontSize:9,color:C.gold,marginTop:4,letterSpacing:'0.08em'}}>▶ видео</div>}
              </div>
              <div style={{padding:'14px 16px',display:'flex',alignItems:'center'}}>
                {item.tag ? (
                  <span style={{display:'inline-flex',alignItems:'center',gap:5,fontFamily:F.mono,fontSize:9,color:C.copper,letterSpacing:'0.1em',textTransform:'uppercase'}}>
                    <span style={{fontFamily:F.kanji,fontSize:11}}>{TAG_KANJI[item.tag]||'文'}</span>
                    {item.tag}
                  </span>
                ) : <span style={{fontFamily:F.mono,fontSize:9,color:C.muted}}>—</span>}
              </div>
              <div style={{padding:'14px 16px',display:'flex',alignItems:'center'}}>
                <Pill2 kind={item.is_published?'success':'muted'} dot>{item.is_published?'живой':'черн.'}</Pill2>
              </div>
              <div style={{padding:'14px 12px',display:'flex',alignItems:'center',justifyContent:'center',color:C.muted,fontSize:12}}>→</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 6. КОММЕНТАРИИ
// ═══════════════════════════════════════════════════════════════
const COMMENTS_DATA_PROTO = [
  {id:'c-981',letter:'К',name:'Константин Орлов',  email:'k.orlov@dojo.ru',    when:'10 мин. назад',at:'Идори · базовая стойка',      atKanji:'居',text:'Сэнсэй, в моменте 4:18 видно, что вы немного смещаете центр тяжести вперёд. Это намеренно для удержания партнёра, или ошибка перевода веса? Не могу понять, как сохранять центр в идори при таком расстоянии.',state:'pending',flag:null,   replies:0},
  {id:'c-980',letter:'И',name:'Мария Иванова',     email:'mivanova@gmail.com', when:'32 мин. назад',at:'Иппон-дори · урок 4',         atKanji:'一',text:'Большое спасибо за детальный разбор. Хотелось бы увидеть отдельный урок про работу с захватом сзади — у меня не получается одновременно держать центр и работать с напряжением партнёра.',state:'pending',flag:null,   replies:0},
  {id:'c-979',letter:'А',name:'Аноним',            email:'—',                  when:'1 ч. назад',   at:'Иккаджо · введение',          atKanji:'一',text:'Это просто фейк, никакого реального боя такие техники не остановят. Зачем это всё вообще?',state:'pending',flag:'reported',replies:0},
  {id:'c-978',letter:'Б',name:'Михаил Беляев',     email:'mbelyaev@yahoo.com', when:'3 ч. назад',   at:'Сихо-нагэ · детально',        atKanji:'四',text:'У меня вопрос по работе плеча — на моменте 8:30 кажется, что движение идёт от локтя, а в комментариях у вас говорится про работу от центра. Где правильная точка приложения?',state:'approved',flag:null,   replies:1},
  {id:'c-977',letter:'Ш',name:'Виктор Шумилов',    email:'shumilov@dojo.ru',   when:'вчера',        at:'Котэ-гаэси · вариация 3',     atKanji:'手',text:'Прекрасный материал. Применил на тренировке с партнёром — действительно ощущается разница в линии выхода. Благодарю.',state:'approved',flag:null,   replies:0},
  {id:'c-976',letter:'А',name:'spambot734',         email:'spam@viagrabest.cn', when:'2 дн. назад',  at:'Главная страница',             atKanji:'宣',text:'★★★ КУПИТЕ ДЕШЁВЫЕ КУРСЫ → bit.ly/xxx',state:'spam',flag:'spam',replies:0},
];

function SectionComments({showToast,isMobile}){
  const {comments,loading,markReplied} = useComments();
  const [replyOpen, setReplyOpen] = useState({});
  const [replyText, setReplyText] = useState({});
  const [filter,    setFilter]    = useState('pending');

  const sendReply = (id) => {
    if(!replyText[id]?.trim()) return;
    markReplied(id);
    setReplyOpen(p=>({...p,[id]:false}));
    setReplyText(p=>({...p,[id]:''}));
    showToast('Ответ отправлен');
  };

  // map real comments to design shape
  const mapped = comments.map(c=>({
    id:       String(c.id),
    letter:   (c.user_name||'?')[0].toUpperCase(),
    name:     c.user_name||'—',
    email:    '—',
    when:     c.created_at||'—',
    at:       c.lesson_id||'—',
    atKanji:  '声',
    text:     c.text||'',
    state:    c.replied?'approved':'pending',
    flag:     null,
    replies:  c.replied?1:0,
    raw:      c,
  }));

  const unreplied  = mapped.filter(c=>!c.raw.replied);
  const replied    = mapped.filter(c=>c.raw.replied);
  const pending    = mapped.filter(c=>c.state==='pending'&&!c.flag);
  const flagged    = mapped.filter(c=>c.flag==='reported');

  // use real data if available, else proto
  const displayAll = mapped.length > 0 ? mapped : COMMENTS_DATA_PROTO;
  const displayFiltered = filter==='pending'  ? displayAll.filter(c=>c.state==='pending'&&c.flag!=='reported'&&c.flag!=='spam')
    : filter==='flagged'  ? displayAll.filter(c=>c.flag==='reported')
    : filter==='approved' ? displayAll.filter(c=>c.state==='approved')
    : filter==='spam'     ? displayAll.filter(c=>c.flag==='spam')
    : displayAll;

  if(loading) return <Spinner/>;

  return (
    <div style={{background:C.bg,minHeight:'100%'}}>
      <div style={{padding:isMobile?'20px 16px 40px':'32px 36px 60px'}}>

        <AdminSectionHead num="07" title="Модерация" subtitle="Очередь комментариев · ответы сэнсэя" kanji="声"/>
        <SumiStroke style={{margin:'0 0 24px',opacity:0.3}}/>

        {/* 5 metrics */}
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(5,1fr)',gap:14,marginBottom:24}}>
          {[
            {label:'Всего за месяц',kanji:'月',value:String(comments.length||248),delta:'+38',deltaDir:'up'},
            {label:'На модерации',  kanji:'待',value:String(unreplied.length||3), delta:'требует',deltaDir:'flat'},
            {label:'Жалоб',         kanji:'告',value:String(flagged.length||1),   delta:'новая',deltaDir:'flat'},
            {label:'Спам · авто',   kanji:'禁',value:'14',sub:'· отсеяно'},
            {label:'Без ответа',    kanji:'無',value:String(unreplied.length||22), sub:'· от сэнсэя'},
          ].map((m,i)=>(
            <div key={i} style={{background:C.surface,border:`1px solid ${C.hairline}`,padding:'18px 20px',display:'flex',flexDirection:'column',gap:4,minHeight:isMobile?90:110}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                <span style={{fontFamily:F.mono,fontSize:9,letterSpacing:'0.22em',color:C.muted,textTransform:'uppercase'}}>{m.label}</span>
                <span style={{fontFamily:F.kanji,fontSize:14,color:C.copper,opacity:0.55}}>{m.kanji}</span>
              </div>
              <div style={{fontFamily:F.serif,fontSize:isMobile?26:34,color:C.ink,fontWeight:500,lineHeight:1,letterSpacing:'0.02em'}}>{m.value}</div>
              <div style={{marginTop:'auto',display:'flex',alignItems:'center',gap:6}}>
                {m.delta&&<span style={{fontFamily:F.mono,fontSize:10,color:m.deltaDir==='up'?C.success:m.deltaDir==='down'?C.danger:C.muted}}>
                  {m.deltaDir==='up'?'▲':m.deltaDir==='down'?'▼':'·'} {m.delta}
                </span>}
                {m.sub&&<span style={{fontFamily:F.mono,fontSize:10,color:C.muted}}>{m.sub}</span>}
              </div>
            </div>
          ))}
        </div>

        {/* filter chips */}
        <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:16,alignItems:'center'}}>
          <FilterChip2 label="На модерации" value={String(unreplied.length||3)}  active={filter==='pending'}  onClick={()=>setFilter('pending')}  dot={C.accent}/>
          <FilterChip2 label="Жалобы"       value={String(flagged.length||1)}     active={filter==='flagged'}  onClick={()=>setFilter('flagged')}  dot={C.danger}/>
          <FilterChip2 label="Без ответа"   value={String(unreplied.length||22)}  active={filter==='noreply'} onClick={()=>setFilter('noreply')}/>
          <FilterChip2 label="Опубликованные" value={String(replied.length||218)} active={filter==='approved'} onClick={()=>setFilter('approved')} dot={C.success}/>
          <FilterChip2 label="Спам"         value="14"                            active={filter==='spam'}     onClick={()=>setFilter('spam')}     dot={C.muted}/>
          <div style={{flex:1}}/>
          <FilterChip2 label="↕ По дате ↓"/>
        </div>

        {/* comment cards */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {(displayFiltered.length?displayFiltered:displayAll.slice(0,6)).map(c=>{
            const isReported = c.flag==='reported';
            const isSpam     = c.flag==='spam';
            return (
              <div key={c.id} style={{background:C.surface,border:`1px solid ${isReported?C.danger:C.hairline}`,display:isMobile?'block':'grid',gridTemplateColumns:'52px 1fr auto',gap:0}}>

                {/* avatar col */}
                {!isMobile&&(
                  <div style={{padding:'18px 0 18px 18px',display:'flex',flexDirection:'column',alignItems:'flex-start'}}>
                    <AvatarCircle letter={c.letter} size={34} color={isReported?C.danger:isSpam?C.muted:undefined}/>
                  </div>
                )}

                {/* body */}
                <div style={{padding:isMobile?'14px 14px 10px':'16px 22px 16px 14px',minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8,flexWrap:'wrap'}}>
                    {isMobile&&<AvatarCircle letter={c.letter} size={28} color={isReported?C.danger:isSpam?C.muted:undefined}/>}
                    <span style={{fontFamily:F.mono,fontSize:13,color:C.ink,fontWeight:600}}>{c.name}</span>
                    <span style={{fontFamily:F.mono,fontSize:10,color:C.muted,letterSpacing:'0.04em'}}>{c.email}</span>
                    <span style={{color:C.muted}}>·</span>
                    <span style={{fontFamily:F.mono,fontSize:10,color:C.muted,letterSpacing:'0.04em'}}>{c.when}</span>
                    <span style={{color:C.muted}}>·</span>
                    <span style={{display:'inline-flex',alignItems:'center',gap:6}}>
                      <span style={{fontFamily:F.kanji,fontSize:13,color:C.accent,opacity:0.85}}>{c.atKanji}</span>
                      <span style={{fontFamily:F.serif,fontStyle:'italic',fontSize:12,color:C.ink2}}>{c.at}</span>
                    </span>
                    {/* state pill */}
                    {c.flag==='reported'&&<Pill2 kind="danger" dot>жалоба</Pill2>}
                    {c.flag==='spam'    &&<Pill2 kind="muted"   dot>спам</Pill2>}
                    {!c.flag&&c.state==='pending' &&<Pill2 kind="accent"  dot>на модерации</Pill2>}
                    {!c.flag&&c.state==='approved'&&<Pill2 kind="success" dot>опубликован</Pill2>}
                  </div>
                  <div style={{fontFamily:F.mono,fontSize:14,color:C.ink2,lineHeight:1.55,opacity:isSpam?0.55:1}}>{c.text}</div>
                  {c.replies>0&&(
                    <div style={{marginTop:10,fontFamily:F.mono,fontSize:10,color:C.success,letterSpacing:'0.1em'}}>✓ {c.replies} ответ сэнсэя</div>
                  )}
                  {/* reply form for real comments */}
                  {c.raw&&replyOpen[c.id]&&(
                    <div style={{marginTop:12}}>
                      <Textarea value={replyText[c.id]||''} onChange={v=>setReplyText(p=>({...p,[c.id]:v}))} placeholder="Ответ сэнсэя…" rows={2}/>
                      <div style={{display:'flex',gap:8,marginTop:8}}>
                        <Btn2 kind="accent" size="sm" onClick={()=>sendReply(c.id)}>Отправить</Btn2>
                        <Btn2 kind="quiet"  size="sm" onClick={()=>setReplyOpen(p=>({...p,[c.id]:false}))}>Отмена</Btn2>
                      </div>
                    </div>
                  )}
                </div>

                {/* action buttons */}
                <div style={{padding:isMobile?'0 14px 14px':'16px 22px',borderLeft:isMobile?'none':`1px solid ${C.hairline}`,display:'flex',flexDirection:isMobile?'row':'column',gap:6,alignItems:'stretch',justifyContent:'center',minWidth:isMobile?0:180,flexWrap:'wrap'}}>
                  {c.state==='pending'&&!isReported&&(
                    <>
                      <Btn2 kind="accent" size="sm">Одобрить</Btn2>
                      <Btn2 kind="ghost"  size="sm" onClick={()=>c.raw&&setReplyOpen(p=>({...p,[c.id]:true}))}>Ответить</Btn2>
                      <Btn2 kind="quiet"  size="sm">Скрыть</Btn2>
                    </>
                  )}
                  {isReported&&(
                    <>
                      <Btn2 kind="accent" size="sm">Удалить</Btn2>
                      <Btn2 kind="quiet"  size="sm">Откл. жалобу</Btn2>
                    </>
                  )}
                  {c.state==='approved'&&!isReported&&(
                    <>
                      <Btn2 kind="ghost" size="sm" onClick={()=>c.raw&&setReplyOpen(p=>({...p,[c.id]:true}))}>{c.replies>0?'Изм. ответ':'Ответить'}</Btn2>
                      <Btn2 kind="quiet" size="sm">Скрыть</Btn2>
                    </>
                  )}
                  {isSpam&&(
                    <>
                      <Btn2 kind="quiet" size="sm">Не спам</Btn2>
                      <Btn2 kind="quiet" size="sm">Бан · IP</Btn2>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* footer */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 4px',marginTop:4}}>
          <span style={{fontFamily:F.mono,fontSize:10,color:C.muted,letterSpacing:'0.12em',textTransform:'uppercase'}}>
            Показано {Math.min(6,displayFiltered.length||6)} из {comments.length||248}
          </span>
          <Btn2 kind="ghost" size="sm">Загрузить ещё</Btn2>
        </div>

      </div>
    </div>
  );
}
