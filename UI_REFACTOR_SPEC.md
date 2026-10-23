# UI Refactoring Spec: Перевод EventTech Hub на дизайн-систему уровня Linear / Vercel

Выполнить полный редизайн пользовательского интерфейса приложения `EventTech Hub`. Цель — полностью устранить визуальные паттерны «ИИ-генерации» (индиго/фиолетовые градиенты, глассморфизм, крупные скругления `rounded-2xl`, декоративные цветные подложки под иконками, раздутые отступы) и перевести интерфейс на строгую, плотную, утилитарную B2B дизайн-систему в стиле Linear, Vercel и Stripe Dashboard. Бизнес-логику, контракты данных (`src/types/event.ts`), контекст (`src/context/EventContext.tsx`) и утилиты (`src/utils/*`) оставить без изменений.

---

## 1. Design System & Visual Rules (Strict Enforcement)

Агент обязан применить следующие правила ко всем файлам в `src/components/**` и `src/App.tsx`:

1. **Цветовая палитра (Monochrome Zinc + Semantic Status)**:
   * **Фон приложения**: `#FAFAFA` (`bg-[#FAFAFA]`).
   * **Поверхности (карточки, таблицы, сайдбар, модалки)**: чистый белый `#FFFFFF` (`bg-white`).
   * **Границы и разделители**: `border-zinc-200` (`#E4E4E7`), разделители строк `divide-zinc-200/80`. Никаких теней кроме `shadow-sm` или `shadow-[0_1px_2px_rgba(0,0,0,0.04)]`.
   * **Текст**: основной `text-zinc-900` (`#18181B`), вторичный `text-zinc-600`, приглушенный/лейблы `text-zinc-500`.
   * **Primary Action (Главные кнопки и активные состояния)**: глубокий графитовый `bg-zinc-900 hover:bg-zinc-800 text-white`.
   * **Акцентный цвет (точечно для ссылок и фокуса)**: сдержанный синий `blue-600` (`#2563EB`), кольцо фокуса `focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900`.
   * **Статусы (тонкие бейджи с точкой-индикатором `w-1.5 h-1.5 rounded-full`)**:
     * Успех / Готово / В бюджете: `bg-emerald-50 text-emerald-700 border border-emerald-200/70` (точка `bg-emerald-500`).
     * В работе / Внимание: `bg-amber-50 text-amber-700 border border-amber-200/70` (точка `bg-amber-500`).
     * Просрочено / Перерасход / Критично: `bg-red-50 text-red-700 border border-red-200/70` (точка `bg-red-500`).
     * Нейтрально / Черновик: `bg-zinc-100 text-zinc-700 border border-zinc-200` (точка `bg-zinc-400`).

2. **Геометрия, плотность и размеры**:
   * **Запрещены классы**: `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `backdrop-blur-*`, `bg-gradient-*`, `from-*`, `via-*`, `to-*`, `shadow-lg`, `shadow-xl`, `shadow-2xl`, `scale-*`.
   * **Скругления**: карточки и панели — `rounded-lg` (`8px`), кнопки, инпуты и селекты — `rounded-md` (`6px`), бейджи и теги — `rounded` (`4px`).
   * **Высота контролов**: стандартные кнопки и поля ввода — строго `h-8` (`32px`, `text-xs font-medium`) или `h-9` (`36px`, `text-sm font-medium`).
   * **Внутренние отступы**: карточки `p-4` (максимум `p-5`), ячейки таблиц `px-3.5 py-2.5 text-sm`.

3. **Типографика**:
   * Подключить шрифт `Inter` (400, 500, 600) для UI и `JetBrains Mono` (400, 500) для всех денежных сумм, процентов, дат, таймингов и токенов билетов.
   * На всех числовых показателях обязательно использовать класс `tabular-nums` и `font-mono` (или `tracking-tight`).
   * Заголовки разделов: `text-lg font-semibold text-zinc-900 tracking-tight` (без капса и эмодзи).

---

## 2. Target Files to Modify

Модифицировать строго следующие файлы:

```text
eventtech-hub/
├── index.html
├── tailwind.config.js
├── src/
│   ├── index.css
│   ├── App.tsx
│   └── components/
│       ├── layout/
│       │   ├── Sidebar.tsx
│       │   └── Topbar.tsx
│       └── views/
│           ├── DashboardView.tsx
│           ├── EventSettingsView.tsx
│           ├── TasksView.tsx
│           ├── BudgetView.tsx
│           ├── GuestsView.tsx
│           ├── TeamContractorsView.tsx
│           ├── CalendarView.tsx
│           └── AiAssistantView.tsx

