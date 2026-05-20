# Online Dojo — Дайто-рю Айкидзюдзюцу

Образовательная платформа для изучения Дайто-рю Айкидзюдзюцу.

## Стек

- **Next.js 14** (App Router)
- **React 18**
- Без CSS-фреймворков — только inline styles

## Запуск локально

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

## Деплой

### Vercel (рекомендуется)
```bash
npx vercel
```

### Другой сервер
```bash
npm run build
npm start
```

## Структура проекта

```
src/
  app/
    layout.js          # Root layout с шрифтами
    page.js            # Главная страница (дашборд)
    globals.css        # Глобальные стили
  components/
    Dashboard.jsx      # Дашборд с сайдбаром
    IkkajoPage.jsx     # База техник — Иккаджо
    TechniquePage.jsx  # Страница техники с видео
    MonthPage.jsx      # Страница месяца с уроками
    LessonPage.jsx     # Страница урока с комментариями
    Sidebar.jsx        # Сайдбар навигации
    SearchBar.jsx      # Поиск по техникам
  data/
    users.js           # Данные пользователя
    levels.js          # Уровни кю/дан
    techniques.js      # База техник и видео
    months.js          # Уроки по месяцам
    exams.js           # История экзаменов
  lib/
    utils.js           # Вспомогательные функции
```

## Следующие шаги

- [ ] Подключить Supabase (база данных + авторизация)
- [ ] Загрузка видео через Supabase Storage или Mux
- [ ] Платёжная система (ЮKassa или Stripe)
- [ ] Система ролей (ученик / сэнсэй / admin)
- [ ] Email-уведомления
