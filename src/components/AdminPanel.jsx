'use client';

import { useState, useRef, useCallback } from 'react';
import {
  useUsers, useAccess, useExams,
  useMonths, useLessons, useTechniques,
  useComments, useVideoUpload,
} from '@/lib/db';
import { IS_DB_CONNECTED } from '@/lib/supabase';

// ═══════════════════════════════════════════════════════════════
// ЦВЕТА — светлый стиль платформы
// ═══════════════════════════════════════════════════════════════
const C = {
  bg:          '#f5f3ee',
  white:       '#fff',
  border:      '#e8e0d0',
  gold:        '#8B6914',
  goldLight:   '#c8a84a',
  goldBorder:  '#e8dcc8',
  goldBg:      '#faf6ee',
  dark:        '#1a1a1a',
  muted:       '#999',
  light:       '#fdfcf8',
  green:       '#2d7a4a',
  greenBg:     '#f0faf4',
  greenBorder: '#b8e0c8',
  red:         '#a03030',
  redBg:       '#fff8f7',
  redBorder:   '#e8c0c0',
  blue:        '#2a5a9a',
};

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
  // YouTube
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/);
  if (yt) return { type: 'youtube', id: yt[1], embed: `https://www.youtube.com/embed/${yt[1]}?rel=0` };
  // Vimeo
  const vi = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vi) return { type: 'vimeo', id: vi[1], embed: `https://player.vimeo.com/video/${vi[1]}?dnt=1` };
  // Supabase Storage или любой mp4
  if (url.includes('.mp4') || url.includes('supabase')) return { type: 'file', url };
  return null;
}

// ═══════════════════════════════════════════════════════════════
// UI-КОМПОНЕНТЫ
// ═══════════════════════════════════════════════════════════════

function Input({ value, onChange, placeholder, type='text' }) {
  return (
    <input type={type} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{background:C.white,border:`1px solid ${C.border}`,color:C.dark,padding:'8px 12px',fontSize:12,outline:'none',width:'100%',fontFamily:"'Jost',sans-serif"}}/>
  );
}
function Textarea({ value, onChange, placeholder, rows=3 }) {
  return (
    <textarea value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{background:C.white,border:`1px solid ${C.border}`,color:C.dark,padding:'8px 12px',fontSize:12,outline:'none',width:'100%',resize:'vertical',lineHeight:1.65,fontFamily:"'Jost',sans-serif"}}/>
  );
}
function Select({ value, onChange, options }) {
  return (
    <select value={value||''} onChange={e=>onChange(e.target.value)}
      style={{background:C.white,border:`1px solid ${C.border}`,color:C.dark,padding:'8px 12px',fontSize:12,outline:'none',cursor:'pointer',fontFamily:"'Jost',sans-serif"}}>
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
function Btn({ children, onClick, variant='primary', small, disabled, loading }) {
  const s = {primary:{bg:C.dark,color:'#fff',brd:C.dark},success:{bg:C.green,color:'#fff',brd:C.green},danger:{bg:C.red,color:'#fff',brd:C.red},ghost:{bg:'transparent',color:C.muted,brd:C.border},gold:{bg:C.goldBg,color:C.gold,brd:C.goldBorder}}[variant]||{bg:C.dark,color:'#fff',brd:C.dark};
  return (
    <button onClick={onClick} disabled={disabled||loading}
      style={{padding:small?'5px 12px':'9px 20px',background:(disabled||loading)?'#eee':s.bg,color:(disabled||loading)?C.muted:s.color,border:`1px solid ${(disabled||loading)?C.border:s.brd}`,fontSize:small?11:12,cursor:(disabled||loading)?'default':'pointer',fontFamily:"'Jost',sans-serif",whiteSpace:'nowrap',transition:'opacity 0.12s',opacity:(disabled||loading)?0.7:1}}>
      {loading ? '…' : children}
    </button>
  );
}
function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{background:C.white,border:`1px solid ${C.border}`,padding:'20px 22px'}}>
      <div style={{fontSize:9,color:C.muted,letterSpacing:1.5,textTransform:'uppercase',marginBottom:10}}>{label}</div>
      <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:30,fontWeight:600,color:accent||C.gold,lineHeight:1}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:C.muted,marginTop:6}}>{sub}</div>}
    </div>
  );
}
function Label({ children }) {
  return <div style={{fontSize:9,color:C.muted,letterSpacing:1.2,textTransform:'uppercase',marginBottom:6}}>{children}</div>;
}
function Toast({ show, text }) {
  if (!show) return null;
  return (
    <div style={{position:'fixed',bottom:24,right:24,background:C.green,color:'#fff',padding:'11px 22px',fontSize:13,boxShadow:'0 4px 24px rgba(0,0,0,0.14)',zIndex:9999,display:'flex',alignItems:'center',gap:8}}>
      <span style={{fontSize:16}}>✓</span>{text||'Сохранено'}
    </div>
  );
}
function DBBadge() {
  return (
    <div style={{padding:'4px 10px',background:IS_DB_CONNECTED?C.greenBg:C.goldBg,border:`1px solid ${IS_DB_CONNECTED?C.greenBorder:C.goldBorder}`,fontSize:9,color:IS_DB_CONNECTED?C.green:C.gold,letterSpacing:0.5}}>
      {IS_DB_CONNECTED ? '● Supabase подключён' : '○ Mock-режим (БД не подключена)'}
    </div>
  );
}
function Spinner() {
  return <div style={{padding:'40px',textAlign:'center',color:C.muted,fontSize:12}}>Загрузка…</div>;
}

// Превью видео (YouTube iframe, Vimeo iframe, или mp4)
function VideoPreview({ url }) {
  const embed = extractVideoEmbed(url);
  if (!embed) return null;
  if (embed.type === 'file') return (
    <video controls src={embed.url} style={{width:'100%',maxHeight:240,background:'#000'}} />
  );
  return (
    <div style={{position:'relative',paddingBottom:'56.25%',height:0,background:'#000',marginTop:10}}>
      <iframe src={embed.embed} title="video" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowFullScreen
        style={{position:'absolute',top:0,left:0,width:'100%',height:'100%',border:'none'}}/>
    </div>
  );
}

