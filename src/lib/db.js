/**
 * src/lib/db.js
 *
 * Слой доступа к данным — все запросы идут через внутренние API routes (/api/*).
 * Компоненты импортируют только хуки из этого файла, не зная ничего о Prisma или БД.
 *
 * Аутентификация: httpOnly cookie 'dojo_token' передаётся браузером автоматически.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────
// MOCK DATA — используется как fallback при ошибке загрузки
// ─────────────────────────────────────────────────────────────

const MOCK_MONTHS = [
  {id:'jan',label:'Январь',   kanji:'一', is_open:false, sort_order:1,  description:'Основы дистанции и базовые захваты.'},
  {id:'feb',label:'Февраль',  kanji:'二', is_open:false, sort_order:2,  description:'Укэми — техника падений.'},
  {id:'mar',label:'Март',     kanji:'三', is_open:false, sort_order:3,  description:'Кихон — базовая техника.'},
  {id:'apr',label:'Апрель',   kanji:'四', is_open:false, sort_order:4,  description:'Ирими — вход. Управление балансом укэ.'},
  {id:'may',label:'Май',      kanji:'五', is_open:false, sort_order:5,  description:'Тэнкан — разворот.'},
  {id:'jun',label:'Июнь',     kanji:'六', is_open:false, sort_order:6,  description:'Атэми — вспомогательные удары.'},
  {id:'jul',label:'Июль',     kanji:'七', is_open:false, sort_order:7,  description:'Работа с дзё.'},
  {id:'aug',label:'Август',   kanji:'八', is_open:false, sort_order:8,  description:'Работа с вооружённым партнёром.'},
  {id:'sep',label:'Сентябрь', kanji:'九', is_open:false, sort_order:9,  description:'Подготовка к аттестации.'},
  {id:'oct',label:'Октябрь',  kanji:'十', is_open:false, sort_order:10, description:'Оё — прикладные техники.'},
  {id:'nov',label:'Ноябрь',   kanji:'十一',is_open:false, sort_order:11, description:'Рандори — свободная практика.'},
  {id:'dec',label:'Декабрь',  kanji:'十二',is_open:false, sort_order:12, description:'Итоги года.'},
];

// ─────────────────────────────────────────────────────────────
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ─────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ru-RU');
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
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
    try {
      const data = await api('/api/admin/users');
      setUsers(data.map(u => ({ ...u, joined_at: fmtDate(u.joined_at) })));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateLevel = useCallback(async (userId, level) => {
    try {
      await api(`/api/admin/users/${userId}`, { method: 'PATCH', body: { level } });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, level } : u));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }, []);

  return { users, loading, error, updateLevel, reload: load };
}

// ─────────────────────────────────────────────────────────────
// HOOK: useAccess
// ─────────────────────────────────────────────────────────────

export function useAccess() {
  const [access,  setAccess]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/api/admin/access')
      .then(data => {
        setAccess(data.map(a => ({
          ...a,
          paid_at: fmtDate(a.paid_at),
          desc: a.type === 'month'
            ? `${a.reference.charAt(0).toUpperCase() + a.reference.slice(1)} 2026`
            : `База — ${a.reference}`,
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const payments = access.map(a => ({
    id:       a.id,
    userId:   a.user_id,
    userName: a.user_name || '—',
    date:     a.paid_at,
    desc:     a.desc,
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
    api('/api/admin/exams')
      .then(data => {
        setExams(data.map(e => ({ ...e, date: fmtDate(e.requested_at) })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const approveExam = useCallback(async (id, note, updateUsers) => {
    try {
      const exam = exams.find(e => e.id === id);
      await api(`/api/admin/exams/${id}`, { method: 'PATCH', body: { status: 'approved', teacher_note: note } });
      setExams(prev => prev.map(e => e.id === id ? { ...e, status: 'approved', teacher_note: note } : e));
      if (updateUsers && exam) updateUsers(exam.user_id, exam.target_level);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }, [exams]);

  const rejectExam = useCallback(async (id, note) => {
    try {
      await api(`/api/admin/exams/${id}`, { method: 'PATCH', body: { status: 'rejected', teacher_note: note } });
      setExams(prev => prev.map(e => e.id === id ? { ...e, status: 'rejected', teacher_note: note } : e));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }, []);

  const addManualExam = useCallback(async ({ userId, userName, targetLevel, result, note }) => {
    try {
      const { exam } = await api('/api/admin/exams', {
        method: 'POST',
        body: { userId, targetLevel, status: result === 'passed' ? 'approved' : 'rejected', note },
      });
      setExams(prev => [...prev, {
        ...exam,
        user_name: userName,
        date: new Date().toLocaleDateString('ru-RU'),
        teacher_note: note,
      }]);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }, []);

  return { exams, loading, approveExam, rejectExam, addManualExam };
}

// ─────────────────────────────────────────────────────────────
// HOOK: useMonthsWithLessons
// ─────────────────────────────────────────────────────────────

export function useMonthsWithLessons() {
  const [months,  setMonths]  = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      // Один запрос вместо 12 — месяцы + уроки сразу
      const data = await api('/api/months?with_lessons=1');
      setMonths(data);
    } catch {
      setMonths(MOCK_MONTHS.map(m => ({ ...m, lessons: [] })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  return { months, loading, reload };
}

// ─────────────────────────────────────────────────────────────
// HOOK: useMonths
// ─────────────────────────────────────────────────────────────

export function useMonths() {
  const [months,  setMonths]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/api/months')
      .then(data => setMonths(data))
      .catch(() => setMonths(MOCK_MONTHS))
      .finally(() => setLoading(false));
  }, []);

  const toggleOpen = useCallback(async (id) => {
    const month = months.find(m => m.id === id);
    const next  = !month?.is_open;
    try {
      await api(`/api/months/${id}`, { method: 'PATCH', body: { is_open: next } });
      setMonths(prev => prev.map(m => m.id === id ? { ...m, is_open: next } : m));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
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

  const reload = useCallback(async () => {
    if (!monthId) return;
    setLoading(true);
    try {
      const data = await api(`/api/lessons?month_id=${monthId}`);
      setLessons(data);
    } catch {
      setLessons([]);
    } finally {
      setLoading(false);
    }
  }, [monthId]);

  useEffect(() => { reload(); }, [reload]);

  const saveLesson = useCallback(async (lesson) => {
    setSaving(true);
    try {
      await api(`/api/lessons/${lesson.id}`, {
        method: 'PATCH',
        body: {
          title:          lesson.title,
          subtitle:       lesson.subtitle,
          text:           lesson.text,
          duration:       lesson.duration,
          video_url:      lesson.video_url || lesson.videoUrl || '',
          ...(lesson.video_id       !== undefined && { video_id:       lesson.video_id }),
          ...(lesson.video_status   !== undefined && { video_status:   lesson.video_status }),
          ...(lesson.video_provider !== undefined && { video_provider: lesson.video_provider }),
        },
      });
      setLessons(prev => prev.map(l => l.id === lesson.id ? { ...l, ...lesson } : l));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    } finally {
      setSaving(false);
    }
  }, []);

  const addLesson = useCallback(async (mId) => {
    try {
      const { lesson } = await api('/api/lessons', { method: 'POST', body: { month_id: mId } });
      setLessons(prev => [...prev, lesson]);
      return { ok: true, lesson };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }, []);

  const deleteLesson = useCallback(async (id) => {
    try {
      await api(`/api/lessons/${id}`, { method: 'DELETE' });
      setLessons(prev => prev.filter(l => l.id !== id));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }, []);

  return { lessons, loading, saving, saveLesson, addLesson, deleteLesson, reload };
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
    api('/api/techniques')
      .then(({ techniques: t, mistakes: m, videos: v }) => {
        setTechniques(t || []);
        setMistakes(m   || []);
        setVideos(v     || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getTechContent = useCallback((techId) => {
    const tech = techniques.find(t => t.id === techId) || {};
    const sort = (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0);
    return {
      description: tech.description || '',
      principles:  Array.isArray(tech.principles) ? tech.principles : [],
      senseiQuote: tech.sensei_quote || '',
      mistakes:    mistakes.filter(m => m.technique_id === techId).sort(sort),
      videos: {
        overview:   videos.filter(v => v.technique_id === techId && v.category === 'overview').sort(sort),
        details:    videos.filter(v => v.technique_id === techId && v.category === 'details').sort(sort),
        mistakes:   videos.filter(v => v.technique_id === techId && v.category === 'mistakes').sort(sort),
        variations: videos.filter(v => v.technique_id === techId && v.category === 'variations').sort(sort),
      },
    };
  }, [techniques, mistakes, videos]);

  const saveTechInfo = useCallback(async (techId, patch) => {
    setSaving(true);
    try {
      await api(`/api/techniques/${techId}`, {
        method: 'PATCH',
        body: {
          name_ru:      patch.nameRu,
          kyu:          patch.kyu,
          section:      patch.section,
          description:  patch.description,
          principles:   patch.principles,
          sensei_quote: patch.senseiQuote,
        },
      });
      setTechniques(prev => prev.map(t => t.id === techId ? { ...t, ...patch, name_ru: patch.nameRu, sensei_quote: patch.senseiQuote } : t));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    } finally {
      setSaving(false);
    }
  }, []);

  const saveMistakes = useCallback(async (techId, newMistakes) => {
    setSaving(true);
    try {
      const { mistakes: updated } = await api(`/api/techniques/${techId}/mistakes`, {
        method: 'POST',
        body: { mistakes: newMistakes },
      });
      setMistakes(prev => [...prev.filter(m => m.technique_id !== techId), ...(updated || [])]);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    } finally {
      setSaving(false);
    }
  }, []);

  const saveVideos = useCallback(async (techId, category, newVideos) => {
    setSaving(true);
    try {
      const { data: updated } = await api(`/api/techniques/${techId}/videos/${category}`, {
        method: 'POST',
        body: { videos: newVideos },
      });
      setVideos(prev => [
        ...prev.filter(v => !(v.technique_id === techId && v.category === category)),
        ...(updated || []),
      ]);
      return { ok: true, data: updated || [] };
    } catch (e) {
      return { ok: false, error: e.message };
    } finally {
      setSaving(false);
    }
  }, []);

  return { techniques, videos, mistakes, loading, saving, getTechContent, saveTechInfo, saveMistakes, saveVideos };
}

// ─────────────────────────────────────────────────────────────
// HOOK: useUserAccess
// ─────────────────────────────────────────────────────────────

export function useUserAccess() {
  const [accessSet, setAccessSet] = useState(new Set());
  const [loading,   setLoading]   = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/api/user/access');
      setAccessSet(new Set(data.map(a => `${a.type}:${a.reference}`)));
    } catch {
      setAccessSet(new Set());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const hasMonth   = useCallback((monthId)   => accessSet.has(`month:${monthId}`),   [accessSet]);
  const hasSection = useCallback((sectionId) => accessSet.has(`section:${sectionId}`), [accessSet]);

  return { accessSet, hasMonth, hasSection, loading, reload };
}

// ─────────────────────────────────────────────────────────────
// HOOK: useComments
// ─────────────────────────────────────────────────────────────

export function useComments() {
  const [comments, setComments] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api('/api/admin/comments')
      .then(data => {
        setComments(data.map(c => ({ ...c, created_at: fmtDate(c.created_at) })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const markReplied = useCallback((id) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, replied: true } : c));
  }, []);

  return { comments, loading, markReplied };
}

// ─────────────────────────────────────────────────────────────
// HOOK: useVideoUpload — устарел, заменён на KinescopeUploader
// Оставлен для совместимости, но не выполняет реальной загрузки
// ─────────────────────────────────────────────────────────────

export function useVideoUpload() {
  return {
    uploadFile:  async () => ({ ok: false, error: 'Используйте KinescopeUploader' }),
    uploading:   false,
    uploadError: null,
  };
}

// ─────────────────────────────────────────────────────────────
// ACCESS HELPERS (pure functions, no hooks)
// ─────────────────────────────────────────────────────────────

export { hasMonthAccess, hasIkkajoFullAccess, hasIkkajoSectionAccess, getAccessibleIkkajoSections } from '@/lib/access';
export { IKKAJO_SECTION_KEYS as IKKAJO_SECTIONS, IKKAJO_SECTION_LABELS, IKKAJO_SECTION_KEYS } from '@/lib/ikkajoSections';

// ─────────────────────────────────────────────────────────────
// HOOK: useUserAccessRows
// ─────────────────────────────────────────────────────────────

export function useUserAccessRows() {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api('/api/user/access');
      setRows(data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Первоначальная загрузка
  useEffect(() => { reload(); }, [reload]);

  // Рефетч при возврате на вкладку:
  // - пользователь вернулся со страницы оплаты (ЮKassa → return_url → /)
  // - администратор выдал доступ в другой вкладке
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') reload();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [reload]);

  return { rows, loading, reload };
}

// ─────────────────────────────────────────────────────────────
// ADMIN: grantAccess / revokeAccess
// ─────────────────────────────────────────────────────────────

export async function grantAccess({ userId, type, reference }) {
  try {
    await api('/api/admin/grant-access', {
      method: 'POST',
      body: { user_id: userId, type, reference },
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function revokeAccess({ userId, type, reference }) {
  try {
    await api('/api/admin/grant-access', {
      method: 'POST',
      body: { user_id: userId, type, reference, revoke: true },
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ─────────────────────────────────────────────────────────────
// HOOK: useAdminUserAccess
// ─────────────────────────────────────────────────────────────

export function useAdminUserAccess(userId) {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!userId) { setRows([]); return; }
    setLoading(true);
    try {
      const data = await api(`/api/admin/user-access?user_id=${userId}`);
      setRows(data);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { reload(); }, [reload]);
  return { rows, loading, reload };
}

// ─────────────────────────────────────────────────────────────
// HOOK: useUserExams — экзамены текущего пользователя
// ─────────────────────────────────────────────────────────────

export function useUserExams() {
  const [exams,   setExams]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api('/api/user/exams');
      setExams(data);
    } catch (e) {
      setError(e.message);
      setExams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  return { exams, loading, error, reload };
}

// ─────────────────────────────────────────────────────────────
// HOOK: useUserPayments — платежи текущего пользователя
// ─────────────────────────────────────────────────────────────

export function useUserPayments() {
  const [payments, setPayments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api('/api/user/payments');
      setPayments(data);
    } catch (e) {
      setError(e.message);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);
  return { payments, loading, error, reload };
}

// ─────────────────────────────────────────────────────────────
// HOOK: useKnowledge
// ─────────────────────────────────────────────────────────────

export function useKnowledge({ adminMode = false } = {}) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const url  = adminMode ? '/api/knowledge?admin=1' : '/api/knowledge';
      const data = await api(url);
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [adminMode]);

  useEffect(() => { reload(); }, [reload]);

  const saveItem = useCallback(async (item) => {
    setSaving(true);
    try {
      const body = {
        title:          item.title,
        subtitle:       item.subtitle || '',
        content:        item.content  || '',
        sort_order:     item.sort_order ?? 0,
        is_published:   item.is_published ?? false,
        tag:            item.tag            || null,
        video_provider: item.video_provider || null,
        video_id:       item.video_id       || null,
        video_status:   item.video_status   || 'none',
      };

      if (item.id) {
        const { item: updated } = await api(`/api/knowledge/${item.id}`, { method: 'PUT', body });
        setItems(prev => prev.map(i => i.id === item.id ? updated : i));
      } else {
        const { item: created } = await api('/api/knowledge', { method: 'POST', body });
        setItems(prev => [...prev, created]);
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteItem = useCallback(async (id) => {
    try {
      await api(`/api/knowledge/${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.id !== id));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }, []);

  return { items, loading, saving, reload, saveItem, deleteItem };
}
