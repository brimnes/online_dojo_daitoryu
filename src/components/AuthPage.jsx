'use client';

import { useState, useRef } from 'react';
import { useIsMobile } from '@/lib/mobile';
import { SELF_LEVELS } from '@/data/users';
import TakedaMon from '@/components/TakedaMon';
import LandingContent from '@/components/LandingContent';

// ─── Временный запрет регистрации ─────────────────────────────
// Поставь false чтобы снова открыть регистрацию
const REGISTRATION_CLOSED = true;

// ─── Цветовая палитра ──────────────────────────────────────────
const C = {
  bg:         '#e6e0d2',        // cool stone
  surface:    '#f1ece0',        // ivory sheet
  surface2:   '#f7f2e7',
  white:      '#fff',
  border:     '#bab09a',
  dark:       '#15120e',
  ink:        '#15120e',
  ink2:       '#3a342b',
  muted:      '#6f6452',
  // Accent = CRIMSON
  accent:     '#9e2f1f',
  accentSoft: '#d4b8b0',
  accentDark: '#b73828',        // on dark bg
  // Gold — decorative only
  gold:       '#8a6e2a',
  goldLight:  '#b8923a',        // for dark backgrounds
  goldBorder: '#c8a978',
  goldBg:     '#f7f2e7',
  // Utility
  green:      '#4d6a4a',
  greenBg:    '#eaf4ea',
  greenBorder:'#9ec49e',
  red:        '#8a2a20',
  redBg:      '#fef4f2',
  redBorder:  '#d4b0aa',
};