// Поле ввода видео с кнопкой Сохранить, превью и загрузкой файла
function VideoInput({ videoUrl, onChange, onSave, saving }) {
  const fileRef = useRef();
  const { uploadFile, uploading } = useVideoUpload();
  const embed   = extractVideoEmbed(videoUrl);

  const handleFile = async (file) => {
    const path = `uploads/${Date.now()}-${file.name.replace(/\s/g,'_')}`;
    const { ok, url, error } = await uploadFile(file, path);
    if (ok) onChange(url);
    else alert('Ошибка загрузки: ' + error);
  };

  return (
    <div>
      <div style={{display:'flex',gap:8,marginBottom:8}}>
        <Input value={videoUrl} onChange={onChange} placeholder="https://youtube.com/watch?v=... или https://youtu.be/... или https://vimeo.com/..." />
        <Btn onClick={onSave} variant='gold' small loading={saving}>Сохранить</Btn>
      </div>

      {/* Превью */}
      {embed && <VideoPreview url={videoUrl} />}

      {/* Загрузка файла */}
      <div style={{display:'flex',alignItems:'center',gap:8,marginTop:10}}>
        <div style={{height:1,flex:1,background:C.border}}/>
        <span style={{fontSize:10,color:C.muted}}>или загрузить файл</span>
        <div style={{height:1,flex:1,background:C.border}}/>
      </div>
      <input ref={fileRef} type="file" accept="video/mp4,video/mov,video/webm" style={{display:'none'}} onChange={e=>{if(e.target.files[0])handleFile(e.target.files[0]);}}/>
      <button onClick={()=>fileRef.current.click()} disabled={uploading}
        style={{width:'100%',marginTop:8,padding:'10px',background:C.bg,border:`1px dashed ${C.border}`,color:C.muted,fontSize:11,cursor:'pointer'}}>
        {uploading ? 'Загрузка…' : 'Выбрать файл (mp4, mov, webm)'}
      </button>
      {IS_DB_CONNECTED && videoUrl && videoUrl.startsWith('[file:') && (
        <div style={{fontSize:10,color:'#c07820',marginTop:4}}>⚠ Создайте bucket «videos» в Supabase Storage для загрузки файлов</div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LAYOUT
// ═══════════════════════════════════════════════════════════════

const SECTIONS = [
  {id:'users',    icon:'◉', label:'Пользователи'},
  {id:'exams',    icon:'✦', label:'Экзамены'},
  {id:'payments', icon:'◈', label:'Оплаты'},
  {id:'months',   icon:'◧', label:'Месяцы'},
  {id:'ikkajo',   icon:'一', label:'Иккаджо'},
  {id:'comments', icon:'◎', label:'Комментарии'},
];

export default function AdminPanel({ onExit }) {
  const [section, setSection] = useState('users');
  const [toast,   setToast]   = useState(false);

  const showToast = useCallback((text) => {
    setToast(text || 'Сохранено');
    setTimeout(() => setToast(false), 2400);
  }, []);

  const { exams } = useExams();
  const pendingCount = exams.filter(e => e.status === 'pending').length;

  return (
    <div style={{display:'flex',minHeight:'100vh',background:C.bg,fontFamily:"'Jost',sans-serif",color:C.dark}}>

      {/* Сайдбар */}
      <aside style={{width:220,background:C.white,borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column',flexShrink:0,position:'sticky',top:0,height:'100vh'}}>
        <div style={{padding:'20px 18px 16px',borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
            <div style={{fontFamily:"'Noto Serif JP',serif",fontSize:24,color:C.gold,lineHeight:1}}>合</div>
            <div>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:12,fontWeight:600,letterSpacing:3,color:C.dark}}>ADMIN</div>
              <div style={{fontSize:9,color:C.muted,letterSpacing:1}}>ONLINE DOJO</div>
            </div>
          </div>
          <DBBadge/>
        </div>

        <nav style={{flex:1,padding:'8px 0'}}>
          {SECTIONS.map(s=>(
            <button key={s.id} onClick={()=>setSection(s.id)}
              style={{width:'100%',display:'flex',alignItems:'center',gap:10,padding:'11px 18px',background:section===s.id?C.goldBg:'none',border:'none',borderLeft:`2px solid ${section===s.id?C.gold:'transparent'}`,color:section===s.id?C.dark:C.muted,fontSize:12,textAlign:'left',cursor:'pointer',transition:'all 0.12s',position:'relative'}}>
              <span style={{fontSize:section===s.id?11:10,color:section===s.id?C.gold:'#ccc',fontFamily:s.id==='ikkajo'?"'Noto Serif JP',serif":'inherit'}}>{s.icon}</span>
              {s.label}
              {s.id==='exams'&&pendingCount>0&&<span style={{marginLeft:'auto',background:C.red,color:'#fff',fontSize:9,padding:'1px 6px',borderRadius:10}}>{pendingCount}</span>}
            </button>
          ))}
        </nav>

        {onExit&&(
          <div style={{borderTop:`1px solid ${C.border}`,padding:'12px 16px'}}>
            <button onClick={onExit} style={{width:'100%',padding:'8px 12px',background:'none',border:`1px solid ${C.border}`,color:C.muted,fontSize:11,cursor:'pointer',textAlign:'left'}}>
              ← Вернуться на сайт
            </button>
          </div>
        )}
      </aside>

      {/* Контент */}
      <main style={{flex:1,overflow:'auto'}}>
        <div key={section} className="anim">
          {section==='users'    && <SectionUsers    showToast={showToast}/>}
          {section==='exams'    && <SectionExams    showToast={showToast}/>}
          {section==='payments' && <SectionPayments/>}
          {section==='months'   && <SectionMonths   showToast={showToast}/>}
          {section==='ikkajo'   && <SectionIkkajo   showToast={showToast}/>}
          {section==='comments' && <SectionComments showToast={showToast}/>}
        </div>
      </main>

      <Toast show={!!toast} text={typeof toast==='string'?toast:'Сохранено'}/>
    </div>
  );
}

function SectionHeader({title,subtitle,action}){
  return(
    <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',padding:'28px 36px 20px',borderBottom:`1px solid ${C.border}`,background:C.white}}>
      <div>
        <div style={{fontSize:9,color:C.gold,letterSpacing:2,textTransform:'uppercase',marginBottom:6}}>Управление</div>
        <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:600,color:C.dark}}>{title}</h1>
        {subtitle&&<div style={{fontSize:12,color:C.muted,marginTop:3}}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 1. ПОЛЬЗОВАТЕЛИ
// ═══════════════════════════════════════════════════════════════
function SectionUsers({showToast}){
  const {users,loading,updateLevel} = useUsers();
  const {payments} = useAccess();
  const [selected,  setSelected]  = useState(null);
  const [search,    setSearch]    = useState('');
  const [editLevel, setEditLevel] = useState('');
  const [saving,    setSaving]    = useState(false);

  const filtered = users.filter(u=>u.name?.toLowerCase().includes(search.toLowerCase())||u.email?.toLowerCase().includes(search.toLowerCase()));
  const user     = users.find(u=>u.id===selected);
  const userPays = payments.filter(p=>p.userId===selected);
  const totalRev = payments.reduce((s,p)=>s+p.amount,0);

  const saveLevel = async () => {
    setSaving(true);
    const {ok,error} = await updateLevel(selected, editLevel);
    setSaving(false);
    if (ok) showToast('Уровень обновлён');
    else showToast('Ошибка: ' + error);
  };

  if (loading) return <Spinner/>;

  return(
    <div>
      <SectionHeader title="Пользователи" subtitle={`${users.length} зарегистрировано`}/>
      <div style={{padding:'24px 36px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:2,marginBottom:24}}>
          <StatCard label="Всего"   value={users.length}                         sub="пользователей"/>
          <StatCard label="Активных" value={users.filter(u=>u.status==='active').length} sub="есть оплата" accent={C.green}/>
          <StatCard label="Выручка"  value={`${totalRev.toLocaleString()} ₽`}     sub="за всё время"/>
          <StatCard label="Ср. чек"  value={`${Math.round(totalRev/Math.max(users.length,1)).toLocaleString()} ₽`} sub="на пользователя"/>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:2}}>
          <div>
            <div style={{marginBottom:10}}><Input value={search} onChange={setSearch} placeholder="Поиск по имени или email…"/></div>
            <div style={{background:C.white,border:`1px solid ${C.border}`}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 130px 80px 80px 56px',padding:'9px 16px',fontSize:9,color:C.muted,letterSpacing:1.5,textTransform:'uppercase',borderBottom:`1px solid ${C.border}`}}>
                <span>Имя</span><span>Email</span><span>Уровень</span><span>Сэнсэй</span><span>Статус</span>
              </div>
              {filtered.map(u=>(
                <div key={u.id} onClick={()=>{setSelected(u.id);setEditLevel(u.level);}}
                  style={{display:'grid',gridTemplateColumns:'1fr 130px 80px 80px 56px',padding:'12px 16px',borderBottom:`1px solid ${C.border}`,cursor:'pointer',background:selected===u.id?C.goldBg:'#fff'}}>
                  <div>
                    <div style={{fontSize:13,color:C.dark,fontWeight:selected===u.id?500:400}}>{u.name}</div>
                    <div style={{fontSize:10,color:C.muted,marginTop:2}}>с {u.joined_at||'—'}</div>
                  </div>
                  <div style={{fontSize:11,color:C.muted,display:'flex',alignItems:'center',overflow:'hidden',textOverflow:'ellipsis'}}>{u.email}</div>
                  <div style={{display:'flex',alignItems:'center'}}>
                    <span style={{fontSize:10,color:C.gold,background:C.goldBg,border:`1px solid ${C.goldBorder}`,padding:'1px 7px'}}>{LEVEL_LABELS[u.level]||u.level}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center'}}>
                    <span style={{fontSize:11,color:u.sensei_name?C.dark:C.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.sensei_name||'Копин'}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center'}}>
                    <span style={{width:7,height:7,borderRadius:'50%',background:u.status==='active'?C.green:'#ccc',display:'inline-block'}}/>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {user?(
            <div style={{background:C.white,border:`1px solid ${C.border}`,padding:'22px'}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:600,color:C.dark,marginBottom:3}}>{user.name}</div>
              <div style={{fontSize:11,color:C.muted,marginBottom:20}}>{user.email}</div>
              <div style={{marginBottom:18}}>
                <Label>Изменить уровень</Label>
                <div style={{display:'flex',gap:8}}>
                  <Select value={editLevel} onChange={setEditLevel} options={LEVELS_LIST.map(l=>({value:l,label:LEVEL_LABELS[l]}))}/>
                  <Btn onClick={saveLevel} small loading={saving}>Сохранить</Btn>
                </div>
              </div>

              {/* Анкета пользователя */}
              {(user.self_level||user.sensei_name||user.experience) && (
                <div style={{marginBottom:18,padding:'14px 16px',background:C.goldBg,border:`1px solid ${C.goldBorder}`}}>
                  <div style={{fontSize:9,color:C.gold,letterSpacing:1.5,textTransform:'uppercase',marginBottom:10}}>Анкета при регистрации</div>
                  {user.self_level && user.self_level!=='none' && (
                    <div style={{display:'flex',gap:8,marginBottom:6,fontSize:12}}>
                      <span style={{color:C.muted,minWidth:100}}>Уровень (сам):</span>
                      <span style={{color:C.dark}}>{LEVEL_LABELS[user.self_level]||user.self_level}</span>
                    </div>
                  )}
                  {user.sensei_name && (
                    <div style={{display:'flex',gap:8,marginBottom:6,fontSize:12}}>
                      <span style={{color:C.muted,minWidth:100}}>Сэнсэй:</span>
                      <span style={{color:C.dark}}>{user.sensei_name}</span>
                    </div>
                  )}
                  {user.experience && (
                    <div style={{marginTop:8}}>
                      <div style={{fontSize:9,color:C.muted,letterSpacing:1,textTransform:'uppercase',marginBottom:6}}>Об опыте</div>
                      <p style={{fontSize:12,color:'#555',lineHeight:1.75,borderLeft:`2px solid ${C.goldBorder}`,paddingLeft:10}}>{user.experience}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label>История оплат</Label>
                {userPays.length===0&&<div style={{fontSize:11,color:C.muted}}>нет оплат</div>}
                {userPays.map(p=>(
                  <div key={p.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:`1px solid ${C.border}`,fontSize:11}}>
                    <span style={{color:C.muted}}>{p.date}</span>
                    <span style={{color:C.dark}}>{p.desc}</span>
                    <span style={{color:C.gold,fontWeight:600}}>{p.amount?.toLocaleString()} ₽</span>
                  </div>
                ))}
              </div>
            </div>
          ):(
            <div style={{background:C.white,border:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'center',color:C.muted,fontSize:12,minHeight:200}}>Выберите пользователя</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 2. ЭКЗАМЕНЫ
// ═══════════════════════════════════════════════════════════════
function SectionExams({showToast}){
  const {users,updateLevel} = useUsers();
  const {exams,loading,approveExam,rejectExam,addManualExam} = useExams();
  const [mUserId, setMUserId] = useState('');
  const [mLevel,  setMLevel]  = useState('6kyu');
  const [mNote,   setMNote]   = useState('');
  const [mResult, setMResult] = useState('passed');
  const [saving,  setSaving]  = useState(false);

  const pending  = exams.filter(e=>e.status==='pending');
  const approved = exams.filter(e=>e.status==='approved');
  const rejected = exams.filter(e=>e.status==='rejected');

  const doApprove = async (id,note) => {
    const {ok} = await approveExam(id,note,updateLevel);
    if(ok) showToast('Экзамен подтверждён');
  };
  const doReject = async (id,note) => {
    const {ok} = await rejectExam(id,note);
    if(ok) showToast('Экзамен отклонён');
  };
  const doManual = async () => {
    if(!mUserId) return;
    setSaving(true);
    const user = users.find(u=>u.id===mUserId);
    const {ok} = await addManualExam({userId:mUserId,userName:user?.name,targetLevel:mLevel,result:mResult,note:mNote});
    if(ok){
      if(mResult==='passed') await updateLevel(mUserId,mLevel);
      showToast('Результат проставлен');
      setMUserId(''); setMNote('');
    }
    setSaving(false);
  };

  if(loading) return <Spinner/>;

  return(
    <div>
      <SectionHeader title="Экзамены" subtitle={`${pending.length} ожидают подтверждения`}/>
      <div style={{padding:'24px 36px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:2,marginBottom:24}}>
          <StatCard label="Ожидают"   value={pending.length}  sub="заявок"      accent={pending.length>0?'#c07820':C.muted}/>
          <StatCard label="Сдано"     value={approved.length} sub="подтверждено" accent={C.green}/>
          <StatCard label="Отклонено" value={rejected.length} sub="не сдали"    accent={C.red}/>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:2}}>
          <div>
            {pending.length>0&&(
              <div style={{marginBottom:24}}>
                <div style={{fontSize:9,color:'#c07820',letterSpacing:1.5,textTransform:'uppercase',marginBottom:12}}>Ожидают подтверждения</div>
                {pending.map(e=><ExamCard key={e.id} exam={e} onApprove={doApprove} onReject={doReject}/>)}
              </div>
            )}
            {approved.length>0&&(
              <div style={{marginBottom:24}}>
                <div style={{fontSize:9,color:C.green,letterSpacing:1.5,textTransform:'uppercase',marginBottom:12}}>✓ Подтверждённые</div>
                {approved.map(e=><ExamCard key={e.id} exam={e} readonly/>)}
              </div>
            )}
            {rejected.length>0&&(
              <div>
                <div style={{fontSize:9,color:C.red,letterSpacing:1.5,textTransform:'uppercase',marginBottom:12}}>✕ Отклонённые</div>
                {rejected.map(e=><ExamCard key={e.id} exam={e} readonly/>)}
              </div>
            )}
          </div>

          <div style={{background:C.white,border:`1px solid ${C.border}`,padding:'22px',alignSelf:'start'}}>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18,fontWeight:600,color:C.dark,marginBottom:4}}>Ручная простановка</div>
            <div style={{fontSize:11,color:C.muted,marginBottom:18}}>Преподаватель проставляет результат напрямую</div>
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div><Label>Ученик</Label><Select value={mUserId} onChange={setMUserId} options={[{value:'',label:'— выберите —'},...users.map(u=>({value:u.id,label:u.name}))]}/></div>
              <div><Label>Уровень экзамена</Label><Select value={mLevel} onChange={setMLevel} options={LEVELS_LIST.map(l=>({value:l,label:LEVEL_LABELS[l]}))}/></div>
              <div><Label>Результат</Label><Select value={mResult} onChange={setMResult} options={[{value:'passed',label:'✓ Сдал'},{value:'failed',label:'✕ Не сдал'}]}/></div>
              <div><Label>Комментарий</Label><Textarea value={mNote} onChange={setMNote} placeholder="Замечания…" rows={3}/></div>
              <Btn onClick={doManual} disabled={!mUserId} loading={saving}>Проставить результат</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamCard({exam,onApprove,onReject,readonly}){
  const [note,setNote] = useState(exam.teacher_note||'');
  const [saving,setSaving] = useState(false);
  const sc = exam.status==='pending'?'#c07820':exam.status==='approved'?C.green:C.red;
  const sl = exam.status==='pending'?'Ожидает':exam.status==='approved'?'Подтверждён':'Отклонён';
  return(
    <div style={{background:C.white,border:`1px solid ${C.border}`,borderLeft:`3px solid ${sc}`,padding:'15px 16px',marginBottom:2}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
        <div>
          <div style={{fontSize:13,color:C.dark,fontWeight:500}}>{exam.user_name}</div>
          <div style={{fontSize:11,color:C.muted,marginTop:2}}>Заявка на <span style={{color:C.gold}}>{LEVEL_LABELS[exam.target_level]||exam.target_level}</span> · {exam.date}</div>
        </div>
        <span style={{fontSize:10,color:sc,background:`${sc}12`,border:`1px solid ${sc}30`,padding:'2px 8px'}}>{sl}</span>
      </div>
      {!readonly&&<div style={{marginBottom:10}}><Textarea value={note} onChange={setNote} placeholder="Комментарий к экзамену…" rows={2}/></div>}
      {readonly&&exam.teacher_note&&<div style={{fontSize:12,color:C.muted,fontStyle:'italic',marginBottom:8,paddingLeft:8,borderLeft:`2px solid ${C.border}`}}>«{exam.teacher_note}»</div>}
      {!readonly&&(
        <div style={{display:'flex',gap:8}}>
          <Btn onClick={async()=>{setSaving(true);await onApprove(exam.id,note);setSaving(false);}} variant='success' small loading={saving}>✓ Подтвердить</Btn>
          <Btn onClick={async()=>{setSaving(true);await onReject(exam.id,note);setSaving(false);}} variant='danger' small>✕ Отклонить</Btn>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 3. ОПЛАТЫ
// ═══════════════════════════════════════════════════════════════
function SectionPayments(){
  const {payments,loading} = useAccess();
  const {users} = useUsers();
  const [filter,setFilter] = useState('all');
  const [userId,setUserId] = useState('all');

  const filtered = payments.filter(p=>filter==='all'||p.type===filter).filter(p=>userId==='all'||p.userId===userId);
  const totalAll = payments.reduce((s,p)=>s+p.amount,0);

  const byMonth = {};
  payments.forEach(p=>{ if(p.date){const m=p.date.slice(3,7);byMonth[m]=(byMonth[m]||0)+p.amount;} });
  const topMonths = Object.entries(byMonth).sort((a,b)=>b[1]-a[1]).slice(0,6);

  if(loading) return <Spinner/>;

  return(
    <div>
      <SectionHeader title="Статистика оплат"/>
      <div style={{padding:'24px 36px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:2,marginBottom:24}}>
          <StatCard label="Выручка"  value={`${totalAll.toLocaleString()} ₽`} sub={`${payments.length} транзакций`}/>
          <StatCard label="Подписки" value={`${payments.filter(p=>p.type==='month').reduce((s,p)=>s+p.amount,0).toLocaleString()} ₽`} sub="ежемесячные"/>
          <StatCard label="Разделы"  value={`${payments.filter(p=>p.type==='section').reduce((s,p)=>s+p.amount,0).toLocaleString()} ₽`} sub="разовые" accent={C.green}/>
          <StatCard label="Платящих" value={new Set(payments.map(p=>p.userId)).size} sub="уникальных"/>
        </div>

        {topMonths.length>0&&(
          <div style={{background:C.white,border:`1px solid ${C.border}`,padding:'20px 24px',marginBottom:20}}>
            <Label>Выручка по периодам</Label>
            <div style={{display:'flex',alignItems:'flex-end',gap:4,height:80,marginTop:12}}>
              {topMonths.map(([m,amt],i)=>{
                const max=topMonths[0][1];
                return(
                  <div key={m} style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                    <div style={{fontSize:10,color:C.gold,fontWeight:600}}>{(amt/1000).toFixed(1)}к</div>
                    <div style={{width:'100%',background:C.bg,height:50,display:'flex',alignItems:'flex-end'}}>
                      <div style={{width:'100%',background:C.gold,height:`${(amt/max)*100}%`,opacity:1-i*0.1}}/>
                    </div>
                    <div style={{fontSize:9,color:C.muted}}>{m}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{display:'flex',gap:8,marginBottom:14}}>
          <Select value={filter} onChange={setFilter} options={[{value:'all',label:'Все типы'},{value:'month',label:'Подписки'},{value:'section',label:'Разделы'}]}/>
          <Select value={userId} onChange={setUserId} options={[{value:'all',label:'Все пользователи'},...users.map(u=>({value:u.id,label:u.name}))]}/>
        </div>

        <div style={{background:C.white,border:`1px solid ${C.border}`}}>
          <div style={{display:'grid',gridTemplateColumns:'100px 1fr 160px 80px 110px',padding:'9px 16px',fontSize:9,color:C.muted,letterSpacing:1.5,textTransform:'uppercase',borderBottom:`1px solid ${C.border}`}}>
            <span>Дата</span><span>Пользователь</span><span>Описание</span><span>Тип</span><span style={{textAlign:'right'}}>Сумма</span>
          </div>
          {filtered.map(p=>(
            <div key={p.id} style={{display:'grid',gridTemplateColumns:'100px 1fr 160px 80px 110px',padding:'11px 16px',borderBottom:`1px solid ${C.border}`,fontSize:12,alignItems:'center'}}>
              <span style={{color:C.muted}}>{p.date}</span>
              <span style={{color:C.dark}}>{p.userName}</span>
              <span style={{color:C.muted}}>{p.desc}</span>
              <span><span style={{fontSize:9,padding:'2px 7px',background:p.type==='month'?'#e8f0fa':C.goldBg,color:p.type==='month'?C.blue:C.gold,border:`1px solid ${p.type==='month'?'#c0d4f0':C.goldBorder}`}}>{p.type==='month'?'Подписка':'Раздел'}</span></span>
              <span style={{color:C.gold,fontWeight:600,textAlign:'right'}}>{p.amount?.toLocaleString()} ₽</span>
            </div>
          ))}
          <div style={{padding:'11px 16px',display:'flex',justifyContent:'space-between',borderTop:`1px solid ${C.border}`,fontSize:12}}>
            <span style={{color:C.muted}}>{filtered.length} записей</span>
            <span style={{color:C.gold,fontWeight:600}}>{filtered.reduce((s,p)=>s+p.amount,0).toLocaleString()} ₽</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 4. МЕСЯЦЫ
// ═══════════════════════════════════════════════════════════════
function SectionMonths({showToast}){
  const {months,loading:mLoading,toggleOpen} = useMonths();
  const [activeMonth, setActiveMonth] = useState('jan');
  const {lessons,loading:lLoading,saving,saveLesson,addLesson,deleteLesson} = useLessons(activeMonth);
  const [editId, setEditId] = useState(null);
  const [draft,  setDraft]  = useState({});

  const startEdit = (l) => { setEditId(l.id); setDraft({...l, videoUrl: l.video_url||''}); };
  const doSave    = async () => {
    const {ok,error} = await saveLesson({...draft, video_url: draft.videoUrl||draft.video_url||''});
    if(ok){ setEditId(null); showToast('Урок сохранён'); }
    else showToast('Ошибка: ' + error);
  };
  const doAdd = async () => {
    const {ok,lesson} = await addLesson(activeMonth);
    if(ok && lesson) startEdit(lesson);
  };
  const doDelete = async (id) => {
    await deleteLesson(id);
    if(editId===id) setEditId(null);
    showToast('Урок удалён');
  };

  if(mLoading) return <Spinner/>;

  return(
    <div>
      <SectionHeader title="Управление месяцами"/>
      <div style={{padding:'24px 36px'}}>
        <div style={{display:'grid',gridTemplateColumns:'220px 1fr',gap:2}}>
          <div style={{background:C.white,border:`1px solid ${C.border}`}}>
            <div style={{padding:'10px 14px',fontSize:9,color:C.muted,letterSpacing:1.5,textTransform:'uppercase',borderBottom:`1px solid ${C.border}`}}>Месяцы 2026</div>
            {months.map(m=>(
              <div key={m.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 14px',borderBottom:`1px solid ${C.border}`,background:activeMonth===m.id?C.goldBg:'#fff',cursor:'pointer'}}>
                <div onClick={()=>{setActiveMonth(m.id);setEditId(null);}} style={{flex:1,display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontFamily:"'Noto Serif JP',serif",fontSize:14,color:m.is_open?C.gold:'#ccc'}}>{m.kanji}</span>
                  <span style={{fontSize:12,color:m.is_open?C.dark:C.muted}}>{m.label}</span>
                </div>
                <button onClick={()=>toggleOpen(m.id)}
                  style={{padding:'2px 8px',background:m.is_open?C.greenBg:'#f5f5f5',border:`1px solid ${m.is_open?C.greenBorder:C.border}`,color:m.is_open?C.green:C.muted,fontSize:9,cursor:'pointer'}}>
                  {m.is_open?'ОТКРЫТ':'ЗАКРЫТ'}
                </button>
              </div>
            ))}
          </div>

          <div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
              <span style={{fontSize:13,color:C.dark}}>{months.find(m=>m.id===activeMonth)?.label} — {lessons.length} уроков</span>
              <Btn onClick={doAdd} small>+ Урок</Btn>
            </div>
            {lLoading&&<Spinner/>}
            {lessons.map(lesson=>(
              editId===lesson.id?(
                <div key={lesson.id} style={{background:C.white,border:`2px solid ${C.gold}`,padding:'20px',marginBottom:2}}>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
                    <div><Label>Заголовок</Label><Input value={draft.title} onChange={v=>setDraft(d=>({...d,title:v}))} placeholder="Название урока"/></div>
                    <div><Label>Подзаголовок</Label><Input value={draft.subtitle} onChange={v=>setDraft(d=>({...d,subtitle:v}))} placeholder="Тема урока"/></div>
                  </div>
                  <div style={{marginBottom:12}}><Label>Описание</Label><Textarea value={draft.text} onChange={v=>setDraft(d=>({...d,text:v}))} rows={3}/></div>
                  <div style={{marginBottom:16}}>
                    <Label>Видео урока</Label>
                    <VideoInput videoUrl={draft.videoUrl||''} onChange={v=>setDraft(d=>({...d,videoUrl:v}))} onSave={doSave} saving={saving}/>
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <Btn onClick={doSave} variant='success' small loading={saving}>Сохранить урок</Btn>
                    <Btn onClick={()=>setEditId(null)} variant='ghost' small>Отмена</Btn>
                  </div>
                </div>
              ):(
                <div key={lesson.id} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 16px',background:C.white,border:`1px solid ${C.border}`,marginBottom:2}}>
                  <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:12,color:'#ccc',minWidth:24,fontWeight:600}}>{String(lesson.num).padStart(2,'0')}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,color:C.dark}}>{lesson.title}</div>
                    <div style={{fontSize:10,color:C.muted,marginTop:2}}>{lesson.subtitle} · {lesson.duration}</div>
                    {(lesson.video_url||lesson.videoUrl)&&<div style={{fontSize:10,color:C.green,marginTop:2}}>✓ видео добавлено</div>}
                  </div>
                  <div style={{display:'flex',gap:6}}>
                    <Btn onClick={()=>startEdit(lesson)} variant='ghost' small>Изменить</Btn>
                    <Btn onClick={()=>doDelete(lesson.id)} variant='danger' small>✕</Btn>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 5. ИККАДЖО — ПОЛНЫЙ РЕДАКТОР
// ═══════════════════════════════════════════════════════════════
function SectionIkkajo({showToast}){
  const {techniques,loading,saving,getTechContent,saveTechInfo,saveMistakes,saveVideos} = useTechniques();
  const [selectedId, setSelectedId] = useState(null);
  const [filterKyu,  setFilterKyu]  = useState('all');
  const [activeTab,  setActiveTab]  = useState('info');

  // Локальный draft для редактирования
  const [draft, setDraft] = useState(null);

  const filtered = filterKyu==='all' ? techniques : techniques.filter(t=>t.kyu===filterKyu);
  const tech     = techniques.find(t=>t.id===selectedId);
  const content  = selectedId ? getTechContent(selectedId) : null;

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
  };

  const doSaveInfo = async () => {
    const {ok} = await saveTechInfo(selectedId,draft);
    if(ok) showToast('Основная информация сохранена');
  };
  const doSaveMistakes = async () => {
    const {ok} = await saveMistakes(selectedId, draft.mistakes||[]);
    if(ok) showToast('Ошибки сохранены');
  };
  const doSaveVideos = async (catId) => {
    const {ok} = await saveVideos(selectedId, catId, draft.videos?.[catId]||[]);
    if(ok) showToast(`Видео «${VIDEO_CAT_LABELS[catId]}» сохранено`);
  };

  const TABS = [{id:'info',label:'Основное'},{id:'videos',label:'Видео'},{id:'principles',label:'Принципы'},{id:'mistakes',label:'Ошибки'},{id:'sensei',label:'Сэнсэй'}];

  if(loading) return <Spinner/>;

  return(
    <div>
      <SectionHeader title="Редактор Иккаджо" subtitle="Полное редактирование контента техник"/>
      <div style={{padding:'24px 36px'}}>
        <div style={{display:'grid',gridTemplateColumns:'240px 1fr',gap:2,alignItems:'start'}}>

          {/* Список */}
          <div style={{background:C.white,border:`1px solid ${C.border}`}}>
            <div style={{padding:'10px 12px',borderBottom:`1px solid ${C.border}`}}>
              <Select value={filterKyu} onChange={setFilterKyu} options={[{value:'all',label:'Все уровни'},...LEVELS_LIST.slice(0,6).map(l=>({value:l,label:LEVEL_LABELS[l]}))]}/>
            </div>
            {filtered.map(t=>{
              const cnt = getTechContent(t.id);
              return(
                <div key={t.id} onClick={()=>selectTech(t)}
                  style={{padding:'11px 14px',borderBottom:`1px solid ${C.border}`,cursor:'pointer',background:selectedId===t.id?C.goldBg:'#fff',borderLeft:`2px solid ${selectedId===t.id?C.gold:'transparent'}`}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:13,color:C.dark,fontWeight:selectedId===t.id?500:400}}>{t.name_ru}</span>
                    <span style={{fontSize:9,color:C.gold,background:C.goldBg,border:`1px solid ${C.goldBorder}`,padding:'1px 6px'}}>{LEVEL_LABELS[t.kyu]||t.kyu}</span>
                  </div>
                  <div style={{display:'flex',gap:5}}>
                    {cnt.principles?.length>0&&<span style={{fontSize:9,color:C.green}}>道</span>}
                    {cnt.mistakes?.length>0&&<span style={{fontSize:9,color:C.red}}>✕</span>}
                    {cnt.senseiQuote&&<span style={{fontSize:9,color:C.gold}}>«»</span>}
                    {Object.values(cnt.videos||{}).some(a=>a.length>0)&&<span style={{fontSize:9,color:C.blue}}>▶</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Редактор */}
          {tech&&draft?(
            <div style={{background:C.white,border:`1px solid ${C.border}`}}>
              <div style={{padding:'14px 20px',borderBottom:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                <div>
                  <div style={{fontSize:16,color:C.dark,fontWeight:500}}>{tech.name_ru}</div>
                  <div style={{fontSize:11,color:C.muted}}>{tech.id} · {draft.section} · {LEVEL_LABELS[draft.kyu]||draft.kyu}</div>
                </div>
              </div>

              <div style={{display:'flex',borderBottom:`1px solid ${C.border}`,overflowX:'auto',background:C.bg}}>
                {TABS.map(tab=>(
                  <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
                    style={{padding:'10px 18px',background:activeTab===tab.id?C.white:'transparent',border:'none',borderBottom:`2px solid ${activeTab===tab.id?C.gold:'transparent'}`,color:activeTab===tab.id?C.dark:C.muted,fontSize:12,cursor:'pointer',whiteSpace:'nowrap',marginBottom:-1,fontWeight:activeTab===tab.id?500:400}}>
                    {tab.label}
                  </button>
                ))}
              </div>

              <div style={{padding:'22px'}}>

                {activeTab==='info'&&(
                  <div style={{display:'flex',flexDirection:'column',gap:14}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                      <div><Label>Название (рус)</Label><Input value={draft.nameRu} onChange={v=>setDraft(d=>({...d,nameRu:v}))} placeholder="Русское название"/></div>
                      <div><Label>Latin ID (ключ)</Label><Input value={tech.id} onChange={()=>{}} placeholder="Неизменяемый ID"/></div>
                    </div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                      <div><Label>Раздел</Label><Input value={draft.section} onChange={v=>setDraft(d=>({...d,section:v}))} placeholder="Tachiai"/></div>
                      <div><Label>Уровень</Label><Select value={draft.kyu} onChange={v=>setDraft(d=>({...d,kyu:v}))} options={LEVELS_LIST.slice(0,6).map(l=>({value:l,label:LEVEL_LABELS[l]}))}/></div>
                    </div>
                    <div><Label>Описание техники</Label><Textarea value={draft.description} onChange={v=>setDraft(d=>({...d,description:v}))} placeholder="Краткое описание…" rows={4}/></div>
                    <div style={{display:'flex',justifyContent:'flex-end'}}>
                      <Btn onClick={doSaveInfo} variant='success' loading={saving}>Сохранить</Btn>
                    </div>
                  </div>
                )}

                {activeTab==='videos'&&(
                  <div>
                    {VIDEO_CAT_IDS.map(catId=>{
                      const catVids = draft.videos?.[catId]||[];
                      const addV    = ()=>setDraft(d=>({...d,videos:{...d.videos,[catId]:[...catVids,{id:`nv-${Date.now()}`,title:'Новое видео',duration:'00:00',video_url:'',videoUrl:''}]}}));
                      const updV    = (vid,field,val)=>setDraft(d=>({...d,videos:{...d.videos,[catId]:catVids.map(v=>v.id===vid.id?{...v,[field]:val,videoUrl:field==='video_url'?val:v.videoUrl}:v)}}));
                      const delV    = (vid)=>setDraft(d=>({...d,videos:{...d.videos,[catId]:catVids.filter(v=>v.id!==vid.id)}}));
                      return(
                        <div key={catId} style={{marginBottom:28}}>
                          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
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
                            <div key={vid.id} style={{background:C.bg,border:`1px solid ${C.border}`,padding:'16px',marginBottom:6}}>
                              <div style={{display:'grid',gridTemplateColumns:'1fr 90px auto',gap:8,marginBottom:12,alignItems:'end'}}>
                                <div><Label>Название</Label><Input value={vid.title} onChange={v=>updV(vid,'title',v)} placeholder="Название видео"/></div>
                                <div><Label>Длина</Label><Input value={vid.duration} onChange={v=>updV(vid,'duration',v)} placeholder="0:00"/></div>
                                <div style={{paddingBottom:1}}><Btn onClick={()=>delV(vid)} variant='danger' small>✕</Btn></div>
                              </div>
                              <VideoInput
                                videoUrl={vid.video_url||vid.videoUrl||''}
                                onChange={v=>updV(vid,'video_url',v)}
                                onSave={()=>doSaveVideos(catId)}
                                saving={saving}
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
                    <div style={{fontSize:11,color:C.muted,marginBottom:18,padding:'10px 14px',background:C.goldBg,border:`1px solid ${C.goldBorder}`}}>
                      Отображаются пользователю в блоке «道 Ключевые принципы»
                    </div>
                    {(draft.principles||[]).map((p,i)=>(
                      <div key={i} style={{display:'flex',gap:8,marginBottom:8,alignItems:'center'}}>
                        <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:13,color:'#ccc',minWidth:24,fontWeight:600}}>{String(i+1).padStart(2,'0')}</span>
                        <div style={{flex:1}}>
                          <Input value={p} onChange={v=>{const a=[...draft.principles];a[i]=v;setDraft(d=>({...d,principles:a}));}} placeholder={`Принцип ${i+1}…`}/>
                        </div>
                        <Btn onClick={()=>setDraft(d=>({...d,principles:d.principles.filter((_,j)=>j!==i)}))} variant='danger' small>✕</Btn>
                      </div>
                    ))}
                    <div style={{display:'flex',gap:8,marginTop:14}}>
                      <Btn onClick={()=>setDraft(d=>({...d,principles:[...(d.principles||[]),'']}))} variant='ghost'>+ Добавить принцип</Btn>
                      <Btn onClick={doSaveInfo} variant='success' loading={saving}>Сохранить</Btn>
                    </div>
                  </div>
                )}

                {activeTab==='mistakes'&&(
                  <div>
                    <div style={{fontSize:11,color:C.muted,marginBottom:18,padding:'10px 14px',background:C.redBg,border:`1px solid ${C.redBorder}`}}>
                      Отображаются в блоке с красной полосой «✕ Типичные ошибки»
                    </div>
                    {(draft.mistakes||[]).map((m,i)=>(
                      <div key={i} style={{background:C.bg,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.red}`,padding:'16px',marginBottom:8}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:10}}>
                          <span style={{fontSize:10,color:C.red}}>Ошибка {i+1}</span>
                          <Btn onClick={()=>setDraft(d=>({...d,mistakes:d.mistakes.filter((_,j)=>j!==i)}))} variant='danger' small>Удалить</Btn>
                        </div>
                        <div style={{marginBottom:8}}><Label>Заголовок</Label><Input value={m.title} onChange={v=>{const a=[...draft.mistakes];a[i]={...a[i],title:v};setDraft(d=>({...d,mistakes:a}));}}/></div>
                        <div><Label>Описание</Label><Textarea value={m.desc} onChange={v=>{const a=[...draft.mistakes];a[i]={...a[i],desc:v};setDraft(d=>({...d,mistakes:a}));}} rows={2}/></div>
                      </div>
                    ))}
                    <div style={{display:'flex',gap:8,marginTop:14}}>
                      <Btn onClick={()=>setDraft(d=>({...d,mistakes:[...(d.mistakes||[]),{title:'',desc:''}]}))} variant='ghost'>+ Добавить ошибку</Btn>
                      <Btn onClick={doSaveMistakes} variant='success' loading={saving}>Сохранить</Btn>
                    </div>
                  </div>
                )}

                {activeTab==='sensei'&&(
                  <div>
                    <div style={{fontSize:11,color:C.muted,marginBottom:18,padding:'10px 14px',background:C.goldBg,border:`1px solid ${C.goldBorder}`}}>
                      Прямая речь сэнсэя — блок с золотой чертой внизу страницы техники. Кавычки добавляются автоматически.
                    </div>
                    <Textarea value={draft.senseiQuote} onChange={v=>setDraft(d=>({...d,senseiQuote:v}))} placeholder="Комментарий сэнсэя без кавычек…" rows={5}/>
                    {draft.senseiQuote&&(
                      <div style={{marginTop:16,padding:'16px 20px',background:C.bg,border:`1px solid ${C.border}`,borderLeft:`2px solid ${C.goldBorder}`}}>
                        <div style={{fontSize:9,color:C.muted,marginBottom:10,letterSpacing:1}}>ПРЕВЬЮ</div>
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
          ):(
            <div style={{background:C.white,border:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'center',minHeight:320,color:C.muted,fontSize:12}}>
              Выберите технику из списка слева
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 6. КОММЕНТАРИИ
// ═══════════════════════════════════════════════════════════════
function SectionComments({showToast}){
  const {comments,loading,markReplied} = useComments();
  const [replyOpen, setReplyOpen] = useState({});
  const [replyText, setReplyText] = useState({});

  const sendReply = (id) => {
    if(!replyText[id]?.trim()) return;
    markReplied(id);
    setReplyOpen(p=>({...p,[id]:false}));
    setReplyText(p=>({...p,[id]:''}));
    showToast('Ответ отправлен');
  };

  const unreplied = comments.filter(c=>!c.replied);
  const replied   = comments.filter(c=>c.replied);

  if(loading) return <Spinner/>;

  return(
    <div>
      <SectionHeader title="Комментарии" subtitle={`${unreplied.length} требуют ответа`}/>
      <div style={{padding:'24px 36px'}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:2,marginBottom:24}}>
          <StatCard label="Всего"      value={comments.length}   sub="комментариев"/>
          <StatCard label="Без ответа" value={unreplied.length}  sub="ждут ответа"  accent={unreplied.length>0?'#c07820':C.muted}/>
          <StatCard label="Обработано" value={replied.length}    sub="отвечено"     accent={C.green}/>
        </div>

        {unreplied.length>0&&(
          <div style={{marginBottom:24}}>
            <div style={{fontSize:9,color:'#c07820',letterSpacing:1.5,textTransform:'uppercase',marginBottom:12}}>Без ответа</div>
            {unreplied.map(c=>(
              <div key={c.id} style={{background:C.white,border:`1px solid ${C.border}`,borderLeft:'3px solid #c07820',padding:'16px 18px',marginBottom:2}}>
                <div style={{fontSize:10,color:C.gold,marginBottom:8}}>{c.lesson_id}</div>
                <div style={{display:'flex',gap:12,marginBottom:12}}>
                  <div style={{width:32,height:32,borderRadius:'50%',background:C.goldBg,border:`1px solid ${C.goldBorder}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:C.gold,flexShrink:0}}>{(c.user_name||'?')[0]}</div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                      <span style={{fontSize:13,color:C.dark,fontWeight:500}}>{c.user_name||'—'}</span>
                      <span style={{fontSize:10,color:C.muted}}>{c.created_at}</span>
                    </div>
                    <div style={{fontSize:13,color:'#555',lineHeight:1.6}}>{c.text}</div>
                  </div>
                </div>
                {replyOpen[c.id]?(
                  <div>
                    <Textarea value={replyText[c.id]||''} onChange={v=>setReplyText(p=>({...p,[c.id]:v}))} placeholder="Ответ сэнсэя…" rows={2}/>
                    <div style={{display:'flex',gap:8,marginTop:8}}>
                      <Btn onClick={()=>sendReply(c.id)} variant='success' small>Отправить</Btn>
                      <Btn onClick={()=>setReplyOpen(p=>({...p,[c.id]:false}))} variant='ghost' small>Отмена</Btn>
                    </div>
                  </div>
                ):(
                  <Btn onClick={()=>setReplyOpen(p=>({...p,[c.id]:true}))} variant='ghost' small>Ответить</Btn>
                )}
              </div>
            ))}
          </div>
        )}

        {replied.length>0&&(
          <div>
            <div style={{fontSize:9,color:C.green,letterSpacing:1.5,textTransform:'uppercase',marginBottom:12}}>Обработанные</div>
            {replied.map(c=>(
              <div key={c.id} style={{background:C.white,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.green}`,padding:'16px 18px',marginBottom:2}}>
                <div style={{fontSize:10,color:C.gold,marginBottom:8}}>{c.lesson_id}</div>
                <div style={{display:'flex',gap:12}}>
                  <div style={{width:32,height:32,borderRadius:'50%',background:'#f5f5f5',border:`1px solid ${C.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,color:C.muted,flexShrink:0}}>{(c.user_name||'?')[0]}</div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                      <span style={{fontSize:13,color:C.dark,fontWeight:500}}>{c.user_name||'—'}</span>
                      <span style={{fontSize:10,color:C.muted}}>{c.created_at}</span>
                    </div>
                    <div style={{fontSize:13,color:'#555',lineHeight:1.6}}>{c.text}</div>
                    <div style={{fontSize:11,color:C.green,marginTop:6}}>✓ Ответ отправлен</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
