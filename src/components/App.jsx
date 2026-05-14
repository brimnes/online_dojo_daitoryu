'use client';

import { useState, useEffect, useRef } from 'react';
import AuthPage from './AuthPage';
import Dashboard from './Dashboard';
import IkkajoPage from './IkkajoPage';
import TechniquePage from './TechniquePage';
import MonthPage from './MonthPage';
import LessonPage from './LessonPage';
import KnowledgePage from './KnowledgePage';
import KnowledgeItemPage from './KnowledgeItemPage';
import { INITIAL_COMMENTS } from '@/data/months';
import { USER } from '@/data/users';
import { registerServiceWorker } from '@/lib/mobile';

/**
 * App — корневой клиентский компонент.
 *
 * initialUser передаётся из Server Component (page.js),
 * который читает cookie dojo_token на сервере при каждом запросе.
 *
 * Навигация:
 *   - Все переходы «вперёд» (nav.month, nav.lesson и т.д.) пушат текущий
 *     маршрут в navStackRef перед сменой страницы.
 *   - nav.back() / nav.dashboard() — «назад»: поп из стека или корень.
 *   - Кнопка «Назад» браузера/хардварная перехватывается через popstate,
 *     вызывает nav.back() — не выходит из SPA и не сбрасывает авторизацию.
 */
export default function App({ initialUser = null }) {
  // Сервер уже проверил cookie → стартуем с готовым пользователем
  const [currentUser, setCurrentUser] = useState(initialUser);

  // authChecked = true сразу: сервер выполнил проверку.
  const [authChecked] = useState(true);

  const [route,    setRoute]    = useState({ page: 'dashboard' });
  const [watched,  setWatched]  = useState({});
  const [comments, setComments] = useState(INITIAL_COMMENTS);

  // ─── Внутренний nav stack ────────────────────────────────────────
  // Ref (не state) — не вызывает лишних ре-рендеров.
  const navStackRef = useRef([]);

  // route ref нужен для доступа к текущему route внутри замыканий
  // без добавления в зависимости useEffect
  const routeRef = useRef(route);
  useEffect(() => { routeRef.current = route; }, [route]);

  // «Вперёд» — пушит текущий маршрут в стек, потом меняет маршрут
  const navigate = (newRoute) => {
    navStackRef.current.push(routeRef.current);
    setRoute(newRoute);
  };

  // «Назад» — поп из стека или корень (не сбрасывает auth)
  const goBack = () => {
    if (navStackRef.current.length > 0) {
      setRoute(navStackRef.current.pop());
    } else {
      setRoute({ page: 'dashboard' });
    }
  };

  // ─── Перехват браузерной/хардварной кнопки «Назад» ──────────────
  // Пушим фиктивный history-state, чтобы браузерный back
  // вызывал popstate вместо реального перехода назад в истории.
  // В обработчике: не выходим из SPA, вызываем goBack().
  useEffect(() => {
    // goBackRef нужен для стабильной ссылки в popstate без пересоздания
    const goBackRef = { fn: goBack };

    const handlePopState = () => {
      // Сразу возвращаем фиктивное состояние, чтобы следующий «Назад»
      // снова сработал как popstate, а не навигировал по реальной истории.
      window.history.pushState(null, '', window.location.href);
      goBackRef.fn();
    };

    // Начальный push: создаём состояние, которое получит popstate
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── PWA service worker ──────────────────────────────────────────
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // ─── Клиентская ревалидация сессии ──────────────────────────────
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) {
          setCurrentUser(data.user);
        } else if (initialUser) {
          setCurrentUser(null);
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setCurrentUser(null);
  };

  // ─── Публичный nav объект ────────────────────────────────────────
  const nav = {
    // Корень: очищаем стек
    dashboard:     ()                   => { navStackRef.current = []; setRoute({ page: 'dashboard' }); },
    // Вперёд: пушим текущий маршрут в стек
    ikkajo:        ()                   => navigate({ page: 'ikkajo' }),
    technique:     (kyu, section, tech) => navigate({ page: 'technique', kyu, section, tech }),
    month:         (monthId)            => navigate({ page: 'month', monthId }),
    lesson:        (monthId, lessonId)  => navigate({ page: 'lesson', monthId, lessonId }),
    knowledge:     ()                   => navigate({ page: 'knowledge' }),
    knowledgeItem: (itemId)             => navigate({ page: 'knowledge_item', itemId }),
    // Назад: поп из стека (или dashboard если стек пуст)
    back:          ()                   => goBack(),
  };

  const toggleWatched = (id) =>
    setWatched(prev => ({ ...prev, [id]: !prev[id] }));

  const addComment = (lessonId, text) => {
    if (!text.trim()) return;
    const name = currentUser?.name || USER.name;
    setComments(prev => ({
      ...prev,
      [lessonId]: [...(prev[lessonId] || []), {
        id:     Date.now(),
        author: name,
        role:   'student',
        date:   'Только что',
        text,
        avatar: name[0],
      }],
    }));
  };

  if (!authChecked) return null;

  const user = currentUser ? { ...USER, ...currentUser } : USER;

  if (!currentUser) {
    return <AuthPage onSuccess={(userData) => setCurrentUser(userData)} />;
  }

  return (
    <>
      {route.page === 'dashboard' && (
        <Dashboard nav={nav} watched={watched} user={user} onLogout={handleLogout} />
      )}
      {route.page === 'ikkajo' && (
        <IkkajoPage nav={nav} />
      )}
      {route.page === 'technique' && (
        <TechniquePage
          kyu={route.kyu}
          section={route.section}
          tech={route.tech}
          onBack={nav.back}
          viewerId={user.id}
        />
      )}
      {route.page === 'month' && (
        <MonthPage
          nav={nav}
          monthId={route.monthId}
          watched={watched}
          toggleWatched={toggleWatched}
        />
      )}
      {route.page === 'lesson' && (
        <LessonPage
          nav={nav}
          monthId={route.monthId}
          lessonId={route.lessonId}
          watched={watched}
          toggleWatched={toggleWatched}
          comments={comments}
          addComment={addComment}
          viewerId={user.id}
        />
      )}
      {route.page === 'knowledge' && (
        <KnowledgePage nav={nav} />
      )}
      {route.page === 'knowledge_item' && (
        <KnowledgeItemPage nav={nav} itemId={route.itemId} viewerId={user.id} />
      )}
    </>
  );
}
