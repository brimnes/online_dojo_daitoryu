'use client';

import React from 'react';

// ─── ЦВЕТА ────────────────────────────────────────────────────
const DARK = {
  bg:     '#0d0b08',
  bg2:    '#13110e',
  panel:  '#1a1710',
  border: 'rgba(255,255,255,0.07)',
  text:   '#d8cebc',
  muted:  'rgba(216,206,188,0.45)',
  accent: '#b73828',
  gold:   '#b8923a',
};

const LIGHT = {
  bg:      '#e6e0d2',
  surface: '#f1ece0',
  border:  '#bab09a',
  ink:     '#15120e',
  ink2:    '#3a342b',
  muted:   '#6f6452',
  accent:  '#9e2f1f',
};

// ─── Общие элементы ───────────────────────────────────────────
function Overline({ children, dark = false }) {
  return (
    <div style={{
      fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
      fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
      color: dark ? DARK.accent : LIGHT.accent,
      marginBottom: 16,
    }}>{children}</div>
  );
}

function SectionTitle({ children, dark = false, style = {} }) {
  return (
    <div style={{
      fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
      fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 400, lineHeight: 1.15,
      color: dark ? LIGHT.surface : LIGHT.ink,
      letterSpacing: '0.02em',
      ...style,
    }}>{children}</div>
  );
}

function Body({ children, dark = false, style = {} }) {
  return (
    <p style={{
      fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
      fontSize: 18, lineHeight: 1.85,
      color: dark ? DARK.text : LIGHT.ink2,
      margin: 0,
      ...style,
    }}>{children}</p>
  );
}

// ─── CTA-кнопки (вставляются внутри страницы) ─────────────────
function CtaButtons({ isMobile, onLogin, onRegister, dark = false }) {
  return (
    <div style={{
      display: 'flex', gap: 12,
      flexDirection: isMobile ? 'column' : 'row',
      alignItems: isMobile ? 'stretch' : 'center',
    }}>
      <button onClick={onRegister} style={{
        padding: '14px 36px',
        background: dark ? DARK.accent : LIGHT.accent,
        color: '#f1ece0', border: 'none',
        fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
        fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase',
        cursor: 'pointer', minHeight: 48,
      }}>Зарегистрироваться бесплатно</button>
      <button onClick={onLogin} style={{
        padding: '14px 36px',
        background: 'transparent',
        color: dark ? DARK.text : LIGHT.ink,
        border: `1px solid ${dark ? DARK.border : LIGHT.border}`,
        fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
        fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase',
        cursor: 'pointer', minHeight: 48,
      }}>Войти</button>
    </div>
  );
}

