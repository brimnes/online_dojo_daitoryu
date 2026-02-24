'use client';

import { useState } from 'react';
import { SELF_LEVELS } from '@/data/users';

// ─── Цвета платформы ───────────────────────────────────────────
const C = {
  bg:         '#f5f3ee',
  white:      '#fff',
  border:     '#e8e0d0',
  gold:       '#8B6914',
  goldLight:  '#c8a84a',
  goldBorder: '#e8dcc8',
  goldBg:     '#faf6ee',
  dark:       '#1a1a1a',
  muted:      '#999',
  light:      '#fdfcf8',
  green:      '#2d7a4a',
  greenBg:    '#f0faf4',
  greenBorder:'#b8e0c8',
  red:        '#a03030',
  redBg:      '#fff8f7',
  redBorder:  '#e8c0c0',
};

// ─── UI-элементы ───────────────────────────────────────────────
function Field({ label, hint, error, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
        <label style={{ fontSize:10, color:C.muted, letterSpacing:1.2, textTransform:'uppercase' }}>{label}</label>
        {hint && <span style={{ fontSize:10, color:'#bbb' }}>{hint}</span>}
      </div>
      {children}
      {error && <div style={{ fontSize:11, color:C.red }}>{error}</div>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type='text', error }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type} value={value} onChange={e=>onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
      style={{
        padding:'11px 14px', fontSize:13,
        background:C.white,
        border:`1px solid ${error?C.red:focused?C.gold:C.border}`,
        outline:'none', color:C.dark, width:'100%',
        fontFamily:"'Jost',sans-serif",
        transition:'border-color 0.15s',
      }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows=4 }) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      value={value} onChange={e=>onChange(e.target.value)}
      placeholder={placeholder} rows={rows}
      onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
      style={{
        padding:'11px 14px', fontSize:13,
        background:C.white,
        border:`1px solid ${focused?C.gold:C.border}`,
        outline:'none', color:C.dark, width:'100%',
        fontFamily:"'Jost',sans-serif", lineHeight:1.7,
        resize:'vertical', transition:'border-color 0.15s',
      }}
    />
  );
}

function Select({ value, onChange, options }) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      value={value} onChange={e=>onChange(e.target.value)}
      onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}
      style={{
        padding:'11px 14px', fontSize:13,
        background:C.white,
        border:`1px solid ${focused?C.gold:C.border}`,
        outline:'none', color:value?C.dark:C.muted, width:'100%',
        fontFamily:"'Jost',sans-serif", cursor:'pointer',
        transition:'border-color 0.15s', appearance:'none',
        backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23bbb'/%3E%3C/svg%3E")`,
        backgroundRepeat:'no-repeat', backgroundPosition:'right 14px center',
      }}
    >
      {options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
    </select>
  );
}

// ─── Шаги регистрации ──────────────────────────────────────────
const STEPS = [
  { id:'account', label:'Аккаунт',  kanji:'一' },
  { id:'profile', label:'Профиль',  kanji:'二' },
  { id:'done',    label:'Готово',   kanji:'三' },
];

