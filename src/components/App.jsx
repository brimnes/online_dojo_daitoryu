'use client';

import { useState } from 'react';
import AuthPage from './AuthPage';
import Dashboard from './Dashboard';
import IkkajoPage from './IkkajoPage';
import TechniquePage from './TechniquePage';
import MonthPage from './MonthPage';
import LessonPage from './LessonPage';
import { INITIAL_COMMENTS } from '@/data/months';
import { USER } from '@/data/users';

export default function App() {
  // auth: null = не вошёл, object = вошедший пользователь
  const [currentUser, setCurrentUser] = useState(null); // null → показывает AuthPage
  const [route,    setRoute]    = useState({ page: 'dashboard' });
  const [watched,  setWatched]  = useState({});
  const [comments, setComments] = useState(INITIAL_COMMENTS);

  const nav = {
    dashboard: ()                   => setRoute({ page: 'dashboard' }),
    ikkajo:    ()                   => setRoute({ page: 'ikkajo' }),
    technique: (kyu, section, tech) => setRoute({ page: 'technique', kyu, section, tech }),
    month:     (monthId)            => setRoute({ page: 'month', monthId }),
    lesson:    (monthId, lessonId)  => setRoute({ page: 'lesson', monthId, lessonId }),
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

  // Мёрдж mock-USER с данными из формы регистрации/входа
  const user = currentUser ? { ...USER, ...currentUser } : USER;

  // ── Если не авторизован — показываем AuthPage ──
  // TEMP: закомментируй строчку ниже чтобы сразу открывался dashboard без входа
  if (!currentUser) {
    return <AuthPage onSuccess={(userData) => setCurrentUser(userData)} />;
  }

  return (
    <>
      {route.page === 'dashboard' && (
        <Dashboard nav={nav} watched={watched} user={user} onLogout={() => setCurrentUser(null)} />
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
        />
      )}
    </>
  );
}
