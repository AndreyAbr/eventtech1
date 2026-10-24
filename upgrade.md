# Spec: Настоящая БД SQLite (`data/eventtech.db`), Строгий экран входа (Zero AI-Slop) и Профили Разработчиков-Админов

Выполнить три критических изменения:
1. Полностью переписать главный экран входа `AuthLandingView.tsx` — убрать весь «AI-slop» (градиентные полоски, свечения, звездочки `Sparkles`, 4 рекламные карточки с цветными иконками, гигантский рекламный текст).
2. Обновить состав пользователей: сделать администраторами системы разработчиков проекта (**Андрей Абрамов**, **Данил Сивцев**, **Дмитрий Жирохов**), а остальных пользователей сделать обычными участниками команды и гостями.
3. Заменить `localStorage` на настоящую серверную базу данных **SQLite** (`data/eventtech.db` через `better-sqlite3`) с REST API middleware внутри `vite.config.ts`.

---

## 1. Настоящая база данных SQLite + REST API (`package.json`, `vite.config.ts`, `src/server/db.ts`)

1. Установить пакет `better-sqlite3` и `@types/better-sqlite3` (`npm install better-sqlite3 && npm install -D @types/better-sqlite3`).
2. Создать серверный модуль БД `src/server/db.ts`, который автоматически создает папку `data/` и файл базы данных **`data/eventtech.db`** (в режиме `WAL` для высокой скорости) со следующими SQL-таблицами:
   * `users` (`id TEXT PRIMARY KEY, name TEXT, email TEXT, role TEXT, position TEXT, phone TEXT, avatarInitials TEXT, createdAt TEXT, isSystemDefault INTEGER`)
   * `events` (`id TEXT PRIMARY KEY, data TEXT NOT NULL`)
   * `kanban_stages` (`id TEXT PRIMARY KEY, eventId TEXT, data TEXT NOT NULL`)
   * `tasks` (`id TEXT PRIMARY KEY, eventId TEXT, data TEXT NOT NULL`)
   * `budget_items` (`id TEXT PRIMARY KEY, eventId TEXT, data TEXT NOT NULL`)
   * `guests` (`id TEXT PRIMARY KEY, eventId TEXT, data TEXT NOT NULL`)
   * `contractors` (`id TEXT PRIMARY KEY, eventId TEXT, data TEXT NOT NULL`)
   * `team_members` (`id TEXT PRIMARY KEY, eventId TEXT, data TEXT NOT NULL`)
   * `feedbacks` (`id TEXT PRIMARY KEY, eventId TEXT, data TEXT NOT NULL`)
   * `mailings` (`id TEXT PRIMARY KEY, eventId TEXT, data TEXT NOT NULL`)
3. При первом запуске (если таблица `users` пуста) автоматически заполнять `data/eventtech.db` начальными данными из `src/data/seedData.ts`.
4. В `vite.config.ts` написать компактный Vite-плагин `sqliteApiPlugin()`, который обрабатывает HTTP-запросы на `/api/*`:
   * `GET /api/state` — читает все таблицы из `data/eventtech.db` и возвращает полный стейт + метаданные БД (`dbEngine: 'SQLite 3 (WAL)', dbFile: 'data/eventtech.db', dbSizeKB: number`).
   * `POST /api/sync` — сохраняет обновленное состояние сущностей в транзакции SQLite в `data/eventtech.db`.
   * `POST /api/reset` — очищает таблицы и заново засевает `data/eventtech.db` эталонными данными из `seedData.ts`.
5. В `src/context/EventContext.tsx`:
   * При загрузке приложения запрашивать данные из `GET /api/state` (с fallback на `seedData`, если открыта статическая сборка).
   * При любых изменениях стейта синхронизировать их с SQLite через `POST /api/sync`.
   * В футере `Sidebar.tsx` и в `AdminSystemView.tsx` вместо `LocalStorage` выводить реальный статус: **`SQLite DB (data/eventtech.db)`**.

---

## 2. Обновление списка пользователей: Разработчики = Админы (`src/data/seedData.ts`)

В `src/data/seedData.ts` (и в БД при инициализации) задать следующий список профилей `initialUsers`:

### Администраторы системы (Разработчики):
1. **Андрей Абрамов**
   * `id`: `'usr-admin-1'`
   * `email`: `'a.abramov@eventtech.ru'`
   * `role`: `'organizer'` (Админ)
   * `position`: `'Lead Developer / Архитектор системы'`
   * `avatarInitials`: `'АА'`
   * `isSystemDefault`: `true`
2. **Данил Сивцев**
   * `id`: `'usr-admin-2'`
   * `email`: `'d.sivtsev@eventtech.ru'`
   * `role`: `'organizer'` (Админ)
   * `position`: `'Core Developer / Системный администратор'`
   * `avatarInitials`: `'ДС'`
   * `isSystemDefault`: `true`