// ─── ГЛАВНЫЙ КОМПОНЕНТ ─────────────────────────────────────────
export default function AuthPage({ onSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  return (
    <div style={{
      minHeight:'100vh', background:C.bg,
      display:'flex', alignItems:'stretch',
      fontFamily:"'Jost',sans-serif",
    }}>

      {/* ── Левая декоративная панель ── */}
      <div style={{
        width:400, flexShrink:0,
        background:`linear-gradient(160deg, #1a1710 0%, #0f0d0a 60%, #1c1a14 100%)`,
        display:'flex', flexDirection:'column', justifyContent:'space-between',
        padding:'48px 44px', position:'relative', overflow:'hidden',
      }}>
        {/* Фоновый кандзи */}
        <div style={{
          position:'absolute', bottom:-40, right:-20,
          fontFamily:"'Noto Serif JP',serif", fontSize:320,
          color:'rgba(200,168,74,0.04)', lineHeight:1, pointerEvents:'none',
          userSelect:'none',
        }}>合</div>

        {/* Логотип */}
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:48 }}>
            <div style={{ fontFamily:"'Noto Serif JP',serif", fontSize:32, color:C.goldLight, lineHeight:1 }}>合</div>
            <div>
              <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:14, fontWeight:600, letterSpacing:4, color:'#f0e8d0' }}>ONLINE DOJO</div>
              <div style={{ fontSize:9, color:'rgba(200,168,74,0.6)', marginTop:3, letterSpacing:1.5 }}>ДАЙТО-РЮ АЙКИДЗЮДЗЮЦУ</div>
            </div>
          </div>

          <div style={{ marginBottom:32 }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:36, fontWeight:300, color:'#f0e8d0', lineHeight:1.3, marginBottom:16 }}>
              Школа<br/>
              <span style={{ color:C.goldLight, fontStyle:'italic' }}>Станислава<br/>Копина</span>
            </div>
            <div style={{ width:40, height:1, background:C.goldBorder, marginBottom:20 }}/>
            <p style={{ fontSize:13, color:'rgba(240,232,208,0.55)', lineHeight:1.9, fontWeight:300 }}>
              Онлайн-платформа для изучения традиционного Дайто-рю Айкидзюдзюцу. Видеоуроки, техники, экзамены.
            </p>
          </div>
        </div>

        {/* Цитата внизу */}
        <div style={{ borderLeft:`2px solid rgba(200,168,74,0.3)`, paddingLeft:16 }}>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:15, fontStyle:'italic', color:'rgba(240,232,208,0.45)', lineHeight:1.8 }}>
            «Путь начинается с первого шага — не с совершенного шага»
          </div>
          <div style={{ fontSize:10, color:'rgba(200,168,74,0.5)', marginTop:8, letterSpacing:1 }}>СЭНСЭЙ СТАНИСЛАВ КОПИН</div>
        </div>
      </div>

      {/* ── Правая форма ── */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'48px 60px', overflowY:'auto' }}>
        <div style={{ width:'100%', maxWidth:460 }}>
          {/* Переключатель режима */}
          <div style={{ display:'flex', background:C.white, border:`1px solid ${C.border}`, marginBottom:36, padding:3 }}>
            {[{id:'login',label:'Вход'},{id:'register',label:'Регистрация'}].map(m=>(
              <button key={m.id} onClick={()=>setMode(m.id)}
                style={{ flex:1, padding:'10px', background:mode===m.id?C.dark:'transparent', color:mode===m.id?'#fff':C.muted, border:'none', fontSize:12, cursor:'pointer', transition:'all 0.15s', fontFamily:"'Jost',sans-serif", fontWeight:mode===m.id?500:400 }}>
                {m.label}
              </button>
            ))}
          </div>

          <div className="auth-anim" key={mode}>
            {mode==='login' ? <LoginForm onSuccess={onSuccess} onRegister={()=>setMode('register')}/> : <RegisterForm onSuccess={onSuccess} onLogin={()=>setMode('login')}/>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ФОРМА ВХОДА ───────────────────────────────────────────────
function LoginForm({ onSuccess, onRegister }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [serverErr,setServerErr]= useState('');

  const validate = () => {
    const e = {};
    if (!email.trim())         e.email    = 'Введите email';
    if (!password)             e.password = 'Введите пароль';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setServerErr(''); setLoading(true);

    // TODO: supabase.auth.signInWithPassword({ email, password })
    await new Promise(r => setTimeout(r, 800)); // mock delay
    setLoading(false);

    // Mock: любой email/password пускает
    if (email && password) {
      onSuccess({ email, name: email.split('@')[0] });
    } else {
      setServerErr('Неверный email или пароль');
    }
  };

  return (
    <div>
      <div style={{ marginBottom:28 }}>
        <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:600, color:C.dark, marginBottom:6 }}>С возвращением</div>
        <div style={{ fontSize:13, color:C.muted }}>Войдите в свой кабинет</div>
      </div>

      {serverErr && (
        <div style={{ padding:'12px 14px', background:C.redBg, border:`1px solid ${C.redBorder}`, fontSize:13, color:C.red, marginBottom:20 }}>
          {serverErr}
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
        <Field label="Email" error={errors.email}>
          <Input value={email} onChange={setEmail} placeholder="your@email.com" type="email" error={!!errors.email}/>
        </Field>
        <Field label="Пароль" error={errors.password}>
          <Input value={password} onChange={setPassword} placeholder="••••••••" type="password" error={!!errors.password}/>
        </Field>

        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <button style={{ background:'none', border:'none', fontSize:11, color:C.gold, cursor:'pointer', padding:0 }}>Забыли пароль?</button>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{ padding:'14px', background:loading?'#444':C.dark, color:'#fff', border:'none', fontSize:13, cursor:'pointer', fontFamily:"'Jost',sans-serif", fontWeight:500, letterSpacing:0.5, transition:'background 0.15s' }}>
          {loading ? 'Вход…' : 'Войти'}
        </button>
      </div>

      <div style={{ marginTop:24, textAlign:'center', fontSize:12, color:C.muted }}>
        Нет аккаунта?{' '}
        <button onClick={onRegister} style={{ background:'none', border:'none', color:C.gold, cursor:'pointer', fontSize:12, fontFamily:"'Jost',sans-serif" }}>
          Зарегистрироваться
        </button>
      </div>
    </div>
  );
}

