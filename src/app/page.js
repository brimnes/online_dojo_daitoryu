/**
 * Корневая страница — Server Component (нет 'use client').
 *
 * Читает cookie dojo_token на сервере при каждом запросе,
 * проверяет JWT и передаёт пользователя в App как initialUser.
 *
 * Это решает ключевую проблему: раньше вся проверка сессии
 * происходила в клиентском useEffect (после загрузки JS),
 * что приводило к:
 *   - вылету из аккаунта при refresh
 *   - миганию пустой страницы перед авторизацией
 *   - ненадёжному восстановлению сессии
 *
 * Теперь: сервер читает cookie → проверяет JWT → передаёт
 * готового пользователя в React. Нет JS-задержки, нет flash.
 */

import { cookies } from 'next/headers';
import { getUserFromToken } from '@/lib/auth-server';
import App from '@/components/App';

export default async function Home() {
  let initialUser = null;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('dojo_token')?.value;
    if (token) {
      initialUser = await getUserFromToken(token);
    }
  } catch {
    // Ошибка при проверке токена — рендерим как неаутентифицированного
    // (App покажет форму входа)
  }

  return <App initialUser={initialUser} />;
}
