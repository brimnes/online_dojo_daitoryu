/**
 * src/lib/db.js
 *
 * Слой доступа к данным — работает в двух режимах:
 *   1. Supabase  — если заданы NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   2. Mock data — если ключи не заданы (для локальной разработки)
 *
 * Компоненты импортируют только хуки из этого файла,
 * не зная ничего о конкретном источнике данных.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase, IS_DB_CONNECTED } from './supabase';

// ─────────────────────────────────────────────────────────────
// MOCK DATA (используется когда Supabase не подключён)
// ─────────────────────────────────────────────────────────────

const MOCK_USERS = [
  { id:'u1', name:'Алексей Воронов',  email:'voronov@mail.ru',    level:'1dan', role:'student', status:'active',   joined_at:'2021-01-12', self_level:'1dan',  sensei_name:'',                     experience:'Занимаюсь айкидзюдзюцу с 2018 года. Особый интерес к Иккаджо.' },
  { id:'u2', name:'Михаил Орлов',     email:'orlov@mail.ru',      level:'3kyu', role:'student', status:'active',   joined_at:'2022-03-05', self_level:'3kyu',  sensei_name:'',                     experience:'Начинал самостоятельно по видео, потом нашёл школу Копина.' },
  { id:'u3', name:'Анна Соколова',    email:'sokolova@gmail.com', level:'5kyu', role:'student', status:'active',   joined_at:'2022-09-18', self_level:'none',  sensei_name:'',                     experience:'Пришла из Айкидо Айкикай, хочу углубить технику.' },
  { id:'u4', name:'Дмитрий Волков',   email:'volkov@yandex.ru',   level:'2kyu', role:'student', status:'active',   joined_at:'2022-11-22', self_level:'2kyu',  sensei_name:'Иван Петров',          experience:'10 лет дзюдо, 3 года Дайто-рю.' },
  { id:'u5', name:'Елена Петрова',    email:'petrova@mail.ru',    level:'4kyu', role:'student', status:'inactive', joined_at:'2023-02-07', self_level:'none',  sensei_name:'',                     experience:'' },
  { id:'u6', name:'Сергей Новиков',   email:'novikov@gmail.com',  level:'6kyu', role:'student', status:'active',   joined_at:'2023-06-14', self_level:'none',  sensei_name:'',                     experience:'Совсем новичок, первый раз в боевых искусствах.' },
  { id:'u7', name:'Ольга Смирнова',   email:'smirnova@mail.ru',   level:'1kyu', role:'teacher', status:'active',   joined_at:'2023-09-03', self_level:'1kyu',  sensei_name:'Станислав Копин',      experience:'Ассистент сэнсэя Копина. Веду отдельные занятия.' },
];

const MOCK_ACCESS = [
  { id:1,  user_id:'u1', type:'month',   reference:'jan', amount:1990, paid_at:'2026-01-01' },
  { id:2,  user_id:'u1', type:'month',   reference:'feb', amount:1990, paid_at:'2026-02-01' },
  { id:3,  user_id:'u1', type:'month',   reference:'mar', amount:1990, paid_at:'2026-03-01' },
  { id:4,  user_id:'u1', type:'section', reference:'ikkajo', amount:2900, paid_at:'2024-09-20' },
  { id:5,  user_id:'u2', type:'month',   reference:'jan', amount:1990, paid_at:'2026-01-01' },
  { id:6,  user_id:'u2', type:'month',   reference:'feb', amount:1990, paid_at:'2026-02-01' },
  { id:7,  user_id:'u3', type:'month',   reference:'jan', amount:1990, paid_at:'2026-01-01' },
  { id:8,  user_id:'u4', type:'month',   reference:'jan', amount:1990, paid_at:'2026-01-01' },
  { id:9,  user_id:'u4', type:'month',   reference:'feb', amount:1990, paid_at:'2026-02-01' },
  { id:10, user_id:'u4', type:'month',   reference:'mar', amount:1990, paid_at:'2026-03-01' },
  { id:11, user_id:'u4', type:'section', reference:'ikkajo', amount:2900, paid_at:'2025-10-15' },
  { id:12, user_id:'u7', type:'month',   reference:'jan', amount:1990, paid_at:'2026-01-01' },
  { id:13, user_id:'u7', type:'month',   reference:'feb', amount:1990, paid_at:'2026-02-01' },
  { id:14, user_id:'u7', type:'month',   reference:'mar', amount:1990, paid_at:'2026-03-01' },
  { id:15, user_id:'u7', type:'section', reference:'ikkajo', amount:2900, paid_at:'2025-11-05' },
];

const MOCK_EXAMS = [
  { id:1, user_id:'u2', user_name:'Михаил Орлов',   target_level:'2kyu', status:'pending',  teacher_note:'', requested_at:'2026-02-20' },
  { id:2, user_id:'u3', user_name:'Анна Соколова',  target_level:'4kyu', status:'pending',  teacher_note:'', requested_at:'2026-02-18' },
  { id:3, user_id:'u6', user_name:'Сергей Новиков', target_level:'5kyu', status:'approved', teacher_note:'Уверенное исполнение.', requested_at:'2026-02-15' },
];

const MOCK_MONTHS = [
  {id:'jan',label:'Январь',   kanji:'一',is_open:true,  sort_order:1,  description:'Основы дистанции и базовые захваты.'},
  {id:'feb',label:'Февраль',  kanji:'二',is_open:true,  sort_order:2,  description:'Укэми — техника падений.'},
  {id:'mar',label:'Март',     kanji:'三',is_open:true,  sort_order:3,  description:'Кихон — базовая техника.'},
  {id:'apr',label:'Апрель',   kanji:'四',is_open:false, sort_order:4,  description:'Ирими — вход. Управление балансом укэ.'},
  {id:'may',label:'Май',      kanji:'五',is_open:false, sort_order:5,  description:'Тэнкан — разворот.'},
  {id:'jun',label:'Июнь',     kanji:'六',is_open:false, sort_order:6,  description:'Атэми — вспомогательные удары.'},
  {id:'jul',label:'Июль',     kanji:'七',is_open:false, sort_order:7,  description:'Работа с дзё.'},
  {id:'aug',label:'Август',   kanji:'八',is_open:false, sort_order:8,  description:'Работа с вооружённым партнёром.'},
  {id:'sep',label:'Сентябрь', kanji:'九',is_open:false, sort_order:9,  description:'Подготовка к аттестации.'},
  {id:'oct',label:'Октябрь',  kanji:'十',is_open:false, sort_order:10, description:'Оё — прикладные техники.'},
  {id:'nov',label:'Ноябрь',  kanji:'十一',is_open:false, sort_order:11, description:'Рандори — свободная практика.'},
  {id:'dec',label:'Декабрь', kanji:'十二',is_open:false, sort_order:12, description:'Итоги года.'},
];

const MOCK_LESSONS = [
  {id:'jan-1',month_id:'jan',num:1,title:'Введение в Дайто-рю',       subtitle:'История и философия школы',   duration:'18:40',video_url:'',text:'Знакомство с корнями школы Дайто-рю Айкидзюдзюцу.'},
  {id:'jan-2',month_id:'jan',num:2,title:'Этикет додзё',               subtitle:'Рэй — уважение и дисциплина',duration:'12:15',video_url:'',text:'Правила поведения в додзё.'},
  {id:'jan-3',month_id:'jan',num:3,title:'Базовые стойки',             subtitle:'Шизентай, Хамни, Айханми',   duration:'22:30',video_url:'',text:'Три базовые стойки школы.'},
  {id:'feb-1',month_id:'feb',num:1,title:'Принцип Кокю',               subtitle:'Дыхание как основа техники', duration:'20:15',video_url:'',text:'Кокю — принцип расширения и сжатия энергии.'},
  {id:'feb-2',month_id:'feb',num:2,title:'Кокю-хо стоя',               subtitle:'Базовое упражнение',         duration:'24:30',video_url:'',text:'Классическое упражнение Кокю-хо.'},
  {id:'mar-1',month_id:'mar',num:1,title:'Кихон — базовая техника',    subtitle:'Что такое кихон',            duration:'17:30',video_url:'',text:'Кихон — язык движения.'},
  {id:'mar-2',month_id:'mar',num:2,title:'Иппондори — разбор',         subtitle:'Первая техника программы',   duration:'29:15',video_url:'',text:'Детальный разбор Иппондори.'},
  {id:'mar-3',month_id:'mar',num:3,title:'Иппондори — детали захвата', subtitle:'Работа кистей',              duration:'22:40',video_url:'',text:'Микродетали в захвате при Иппондори.'},
];

const MOCK_TECHNIQUES = [
  {id:'Ippondori',    name_ru:'Иппондори',   kyu:'6kyu', section:'Tachiai', sort_order:1,
    description:'Первая и фундаментальная техника Татиай. Контроль запястья.',
    principles:['Движение начинается от бёдер — руки лишь направляют.','Сохраняйте низкий центр тяжести.','Непрерывный контакт с укэ.','Входите через расслабление, не через силу.'],
    sensei_quote:'Иппондори — не техника захвата, это техника единения. Цель — управлять центром тяжести укэ.'},
  {id:'Kurumadaoshi', name_ru:'Курумадаоси', kyu:'6kyu', section:'Tachiai', sort_order:2,
    description:'Техника переворота через круговое движение.',
    principles:['Вращение происходит вокруг оси тела укэ.','Скорость важнее силы.'],
    sensei_quote:'Вы не опрокидываете человека — вы становитесь осью его падения.'},
  {id:'Shihonage',    name_ru:'Сихонагэ',    kyu:'4kyu', section:'Tachiai', sort_order:3,
    description:'Бросок в четыре стороны — одна из важнейших техник.',
    principles:['Рука укэ ведётся по дуге над его головой.','Разворот выполняется под рукой.'],
    sensei_quote:'Сихонагэ — техника на все случаи жизни.'},
  {id:'Kotegaeshi',   name_ru:'Котэгаэси',   kyu:'4kyu', section:'Tachiai', sort_order:4,
    description:'Выворот запястья с одновременным броском.',
    principles:['Захват кисти должен быть мягким, но точным.','Выворот происходит по оси предплечья укэ.'],
    sensei_quote:'Котэгаэси — не ломающая техника. Цель — создать болевое ощущение достаточное для броска.'},
];

const MOCK_TECHNIQUE_MISTAKES = [
  {id:1, technique_id:'Ippondori',  title:'Тянуть руками',   description:'Попытка выполнить технику силой рук вместо тела.', sort_order:1},
  {id:2, technique_id:'Ippondori',  title:'Потеря оси',      description:'Нарушение вертикальной оси разрушает структуру.',   sort_order:2},
  {id:3, technique_id:'Ippondori',  title:'Разрыв контакта', description:'Любой разрыв даёт укэ возможность освободиться.',   sort_order:3},
  {id:4, technique_id:'Shihonage',  title:'Прямая траектория',description:'Попытка вести руку по прямой вместо дуги.',        sort_order:1},
  {id:5, technique_id:'Shihonage',  title:'Слабый финал',    description:'Недостаточное давление в финальной фазе.',          sort_order:2},
  {id:6, technique_id:'Kotegaeshi', title:'Захват пальцами', description:'Сильный захват пальцами вместо ладонного.',         sort_order:1},
];

const MOCK_TECHNIQUE_VIDEOS = [
  {id:'ip-v1', technique_id:'Ippondori',  category:'overview',   title:'Иппондори — Общий вид',       duration:'4:12', video_url:'', sort_order:1},
  {id:'ip-v2', technique_id:'Ippondori',  category:'overview',   title:'Иппондори — Ура-хэнка',       duration:'3:40', video_url:'', sort_order:2},
  {id:'ip-v3', technique_id:'Ippondori',  category:'details',    title:'Иппондори — Работа рук',      duration:'3:20', video_url:'', sort_order:1},
  {id:'ip-v4', technique_id:'Ippondori',  category:'details',    title:'Иппондори — Позиция корпуса', duration:'2:55', video_url:'', sort_order:2},
  {id:'ip-v5', technique_id:'Ippondori',  category:'mistakes',   title:'Иппондори — Ошибки',          duration:'2:30', video_url:'', sort_order:1},
  {id:'ip-v6', technique_id:'Ippondori',  category:'variations', title:'Иппондори — Вариации',        duration:'4:15', video_url:'', sort_order:1},
  {id:'ku-v1', technique_id:'Kurumadaoshi',category:'overview',  title:'Курумадаоси — Общий вид',     duration:'3:55', video_url:'', sort_order:1},
  {id:'sh-v1', technique_id:'Shihonage',  category:'overview',   title:'Сихонагэ — Базовая форма',    duration:'6:00', video_url:'', sort_order:1},
];

const MOCK_COMMENTS = [
  {id:1, lesson_id:'jan-2', user_id:'u3', user_name:'Анна Соколова',  text:'Вопрос: при входе в додзё поклон от двери или с татами?',                        created_at:'2026-01-16', replied:false},
  {id:2, lesson_id:'mar-2', user_id:'u4', user_name:'Дмитрий Волков', text:'После многих повторений начинаю чувствовать разницу.',                           created_at:'2026-03-03', replied:true},
  {id:3, lesson_id:'jan-1', user_id:'u2', user_name:'Михаил Орлов',   text:'Очень полезное введение. Впервые понял разницу между Айкидо и Дайто-рю.',         created_at:'2026-01-15', replied:false},
  {id:4, lesson_id:'jan-3', user_id:'u6', user_name:'Сергей Новиков', text:'Сложно держать расслабленную руку при захвате — как развить это?',               created_at:'2026-01-20', replied:false},
];

// ─────────────────────────────────────────────────────────────
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ─────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ru-RU');
}

// ─────────────────────────────────────────────────────────────
// HOOK: useUsers
// ─────────────────────────────────────────────────────────────

export function useUsers() {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    if (!IS_DB_CONNECTED) {
      // fallback: mock
      setUsers(MOCK_USERS.map(u => ({ ...u, joined_at: fmtDate(u.joined_at) })));
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from('profiles').select('id,name,email,level,role,status,joined_at,self_level,sensei_name,experience').order('joined_at');
    if (error) setError(error.message);
    else setUsers((data || []).map(u => ({ ...u, joined_at: fmtDate(u.joined_at) })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateLevel = useCallback(async (userId, level) => {
    if (!IS_DB_CONNECTED) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, level } : u));
      return { ok: true };
    }
    const { error } = await supabase.from('profiles').update({ level }).eq('id', userId);
    if (!error) setUsers(prev => prev.map(u => u.id === userId ? { ...u, level } : u));
    return { ok: !error, error: error?.message };
  }, []);

  return { users, loading, error, updateLevel, reload: load };
}

// ─────────────────────────────────────────────────────────────
// HOOK: useAccess (оплаты и доступы)
// ─────────────────────────────────────────────────────────────

export function useAccess() {
  const [access,  setAccess]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!IS_DB_CONNECTED) {
        setAccess(MOCK_ACCESS.map(a => ({ ...a, paid_at: fmtDate(a.paid_at) })));
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('user_access')
        .select('*, profiles(name)')
        .order('paid_at', { ascending: false });
      setAccess((data || []).map(a => ({
        ...a,
        user_name: a.profiles?.name,
        paid_at: fmtDate(a.paid_at),
        // desc для отображения в таблице
        desc: a.type === 'month'
          ? `${a.reference.charAt(0).toUpperCase() + a.reference.slice(1)} 2026`
          : `База — ${a.reference}`,
      })));
      setLoading(false);
    };
    load();
  }, []);

  // Формат платежей совместимый с компонентом SectionPayments
  const payments = access.map(a => ({
    id:       a.id,
    userId:   a.user_id,
    userName: a.user_name || a.profiles?.name || '—',
    date:     a.paid_at,
    desc:     a.desc || (a.type === 'month' ? `${a.reference} 2026` : `База — ${a.reference}`),
    amount:   a.amount,
    type:     a.type,
  }));

  return { payments, loading };
}

// ─────────────────────────────────────────────────────────────
// HOOK: useExams
// ─────────────────────────────────────────────────────────────

export function useExams() {
  const [exams,   setExams]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!IS_DB_CONNECTED) {
        setExams(MOCK_EXAMS.map(e => ({ ...e, date: fmtDate(e.requested_at) })));
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('exams')
        .select('*, profiles!exams_user_id_fkey(name)')
        .order('requested_at', { ascending: false });
      setExams((data || []).map(e => ({
        ...e,
        user_name: e.profiles?.name,
        date:      fmtDate(e.requested_at),
        teacher_note: e.teacher_note || '',
      })));
      setLoading(false);
    };
    load();
  }, []);

  const approveExam = useCallback(async (id, note, updateUsers) => {
    const exam = exams.find(e => e.id === id);
    if (!IS_DB_CONNECTED) {
      setExams(prev => prev.map(e => e.id === id ? { ...e, status: 'approved', teacher_note: note } : e));
      if (updateUsers) updateUsers(exam.user_id, exam.target_level);
      return { ok: true };
    }
    const { error } = await supabase
      .from('exams')
      .update({ status: 'approved', teacher_note: note, resolved_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) {
      setExams(prev => prev.map(e => e.id === id ? { ...e, status: 'approved', teacher_note: note } : e));
      // Триггер в БД обновит уровень автоматически, но обновляем локально тоже
      if (updateUsers) updateUsers(exam.user_id, exam.target_level);
    }
    return { ok: !error, error: error?.message };
  }, [exams]);

  const rejectExam = useCallback(async (id, note) => {
    if (!IS_DB_CONNECTED) {
      setExams(prev => prev.map(e => e.id === id ? { ...e, status: 'rejected', teacher_note: note } : e));
      return { ok: true };
    }
    const { error } = await supabase
      .from('exams')
      .update({ status: 'rejected', teacher_note: note, resolved_at: new Date().toISOString() })
      .eq('id', id);
    if (!error) setExams(prev => prev.map(e => e.id === id ? { ...e, status: 'rejected', teacher_note: note } : e));
    return { ok: !error, error: error?.message };
  }, []);

  const addManualExam = useCallback(async ({ userId, userName, targetLevel, result, note }) => {
    const newExam = {
      id:           Date.now(),
      user_id:      userId,
      user_name:    userName,
      target_level: targetLevel,
      status:       result === 'passed' ? 'approved' : 'rejected',
      teacher_note: note,
      date:         new Date().toLocaleDateString('ru-RU'),
      requested_at: new Date().toISOString(),
    };
    if (!IS_DB_CONNECTED) {
      setExams(prev => [...prev, newExam]);
      return { ok: true };
    }
    const { data, error } = await supabase
      .from('exams')
      .insert({ user_id: userId, target_level: targetLevel, status: newExam.status, teacher_note: note })
      .select()
      .single();
    if (!error) setExams(prev => [...prev, { ...newExam, id: data.id }]);
    return { ok: !error, error: error?.message };
  }, []);

  return { exams, loading, approveExam, rejectExam, addManualExam };
}

// ─────────────────────────────────────────────────────────────
// HOOK: useMonths
// ─────────────────────────────────────────────────────────────

export function useMonths() {
  const [months,  setMonths]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!IS_DB_CONNECTED) { setMonths(MOCK_MONTHS); setLoading(false); return; }
      const { data } = await supabase.from('months').select('*').order('sort_order');
      setMonths(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const toggleOpen = useCallback(async (id) => {
    const month = months.find(m => m.id === id);
    const next  = !month?.is_open;
    if (!IS_DB_CONNECTED) { setMonths(prev => prev.map(m => m.id === id ? { ...m, is_open: next } : m)); return { ok: true }; }
    const { error } = await supabase.from('months').update({ is_open: next }).eq('id', id);
    if (!error) setMonths(prev => prev.map(m => m.id === id ? { ...m, is_open: next } : m));
    return { ok: !error };
  }, [months]);

  return { months, loading, toggleOpen };
}

// ─────────────────────────────────────────────────────────────
// HOOK: useLessons
// ─────────────────────────────────────────────────────────────

export function useLessons(monthId) {
  const [lessons,  setLessons]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    if (!monthId) return;
    const load = async () => {
      setLoading(true);
      if (!IS_DB_CONNECTED) {
        setLessons(MOCK_LESSONS.filter(l => l.month_id === monthId));
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('lessons')
        .select('*')
        .eq('month_id', monthId)
        .order('num');
      setLessons(data || []);
      setLoading(false);
    };
    load();
  }, [monthId]);

  const saveLesson = useCallback(async (lesson) => {
    setSaving(true);
    const patch = {
      title:     lesson.title,
      subtitle:  lesson.subtitle,
      text:      lesson.text,
      duration:  lesson.duration,
      video_url: lesson.video_url || lesson.videoUrl || '',
    };
    if (!IS_DB_CONNECTED) {
      setLessons(prev => prev.map(l => l.id === lesson.id ? { ...l, ...patch } : l));
      setSaving(false);
      return { ok: true };
    }
    const { error } = await supabase.from('lessons').update(patch).eq('id', lesson.id);
    if (!error) setLessons(prev => prev.map(l => l.id === lesson.id ? { ...l, ...patch } : l));
    setSaving(false);
    return { ok: !error, error: error?.message };
  }, []);

  const addLesson = useCallback(async (monthId) => {
    const num    = (lessons.length || 0) + 1;
    const newId  = `${monthId}-${Date.now()}`;
    const newL   = { id: newId, month_id: monthId, num, title: 'Новый урок', subtitle: '', text: '', duration: '00:00', video_url: '' };
    if (!IS_DB_CONNECTED) {
      setLessons(prev => [...prev, newL]);
      return { ok: true, lesson: newL };
    }
    const { data, error } = await supabase.from('lessons').insert(newL).select().single();
    if (!error) setLessons(prev => [...prev, data]);
    return { ok: !error, lesson: error ? newL : data };
  }, [lessons]);

  const deleteLesson = useCallback(async (id) => {
    if (!IS_DB_CONNECTED) { setLessons(prev => prev.filter(l => l.id !== id)); return { ok: true }; }
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (!error) setLessons(prev => prev.filter(l => l.id !== id));
    return { ok: !error };
  }, []);

  return { lessons, loading, saving, saveLesson, addLesson, deleteLesson };
}

// ─────────────────────────────────────────────────────────────
// HOOK: useTechniques
// ─────────────────────────────────────────────────────────────

export function useTechniques() {
  const [techniques, setTechniques] = useState([]);
  const [mistakes,   setMistakes]   = useState([]);
  const [videos,     setVideos]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!IS_DB_CONNECTED) {
        setTechniques(MOCK_TECHNIQUES);
        setMistakes(MOCK_TECHNIQUE_MISTAKES);
        setVideos(MOCK_TECHNIQUE_VIDEOS);
        setLoading(false);
        return;
      }
      const [t, m, v] = await Promise.all([
        supabase.from('techniques').select('*').order('sort_order'),
        supabase.from('technique_mistakes').select('*').order('sort_order'),
        supabase.from('technique_videos').select('*').order('sort_order'),
      ]);
      setTechniques(t.data || []);
      setMistakes(m.data || []);
      setVideos(v.data || []);
      setLoading(false);
    };
    load();
  }, []);

  // Возвращает контент конкретной техники в удобном формате
  const getTechContent = useCallback((techId) => ({
    description:  techniques.find(t => t.id === techId)?.description || '',
    principles:   techniques.find(t => t.id === techId)?.principles  || [],
    senseiQuote:  techniques.find(t => t.id === techId)?.sensei_quote || '',
    mistakes:     mistakes.filter(m => m.technique_id === techId).sort((a,b) => a.sort_order - b.sort_order),
    videos: {
      overview:   videos.filter(v => v.technique_id === techId && v.category === 'overview').sort((a,b) => a.sort_order - b.sort_order),
      details:    videos.filter(v => v.technique_id === techId && v.category === 'details').sort((a,b) => a.sort_order - b.sort_order),
      mistakes:   videos.filter(v => v.technique_id === techId && v.category === 'mistakes').sort((a,b) => a.sort_order - b.sort_order),
      variations: videos.filter(v => v.technique_id === techId && v.category === 'variations').sort((a,b) => a.sort_order - b.sort_order),
    },
  }), [techniques, mistakes, videos]);

  // Сохранить основную инфо + принципы + цитату сэнсэя
  const saveTechInfo = useCallback(async (techId, patch) => {
    setSaving(true);
    const dbPatch = {
      name_ru:      patch.nameRu,
      kyu:          patch.kyu,
      section:      patch.section,
      description:  patch.description,
      principles:   patch.principles,
      sensei_quote: patch.senseiQuote,
    };
    if (!IS_DB_CONNECTED) {
      setTechniques(prev => prev.map(t => t.id === techId ? { ...t, ...dbPatch } : t));
      setSaving(false);
      return { ok: true };
    }
    const { error } = await supabase.from('techniques').update(dbPatch).eq('id', techId);
    if (!error) setTechniques(prev => prev.map(t => t.id === techId ? { ...t, ...dbPatch } : t));
    setSaving(false);
    return { ok: !error };
  }, []);

  // Сохранить ошибки (полная замена набора для техники)
  const saveMistakes = useCallback(async (techId, newMistakes) => {
    setSaving(true);
    if (!IS_DB_CONNECTED) {
      setMistakes(prev => [
        ...prev.filter(m => m.technique_id !== techId),
        ...newMistakes.map((m, i) => ({ ...m, id: m.id || `m-${Date.now()}-${i}`, technique_id: techId, sort_order: i })),
      ]);
      setSaving(false);
      return { ok: true };
    }
    // Удаляем старые, вставляем новые
    await supabase.from('technique_mistakes').delete().eq('technique_id', techId);
    const toInsert = newMistakes.map((m, i) => ({ technique_id: techId, title: m.title, description: m.desc || m.description, sort_order: i }));
    const { data, error } = await supabase.from('technique_mistakes').insert(toInsert).select();
    if (!error) setMistakes(prev => [...prev.filter(m => m.technique_id !== techId), ...(data || [])]);
    setSaving(false);
    return { ok: !error };
  }, []);

  // Сохранить видео одной категории
  const saveVideos = useCallback(async (techId, category, newVideos) => {
    setSaving(true);
    if (!IS_DB_CONNECTED) {
      setVideos(prev => [
        ...prev.filter(v => !(v.technique_id === techId && v.category === category)),
        ...newVideos.map((v, i) => ({ ...v, technique_id: techId, category, sort_order: i })),
      ]);
      setSaving(false);
      return { ok: true };
    }
    await supabase.from('technique_videos').delete().eq('technique_id', techId).eq('category', category);
    const toInsert = newVideos.map((v, i) => ({
      technique_id: techId,
      category,
      title:        v.title,
      duration:     v.duration,
      video_url:    v.video_url || v.videoUrl || '',
      sort_order:   i,
    }));
    const { data, error } = await supabase.from('technique_videos').insert(toInsert).select();
    if (!error) setVideos(prev => [...prev.filter(v => !(v.technique_id === techId && v.category === category)), ...(data || [])]);
    setSaving(false);
    return { ok: !error };
  }, []);

  return { techniques, loading, saving, getTechContent, saveTechInfo, saveMistakes, saveVideos };
}

// ─────────────────────────────────────────────────────────────
// HOOK: useComments
// ─────────────────────────────────────────────────────────────

export function useComments() {
  const [comments, setComments] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!IS_DB_CONNECTED) { setComments(MOCK_COMMENTS); setLoading(false); return; }
      const { data } = await supabase
        .from('comments')
        .select('*, profiles(name)')
        .order('created_at', { ascending: false });
      setComments((data || []).map(c => ({
        ...c,
        user_name:  c.profiles?.name,
        created_at: fmtDate(c.created_at),
        replied:    false, // Статус ответа хранить в отдельной таблице, пока mock
      })));
      setLoading(false);
    };
    load();
  }, []);

  const markReplied = useCallback((id) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, replied: true } : c));
    // TODO: supabase.from('comment_replies').insert({ comment_id: id, text: replyText, admin_id: ... })
  }, []);

  return { comments, loading, markReplied };
}

// ─────────────────────────────────────────────────────────────
// HOOK: useVideoUpload — загрузка на Supabase Storage
// ─────────────────────────────────────────────────────────────

export function useVideoUpload() {
  const [uploading,   setUploading]   = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const uploadFile = useCallback(async (file, path) => {
    setUploading(true);
    setUploadError(null);

    if (!IS_DB_CONNECTED) {
      // Mock — возвращаем fake URL
      await new Promise(r => setTimeout(r, 800)); // имитация загрузки
      setUploading(false);
      return { ok: true, url: `[file: ${file.name}]` };
    }

    const ext      = file.name.split('.').pop();
    const filePath = `${path}.${ext}`;

    const { error: upError } = await supabase.storage
      .from('videos')
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (upError) {
      setUploadError(upError.message);
      setUploading(false);
      return { ok: false, error: upError.message };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(filePath);

    setUploading(false);
    return { ok: true, url: publicUrl };
  }, []);

  return { uploadFile, uploading, uploadError };
}