// ─── ФОРМА РЕГИСТРАЦИИ (многошаговая) ─────────────────────────
function RegisterForm({ onSuccess, onLogin }) {
  const [step, setStep] = useState(0); // 0 = аккаунт, 1 = профиль, 2 = готово

  // Шаг 1 — данные аккаунта
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [password2,setPassword2]= useState('');

  // Шаг 2 — профиль
  const [selfLevel,   setSelfLevel]   = useState('none');
  const [senseiName,  setSenseiName]  = useState('');
  const [experience,  setExperience]  = useState('');

  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);

  const validateStep1 = () => {
    const e = {};
    if (!name.trim())                            e.name     = 'Введите ФИО';
    if (!email.trim() || !email.includes('@'))   e.email    = 'Введите корректный email';
    if (password.length < 6)                     e.password = 'Минимум 6 символов';
    if (password !== password2)                  e.password2= 'Пароли не совпадают';
    return e;
  };

  const handleStep1 = () => {
    const e = validateStep1();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({});
    setStep(1);
  };

  const handleStep2 = async () => {
    setLoading(true);

    // TODO: supabase.auth.signUp({ email, password, options:{ data:{ name } } })
    // TODO: supabase.from('profiles').update({ self_level, sensei_name, experience })
    await new Promise(r => setTimeout(r, 1000)); // mock

    setLoading(false);
    setStep(2);
  };

  // Шаг завершён — входим
  const handleDone = () => {
    onSuccess({ name, email, selfLevel, senseiName, experience, level: '6kyu' });
  };

  const selfLevelLabel = SELF_LEVELS.find(l => l.id === selfLevel)?.label || '—';

  return (
    <div>
      {/* Индикатор шагов */}
      <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:32 }}>
        {STEPS.map((s, i) => (
          <div key={s.id} style={{ display:'flex', alignItems:'center', flex: i < STEPS.length-1 ? 1 : 'none' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{
                width:32, height:32,
                background: step > i ? C.green : step === i ? C.dark : C.bg,
                border:`1px solid ${step > i ? C.green : step === i ? C.dark : C.border}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:"'Noto Serif JP',serif", fontSize:12,
                color: step >= i ? '#fff' : C.muted,
                transition:'all 0.2s',
              }}>{step > i ? '✓' : s.kanji}</div>
              <div style={{ fontSize:9, color: step===i ? C.dark : C.muted, letterSpacing:0.5, whiteSpace:'nowrap' }}>{s.label}</div>
            </div>
            {i < STEPS.length-1 && (
              <div style={{ flex:1, height:1, background: step > i ? C.green : C.border, margin:'0 8px', marginBottom:18, transition:'background 0.2s' }}/>
            )}
          </div>
        ))}
      </div>

      {/* ── Шаг 1: Аккаунт ── */}
      {step === 0 && (
        <div className="auth-anim">
          <div style={{ marginBottom:24 }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:600, color:C.dark, marginBottom:4 }}>Создайте аккаунт</div>
            <div style={{ fontSize:13, color:C.muted }}>Основные данные для входа</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <Field label="ФИО" error={errors.name}>
              <Input value={name} onChange={setName} placeholder="Иванов Иван Иванович" error={!!errors.name}/>
            </Field>
            <Field label="Email" error={errors.email}>
              <Input value={email} onChange={setEmail} placeholder="your@email.com" type="email" error={!!errors.email}/>
            </Field>
            <Field label="Пароль" hint="Минимум 6 символов" error={errors.password}>
              <Input value={password} onChange={setPassword} placeholder="••••••••" type="password" error={!!errors.password}/>
            </Field>
            <Field label="Повторите пароль" error={errors.password2}>
              <Input value={password2} onChange={setPassword2} placeholder="••••••••" type="password" error={!!errors.password2}/>
            </Field>
            <button onClick={handleStep1}
              style={{ padding:'14px', background:C.dark, color:'#fff', border:'none', fontSize:13, cursor:'pointer', fontFamily:"'Jost',sans-serif", fontWeight:500, marginTop:4 }}>
              Продолжить →
            </button>
          </div>
          <div style={{ marginTop:24, textAlign:'center', fontSize:12, color:C.muted }}>
            Уже есть аккаунт?{' '}
            <button onClick={onLogin} style={{ background:'none', border:'none', color:C.gold, cursor:'pointer', fontSize:12, fontFamily:"'Jost',sans-serif" }}>Войти</button>
          </div>
        </div>
      )}

      {/* ── Шаг 2: Профиль ── */}
      {step === 1 && (
        <div className="auth-anim">
          <div style={{ marginBottom:24 }}>
            <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:26, fontWeight:600, color:C.dark, marginBottom:4 }}>Расскажите о себе</div>
            <div style={{ fontSize:13, color:C.muted }}>Эта информация поможет сэнсэю узнать вас лучше</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

            <Field label="Ваш уровень в Дайто-рю" hint="По последней аттестации">
              <Select value={selfLevel} onChange={setSelfLevel} options={SELF_LEVELS}/>
              {selfLevel !== 'none' && (
                <div style={{ fontSize:11, color:C.gold, marginTop:4 }}>
                  Выбрано: {selfLevelLabel}. Официальный уровень будет подтверждён преподавателем.
                </div>
              )}
            </Field>

            <Field label="Имя вашего сэнсэя" hint="Необязательно">
              <Input value={senseiName} onChange={setSenseiName} placeholder="Если занимались у другого преподавателя…"/>
              <div style={{ fontSize:11, color:'#bbb', marginTop:3 }}>Оставьте пустым, если ваш сэнсэй — Станислав Копин</div>
            </Field>

            <Field label="Ваш опыт и цели" hint="Необязательно">
              <Textarea
                value={experience} onChange={setExperience}
                placeholder="Расскажите о своём опыте в боевых искусствах, сколько времени занимаетесь Дайто-рю, какие цели ставите на платформе…"
                rows={5}
              />
            </Field>

            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button onClick={()=>setStep(0)}
                style={{ padding:'14px 20px', background:'transparent', color:C.muted, border:`1px solid ${C.border}`, fontSize:13, cursor:'pointer', fontFamily:"'Jost',sans-serif" }}>
                ← Назад
              </button>
              <button onClick={handleStep2} disabled={loading}
                style={{ flex:1, padding:'14px', background:loading?'#444':C.dark, color:'#fff', border:'none', fontSize:13, cursor:'pointer', fontFamily:"'Jost',sans-serif", fontWeight:500 }}>
                {loading ? 'Создание аккаунта…' : 'Завершить регистрацию'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Шаг 3: Готово ── */}
      {step === 2 && (
        <div className="auth-anim" style={{ textAlign:'center' }}>
          <div style={{ width:64, height:64, background:C.greenBg, border:`1px solid ${C.greenBorder}`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', fontSize:24 }}>✓</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:600, color:C.dark, marginBottom:8 }}>
            Добро пожаловать!
          </div>
          <div style={{ fontSize:14, color:C.muted, lineHeight:1.8, marginBottom:8 }}>{name}</div>
          <p style={{ fontSize:13, color:C.muted, lineHeight:1.8, marginBottom:8 }}>
            Ваш аккаунт создан. Преподаватель рассмотрит ваш уровень<br/>
            и подтвердит его в течение одного-двух рабочих дней.
          </p>

          {/* Сводка анкеты */}
          <div style={{ background:C.goldBg, border:`1px solid ${C.goldBorder}`, padding:'16px 20px', textAlign:'left', marginBottom:28 }}>
            <div style={{ fontSize:9, color:C.gold, letterSpacing:1.5, textTransform:'uppercase', marginBottom:12 }}>Ваши данные</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { label:'ФИО',       value: name },
                { label:'Email',     value: email },
                { label:'Уровень',   value: selfLevelLabel },
                senseiName && { label:'Сэнсэй', value: senseiName },
              ].filter(Boolean).map(row => (
                <div key={row.label} style={{ display:'flex', gap:10, fontSize:12 }}>
                  <span style={{ color:C.muted, minWidth:80 }}>{row.label}</span>
                  <span style={{ color:C.dark }}>{row.value}</span>
                </div>
              ))}
              {experience && (
                <div style={{ fontSize:12, marginTop:4 }}>
                  <div style={{ color:C.muted, marginBottom:4 }}>Об опыте</div>
                  <div style={{ color:C.dark, lineHeight:1.7 }}>{experience.slice(0,120)}{experience.length>120?'…':''}</div>
                </div>
              )}
            </div>
          </div>

          <button onClick={handleDone}
            style={{ width:'100%', padding:'14px', background:C.dark, color:'#fff', border:'none', fontSize:13, cursor:'pointer', fontFamily:"'Jost',sans-serif", fontWeight:500 }}>
            Перейти в кабинет
          </button>
        </div>
      )}
    </div>
  );
}
