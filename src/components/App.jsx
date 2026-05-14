'use client';

import { useState, useEffect } from 'react';
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
 * Это значит:
 *   - при refresh сервер уже знает пользователя → нет flash login-страницы
 *   - при browser back браузер получает SSR-HTML с правильным состоянием
 *   - authChecked = true сразу (не нужно ждать JS-fetch)
 *
 * После монтирования делаем лёгкую клиентскую ревалидацию (один fetch):
 *   - обновляем профиль, если сервер вернул устаревшие данные
 *   - логаут если токен истёк с момента SSR
 *   - НЕ блокируем рендер этим запросом
 */
export default function App({ initialUser = null }) {
  // Сервер уже проверил cookie → стартуем с готовым пользователем
  const [currentUser, setCurrentUser] = useState(initialUser);

  // authChecked = true сразу: сервер выполнил проверку.
  // Нет фазы "пустого экрана" при refresh.
  const [authChecked] = useState(true);

  const [route,    setRoute]    = useState({ page: 'dashboard' });
  const [watched,  setWatched]  = useState({});
  const [comments, setComments] = useState(INITIAL_COMMENTS);

  // PWA service worker
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Клиентская ревалидация сессии.
  // Цель: поймать случаи, когда токен истёк с момента SSR,
  // или синхронизировать обновлённый профиль пользователя.
  // НЕ блокирует рендер — пользователь уже видит контент.
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user) {
          // Обновляем профиль свежими данными из БД
          setCurrentUser(data.user);
        } else if (initialUser) {
          // Токен истёк с момента SSR — выходим
          setCurrentUser(null);
        }
        // Если initialUser = null и data = null → уже показываем AuthPage, ничего не меняем
      })
      .catch(() => {
        // Сетевая ошибка — сохраняем текущее состояние (не разлогиниваем)
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    setCurrentUser(null);
  };

  const nav = {
    dashboard:     ()                   => setRoute({ page: 'dashboard' }),
    ikkajo:        ()                   => setRoute({ page: 'ikkajo' }),
    technique:     (kyu, section, tech) => setRoute({ page: 'technique', kyu, section, tech }),
    month:         (monthId)            => setRoute({ page: 'month', monthId }),
    lesson:        (monthId, lessonId)  => setRoute({ page: 'lesson', monthId, lessonId }),
    knowledge:     ()                   => setRoute({ page: 'knowledge' }),
    knowledgeItem: (itemId)             => setRoute({ page: 'knowledge_item', itemId }),
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

  // authChecked всегда true (сервер уже проверил) — нет пустого экрана
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
          onBack={nav.ikkajo}
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