// ─── UI-элементы ───────────────────────────────────────────────
function Field({ label, hint, error, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between' }}>
        <label style={{
          fontFamily:"var(--font-mono), 'JetBrains Mono', monospace",
          fontSize:11, color:C.muted, letterSpacing:'0.14em', textTransform:'uppercase',
        }}>{label}</label>
        {hint && <span style={{
          fontFamily:"var(--font-mono), 'JetBrains Mono', monospace",
          fontSize:11, color:C.border, letterSpacing:'0.06em',
        }}>{hint}</span>}
      </div>
      {children}
      {error && <div style={{ fontSize:13, color:C.red }}>{error}</div>}
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
        background: C.surface,
        border:`1px solid ${error?C.red:focused?C.accent:C.border}`,
        outline:'none', color:C.ink, width:'100%',
        fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
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
        background: C.surface,
        border:`1px solid ${focused?C.accent:C.border}`,
        outline:'none', color:C.dark, width:'100%',
        fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", lineHeight:1.7,
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
        background: C.surface,
        border:`1px solid ${focused?C.accent:C.border}`,
        outline:'none', color:value?C.dark:C.muted, width:'100%',
        fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", cursor:'pointer',
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
  const heroRef = useRef(null);

  const handleResetRequired = (userId) => {
    setResetUserId(userId);
    setMode('set-password');
  };

  const goToForm = (targetMode = 'login') => {
    setMode(targetMode);
    heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const features = ['Техники', 'История', 'Принципы', 'Архивные материалы', 'Экзаменационные программы', 'Ежемесячные тематические выпуски'];

  return (
    <div>
    <div ref={heroRef} style={{
      minHeight: '100dvh', background: C.bg,
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: 'stretch',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>

      {/* ── Левая часть: описание платформы ── */}
      <div style={{
        ...(isMobile
          ? { width: '100%', minHeight: '46dvh', flexShrink: 0 }
          : { flex: '0 0 58%' }),
        background: `linear-gradient(170deg, #1a1710 0%, #0d0b08 60%, #161410 100%)`,
        display: 'flex', flexDirection: 'column',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Декоративный кандзи */}
        <div style={{
          position: 'absolute', bottom: -40, right: -40,
          fontFamily: "'Noto Serif JP', serif", fontSize: isMobile ? 200 : 340,
          color: 'rgba(183,56,40,0.04)', lineHeight: 1,
          pointerEvents: 'none', userSelect: 'none',
        }}>道</div>

        {/* Вертикальный кандзи-рельс */}
        <div style={{
          position: 'absolute', top: 48, right: 28,
          writingMode: 'vertical-rl', textOrientation: 'upright',
          fontFamily: "'Noto Serif JP', var(--font-noto), serif",
          fontSize: 13, color: 'rgba(183,56,40,0.15)',
          letterSpacing: '0.45em', lineHeight: 1.1,
          pointerEvents: 'none', userSelect: 'none',
        }}>大東流合気柔術</div>

        {/* Контент */}
        <div style={{
          position: 'relative', zIndex: 3,
          padding: isMobile ? '36px 28px 32px' : '56px 64px',
          flex: 1, display: 'flex', flexDirection: 'column',
          justifyContent: 'center',
        }}>
          {/* Оверлайн */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isMobile ? 20 : 32 }}>
            <TakedaMon size={16} color="rgba(183,56,40,0.5)" />
            <div style={{
              fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
              fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
              color: 'rgba(183,56,40,0.65)',
            }}>Online Daito-ryu Dojo</div>
          </div>

          {/* Заголовок */}
          <div style={{
            fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            fontSize: isMobile ? 'clamp(26px, 6.5vw, 38px)' : 'clamp(34px, 3.8vw, 54px)',
            fontWeight: 400, lineHeight: 1.1, letterSpacing: '0.02em',
            color: '#ede8d8', marginBottom: 16,
          }}>
            Добро пожаловать<br />в мир Дайто-рю<br />Айкидзюдзюцу
          </div>

          {/* Разделитель */}
          <div style={{ width: 40, height: 1, background: 'rgba(183,56,40,0.4)', marginBottom: 18 }} />

          {/* Подзаголовок */}
          <p style={{
            fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            fontSize: isMobile ? 15 : 17, lineHeight: 1.75,
            color: 'rgba(216,206,188,0.6)', margin: 0,
            marginBottom: isMobile ? 0 : 28,
          }}>
            Крупнейшая русскоязычная платформа по изучению, исследованию и сохранению традиции Дайто-рю.
          </p>

          {/* Список — только десктоп */}
          {!isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {features.map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: 'rgba(183,56,40,0.4)', fontSize: 12, flexShrink: 0 }}>—</span>
                  <span style={{
                    fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                    fontSize: 16, color: 'rgba(216,206,188,0.5)', lineHeight: 1.5,
                  }}>{f}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Кнопка прокрутки — только десктоп */}
        {!isMobile && (
          <div style={{ position: 'relative', zIndex: 3, padding: '0 64px 40px' }}>
            <button
              onClick={() => window.scrollBy({ top: window.innerHeight, behavior: 'smooth' })}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                fontSize: 11, color: 'rgba(216,206,188,0.25)', letterSpacing: '0.14em', textTransform: 'uppercase',
              }}
            >Узнать больше ↓</button>
          </div>
        )}
      </div>

      {/* ── Правая часть: компактная форма входа ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: C.bg, position: 'relative',
      }}>
        {/* Brand header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: isMobile ? 'max(16px, env(safe-area-inset-top)) 24px 0' : '28px 48px 0',
        }}>
          <TakedaMon size={14} color={C.accent} />
          <div style={{
            fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
            fontSize: 11, letterSpacing: '0.18em', color: C.accent, textTransform: 'uppercase',
          }}>Online Daito-ryu Dojo</div>
        </div>

        {/* Форма — центрирована вертикально */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: isMobile ? '20px 24px 16px' : '32px 48px',
        }}>
          <div style={{ width: '100%', maxWidth: 380 }}>
            <div className="auth-anim" key={mode}>
              {mode==='login'        && <LoginForm compact onSuccess={onSuccess} onRegister={()=>setMode('register')} onResetRequired={handleResetRequired}/>}
              {mode==='register'     && <RegisterForm onSuccess={onSuccess} onLogin={()=>setMode('login')}/>}
              {mode==='set-password' && <SetPasswordForm userId={resetUserId} onSuccess={onSuccess} onBack={()=>setMode('login')}/>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: isMobile ? '0 24px max(12px, env(safe-area-inset-bottom))' : '0 48px 24px',
        }}>
          <div style={{
            fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
            fontSize: 11, color: C.border, letterSpacing: '0.1em',
          }}>v 1.9 · 2026</div>
          <div style={{
            fontFamily: "'Noto Serif JP', var(--font-noto), serif",
            fontSize: 13, color: C.border, letterSpacing: '0.3em',
          }}>大東流合気柔術</div>
        </div>
      </div>
    </div>

    <LandingContent
      isMobile={isMobile}
      onLogin={() => goToForm('login')}
      onRegister={() => goToForm('register')}
    />
    </div>
  );
}

