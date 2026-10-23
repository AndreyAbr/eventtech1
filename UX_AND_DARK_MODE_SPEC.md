# UX Polish, Visual Bugfixes & Dark Mode Spec (Linear / Vercel Dark Theme)

Выполнить исправление визуальных и грамматических ошибок, выявленных на скриншотах, улучшить UX взаимодействия и внедрить полноценную поддержку Темной темы (Dark Mode) во все компоненты `EventTech Hub`.

---

## 1. Архитектура Темной темы (`tailwind.config.js`, `src/context/EventContext.tsx`, `src/index.css`)

1. **`tailwind.config.js`**:
   * Включить классовую стратегию темной темы: `darkMode: 'class'`.
2. **`src/context/EventContext.tsx`**:
   * Добавить состояние `theme: 'light' | 'dark'` (с сохранением в `localStorage` под ключом `eventtech_theme`, по умолчанию `'light'`).
   * Добавить метод `toggleTheme: () => void`.
   * В `useEffect` при изменении `theme` синхронно добавлять/удалять класс `'dark'` на `document.documentElement` (`<html>`).
3. **Глобальные переменные и классы в `src/index.css`**:
   Обновить базовые утилитарные классы так, чтобы они автоматически адаптировались к `dark:` без дублирования сотен классов в каждом месте:
   * `body`: `bg-[#FAFAFA] text-zinc-900 dark:bg-[#09090B] dark:text-zinc-100 transition-colors duration-150`
   * `.card-surface`: `bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800/90 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] dark:shadow-none`
   * `.btn-primary`: `inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs font-medium transition-colors cursor-pointer`
   * `.btn-secondary`: `inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-xs font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer`
   * `.input-base`: `h-8 px-2.5 rounded-md bg-white dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-400 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-400 transition-colors`

---

## 2. Исправление 5 визуальных и логических багов со скриншота

1. **Исправить перенос даты `6 ноя 2026` на 3 строки в `src/components/layout/Topbar.tsx`**:
   * Контейнеру правого блока и кнопке даты задать `whitespace-nowrap shrink-0`.
   * В хлебных крошках кнопке названия активного мероприятия задать `max-w-[180px] lg:max-w-[260px] truncate`, чтобы длинное название «ТехноИмпульс 2026: Всероссийский ИТ-Форум и Хакатон» никогда не сжимало дату и прогресс-бар.
   * Добавить в правую часть `Topbar.tsx` (рядом с переключателем ролей и кнопкой «Сбросить демо») аккуратную кнопку переключения темы (`Sun` / `Moon` из `lucide-react`, размер `w-4 h-4`, класс `.btn-secondary w-8 px-0`) с тултипом «Переключить тему (Светлая / Темная)».

2. **Исправить логику подсветки просроченных задач (`src/utils/analytics.ts` и `src/components/views/DashboardView.tsx`)**:
   * В `src/utils/analytics.ts` создать и экспортировать функцию `isTaskOverdue(task: TaskItem, completedStageIds?: string[]): boolean`:
     * Задача считается завершенной, если `task.status === 'done'` или `completedStageIds?.includes(task.status)`.
     * Если задача НЕ завершена и `task.deadline < todayStr` (сравнение строк `YYYY-MM-DD`), функция возвращает `true`.
   * В ` seedData.ts` убедиться, что у задач `evt-1` даты дедлайнов консистентны: ровно 3 просроченные задачи (с датами в прошлом относительно текущей даты) и 5 предстоящих/выполненных задач (с датами в будущем), чтобы в блоке «Требуют внимания» не было задач с датой `13 окт` или `18 окт` без красного бейджа просрочки.
   * На `DashboardView.tsx` в виджете «Требуют внимания» сортировать незавершенные задачи так: сначала просроченные (с красным бейджем даты `bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60`), затем ближайшие по дедлайну.

3. **Исправить грамматику числительных (`pluralizeRu`)**:
   * В `src/utils/analytics.ts` добавить функцию:
     ```typescript
     export function pluralizeRu(count: number, words: [string, string, string]): string {
       const abs = Math.abs(count) % 100;
       const n1 = abs % 10;
       if (abs > 10 && abs < 20) return words[2];
       if (n1 > 1 && n1 < 5) return words[1];
       if (n1 === 1) return words[0];
       return words[2];
     }
     ```
   * Применить `pluralizeRu` во всех местах:
     * На Дашборде в блоке NPS: `4 ответа` (вместо `4 ответов`).
     * В красном баннере: `Обнаружено ${count} ${pluralizeRu(count, ['просроченная задача', 'просроченные задачи', 'просроченных задач'])}`.
     * В таблицах и счетчиках: `6 статей`, `11 задач`, `12 участников`.