// ─── Симуляция интерфейса платформы ───────────────────────────
function PlatformPreview({ type }) {
  const base = {
    background: DARK.bg,
    border: `1px solid ${DARK.border}`,
    padding: '20px',
    fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
    overflow: 'hidden',
  };

  if (type === 'knowledge') return (
    <div style={base}>
      <div style={{ fontSize: 10, color: DARK.accent, letterSpacing: '0.2em', marginBottom: 16 }}>БАЗА ЗНАНИЙ</div>
      {['История школы Дайто-рю', 'Биографии мастеров', 'Терминология и принципы', 'Этикет додзё', 'Редкие исторические тексты', 'Интервью и исследования'].map((t, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${DARK.border}`, color: DARK.text, fontSize: 13 }}>
          <span>✦ {t}</span>
          <span style={{ color: DARK.muted, fontSize: 10 }}>→</span>
        </div>
      ))}
    </div>
  );

  if (type === 'techniques') {
    const items = [
      { kyu: '6 КЮ', name: 'Иппондори' },
      { kyu: '6 КЮ', name: 'Курумадаоси' },
      { kyu: '6 КЮ', name: 'Гьякуудэдори' },
      { kyu: '5 КЮ', name: 'Косигурума' },
      { kyu: '5 КЮ', name: 'Караминагэ' },
    ];
    return (
      <div style={base}>
        <div style={{ fontSize: 10, color: DARK.accent, letterSpacing: '0.2em', marginBottom: 16 }}>БАЗА ТЕХНИК · ИККАДЖО</div>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: `1px solid ${DARK.border}` }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: i < 3 ? '#e8c94a' : '#c8a88a', flexShrink: 0, display: 'inline-block' }} />
            <span style={{ fontSize: 10, color: DARK.muted, minWidth: 44 }}>{item.kyu}</span>
            <span style={{ fontSize: 13, color: DARK.text }}>{item.name}</span>
          </div>
        ))}
        <div style={{ marginTop: 12, fontSize: 10, color: DARK.muted }}>от 6 кю до 1 дана и старших уровней</div>
      </div>
    );
  }

  if (type === 'months') {
    const months = [
      { kanji: '六', label: 'ИЮНЬ' },
      { kanji: '七', label: 'ИЮЛЬ' },
      { kanji: '八', label: 'АВГУСТ' },
      { kanji: '九', label: 'СЕНТЯБРЬ' },
      { kanji: '十', label: 'ОКТЯБРЬ' },
      { kanji: '十一', label: 'НОЯБРЬ' },
    ];
    return (
      <div style={base}>
        <div style={{ fontSize: 10, color: DARK.accent, letterSpacing: '0.2em', marginBottom: 16 }}>ЕЖЕМЕСЯЧНЫЕ ВЫПУСКИ</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          {months.map((m, i) => (
            <div key={i} style={{ background: DARK.panel, border: `1px solid ${DARK.border}`, padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 22, color: DARK.gold, lineHeight: 1, marginBottom: 6 }}>{m.kanji}</div>
              <div style={{ fontSize: 9, color: DARK.muted, letterSpacing: '0.12em' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'profile') return (
    <div style={base}>
      <div style={{ fontSize: 10, color: DARK.accent, letterSpacing: '0.2em', marginBottom: 16 }}>ЛИЧНЫЙ КАБИНЕТ</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, background: DARK.panel, border: `1px solid ${DARK.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: DARK.text }}>井</div>
        <div>
          <div style={{ fontSize: 13, color: DARK.text }}>Иванов Иван</div>
          <div style={{ fontSize: 10, color: DARK.muted }}>6 КЮ · Студент</div>
        </div>
      </div>
      {[
        { label: 'Путь к Сёдан', value: 15 },
        { label: 'Иккаджо', value: 60 },
      ].map((p, i) => (
        <div key={i} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: DARK.muted, marginBottom: 4 }}>{p.label}</div>
          <div style={{ height: 4, background: DARK.panel, borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${p.value}%`, background: DARK.accent, borderRadius: 2 }} />
          </div>
        </div>
      ))}
      <div style={{ marginTop: 14, fontSize: 10, color: DARK.muted }}>Приобретённые материалы · История обучения</div>
    </div>
  );

  return null;
}

// ─── СЕКЦИЯ 1: ЧТО ВНУТРИ ─────────────────────────────────────
function WhatsInsideSection({ isMobile, onLogin, onRegister }) {
  const sections = [
    {
      overline: 'База знаний',
      title: 'История, принципы\nи традиция школы',
      text: 'База знаний содержит всё необходимое для знакомства с Дайто-рю Айкидзюдзюцу и более глубокого понимания традиции.\n\nЗдесь собраны история школы, биографии мастеров, терминология, принципы и этикет, справочная информация, программа обучения, интервью, полезные статьи, редкие тексты, видеоматериалы и другие материалы, связанные с Дайто-рю.',
      preview: 'knowledge',
    },
    {
      overline: 'База техник',
      title: 'Экзаменационная\nпрограмма',
      text: 'База техник содержит подробные видеоразборы и пошаговые объяснения экзаменационной программы Дайто-рю Айкидзюдзюцу от 6 кю до 1 дана, а также материалы более высокого уровня для подготовленных учеников (2–3 дан).\n\nКаждая техника сопровождается детальным объяснением, разбором нюансов исполнения, типичных ошибок и возможных вариаций.',
      preview: 'techniques',
      flip: true,
    },
    {
      overline: 'Месяцы Дайто-рю',
      title: 'Ежемесячные\nтематические выпуски',
      text: '«Месяцы Дайто-рю» — это ежемесячные тематические выпуски, посвящённые различным аспектам Дайто-рю Айкидзюдзюцу.\n\nКаждый выпуск включает материалы по технике и её практическому применению, самообороне, физической подготовке, истории школы, архивным документам, исследованиям, теоретическим и историческим подкастам, а также другим темам, связанным с традицией Дайто-рю.',
      preview: 'months',
    },
    {
      overline: 'Личный кабинет',
      title: 'История обучения\nи личный прогресс',
      text: 'Личный кабинет позволяет отслеживать приобретённые материалы, историю обучения и личный прогресс в рамках платформы.',
      preview: 'profile',
      flip: true,
    },
  ];

  return (
    <section style={{ background: LIGHT.bg, padding: '100px 24px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <Overline>Содержание платформы</Overline>
          <SectionTitle style={{ maxWidth: 600, margin: '0 auto' }}>
            Что находится внутри
          </SectionTitle>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 80 }}>
          {sections.map((s, i) => (
            <React.Fragment key={i}>
              {/* CTA-вставка между 2 и 3 блоком */}
              {i === 2 && (
                <div key="mid-cta" style={{
                  borderTop: `1px solid ${LIGHT.border}`,
                  borderBottom: `1px solid ${LIGHT.border}`,
                  padding: '40px 0',
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'flex-start' : 'center',
                  justifyContent: 'space-between',
                  gap: 24,
                }}>
                  <div>
                    <div style={{
                      fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                      fontSize: isMobile ? 22 : 26, fontWeight: 400,
                      color: LIGHT.ink, lineHeight: 1.3, marginBottom: 6,
                    }}>Присоединяйтесь к платформе</div>
                    <div style={{
                      fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                      fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
                      color: LIGHT.muted,
                    }}>Бесплатная регистрация</div>
                  </div>
                  <CtaButtons isMobile={isMobile} onLogin={onLogin} onRegister={onRegister} />
                </div>
              )}

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: isMobile ? 32 : 60,
                alignItems: 'center',
              }}>
                {/* Mockup */}
                <div style={{ order: isMobile ? 0 : (s.flip ? 1 : 0) }}>
                  <PlatformPreview type={s.preview} />
                </div>

                {/* Text */}
                <div style={{ order: isMobile ? 1 : (s.flip ? 0 : 1) }}>
                  <Overline>{s.overline}</Overline>
                  <SectionTitle style={{ marginBottom: 24, whiteSpace: 'pre-line' }}>{s.title}</SectionTitle>
                  {s.text.split('\n\n').map((para, j) => (
                    <Body key={j} style={{ marginBottom: j < s.text.split('\n\n').length - 1 ? 16 : 0 }}>
                      {para}
                    </Body>
                  ))}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── СЕКЦИЯ 3: ПОЧЕМУ ЭТА ПЛАТФОРМА ──────────────────────────
function WhySection({ isMobile }) {
  const items = [
    { kanji: '一', text: 'Подробный разбор экзаменационной программы Дайто-рю Айкидзюдзюцу.' },
    { kanji: '二', text: 'Материалы подготовлены официальным представителем линии Кацуюки Кондо.' },
    { kanji: '三', text: 'Система подготовки от начальных ступеней до чёрного пояса и выше.' },
    { kanji: '四', text: 'Сочетание техники, истории, философии и традиции.' },
    { kanji: '五', text: 'Регулярное пополнение платформы новыми материалами.' },
    { kanji: '六', text: 'Доступ к материалам из любой точки мира.' },
    { kanji: '七', text: 'Доступные цены на все разделы программы.' },
    { kanji: '八', text: 'Пожизненный доступ ко всем приобретённым материалам.' },
    { kanji: '九', text: 'Бесплатные материалы в открытом доступе — видео, статьи, файлы.' },
  ];

  return (
    <section style={{ background: DARK.bg, padding: '100px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', left: -60, bottom: -40,
        fontFamily: "'Noto Serif JP', serif", fontSize: 280,
        color: 'rgba(183,56,40,0.04)', lineHeight: 1,
        pointerEvents: 'none', userSelect: 'none',
      }}>心</div>

      <div style={{ maxWidth: 1080, margin: '0 auto', position: 'relative' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <Overline dark>Отличие</Overline>
          <SectionTitle dark>Что делает<br />платформу особенной</SectionTitle>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
          gap: isMobile ? 16 : 24,
        }}>
          {items.map((item, i) => (
            <div key={i} style={{
              background: DARK.panel,
              border: `1px solid ${DARK.border}`,
              padding: '28px 24px',
            }}>
              <div style={{
                fontFamily: "'Noto Serif JP', serif",
                fontSize: 20, color: DARK.gold,
                marginBottom: 16, lineHeight: 1,
              }}>{item.kanji}</div>
              <p style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: 17, lineHeight: 1.75,
                color: DARK.text, margin: 0,
              }}>{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── СЕКЦИЯ 4: ДЛЯ КОГО ──────────────────────────────────────
function ForWhomSection({ isMobile }) {
  const cards = [
    { title: 'Для начинающих',                    text: 'Знакомство с традицией и базовыми принципами Дайто-рю Айкидзюдзюцу.' },
    { title: 'Для учеников Дайто-рю',             text: 'Подготовка к экзаменам, систематизация знаний и доступ к архивам.' },
    { title: 'Для инструкторов',                  text: 'Дополнительные методические материалы и исследовательские ресурсы.' },
    { title: 'Для представителей других стилей',  text: 'Изучение принципов и техники Дайто-рю в сравнительном контексте.' },
    { title: 'Для исследователей японского Будо', text: 'Исторические документы, аналитические материалы и первоисточники.' },
    { title: 'Для людей из любых городов',        text: 'Возможность учиться независимо от места проживания — в любой точке мира.' },
  ];

  return (
    <section style={{ background: LIGHT.bg, padding: '100px 24px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <Overline>Аудитория</Overline>
          <SectionTitle>Для кого создана платформа</SectionTitle>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr',
          gap: isMobile ? 12 : 20,
        }}>
          {cards.map((c, i) => (
            <div key={i} style={{
              background: LIGHT.surface,
              border: `1px solid ${LIGHT.border}`,
              padding: isMobile ? '20px 16px' : '28px 24px',
            }}>
              <div style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: isMobile ? 15 : 17, fontWeight: 500,
                color: LIGHT.ink, marginBottom: 10, lineHeight: 1.3,
              }}>{c.title}</div>
              <p style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: isMobile ? 14 : 16, lineHeight: 1.7,
                color: LIGHT.muted, margin: 0,
              }}>{c.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── СЕКЦИЯ 5: ОБ АВТОРЕ ─────────────────────────────────────
function AuthorSection({ isMobile }) {
  const credentials = [
    '5 дан Дайто-рю Айкидзюдзюцу',
    'Официальный представитель линии Кацуюки Кондо в России',
    'Сооснователь Федерации Дайто-рю России',
    'Автор книги «Таинственный мир Дайто-рю Айкидзюдзюцу»',
    'Многолетний опыт изучения и преподавания японских боевых искусств',
    'Регулярное обучение и стажировки в Японии',
  ];

  return (
    <section style={{ background: DARK.bg, padding: '100px 24px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '380px 1fr',
          gap: isMobile ? 40 : 72,
          alignItems: 'center',
        }}>
          {/* Фото */}
          <div style={{ position: 'relative' }}>
            <div style={{
              aspectRatio: '3/4',
              background: DARK.panel,
              border: `1px solid ${DARK.border}`,
              overflow: 'hidden',
              maxHeight: isMobile ? 320 : 'none',
            }}>
              <img
                src="/images/stas-hero.jpg"
                alt="Станислав Копин"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 10%', display: 'block' }}
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
                background: `linear-gradient(to top, ${DARK.bg}, transparent)`,
              }} />
            </div>
          </div>

          {/* Текст */}
          <div>
            <Overline dark>Об авторе</Overline>
            <SectionTitle dark style={{ marginBottom: 8 }}>Станислав Копин</SectionTitle>
            <div style={{
              fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
              fontSize: 11, letterSpacing: '0.14em', color: DARK.gold, marginBottom: 28, textTransform: 'uppercase',
            }}>Основатель платформы Online Daito-ryu Dojo</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
              {credentials.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <span style={{ color: DARK.accent, flexShrink: 0, marginTop: 2, fontSize: 14 }}>—</span>
                  <span style={{
                    fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                    fontSize: 17, lineHeight: 1.65, color: DARK.text,
                  }}>{c}</span>
                </div>
              ))}
            </div>

            <div style={{ borderLeft: '2px solid rgba(183,56,40,0.3)', paddingLeft: 20 }}>
              <p style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: 17, lineHeight: 1.85,
                color: DARK.muted, margin: 0, fontStyle: 'italic',
              }}>
                «ONLINE DAITO-RYU DOJO создан как живой архив и учебная среда — чтобы знание Дайто-рю было доступно каждому вне зависимости от географии.»
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── СЕКЦИЯ 6: ФИНАЛЬНЫЙ CTA ──────────────────────────────────
function FinalCtaSection({ isMobile, onLogin, onRegister }) {
  return (
    <section style={{ background: DARK.bg2, padding: '100px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        fontFamily: "'Noto Serif JP', serif", fontSize: 400,
        color: 'rgba(183,56,40,0.025)', lineHeight: 1,
        pointerEvents: 'none', userSelect: 'none', whiteSpace: 'nowrap',
      }}>大東流</div>

      <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
        <div style={{
          fontFamily: "'Noto Serif JP', serif",
          fontSize: 28, color: DARK.gold, marginBottom: 24, letterSpacing: '0.3em',
        }}>大東流合気柔術</div>

        <SectionTitle dark style={{ marginBottom: 20 }}>
          Добро пожаловать<br />в таинственный мир Дайто-рю
        </SectionTitle>

        <p style={{
          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
          fontSize: 18, lineHeight: 1.85, color: DARK.text, marginBottom: 48,
        }}>
          Начните знакомство с традицией Дайто-рю Айкидзюдзюцу уже сегодня.<br />
          Регистрация на платформе бесплатна.
        </p>

        <div style={{
          display: 'flex', gap: 12, justifyContent: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
        }}>
          <button onClick={onRegister} style={{
            padding: isMobile ? '16px 0' : '16px 44px',
            width: isMobile ? '100%' : 'auto', maxWidth: isMobile ? 360 : 'none',
            background: DARK.accent, color: '#f1ece0', border: 'none',
            fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
            fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase',
            cursor: 'pointer', minHeight: 52,
          }}>Зарегистрироваться бесплатно</button>
          <button onClick={onLogin} style={{
            padding: isMobile ? '16px 0' : '16px 44px',
            width: isMobile ? '100%' : 'auto', maxWidth: isMobile ? 360 : 'none',
            background: 'transparent', color: DARK.text,
            border: `1px solid ${DARK.border}`,
            fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
            fontSize: 13, letterSpacing: '0.14em', textTransform: 'uppercase',
            cursor: 'pointer', minHeight: 52,
          }}>Войти</button>
        </div>

        <div style={{
          marginTop: 40,
          fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
          fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: DARK.muted,
        }}>
          Бесплатная регистрация&nbsp;•&nbsp;Открытая база знаний&nbsp;•&nbsp;Доступ из любой точки мира
        </div>
      </div>
    </section>
  );
}

// ─── ЭКСПОРТ ─────────────────────────────────────────────────
export default function LandingContent({ isMobile, onLogin, onRegister }) {
  return (
    <>
      <WhatsInsideSection isMobile={isMobile} onLogin={onLogin} onRegister={onRegister} />
      <WhySection isMobile={isMobile} />
      <ForWhomSection isMobile={isMobile} />
      <AuthorSection isMobile={isMobile} />
      <FinalCtaSection isMobile={isMobile} onLogin={onLogin} onRegister={onRegister} />
    </>
  );
}
