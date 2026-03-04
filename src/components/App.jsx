'use client';

import { useState, useEffect } from 'react';
import AuthPage from './AuthPage';
import Dashboard from './Dashboard';
import IkkajoPage from './IkkajoPage';
import TechniquePage from './TechniquePage';
import MonthPage from './MonthPage';
import LessonPage from './LessonPage';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Восстанавливаем сессию при перезагрузке страницы
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          setCurrentUser(profile || { id: session.user.id, email: session.user.email, name: session.user.email.split('@')[0] });
        }
        setAuthLoading(false);
      });

      // Слушаем изменения сессии (логин/логаут)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setCurrentUser(null);
        }
      });
      return () => subscription.unsubscribe();
    });
  }, []);
  const [route,    setRoute]    = useState({ page: 'dashboard' });
  const [watched,  setWatched]  = useState({});
  const [comments, setComments] = useState({});

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
    const name = currentUser?.name || 'Ученик';
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

  if (authLoading) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f5f3ee', fontFamily:"'Jost',sans-serif", color:'#999', fontSize:13 }}>
        Загрузка…
      </div>
    );
  }

  if (!currentUser) {
    return <AuthPage onSuccess={(userData) => setCurrentUser(userData)} />;
  }

  return (
    <>
      {route.page === 'dashboard' && (
        <Dashboard nav={nav} watched={watched} user={currentUser} onLogout={async () => { const { supabase } = await import('@/lib/supabase'); await supabase.auth.signOut(); setCurrentUser(null); }} />
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