3. Step-by-Step Implementation Plan
Phase 1: Типографика и глобальные утилиты (index.html, tailwind.config.js, src/index.css)

    В index.html заменить Google Fonts на Inter:wght@400;500;600;700 и JetBrains+Mono:wght@400;500. Задать body классы bg-[#FAFAFA] text-zinc-900 antialiased selection:bg-zinc-900 selection:text-white.

    В tailwind.config.js прописать fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] }.

    В src/index.css добавить лаконичные компонентные классы:

        .btn-primary: inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50

        .btn-secondary: inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md bg-white text-zinc-700 border border-zinc-200 text-xs font-medium hover:bg-zinc-50 hover:text-zinc-900 transition-colors

        .input-base: h-8 px-2.5 rounded-md bg-white border border-zinc-200 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-colors

        .card-surface: bg-white border border-zinc-200 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)]

Phase 2: Каркас приложения (Sidebar.tsx, Topbar.tsx, App.tsx)

    Sidebar.tsx:

        Ширина w-60 (240px), фон bg-[#F4F4F5]/70 с правой границей border-r border-zinc-200. Никаких темных градиентных фонов.

        Верхний блок: компактный переключатель мероприятия (выпадающий список в стиле Vercel Project Switcher с рамкой border-zinc-200 bg-white rounded-md p-1.5 text-xs font-medium) и строгая иконка-кнопка + для создания нового мероприятия.

        Пункты меню: высота h-8 px-2.5 rounded-md text-[13px] font-medium flex items-center justify-between.

            Активный пункт: bg-zinc-200/70 text-zinc-900 font-medium.

            Неактивный пункт: text-zinc-600 hover:bg-zinc-200/40 hover:text-zinc-900.

            Иконки lucide-react строго размера w-4 h-4 text-zinc-500 (у активного пункта text-zinc-900), без цветных квадратиков вокруг иконок.

            Счетчики (просроченные задачи / перерасход): компактный моноширинный пилл px-1.5 py-0.5 text-[11px] font-mono rounded bg-red-100 text-red-700.

    Topbar.tsx:

        Высота h-12 (48px), bg-white border-b border-zinc-200 px-6 flex items-center justify-between.

        Слева: хлебные крошки в стиле Мероприятия / [Название ивента] / [Текущая вкладка], рядом компактный статус-бейдж типа ивента и даты (font-mono text-xs text-zinc-500).

        Справа:

            Тонкий линейный индикатор готовности: текст Готовность 42% (font-mono text-xs) + полоска w-20 h-1.5 bg-zinc-100 rounded-full overflow-hidden со сплошной заливкой bg-zinc-900.

            Сегментированный переключатель роли (Админ | Команда | Гость) в рамке bg-zinc-100 p-0.5 rounded-md border border-zinc-200/60, активная вкладка bg-white text-zinc-900 shadow-sm rounded px-2 py-0.5 text-xs font-medium.

            Кнопка «Сбросить демо» в стиле .btn-secondary.

    Уведомления (Тосты):

        Строгие компактные плашки в правом нижнем углу: bg-zinc-900 text-white text-xs px-3.5 py-2.5 rounded-md shadow-md border border-zinc-800 flex items-center gap-2.

Phase 3: Переработка экранов (src/components/views/*)

    DashboardView.tsx:

        Вместо 4 отдельных «пухлых» карточек сделать единую горизонтальную метрик-панель в стиле Stripe/Vercel: grid grid-cols-1 md:grid-cols-4 bg-white border border-zinc-200 rounded-lg divide-y md:divide-y-0 md:divide-x divide-zinc-200.

        В каждой секции (p-4): сверху мелкий заголовок text-xs font-medium text-zinc-500, под ним крупное число text-2xl font-semibold text-zinc-900 font-mono tabular-nums mt-1, снизу строка контекста text-xs text-zinc-500 mt-1.5 (например, 2 просрочено красным текстом text-red-600 font-medium или Лимит: 2 500 000 ₽). Никаких круглых цветных иконок!

        Если есть перерасход бюджета или просроченные задачи — узкий технический баннер высотой в одну строку: bg-red-50/80 border border-red-200 rounded-md px-3.5 py-2 text-xs text-red-800 flex items-center justify-between.

        Нижняя часть: двухколоночная сетка (grid-cols-1 lg:grid-cols-3 gap-5):

            Слева (2 колонки): таблица «Требуют внимания (Дедлайны и задачи)» с тонкими строками divide-y divide-zinc-200, моноширинными датами и быстрым чекбоксом завершения.

            Справа (1 колонка): «Исполнение сметы по статьям» — список категорий с суммами Факт / План моноширинным шрифтом и тонкими 4px прогресс-барами (bg-zinc-900, а при превышении — bg-red-600).

    TasksView.tsx (Канбан в стиле Linear):

        Верхний тулбар: компактный поиск, селекты фильтрации (h-8 text-xs), переключатель вида Доска / Список и кнопка + Новая задача (.btn-primary).

        Канбан-колонки: фон колонки bg-zinc-100/70 border border-zinc-200/80 rounded-lg p-2.5. Шапка колонки: точка статуса + название (text-xs font-semibold text-zinc-700) + количество задач (font-mono text-xs text-zinc-400).

        Карточка задачи (bg-white border border-zinc-200 rounded-md p-3 hover:border-zinc-300 transition-colors):

            Верхняя строка: ID задачи (font-mono text-[11px] text-zinc-400, например TSK-01) и лаконичный текстовый индикатор приоритета.

            Заголовок задачи: text-sm font-medium text-zinc-900 mt-1 leading-snug.

            Нижняя строка: инициал+имя ответственного (text-xs text-zinc-600), счетчик комментариев и дата дедлайна (font-mono text-[11px]). Если просрочено — дата выводится на плашке bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded.

    BudgetView.tsx (Финансовая таблица):

        Верхняя сводная полоса на 4 ячейки (Лимит бюджета, Плановая смета, Фактический расход, Отклонение / Остаток) с моноширинными суммами font-mono text-xl font-semibold.

        Основная область: плотная бухгалтерская таблица (w-full text-left border-collapse) внутри .card-surface.

        Заголовки таблицы: bg-zinc-50/80 border-b border-zinc-200 text-[11px] font-medium text-zinc-500 uppercase tracking-wider py-2 px-3.5.

        Числовые колонки (План, ₽, Факт, ₽, Разница) выровнены строго по правому краю (text-right font-mono tabular-nums). Инлайн-редактирование фактического расхода через аккуратный компактный инпут w-28 text-right font-mono h-7 px-2 border border-zinc-200 rounded.

    GuestsView.tsx (Реестр, билет и чек-ин):

        Вкладка «Список участников»: плотная таблица с поиском, фильтрами и экспортом CSV. Токен QR-кода отображается тегом font-mono text-xs bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-700.

        Электронный билет (превью и публичный вид гостя): оформить как реальный посадочный талон / бейдж конференции (border border-zinc-300 bg-white rounded-lg max-w-md mx-auto overflow-hidden) с перфорацией (border-t border-dashed border-zinc-300), четкой типографикой, моноширинным кодом билета и чистым QRCodeSVG без пестрых фонов.

    TeamContractorsView.tsx и CalendarView.tsx:

        Перевести карточки оргкомитета и подрядчиков на плотную табличную или компактную карточную верстку (rounded-lg border-zinc-200 p-3.5) с моноширинными суммами договоров и строгими селектами смены статуса (negotiation -> contracted -> paid -> completed).

        В календаре сделать четкую сетку border-t border-l border-zinc-200 (каждая ячейка border-r border-b border-zinc-200 bg-white min-h-[96px] p-1.5), события отображать узкими полосками text-[11px] px-1.5 py-0.5 rounded truncate font-medium.

    AiAssistantView.tsx (Инженерный вид вместо «магического ИИ»):

        Убрать любые упоминания «магии», звездных градиентов и фиолетовых свечений. Оформить раздел как «Автоматизация и аудит проекта (Ассистент планирования)».

        Четыре строгие рабочие вкладки или секции в .card-surface:

            Генерация базового плана работ (таблица предлагаемых задач с чекбоксами и кнопкой .btn-primary «Импортировать задачи в план»).

            Расчет сметы по нормативам (таблица категорий с процентами и суммами в ₽ + кнопка «Заполнить смету»).

            Диагностика рисков и узких мест (строгий список проверок со статусами Критично / Предупреждение / Норма).

            Генератор тайминга площадки (хронологическая таблица Время | Блок | Описание).

4. Strict Execution Rules (3.8 Flash Guardrails)

    Zero Placeholders: Выводить полный, 100% рабочий код каждого изменяемого файла. Запрещены сокращения // ... existing code или // TODO.

    Preserve Functionality: Все существующие функции (addEvent, updateEvent, addTask, updateTaskStatus, addComment, addBudgetItem, updateBudgetActual, registerGuest, updateGuestStatus, exportGuestsToCSV, exportBudgetToCSV, generateEventBlueprint, resetDemoData) и переключение ролей должны работать безотказно.

    Build Verification: После внесения изменений обязательно выполнить npm run build и убедиться в отсутствии ошибок TypeScript и CSS.