4. **Восстановить демонстрацию перерасхода бюджета в `src/data/seedData.ts`**:
   * В `seedData.ts` для `evt-1` выставить по статье «Аренда площадки» `plannedAmount: 800000, actualAmount: 800000`, а по статье «Кейтеринг» `plannedAmount: 450000, actualAmount: 620000`.
   * Проверить, что сумма `actualAmount` всех 6 статей `evt-1` равна `2 600 000 ₽` (при лимите `2 500 000 ₽`), чтобы на Дашборде и в Смете сразу горел перерасход `+100 000 ₽`.
   * Обновить ключ стора в `EventContext.tsx` на `eventtech_store_v4`.

5. **Адаптация логотипа `logo.png` для темной темы (`Sidebar.tsx`)**:
   * Обернуть `<img src="/logo.png" ... />` в сайдбаре в аккуратную капсулу `bg-white dark:bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200/60 dark:border-zinc-700` либо применить фильтр, чтобы темно-синие буквы `Event` идеально читались и в светлой, и в темной теме.

---

## 3. Улучшения UX и Темная тема по всем 8 экранам

Проверить и адаптировать цвета поверхностей, текста, таблиц и модальных окон для `dark:` режима во всех компонентах:

1. **`Sidebar.tsx` & `Topbar.tsx`**:
   * Сайдбар: `bg-[#F4F4F5] dark:bg-[#0C0C0E] border-r border-zinc-200 dark:border-zinc-800/80`.
   * Активный пункт меню: `bg-zinc-200/80 dark:bg-zinc-800/90 text-zinc-900 dark:text-zinc-100`.
   * Топбар: `bg-white dark:bg-[#0C0C0E] border-b border-zinc-200 dark:border-zinc-800/80`.
2. **`DashboardView.tsx`**:
   * Верхняя метрик-панель: `bg-white dark:bg-[#121215] border-zinc-200 dark:border-zinc-800 divide-zinc-200 dark:divide-zinc-800`.
   * Полосы прогресса сметы: трек `bg-zinc-100 dark:bg-zinc-800`, заполнение `bg-zinc-900 dark:bg-zinc-100` (а при перерасходе >100% — `bg-red-600 dark:bg-red-500`).
   * Чекбоксы задач в блоке «Требуют внимания»: сделать интерактивными — клик по чекбоксу сразу отмечает задачу выполненной (с перечеркиванием и тост-уведомлением), а клик по тексту задачи открывает эту задачу в разделе «План и задачи».
3. **`TasksView.tsx` (Канбан и Список)**:
   * Колонки канбана: `bg-zinc-100/80 dark:bg-[#16161A] border border-zinc-200/80 dark:border-zinc-800/80`.
   * Карточки задач: `bg-white dark:bg-[#1E1E24] border-zinc-200 dark:border-zinc-700/80 hover:border-zinc-300 dark:hover:border-zinc-600`.
   * Добавить возможность открыть боковую панель/модалку задачи просто по клику на карточку задачи (не только по мелкой кнопке комментариев), чтобы удобно читать описание, менять дедлайн, исполнителя и писать комментарии.
4. **`BudgetView.tsx`, `GuestsView.tsx`, `TeamContractorsView.tsx`, `CalendarView.tsx`, `AiAssistantView.tsx`, `EventSettingsView.tsx`**:
   * Шапки таблиц `thead`: `bg-zinc-50/80 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400`.
   * Строки таблиц `tbody`: `divide-zinc-200/80 dark:divide-zinc-800/70 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40`.
   * Подвал таблицы `tfoot`: `bg-zinc-50/90 dark:bg-zinc-900/80 border-t border-zinc-200 dark:border-zinc-800`.
   * Все модальные окна: `bg-white dark:bg-[#141418] border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100`.
   * На **Электронном билете участника** (`GuestsView.tsx`) блок самого SVG QR-кода всегда оставлять на белой подложке (`bg-white p-3 rounded-md border border-zinc-200`), чтобы сканеры камер считывали контрастный QR-код даже при включенной темной теме.

---

## 4. Strict Execution Rules

1. Никаких сокращений кода (`// ...`) — выводить полные версии изменяемых файлов.
2. После внесения изменений выполнить `npm run build` и убедиться в отсутствии ошибок компиляции TypeScript и Vite (код `0`).