3. **Дмитрий Жирохов**
   * `id`: `'usr-admin-3'`
   * `email`: `'d.zhirokhov@eventtech.ru'`
   * `role`: `'organizer'` (Админ)
   * `position`: `'Product & UI Developer / Администратор'`
   * `avatarInitials`: `'ДЖ'`
   * `isSystemDefault`: `true`

### Обычные пользователи (Команда и Гости):
4. **Алексей Морозов** (`id: 'usr-team-1'`, `email: 'a.morozov@eventtech.ru'`, `role: 'team'`, `position: 'Координатор площадки'`, `avatarInitials: 'АМ'`)
5. **Ирина Соколова** (`id: 'usr-team-2'`, `email: 'i.sokolova@eventtech.ru'`, `role: 'team'`, `position: 'Технический специалист'`, `avatarInitials: 'ИС'`)
6. **Анна Волкова** (`id: 'usr-team-3'`, `email: 'a.volkova@eventtech.ru'`, `role: 'team'`, `position: 'PR и работа со спикерами'`, `avatarInitials: 'АВ'`)
7. **Максим Белов** (`id: 'usr-guest-1'`, `email: 'm.belov@techcorp.ru'`, `role: 'guest'`, `position: 'Участник хакатона (VIP Гость)'`, `avatarInitials: 'МБ'`)

Также добавить Андрея Абрамова, Данила Сивцева и Дмитрия Жирохова в оргкомитет (`initialTeam`) и задачи, чтобы их имена фигурировали в проекте.

---

## 3. Полный редизайн экрана входа `src/components/auth/AuthLandingView.tsx` (Строгий Linear/Vercel стиль, БЕЗ AI-Slop)

Категорически запрещено использовать на экране входа:
* Градиентные полоски (`bg-gradient-to-r from-blue-500...`), цветные рамки вокруг карточек (`border-blue-500/30`), тени `shadow-lg`/`shadow-xl`;
* Иконки `Sparkles`, пульсирующие точки `animate-ping` на заголовках и рекламные лозунги «Корпоративная Event OS нового поколения»;
* Двухколоночный маркетинговый лендинг с 4 квадратными карточками фич и разноцветными плашками (`bg-blue-100`, `bg-purple-100`, `bg-amber-100`).

### Как должен выглядеть `AuthLandingView.tsx`:
Строгий, чистый, центрированный рабочий терминал авторизации (`max-w-[460px] mx-auto my-auto`), как в **Linear / Vercel / Raycast**:
1. **Минималистичная верхняя строка**:
   * Слева: логотип `/logo.png` в аккуратной рамке + `Hub` + моноширинный бейдж `Alpha 0.4`.
   * Справа: индикатор БД (`SQLite • Connected`) и кнопка смены темы (`Sun`/`Moon`).
2. **Центральный блок авторизации (`w-full max-w-[460px] mx-auto`)**:
   * Строгий заголовок: `Вход в рабочее пространство` и подзаголовок `Выберите профиль для быстрого входа или авторизуйтесь по Email`.
   * **Переключатель режима** (Segmented Control в 1 линию): `Быстрый вход (Демо)` | `По Email` | `Регистрация`.
   * **На вкладке «Быстрый вход (Демо)»** (открыта по умолчанию):
     * Две четкие компактные группы в виде строгих списков с разделителями `divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-[#121215]`:
       * **Группа 1 — «АДМИНИСТРАТОРЫ (РАЗРАБОТЧИКИ)»**:
         Строки для **Андрея Абрамова**, **Данила Сивцева**, **Дмитрия Жирохова**.
       * **Группа 2 — «КОМАНДА И УЧАСТНИКИ»**:
         Строки для **Алексея Морозова**, **Ирины Соколовой**, **Анны Волковой**, **Максима Белова**.
     * Каждая строка — плотная (`py-2.5 px-3.5`), со строгим монохромным аватаром (`w-7 h-7 rounded bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-mono text-[11px]`), именем, должностью, аккуратным моноширинным бейджем роли (`ADMIN` / `TEAM` / `GUEST`) и стрелкой `→` при наведении.
   * **На вкладке «По Email»**:
     * Чистое поле ввода Email (с подсказкой `a.abramov@eventtech.ru`) и строгая кнопка `Войти в систему` (`.btn-primary w-full h-9`).
   * **На вкладке «Регистрация»**:
     * Компактная форма создания нового пользователя (ФИО, Email, Роль, Должность).
3. **Строгий нижний колонтитул (Footer)**:
   * Слева: `EventTech Hub • Alpha 0.4`
   * Справа: `СУБД: SQLite3 (data/eventtech.db) • Записей: X`

---

## 4. Strict Execution Rules

1. Проверить, что файл базы данных `data/eventtech.db` реально создается на диске и обновляется при действиях в UI (создании задач, смене ролей пользователей, редактировании бюджета).
2. Добавить папку `data/*.db*` в `.gitignore`.
3. Вывести полный рабочий код всех измененных и созданных файлов без сокращений.
4. Проверить сборку `npm run build` (`tsc && vite build`, код возврата `0`).