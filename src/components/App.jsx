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

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [route,    setRoute]    = useState({ page: 'dashboard' });
  const [watched,  setWatched]  = useState({});
  const [comments, setComments] = useState(INITIAL_COMMENTS);

  // Register PWA service worker once
  useEffect(() => {
    registerServiceWorker();
  }, []);

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

  const user = currentUser ? { ...USER, ...currentUser } : USER;

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
      {route.page === 'knowledge' && (
        <KnowledgePage nav={nav} />
      )}
      {route.page === 'knowledge_item' && (
        <KnowledgeItemPage nav={nav} itemId={route.itemId} />
      )}
    </>
  );
}
