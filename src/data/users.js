// В реальном проекте — из Supabase Auth + profiles table
export const USER = {
  name:              'Алексей Воронов',
  email:             'voronov@mail.ru',
  level:             '1dan',
  purchasedSections: ['ikkajo'],
  // Поля из анкеты при регистрации:
  selfLevel:   '1dan',
  senseiName:  '',
  experience:  'Занимаюсь айкидзюдзюцу с 2018 года. До этого 5 лет дзюдо. Начал с нуля под руководством Станислава Копина, прошёл путь от 6 кю до 1 дана. Особый интерес к техникам Иккаджо и принципу кокю.',
  joinedAt:    '12.01.2021',
};

export const LEVELS = [
  { id: '6kyu', label: '6 кю',  program: 'ikkajo'   },
  { id: '5kyu', label: '5 кю',  program: 'ikkajo'   },
  { id: '4kyu', label: '4 кю',  program: 'ikkajo'   },
  { id: '3kyu', label: '3 кю',  program: 'ikkajo'   },
  { id: '2kyu', label: '2 кю',  program: 'ikkajo'   },
  { id: '1kyu', label: '1 кю',  program: 'ikkajo'   },
  { id: '1dan', label: '1 дан', program: 'nikkajo'  },
  { id: '2dan', label: '2 дан', program: 'sankajo'  },
  { id: '3dan', label: '3 дан', program: null        },
];

// Уровни для анкеты при регистрации (включает "нет аттестации")
export const SELF_LEVELS = [
  { id: 'none',  label: 'Нет аттестации' },
  { id: '6kyu',  label: '6 кю'  },
  { id: '5kyu',  label: '5 кю'  },
  { id: '4kyu',  label: '4 кю'  },
  { id: '3kyu',  label: '3 кю'  },
  { id: '2kyu',  label: '2 кю'  },
  { id: '1kyu',  label: '1 кю'  },
  { id: '1dan',  label: '1 дан' },
  { id: '2dan',  label: '2 дан' },
  { id: '3dan',  label: '3 дан' },
];

export const BELT = {
  '6kyu': { color: '#fff',    border: '#bbb',    label: 'Белый пояс'      },
  '5kyu': { color: '#4a9a4a', border: '#357a35', label: 'Зелёный пояс'    },
  '4kyu': { color: '#3060b0', border: '#1e448a', label: 'Синий пояс'      },
  '3kyu': { color: '#7a4a1a', border: '#5a3010', label: 'Коричневый пояс' },
  '2kyu': { color: '#7a4a1a', border: '#5a3010', label: 'Коричневый пояс' },
  '1kyu': { color: '#7a4a1a', border: '#5a3010', label: 'Коричневый пояс' },
};

export const EXAMS = [
  { id:1, date:'12.10.2021', level:'6kyu', result:true,  comment:'Базовые стойки и падения уверенно.' },
  { id:2, date:'18.03.2022', level:'5kyu', result:false, comment:'Недостаточная отработка захватов.' },
  { id:3, date:'15.06.2022', level:'5kyu', result:true,  comment:'Значительный прогресс.' },
  { id:4, date:'20.10.2022', level:'4kyu', result:true,  comment:'Чистое выполнение техник.' },
  { id:5, date:'22.03.2023', level:'3kyu', result:true,  comment:'Замечания по позиции корпуса.' },
  { id:6, date:'14.09.2023', level:'2kyu', result:true,  comment:'Хорошее понимание принципов.' },
  { id:7, date:'20.12.2023', level:'1kyu', result:true,  comment:'Рекомендован к сдаче дана.' },
  { id:8, date:'22.03.2024', level:'1dan', result:true,  comment:'Замечания по укэми.' },
  { id:9, date:'11.11.2025', level:'2dan', result:false, comment:'Доработка техник санкаджо.' },
];

export const PAYS = [
  { id:1, date:'01.03.2026', desc:'Март 2026',       amount:'1 990 ₽', type:'month'   },
  { id:2, date:'01.02.2026', desc:'Февраль 2026',    amount:'1 990 ₽', type:'month'   },
  { id:3, date:'01.01.2026', desc:'Январь 2026',     amount:'1 990 ₽', type:'month'   },
  { id:4, date:'20.09.2024', desc:'База — Иккаджо',  amount:'2 900 ₽', type:'section' },
];
