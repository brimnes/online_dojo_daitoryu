'use client';

import { useState } from 'react';
import { useIsMobile } from '@/lib/mobile';
import { SELF_LEVELS } from '@/data/users';
import TakedaMon from '@/components/TakedaMon';

// ─── Цветовая палитра ──────────────────────────────────────────
const C = {
  bg:         '#f5f3ee',
  white:      '#fff',
  border:     '#d8d0c0',
  gold:       '#7a5c0f',        // тёмнее для контраста на светлом фоне
  goldLight:  '#c8a84a',        // акцент на тёмном фоне
  goldBorder: '#e0d0b0',
  goldBg:     '#faf6ee',
  dark:       '#111111',        // почти чёрный — сильный контраст
  muted:      '#666',           // был #999 — теперь темнее и читаемее
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
        <label style={{ fontSize:11, color:C.muted, letterSpacing:1.2, textTransform:'uppercase', fontWeight:500 }}>{label}</label>
        {hint && <span style={{ fontSize:11, color:'#999' }}>{hint}</span>}
      </div>
      {children}
      {error && <div style={{ fontSize:12, color:C.red }}>{error}</div>}
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
        padding:'13px 16px', fontSize:15,
        background:C.white,
        border:`1px solid ${error?C.red:focused?C.gold:C.border}`,
        outline:'none', color:C.dark, width:'100%',
        fontFamily:"'Jost',sans-serif",
        transition:'border-color 0.15s',
        borderRadius: 0,
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
        padding:'13px 16px', fontSize:15,
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
        padding:'13px 16px', fontSize:15,
        background:C.white,
        border:`1px solid ${focused?C.gold:C.border}`,
        outline:'none', color:value?C.dark:C.muted, width:'100%',
        fontFamily:"'Jost',sans-serif", cursor:'pointer',
        transition:'border-color 0.15s', appearance:'none',
        backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23999'/%3E%3C/svg%3E")`,
        backgroundRepeat:'no-repeat', backgroundPosition:'right 16px center',
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
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'set-password'
  const [resetUserId, setResetUserId] = useState(null);
  const isMobile = useIsMobile();

  const handleResetRequired = (userId) => {
    setResetUserId(userId);
    setMode('set-password');
  };

  return (
    <div style={{
      minHeight:'100vh', background:C.bg,
      display:'flex', alignItems:'stretch',
      fontFamily:"'Jost',sans-serif",
    }}>

      {/* ── Левая героическая панель (desktop only) ── */}
      {!isMobile && (
        <div style={{
          width: 460, flexShrink: 0,
          background: `linear-gradient(170deg, #1a1710 0%, #0d0b08 55%, #161410 100%)`,
          display: 'flex', flexDirection: 'column',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Фоновый кандзи — декоративный */}
          <div style={{
            position:'absolute', bottom: -60, right: -30,
            fontFamily:"'Noto Serif JP',serif", fontSize: 360,
            color:'rgba(200,168,74,0.035)', lineHeight:1,
            pointerEvents:'none', userSelect:'none',
          }}>合</div>

          {/* Фото Станислава — нижняя половина, плавно растворяется */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            height: '52%',
            overflow: 'hidden',
          }}>
            {/* Градиент-маска сверху (из тёмного в прозрачное) */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 120,
              background: 'linear-gradient(to bottom, #0d0b08, transparent)',
              zIndex: 2, pointerEvents: 'none',
            }} />
            {/* Градиент-маска снизу (небольшое затемнение для цитаты) */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 140,
              background: 'linear-gradient(to top, rgba(13,11,8,0.85), transparent)',
              zIndex: 2, pointerEvents: 'none',
            }} />
            <img
              src="/images/stas-hero.jpg"
              alt="Станислав Копин"
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center 15%',
                display: 'block',
              }}
              onError={e => { e.currentTarget.parentElement.style.display = 'none'; }}
            />
          </div>

          {/* Верхняя контентная часть */}
          <div style={{ position: 'relative', zIndex: 3, padding: '44px 44px 0', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Логотип */}
            <div style={{ display:'flex', alignItems:'center', gap:18, marginBottom: 52 }}>
              <TakedaMon size={68} color="#c8a84a" />
              <div>
                <div style={{
                  fontFamily:"var(--font-arkhip), system-ui, sans-serif",
                  fontSize: 13, letterSpacing:'0.16em',
                  color:'#c8a84a', textTransform:'uppercase',
                  lineHeight: 1.3,
                }}>ONLINE DAITO-RYU DOJO</div>
                <div style={{
                  fontSize: 10, color:'rgba(200,168,74,0.55)',
                  marginTop: 5, letterSpacing: 2,
                  textTransform: 'uppercase',
                }}>ДАЙТО-РЮ АЙКИДЗЮДЗЮЦУ</div>
              </div>
            </div>

            {/* Заголовок */}
            <div>
              <div style={{
                fontFamily:"var(--font-arkhip), system-ui, sans-serif",
                fontSize: 34, color:'#e8d49a',
                lineHeight: 1.25, marginBottom: 18,
                letterSpacing: '0.01em',
              }}>
                Онлайн-школа<br/>
                <span style={{ color:'#c8a84a' }}>Станислава<br/>Копина</span>
              </div>
              <div style={{ width: 48, height: 2, background: 'rgba(200,168,74,0.5)', marginBottom: 22 }}/>
              <p style={{
                fontSize: 14, color:'rgba(240,232,208,0.5)',
                lineHeight: 1.9, fontWeight: 300, maxWidth: 300,
              }}>
                Онлайн-платформа для изучения традиционного Дайто-рю Айкидзюдзюцу. Видеоуроки, техники, экзамены.
              </p>
            </div>
          </div>

          {/* Цитата внизу */}
          <div style={{
            position: 'relative', zIndex: 3,
            padding: '0 44px 40px',
            borderLeft: 'none',
          }}>
            <div style={{ borderLeft:'2px solid rgba(200,168,74,0.4)', paddingLeft: 18 }}>
              <div style={{
                fontFamily:"'Cormorant Garamond',serif",
                fontSize: 15, fontStyle:'italic',
                color:'rgba(240,232,208,0.5)', lineHeight: 1.8,
              }}>
                «Путь начинается с первого шага — не с совершенного шага»
              </div>
              <div style={{
                fontSize: 10, color:'rgba(200,168,74,0.55)',
                marginTop: 10, letterSpacing: 1.2, textTransform: 'uppercase',
              }}>Сэнсэй Станислав Копин</div>
            </div>
          </div>
        </div>
      )}

      {/* ── Правая форма ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        justifyContent: isMobile ? 'flex-start' : 'center',
        padding: isMobile
          ? 'max(20px, env(safe-area-inset-top)) 20px 40px'
          : '48px 60px',
        overflowY: 'auto',
        background: C.bg,
      }}>

        {/* Mobile hero ── */}
        {isMobile && (
          <div style={{
            width: '100%',
            background: 'linear-gradient(160deg, #1a1710 0%, #0d0b08 100%)',
            padding: '36px 24px 32px',
            marginBottom: 32,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Декоративный кандзи */}
            <div style={{
              position: 'absolute', right: -10, bottom: -20,
              fontFamily:"'Noto Serif JP',serif", fontSize: 160,
              color:'rgba(200,168,74,0.05)', lineHeight:1,
              pointerEvents:'none', userSelect:'none',
            }}>合</div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Логотип */}
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom: 28 }}>
                <TakedaMon size={56} color="#c8a84a" />
                <div>
                  <div style={{
                    fontFamily:"var(--font-arkhip), system-ui, sans-serif",
                    fontSize: 12, letterSpacing:'0.15em',
                    color:'#c8a84a', textTransform:'uppercase',
                    lineHeight: 1.4,
                  }}>ONLINE DAITO-RYU<br/>DOJO</div>
                </div>
              </div>

              <div style={{
                fontFamily:"var(--font-arkhip), system-ui, sans-serif",
                fontSize: 22, color:'#e8d49a',
                lineHeight: 1.3, marginBottom: 10,
              }}>
                Школа Станислава Копина
              </div>
              <div style={{ fontSize: 11, color:'rgba(200,168,74,0.6)', letterSpacing: 1.5, textTransform: 'uppercase' }}>
                Дайто-рю Айкидзюдзюцу
              </div>
            </div>
          </div>
        )}

        <div style={{ width:'100%', maxWidth: isMobile ? '100%' : 460 }}>
          {/* Переключатель Вход / Регистрация */}
          {mode !== 'set-password' && (
            <div style={{
              display:'flex', background:C.white,
              border:`1px solid ${C.border}`,
              marginBottom: 32, padding: 3,
            }}>
              {[{id:'login',label:'Вход'},{id:'register',label:'Регистрация'}].map(m=>(
                <button key={m.id} onClick={()=>setMode(m.id)}
                  style={{
                    flex:1, padding:'11px',
                    background: mode===m.id ? C.dark : 'transparent',
                    color: mode===m.id ? '#fff' : C.muted,
                    border:'none', fontSize:14, cursor:'pointer',
                    transition:'all 0.15s',
                    fontFamily:"'Jost',sans-serif",
                    fontWeight: mode===m.id ? 600 : 400,
                    letterSpacing: mode===m.id ? '0.02em' : 0,
                  }}>
                  {m.label}
                </button>
              ))}
            </div>
          )}

          <div className="auth-anim" key={mode}>
            {mode==='login'         && <LoginForm onSuccess={onSuccess} onRegister={()=>setMode('register')} onResetRequired={handleResetRequired}/>}
            {mode==='register'      && <RegisterForm onSuccess={onSuccess} onLogin={()=>setMode('login')}/>}
            {mode==='set-password'  && <SetPasswordForm userId={resetUserId} onSuccess={onSuccess} onBack={()=>setMode('login')}/>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ФОРМА ВХОДА ───────────────────────────────────────────────
function LoginForm({ onSuccess, onRegister, onResetRequired }) {
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

    try {
      const res  = await fetch('/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        if (data.resetRequired) {
          onResetRequired(data.userId);
          return;
        }
        setServerErr(data.error || 'Неверный email или пароль');
        return;
      }

      onSuccess(data.user);
    } catch {
      setLoading(false);
      setServerErr('Ошибка соединения. Попробуйте ещё раз.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontFamily:"var(--font-arkhip), system-ui, sans-serif",
          fontSize: 26, fontWeight: 400, color: C.dark,
          marginBottom: 8, letterSpacing: '0.01em',
        }}>С возвращением</div>
        <div style={{ fontSize:14, color:C.muted }}>Войдите в свой кабинет</div>
      </div>

      {serverErr && (
        <div style={{ padding:'13px 16px', background:C.redBg, border:`1px solid ${C.redBorder}`, fontSize:14, color:C.red, marginBottom:20, lineHeight:1.5 }}>
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
          <button style={{ background:'none', border:'none', fontSize:12, color:C.gold, cursor:'pointer', padding:0 }}>Забыли пароль?</button>
        </div>

        <button onClick={handleSubmit} disabled={loading}
          style={{
            padding:'15px', background: loading ? '#444' : C.dark,
            color:'#fff', border:'none', fontSize:15,
            cursor: loading ? 'default' : 'pointer',
            fontFamily:"'Jost',sans-serif", fontWeight:600,
            letterSpacing:'0.04em', transition:'background 0.15s',
            minHeight:50, textTransform:'uppercase',
          }}>
          {loading ? 'Вход…' : 'Войти'}
        </button>
      </div>

      <div style={{ marginTop:24, textAlign:'center', fontSize:13, color:C.muted }}>
        Нет аккаунта?{' '}
        <button onClick={onRegister} style={{ background:'none', border:'none', color:C.gold, cursor:'pointer', fontSize:13, fontFamily:"'Jost',sans-serif", fontWeight:600 }}>
          Зарегистрироваться
        </button>
      </div>
    </div>
  );
}

// ─── ФОРМА СМЕНЫ ПАРОЛЯ (для импортированных пользователей) ───
function SetPasswordForm({ userId, onSuccess, onBack }) {
  const [password,  setPassword]  = useState('');
  const [password2, setPassword2] = useState('');
  const [errors,    setErrors]    = useState({});
  const [loading,   setLoading]   = useState(false);
  const [serverErr, setServerErr] = useState('');

  const validate = () => {
    const e = {};
    if (password.length < 6)        e.password  = 'Минимум 6 символов';
    if (password !== password2)     e.password2 = 'Пароли не совпадают';
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setErrors({}); setServerErr(''); setLoading(true);

    try {
      const res  = await fetch('/api/auth/set-password', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId, password }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) { setServerErr(data.error || 'Ошибка при сохранении пароля'); return; }
      onSuccess(data.user);
    } catch {
      setLoading(false);
      setServerErr('Ошибка соединения. Попробуйте ещё раз.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontFamily:"var(--font-arkhip), system-ui, sans-serif",
          fontSize: 26, color: C.dark, marginBottom: 8,
        }}>
          Придумайте пароль
        </div>
        <div style={{ fontSize:14, color:C.muted, lineHeight:1.7 }}>
          Ваш аккаунт был перенесён из старой системы.<br/>
          Установите новый пароль для входа.
        </div>
      </div>

      {serverErr && (
        <div style={{ padding:'13px 16px', background:C.redBg, border:`1px solid ${C.redBorder}`, fontSize:14, color:C.red, marginBottom:20 }}>
          {serverErr}
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
        <Field label="Новый пароль" hint="Минимум 6 символов" error={errors.password}>
          <Input value={password} onChange={setPassword} placeholder="••••••••" type="password" error={!!errors.password}/>
        </Field>
        <Field label="Повторите пароль" error={errors.password2}>
          <Input value={password2} onChange={setPassword2} placeholder="••••••••" type="password" error={!!errors.password2}/>
        </Field>

        <button onClick={handleSubmit} disabled={loading}
          style={{
            padding:'15px', background: loading ? '#444' : C.dark,
            color:'#fff', border:'none', fontSize:15,
            cursor: loading ? 'default' : 'pointer',
            fontFamily:"'Jost',sans-serif", fontWeight:600,
            letterSpacing:'0.04em', transition:'background 0.15s', minHeight:50,
            textTransform:'uppercase',
          }}>
          {loading ? 'Сохранение…' : 'Сохранить и войти'}
        </button>

        <button onClick={onBack}
          style={{ background:'none', border:'none', fontSize:13, color:C.muted, cursor:'pointer', fontFamily:"'Jost',sans-serif" }}>
          ← Вернуться к входу
        </button>
      </div>
    </div>
  );
}

// ─── ФОРМА РЕГИСТРАЦИИ (многошаговая) ─────────────────────────
function RegisterForm({ onSuccess, onLogin }) {
  const [step, setStep] = useState(0);

  // Шаг 1
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [password2,setPassword2]= useState('');

  // Шаг 2
  const [selfLevel,   setSelfLevel]   = useState('none');
  const [senseiName,  setSenseiName]  = useState('');
  const [experience,  setExperience]  = useState('');

  const [errors,    setErrors]    = useState({});
  const [loading,   setLoading]   = useState(false);
  const [serverErr, setServerErr] = useState('');

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

  const [registeredUser, setRegisteredUser] = useState(null);

  const handleStep2 = async () => {
    setLoading(true);
    setServerErr('');

    try {
      const res  = await fetch('/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password, name, selfLevel, senseiName, experience }),
      });
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        if (res.status === 409) {
          setServerErr('Пользователь с таким email уже существует');
        } else {
          setServerErr(data.error || 'Ошибка при регистрации');
        }
        return;
      }

      setRegisteredUser(data.user);
      setStep(2);
    } catch {
      setLoading(false);
      setServerErr('Ошибка соединения. Попробуйте ещё раз.');
    }
  };

  const handleDone = () => {
    onSuccess(registeredUser || { name, email, level: '6kyu', role: 'student' });
  };

  const selfLevelLabel = SELF_LEVELS.find(l => l.id === selfLevel)?.label || '—';

  return (
    <div>
      {/* Индикатор шагов */}
      <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:32 }}>
        {STEPS.map((s, i) => (
          <div key={s.id} style={{ display:'flex', alignItems:'center', flex: i < STEPS.length-1 ? 1 : 'none' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
              <div style={{
                width:34, height:34,
                background: step > i ? C.green : step === i ? C.dark : C.bg,
                border:`1px solid ${step > i ? C.green : step === i ? C.dark : C.border}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:"'Noto Serif JP',serif", fontSize:13,
                color: step >= i ? '#fff' : C.muted,
                transition:'all 0.2s',
              }}>{step > i ? '✓' : s.kanji}</div>
              <div style={{ fontSize:10, color: step===i ? C.dark : C.muted, letterSpacing:0.5, whiteSpace:'nowrap', fontWeight: step===i ? 600 : 400 }}>{s.label}</div>
            </div>
            {i < STEPS.length-1 && (
              <div style={{ flex:1, height:1, background: step > i ? C.green : C.border, margin:'0 8px', marginBottom:20, transition:'background 0.2s' }}/>
            )}
          </div>
        ))}
      </div>

      {/* ── Шаг 1: Аккаунт ── */}
      {step === 0 && (
        <div className="auth-anim">
          <div style={{ marginBottom:24 }}>
            <div style={{
              fontFamily:"var(--font-arkhip), system-ui, sans-serif",
              fontSize:24, color:C.dark, marginBottom:6,
            }}>Создайте аккаунт</div>
            <div style={{ fontSize:14, color:C.muted }}>Основные данные для входа</div>
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
              style={{
                padding:'15px', background:C.dark, color:'#fff', border:'none',
                fontSize:15, cursor:'pointer', fontFamily:"'Jost',sans-serif",
                fontWeight:600, marginTop:4, letterSpacing:'0.04em',
                textTransform:'uppercase',
              }}>
              Продолжить →
            </button>
          </div>
          <div style={{ marginTop:24, textAlign:'center', fontSize:13, color:C.muted }}>
            Уже есть аккаунт?{' '}
            <button onClick={onLogin} style={{ background:'none', border:'none', color:C.gold, cursor:'pointer', fontSize:13, fontFamily:"'Jost',sans-serif", fontWeight:600 }}>Войти</button>
          </div>
        </div>
      )}

      {/* ── Шаг 2: Профиль ── */}
      {step === 1 && (
        <div className="auth-anim">
          <div style={{ marginBottom:24 }}>
            <div style={{
              fontFamily:"var(--font-arkhip), system-ui, sans-serif",
              fontSize:24, color:C.dark, marginBottom:6,
            }}>Расскажите о себе</div>
            <div style={{ fontSize:14, color:C.muted }}>Эта информация поможет сэнсэю узнать вас лучше</div>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

            <Field label="Ваш уровень в Дайто-рю" hint="По последней аттестации">
              <Select value={selfLevel} onChange={setSelfLevel} options={SELF_LEVELS}/>
              {selfLevel !== 'none' && (
                <div style={{ fontSize:12, color:C.gold, marginTop:4 }}>
                  Выбрано: {selfLevelLabel}. Официальный уровень будет подтверждён преподавателем.
                </div>
              )}
            </Field>

            <Field label="Имя вашего сэнсэя" hint="Необязательно">
              <Input value={senseiName} onChange={setSenseiName} placeholder="Если занимались у другого преподавателя…"/>
              <div style={{ fontSize:12, color:'#aaa', marginTop:3 }}>Оставьте пустым, если ваш сэнсэй — Станислав Копин</div>
            </Field>

            <Field label="Ваш опыт и цели" hint="Необязательно">
              <Textarea
                value={experience} onChange={setExperience}
                placeholder="Расскажите о своём опыте в боевых искусствах, сколько времени занимаетесь Дайто-рю, какие цели ставите на платформе…"
                rows={5}
              />
            </Field>

            {serverErr && (
              <div style={{ padding:'13px 16px', background:'#fff8f7', border:'1px solid #e8c0c0', fontSize:14, color:'#a03030' }}>
                {serverErr}
              </div>
            )}
            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button onClick={()=>setStep(0)}
                style={{
                  padding:'15px 20px', background:'transparent',
                  color:C.muted, border:`1px solid ${C.border}`,
                  fontSize:14, cursor:'pointer', fontFamily:"'Jost',sans-serif",
                }}>
                ← Назад
              </button>
              <button onClick={handleStep2} disabled={loading}
                style={{
                  flex:1, padding:'15px', background: loading ? '#444' : C.dark,
                  color:'#fff', border:'none', fontSize:15,
                  cursor: loading ? 'default' : 'pointer',
                  fontFamily:"'Jost',sans-serif", fontWeight:600,
                  letterSpacing:'0.04em', textTransform:'uppercase',
                }}>
                {loading ? 'Создание аккаунта…' : 'Завершить регистрацию'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Шаг 3: Готово ── */}
      {step === 2 && (
        <div className="auth-anim" style={{ textAlign:'center' }}>
          <div style={{
            width:64, height:64,
            background:C.greenBg, border:`1px solid ${C.greenBorder}`,
            borderRadius:'50%',
            display:'flex', alignItems:'center', justifyContent:'center',
            margin:'0 auto 24px', fontSize:26,
          }}>✓</div>
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:30, fontWeight:600, color:C.dark, marginBottom:8 }}>
            Добро пожаловать!
          </div>
          <div style={{ fontSize:15, color:C.muted, lineHeight:1.8, marginBottom:8 }}>{name}</div>
          <p style={{ fontSize:14, color:C.muted, lineHeight:1.8, marginBottom:8 }}>
            Ваш аккаунт создан. Преподаватель рассмотрит ваш уровень<br/>
            и подтвердит его в течение одного-двух рабочих дней.
          </p>

          {/* Сводка анкеты */}
          <div style={{ background:C.goldBg, border:`1px solid ${C.goldBorder}`, padding:'16px 20px', textAlign:'left', marginBottom:28 }}>
            <div style={{ fontSize:10, color:C.gold, letterSpacing:1.5, textTransform:'uppercase', marginBottom:12, fontWeight:600 }}>Ваши данные</div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {[
                { label:'ФИО',       value: name },
                { label:'Email',     value: email },
                { label:'Уровень',   value: selfLevelLabel },
                senseiName && { label:'Сэнсэй', value: senseiName },
              ].filter(Boolean).map(row => (
                <div key={row.label} style={{ display:'flex', gap:10, fontSize:13 }}>
                  <span style={{ color:C.muted, minWidth:80 }}>{row.label}</span>
                  <span style={{ color:C.dark }}>{row.value}</span>
                </div>
              ))}
              {experience && (
                <div style={{ fontSize:13, marginTop:4 }}>
                  <div style={{ color:C.muted, marginBottom:4 }}>Об опыте</div>
                  <div style={{ color:C.dark, lineHeight:1.7 }}>{experience.slice(0,120)}{experience.length>120?'…':''}</div>
                </div>
              )}
            </div>
          </div>

          <button onClick={handleDone}
            style={{
              width:'100%', padding:'15px',
              background:C.dark, color:'#fff', border:'none',
              fontSize:15, cursor:'pointer',
              fontFamily:"'Jost',sans-serif", fontWeight:600,
              letterSpacing:'0.04em', textTransform:'uppercase',
            }}>
            Перейти в кабинет
          </button>
        </div>
      )}
    </div>
  );
}