// ─── ФОРМА ВХОДА ───────────────────────────────────────────────
function LoginForm({ onSuccess, onRegister, onResetRequired, compact = false }) {
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
      {compact ? (
        <div style={{
          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
          fontSize: 26, fontWeight: 400, color: C.ink,
          marginBottom: 22, letterSpacing: '0.03em', lineHeight: 1.15,
        }}>Войти в аккаунт</div>
      ) : (
        <>
          <div style={{
            fontFamily:"var(--font-cormorant), 'Cormorant Garamond', serif",
            fontSize: 42, fontWeight: 400, color: C.ink,
            marginBottom: 10, letterSpacing: '0.03em', lineHeight: 1.1,
          }}>Добро пожаловать</div>
          <p style={{
            fontFamily:"var(--font-cormorant), 'Cormorant Garamond', serif",
            fontSize: 15, color: C.muted, lineHeight: 1.75, marginBottom: 28,
          }}>
            Чтобы продолжить обучение или знакомство со школой Дайто-рю Айкидзюдзюцу, пожалуйста, войдите или зарегистрируйтесь.
          </p>
        </>
      )}

      {serverErr && (
        <div style={{ padding:'12px 16px', background:C.redBg, border:`1px solid ${C.redBorder}`, fontSize:13, color:C.red, marginBottom:20, lineHeight:1.5 }}>
          {serverErr}
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
        {/* Email field */}
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          <label style={{
            fontFamily:"var(--font-mono), 'JetBrains Mono', monospace",
            fontSize:11, color:C.muted, letterSpacing:'0.14em', textTransform:'uppercase',
          }}>Email</label>
          <Input value={email} onChange={setEmail} placeholder="ivan@dojo.ru" type="email" error={!!errors.email}/>
          {errors.email && <div style={{ fontSize:13, color:C.red }}>{errors.email}</div>}
        </div>

        {/* Password field */}
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
            <label style={{
              fontFamily:"var(--font-mono), 'JetBrains Mono', monospace",
              fontSize:11, color:C.muted, letterSpacing:'0.14em', textTransform:'uppercase',
            }}>Пароль</label>
            <button style={{ background:'none', border:'none', fontSize:11, color:C.accent, cursor:'pointer', padding:'12px 0', minHeight:44, display:'flex', alignItems:'center' }}>забыли?</button>
          </div>
          <Input value={password} onChange={setPassword} placeholder="••••••••" type="password" error={!!errors.password}/>
          {errors.password && <div style={{ fontSize:13, color:C.red }}>{errors.password}</div>}
        </div>

        {/* Primary CTA */}
        <button onClick={handleSubmit} disabled={loading}
          style={{
            marginTop:8,
            padding:'16px', background: loading ? C.muted : C.accent,
            color:'#f1ece0', border:'none', fontSize:13,
            cursor: loading ? 'default' : 'pointer',
            fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontWeight:600,
            letterSpacing:'0.12em', transition:'background 0.15s',
            minHeight:52, textTransform:'uppercase',
          }}>
          {loading ? 'Вход…' : 'Войти →'}
        </button>

        {/* Divider */}
        {REGISTRATION_CLOSED ? (
          compact ? (
            <div style={{
              marginTop: 4,
              paddingTop: 16, borderTop: `1px solid ${C.border}`,
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                fontSize: 10, color: C.muted, letterSpacing: '0.14em',
                textTransform: 'uppercase', marginBottom: 5,
              }}>Регистрация приостановлена</div>
              <div style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: 14, color: C.muted, lineHeight: 1.6,
              }}>Следите за анонсами новых наборов.</div>
            </div>
          ) : (
          <div style={{
            padding: '14px 16px',
            background: '#faf6ee',
            border: `1px solid ${C.border}`,
            textAlign: 'center',
          }}>
            <div style={{
              fontFamily: "'Noto Serif JP', var(--font-noto), serif",
              fontSize: 18, color: C.accent, marginBottom: 6,
            }}>門</div>
            <div style={{
              fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
              fontSize: 11, color: C.muted, letterSpacing: '0.14em',
              textTransform: 'uppercase', marginBottom: 6,
            }}>Регистрация закрыта</div>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 13, color: C.muted, lineHeight: 1.6,
            }}>Набор новых учеников временно приостановлен. Следите за анонсами.</div>
          </div>
          )
        ) : (
          <>
            <div style={{ display:'flex', alignItems:'center', gap:12, margin:'4px 0' }}>
              <div style={{ flex:1, height:1, background:C.border }} />
              <span style={{
                fontFamily:"var(--font-mono), 'JetBrains Mono', monospace",
                fontSize:11, color:C.border, letterSpacing:'0.1em', textTransform:'uppercase',
              }}>или</span>
              <div style={{ flex:1, height:1, background:C.border }} />
            </div>
            <button onClick={onRegister}
              style={{
                padding:'14px', background:'transparent',
                color:C.ink2, border:`1px solid ${C.border}`,
                fontSize:13, cursor:'pointer',
                fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontWeight:500,
                letterSpacing:'0.12em', textTransform:'uppercase',
                transition:'border-color 0.15s',
              }}>
              Регистрация
            </button>
          </>
        )}
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
          fontFamily:"var(--font-cormorant), 'Cormorant Garamond', serif",
          fontSize: 24, color: C.ink, marginBottom: 8, letterSpacing: '0.04em', fontWeight: 400,
        }}>
          Придумайте пароль
        </div>
        <div style={{ fontSize:15, color:C.muted, lineHeight:1.7 }}>
          Ваш аккаунт был перенесён из старой системы.<br/>
          Установите новый пароль для входа.
        </div>
      </div>

      {serverErr && (
        <div style={{ padding:'13px 16px', background:C.redBg, border:`1px solid ${C.redBorder}`, fontSize:15, color:C.red, marginBottom:20 }}>
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
            padding:'15px', background: loading ? C.muted : C.accent,
            color:'#fff', border:'none', fontSize:15,
            cursor: loading ? 'default' : 'pointer',
            fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontWeight:600,
            letterSpacing:'0.04em', transition:'background 0.15s', minHeight:50,
            textTransform:'uppercase',
          }}>
          {loading ? 'Сохранение…' : 'Сохранить и войти'}
        </button>

        <button onClick={onBack}
          style={{ background:'none', border:'none', fontSize:13, color:C.muted, cursor:'pointer', fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", minHeight:44, display:'flex', alignItems:'center', padding:'0 4px' }}>
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
                background: step > i ? C.green : step === i ? C.accent : C.surface2,
                border:`1px solid ${step > i ? C.green : step === i ? C.accent : C.border}`,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:"'Noto Serif JP', var(--font-noto), serif", fontSize:13,
                color: step >= i ? '#f1ece0' : C.muted,
                transition:'all 0.2s',
              }}>{step > i ? '✓' : s.kanji}</div>
              <div style={{ fontFamily:"var(--font-mono), monospace", fontSize:11, color: step===i ? C.ink : C.muted, letterSpacing:'0.1em', whiteSpace:'nowrap', fontWeight: step===i ? 600 : 400, textTransform:'uppercase' }}>{s.label}</div>
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
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <span style={{ fontFamily:"var(--font-mono), 'JetBrains Mono', monospace", fontSize:11, color:C.accent, letterSpacing:'0.06em' }}>02</span>
              <div style={{ width:20, height:1, background:C.border }} />
              <span style={{ fontFamily:"var(--font-mono), 'JetBrains Mono', monospace", fontSize:11, color:C.muted, letterSpacing:'0.14em', textTransform:'uppercase' }}>Регистрация</span>
            </div>
            <div style={{
              fontFamily:"var(--font-cormorant), 'Cormorant Garamond', serif",
              fontSize:36, color:C.ink, marginBottom:6, letterSpacing:'0.03em', fontWeight:400, lineHeight:1.1,
            }}>Создайте аккаунт</div>
            <p style={{ fontFamily:"var(--font-cormorant), 'Cormorant Garamond', serif", fontSize:15, color:C.muted, lineHeight:1.7 }}>Основные данные для входа в систему</p>
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
                padding:'15px', background:C.accent, color:'#f1ece0', border:'none',
                fontSize:15, cursor:'pointer', fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                fontWeight:500, marginTop:4, letterSpacing:'0.06em',
                textTransform:'uppercase',
              }}>
              Продолжить →
            </button>
          </div>
          <div style={{ marginTop:24, textAlign:'center', fontSize:13, color:C.muted }}>
            Уже есть аккаунт?{' '}
            <button onClick={onLogin} style={{ background:'none', border:'none', color:C.accent, cursor:'pointer', fontSize:13, fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontWeight:500 }}>Войти</button>
          </div>
        </div>
      )}

      {/* ── Шаг 2: Профиль ── */}
      {step === 1 && (
        <div className="auth-anim">
          <div style={{ marginBottom:24 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
              <span style={{ fontFamily:"var(--font-mono), 'JetBrains Mono', monospace", fontSize:11, color:C.accent, letterSpacing:'0.06em' }}>02</span>
              <div style={{ width:20, height:1, background:C.border }} />
              <span style={{ fontFamily:"var(--font-mono), 'JetBrains Mono', monospace", fontSize:11, color:C.muted, letterSpacing:'0.14em', textTransform:'uppercase' }}>Регистрация</span>
            </div>
            <div style={{
              fontFamily:"var(--font-cormorant), 'Cormorant Garamond', serif",
              fontSize:36, color:C.ink, marginBottom:6, letterSpacing:'0.03em', fontWeight:400, lineHeight:1.1,
            }}>Расскажите о себе</div>
            <p style={{ fontFamily:"var(--font-cormorant), 'Cormorant Garamond', serif", fontSize:15, color:C.muted, lineHeight:1.7 }}>Эта информация поможет сэнсэю узнать вас лучше</p>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>

            <Field label="Ваш уровень в Дайто-рю" hint="По последней аттестации">
              <Select value={selfLevel} onChange={setSelfLevel} options={SELF_LEVELS}/>
              {selfLevel !== 'none' && (
                <div style={{ fontSize:13, color:C.muted, marginTop:4 }}>
                  Выбрано: {selfLevelLabel}. Официальный уровень будет подтверждён преподавателем.
                </div>
              )}
            </Field>

            <Field label="Имя вашего сэнсэя" hint="Необязательно">
              <Input value={senseiName} onChange={setSenseiName} placeholder="Если занимались у другого преподавателя…"/>
              <div style={{ fontSize:13, color:'#aaa', marginTop:3 }}>Оставьте пустым, если ваш сэнсэй — Станислав Копин</div>
            </Field>

            <Field label="Ваш опыт и цели" hint="Необязательно">
              <Textarea
                value={experience} onChange={setExperience}
                placeholder="Расскажите о своём опыте в боевых искусствах, сколько времени занимаетесь Дайто-рю, какие цели ставите на платформе…"
                rows={5}
              />
            </Field>

            {serverErr && (
              <div style={{ padding:'13px 16px', background:'#fff8f7', border:'1px solid #e8c0c0', fontSize:15, color:'#a03030' }}>
                {serverErr}
              </div>
            )}
            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button onClick={()=>setStep(0)}
                style={{
                  padding:'15px 20px', background:'transparent',
                  color:C.muted, border:`1px solid ${C.border}`,
                  fontSize:15, cursor:'pointer', fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                }}>
                ← Назад
              </button>
              <button onClick={handleStep2} disabled={loading}
                style={{
                  flex:1, padding:'15px', background: loading ? C.muted : C.accent,
                  color:'#fff', border:'none', fontSize:15,
                  cursor: loading ? 'default' : 'pointer',
                  fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontWeight:600,
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
            margin:'0 auto 24px', fontSize:24,
          }}>✓</div>
          <div style={{ fontFamily:"var(--font-cormorant), 'Cormorant Garamond', serif", fontSize:36, fontWeight:400, color:C.ink, marginBottom:8, letterSpacing:'0.05em' }}>
            Добро пожаловать!
          </div>
          <div style={{ fontSize:15, color:C.muted, lineHeight:1.8, marginBottom:8 }}>{name}</div>
          <p style={{ fontSize:15, color:C.muted, lineHeight:1.8, marginBottom:8 }}>
            Ваш аккаунт создан. Преподаватель рассмотрит ваш уровень<br/>
            и подтвердит его в течение одного-двух рабочих дней.
          </p>

          {/* Сводка анкеты */}
          <div style={{ background:C.surface2, border:`1px solid ${C.border}`, padding:'16px 20px', textAlign:'left', marginBottom:28 }}>
            <div style={{ fontFamily:"var(--font-mono), monospace", fontSize:11, color:C.muted, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:12 }}>Ваши данные</div>
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
              background:C.accent, color:'#f1ece0', border:'none',
              fontSize:15, cursor:'pointer',
              fontFamily:"-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontWeight:500,
              letterSpacing:'0.06em', textTransform:'uppercase',
            }}>
            Перейти в кабинет
          </button>
        </div>
      )}
    </div>
  );
}
