import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import {
  INITIAL_EVENTS,
  INITIAL_TEAM,
  INITIAL_CONTRACTORS,
  INITIAL_SURVEYS,
  INITIAL_KANBAN_STAGES,
  INITIAL_TASKS,
  INITIAL_BUDGET,
  INITIAL_GUESTS,
  INITIAL_BROADCASTS,
  INITIAL_USERS
} from '../data/seedData';
import {
  UserProfile,
  SysConfigItem,
  SysCatalogItem,
  AuditLogEntry,
  TableStat,
  SqlExecutionResult
} from '../types/event';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const DB_FILE_PATH = path.join(DATA_DIR, 'eventtech.db');

export const db: Database.Database = new Database(DB_FILE_PATH);
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL,
    position TEXT NOT NULL,
    phone TEXT,
    avatarInitials TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    isSystemDefault INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS kanban_stages (
    id TEXT PRIMARY KEY,
    eventId TEXT NOT NULL,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    eventId TEXT NOT NULL,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS budget_items (
    id TEXT PRIMARY KEY,
    eventId TEXT NOT NULL,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS guests (
    id TEXT PRIMARY KEY,
    eventId TEXT NOT NULL,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS contractors (
    id TEXT PRIMARY KEY,
    eventId TEXT NOT NULL,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    eventId TEXT NOT NULL,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS feedbacks (
    id TEXT PRIMARY KEY,
    eventId TEXT NOT NULL,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS mailings (
    id TEXT PRIMARY KEY,
    eventId TEXT NOT NULL,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sys_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    label TEXT NOT NULL,
    type TEXT NOT NULL,
    groupName TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sys_catalogs (
    id TEXT PRIMARY KEY,
    catalogType TEXT NOT NULL,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    sortOrder INTEGER NOT NULL DEFAULT 0,
    isProtected INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    userName TEXT NOT NULL,
    userRole TEXT NOT NULL,
    action TEXT NOT NULL,
    metadataObject TEXT NOT NULL,
    details TEXT NOT NULL
  );
`);

export const DEFAULT_SYS_CONFIG: SysConfigItem[] = [
  {
    key: 'org_name',
    value: 'АНО «Дирекция Технологических Мероприятий»',
    label: 'Наименование организации',
    type: 'string',
    groupName: 'Основные'
  },
  {
    key: 'strict_budget_control',
    value: 'false',
    label: 'Строгий контроль лимита бюджета',
    type: 'boolean',
    groupName: 'Финансы'
  },
  {
    key: 'budget_warning_threshold',
    value: '90',
    label: 'Порог предупреждения об исчерпании сметы (%)',
    type: 'number',
    groupName: 'Финансы'
  },
  {
    key: 'tax_rate_percent',
    value: '0',
    label: 'Ставка налога / УСН / НДС (%)',
    type: 'number',
    groupName: 'Финансы'
  },
  {
    key: 'default_currency',
    value: 'RUB',
    label: 'Валюта регламентированного учета',
    type: 'select',
    groupName: 'Финансы',
    options: ['RUB', 'USD', 'EUR', 'KZT']
  },
  {
    key: 'allow_public_registration',
    value: 'true',
    label: 'Разрешить публичную регистрацию гостей',
    type: 'boolean',
    groupName: 'Регистрация'
  },
  {
    key: 'auto_checkin_qr',
    value: 'true',
    label: 'Мгновенный чек-ин по QR',
    type: 'boolean',
    groupName: 'Регистрация'
  },
  {
    key: 'default_event_headcount',
    value: '200',
    label: 'Плановая квота участников по умолчанию',
    type: 'number',
    groupName: 'Основные'
  }
];

export const DEFAULT_SYS_CATALOGS: SysCatalogItem[] = [
  // budget_categories
  { id: 'cat-b-1', catalogType: 'budget_categories', code: 'BC-01', name: 'Аренда площадки', color: '#3B82F6', sortOrder: 1, isProtected: true },
  { id: 'cat-b-2', catalogType: 'budget_categories', code: 'BC-02', name: 'Кейтеринг', color: '#F43F5E', sortOrder: 2, isProtected: true },
  { id: 'cat-b-3', catalogType: 'budget_categories', code: 'BC-03', name: 'Оборудование', color: '#8B5CF6', sortOrder: 3, isProtected: true },
  { id: 'cat-b-4', catalogType: 'budget_categories', code: 'BC-04', name: 'Маркетинг и реклама', color: '#F59E0B', sortOrder: 4, isProtected: true },
  { id: 'cat-b-5', catalogType: 'budget_categories', code: 'BC-05', name: 'Полиграфия и мерч', color: '#10B981', sortOrder: 5, isProtected: true },
  { id: 'cat-b-6', catalogType: 'budget_categories', code: 'BC-06', name: 'Работа подрядчиков', color: '#64748B', sortOrder: 6, isProtected: true },
  { id: 'cat-b-7', catalogType: 'budget_categories', code: 'BC-07', name: 'Логистика', color: '#06B6D4', sortOrder: 7, isProtected: true },
  { id: 'cat-b-8', catalogType: 'budget_categories', code: 'BC-08', name: 'Безопасность', color: '#EF4444', sortOrder: 8, isProtected: true },
  { id: 'cat-b-9', catalogType: 'budget_categories', code: 'BC-09', name: 'Прочее', color: '#71717A', sortOrder: 9, isProtected: true },

  // event_types
  { id: 'cat-e-1', catalogType: 'event_types', code: 'ET-01', name: 'Хакатон', color: '#6366F1', sortOrder: 1, isProtected: true },
  { id: 'cat-e-2', catalogType: 'event_types', code: 'ET-02', name: 'Конференция', color: '#3B82F6', sortOrder: 2, isProtected: true },
  { id: 'cat-e-3', catalogType: 'event_types', code: 'ET-03', name: 'Форум', color: '#10B981', sortOrder: 3, isProtected: true },
  { id: 'cat-e-4', catalogType: 'event_types', code: 'ET-04', name: 'Воркшоп', color: '#F59E0B', sortOrder: 4, isProtected: true },
  { id: 'cat-e-5', catalogType: 'event_types', code: 'ET-05', name: 'Выставка', color: '#EC4899', sortOrder: 5, isProtected: true },
  { id: 'cat-e-6', catalogType: 'event_types', code: 'ET-06', name: 'Корпоратив', color: '#8B5CF6', sortOrder: 6, isProtected: true },

  // ticket_categories
  { id: 'cat-t-1', catalogType: 'ticket_categories', code: 'TC-01', name: 'Стандарт', color: '#71717A', sortOrder: 1, isProtected: true },
  { id: 'cat-t-2', catalogType: 'ticket_categories', code: 'TC-02', name: 'VIP', color: '#F59E0B', sortOrder: 2, isProtected: true },
  { id: 'cat-t-3', catalogType: 'ticket_categories', code: 'TC-03', name: 'Спикер', color: '#8B5CF6', sortOrder: 3, isProtected: true },
  { id: 'cat-t-4', catalogType: 'ticket_categories', code: 'TC-04', name: 'Пресса', color: '#06B6D4', sortOrder: 4, isProtected: true },
  { id: 'cat-t-5', catalogType: 'ticket_categories', code: 'TC-05', name: 'Партнер', color: '#10B981', sortOrder: 5, isProtected: true },
  { id: 'cat-t-6', catalogType: 'ticket_categories', code: 'TC-06', name: 'Оргкомитет', color: '#3B82F6', sortOrder: 6, isProtected: true }
];

export const ALL_TABLE_NAMES = [
  'users',
  'events',
  'kanban_stages',
  'tasks',
  'budget_items',
  'guests',
  'contractors',
  'team_members',
  'feedbacks',
  'mailings',
  'sys_config',
  'sys_catalogs',
  'audit_log'
] as const;

export function logAuditEvent(
  action: string,
  metadataObject: string,
  details: string,
  userName: string = 'Андрей Абрамов',
  userRole: string = 'admin'
) {
  try {
    const timestamp = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO audit_log (timestamp, userName, userRole, action, metadataObject, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(timestamp, userName, userRole, action, metadataObject, details);
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

export function seedDatabase(force: boolean = false) {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  const configCount = db.prepare('SELECT COUNT(*) as count FROM sys_config').get() as { count: number };
  const catalogCount = db.prepare('SELECT COUNT(*) as count FROM sys_catalogs').get() as { count: number };

  if (!force && userCount.count > 0 && configCount.count > 0 && catalogCount.count > 0) {
    return;
  }

  const seedTx = db.transaction(() => {
    if (force || userCount.count === 0) {
      // Clear existing domain data
      db.prepare('DELETE FROM users').run();
      db.prepare('DELETE FROM events').run();
      db.prepare('DELETE FROM kanban_stages').run();
      db.prepare('DELETE FROM tasks').run();
      db.prepare('DELETE FROM budget_items').run();
      db.prepare('DELETE FROM guests').run();
      db.prepare('DELETE FROM contractors').run();
      db.prepare('DELETE FROM team_members').run();
      db.prepare('DELETE FROM feedbacks').run();
      db.prepare('DELETE FROM mailings').run();

      // Insert Users
      const insertUser = db.prepare(`
        INSERT INTO users (id, name, email, role, position, phone, avatarInitials, createdAt, isSystemDefault)
        VALUES (@id, @name, @email, @role, @position, @phone, @avatarInitials, @createdAt, @isSystemDefault)
      `);
      for (const u of INITIAL_USERS) {
        insertUser.run({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          position: u.position,
          phone: u.phone || null,
          avatarInitials: u.avatarInitials,
          createdAt: u.createdAt,
          isSystemDefault: u.isSystemDefault ? 1 : 0
        });
      }

      // Insert Events
      const insertEvent = db.prepare('INSERT INTO events (id, data) VALUES (?, ?)');
      for (const ev of INITIAL_EVENTS) {
        insertEvent.run(ev.id, JSON.stringify(ev));
      }

      // Insert Kanban Stages
      const insertStage = db.prepare('INSERT INTO kanban_stages (id, eventId, data) VALUES (?, ?, ?)');
      for (const st of INITIAL_KANBAN_STAGES) {
        insertStage.run(st.id, st.eventId, JSON.stringify(st));
      }

      // Insert Tasks
      const insertTask = db.prepare('INSERT INTO tasks (id, eventId, data) VALUES (?, ?, ?)');
      for (const t of INITIAL_TASKS) {
        insertTask.run(t.id, t.eventId, JSON.stringify(t));
      }

      // Insert Budget Items
      const insertBudget = db.prepare('INSERT INTO budget_items (id, eventId, data) VALUES (?, ?, ?)');
      for (const b of INITIAL_BUDGET) {
        insertBudget.run(b.id, b.eventId, JSON.stringify(b));
      }

      // Insert Guests
      const insertGuest = db.prepare('INSERT INTO guests (id, eventId, data) VALUES (?, ?, ?)');
      for (const g of INITIAL_GUESTS) {
        insertGuest.run(g.id, g.eventId, JSON.stringify(g));
      }

      // Insert Contractors
      const insertContractor = db.prepare('INSERT INTO contractors (id, eventId, data) VALUES (?, ?, ?)');
      for (const c of INITIAL_CONTRACTORS) {
        insertContractor.run(c.id, c.eventId, JSON.stringify(c));
      }

      // Insert Team Members
      const insertTeam = db.prepare('INSERT INTO team_members (id, eventId, data) VALUES (?, ?, ?)');
      for (const tm of INITIAL_TEAM) {
        insertTeam.run(tm.id, tm.eventId, JSON.stringify(tm));
      }

      // Insert Feedbacks
      const insertFeedback = db.prepare('INSERT INTO feedbacks (id, eventId, data) VALUES (?, ?, ?)');
      for (const fb of INITIAL_SURVEYS) {
        insertFeedback.run(fb.id, fb.eventId, JSON.stringify(fb));
      }

      // Insert Mailings
      const insertMailing = db.prepare('INSERT INTO mailings (id, eventId, data) VALUES (?, ?, ?)');
      for (const m of INITIAL_BROADCASTS) {
        insertMailing.run(m.id, m.eventId, JSON.stringify(m));
      }
    }

    // Seed Config if force or empty
    if (force || configCount.count === 0) {
      db.prepare('DELETE FROM sys_config').run();
      const insertConfig = db.prepare(`
        INSERT INTO sys_config (key, value, label, type, groupName)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const c of DEFAULT_SYS_CONFIG) {
        insertConfig.run(c.key, c.value, c.label, c.type, c.groupName);
      }
    }

    // Seed Catalogs if force or empty
    if (force || catalogCount.count === 0) {
      db.prepare('DELETE FROM sys_catalogs').run();
      const insertCatalog = db.prepare(`
        INSERT INTO sys_catalogs (id, catalogType, code, name, color, sortOrder, isProtected)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const cat of DEFAULT_SYS_CATALOGS) {
        insertCatalog.run(cat.id, cat.catalogType, cat.code, cat.name, cat.color, cat.sortOrder, cat.isProtected ? 1 : 0);
      }
    }
  });

  seedTx();

  logAuditEvent(
    force ? 'Сброс информационной базы' : 'Инициализация информационной базы',
    'Информационная база',
    force ? 'База данных сброшена к эталонным демо-данным и системным каталогам' : 'Первичная инициализация таблиц и справочников',
    'Андрей Абрамов',
    'admin'
  );
}

// Auto seed on boot if empty
seedDatabase(false);

export function getSysConfig(): Record<string, SysConfigItem> {
  const rows = db.prepare('SELECT * FROM sys_config').all() as any[];
  const configMap: Record<string, SysConfigItem> = {};
  for (const r of rows) {
    configMap[r.key] = {
      key: r.key,
      value: r.value,
      label: r.label,
      type: r.type,
      groupName: r.groupName,
      options: r.key === 'default_currency' ? ['RUB', 'USD', 'EUR', 'KZT'] : undefined
    };
  }
  return configMap;
}

export function updateSysConfig(updates: Record<string, string>, userName = 'Андрей Абрамов', userRole = 'admin') {
  const updateStmt = db.prepare('UPDATE sys_config SET value = ? WHERE key = ?');
  const tx = db.transaction(() => {
    for (const [key, val] of Object.entries(updates)) {
      updateStmt.run(String(val), key);
    }
  });
  tx();

  logAuditEvent(
    'Изменение констант',
    'Константы',
    `Обновлены параметры: ${Object.keys(updates).join(', ')}`,
    userName,
    userRole
  );

  return getSysConfig();
}

export function getSysCatalogs(): SysCatalogItem[] {
  const rows = db.prepare('SELECT * FROM sys_catalogs ORDER BY catalogType, sortOrder ASC').all() as any[];
  return rows.map(r => ({
    id: r.id,
    catalogType: r.catalogType,
    code: r.code,
    name: r.name,
    color: r.color,
    sortOrder: Number(r.sortOrder) || 0,
    isProtected: Boolean(r.isProtected)
  }));
}

export function saveSysCatalogItem(item: SysCatalogItem, userName = 'Андрей Абрамов', userRole = 'admin') {
  const existing = db.prepare('SELECT id FROM sys_catalogs WHERE id = ?').get(item.id);
  if (existing) {
    db.prepare(`
      UPDATE sys_catalogs
      SET catalogType = ?, code = ?, name = ?, color = ?, sortOrder = ?, isProtected = ?
      WHERE id = ?
    `).run(
      item.catalogType,
      item.code,
      item.name,
      item.color,
      item.sortOrder,
      item.isProtected ? 1 : 0,
      item.id
    );
    logAuditEvent(
      'Изменение элемента справочника',
      `Справочник.${item.catalogType}`,
      `[${item.code}] ${item.name}`,
      userName,
      userRole
    );
  } else {
    db.prepare(`
      INSERT INTO sys_catalogs (id, catalogType, code, name, color, sortOrder, isProtected)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      item.id,
      item.catalogType,
      item.code,
      item.name,
      item.color,
      item.sortOrder,
      item.isProtected ? 1 : 0
    );
    logAuditEvent(
      'Добавление элемента справочника',
      `Справочник.${item.catalogType}`,
      `Создан [${item.code}] ${item.name}`,
      userName,
      userRole
    );
  }
  return getSysCatalogs();
}

export function deleteSysCatalogItem(id: string, userName = 'Андрей Абрамов', userRole = 'admin') {
  const item = db.prepare('SELECT * FROM sys_catalogs WHERE id = ?').get(id) as any;
  if (item) {
    db.prepare('DELETE FROM sys_catalogs WHERE id = ?').run(id);
    logAuditEvent(
      'Удаление элемента справочника',
      `Справочник.${item.catalogType}`,
      `Удален [${item.code}] ${item.name}`,
      userName,
      userRole
    );
  }
  return getSysCatalogs();
}

export function getAuditLog(limit: number = 100): AuditLogEntry[] {
  const rows = db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT ?').all(limit) as any[];
  return rows.map(r => ({
    id: r.id,
    timestamp: r.timestamp,
    userName: r.userName,
    userRole: r.userRole,
    action: r.action,
    metadataObject: r.metadataObject,
    details: r.details
  }));
}

export function getTableStats(): TableStat[] {
  const stats: TableStat[] = [];
  for (const name of ALL_TABLE_NAMES) {
    try {
      const res = db.prepare(`SELECT COUNT(*) as count FROM ${name}`).get() as { count: number };
      stats.push({
        tableName: name,
        rowCount: res.count
      });
    } catch {
      stats.push({
        tableName: name,
        rowCount: 0
      });
    }
  }
  return stats;
}

export function executeSql(
  query: string,
  userName: string = 'Андрей Абрамов',
  userRole: string = 'admin'
): SqlExecutionResult {
  const startTime = performance.now();
  const trimmed = query.trim();

  if (!trimmed) {
    return {
      columns: [],
      rows: [],
      executionTimeMs: 0
    };
  }

  const isRead = /^(SELECT|PRAGMA|EXPLAIN|WITH)\b/i.test(trimmed);

  try {
    if (isRead) {
      const stmt = db.prepare(trimmed);
      const rows = stmt.all() as any[];
      const columns = rows.length > 0 ? Object.keys(rows[0]) : (stmt.columns ? stmt.columns().map(c => c.name) : []);
      const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

      logAuditEvent(
        'Выполнение SQL (чтение)',
        'SQL-консоль',
        trimmed.slice(0, 140),
        userName,
        userRole
      );

      return {
        columns,
        rows,
        executionTimeMs
      };
    } else {
      const stmt = db.prepare(trimmed);
      const info = stmt.run();
      const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;

      logAuditEvent(
        'Выполнение SQL (модификация)',
        'SQL-консоль',
        trimmed.slice(0, 140),
        userName,
        userRole
      );

      return {
        columns: ['changes', 'lastInsertRowid'],
        rows: [{ changes: info.changes, lastInsertRowid: info.lastInsertRowid }],
        changes: info.changes,
        executionTimeMs
      };
    }
  } catch (err: any) {
    const executionTimeMs = Math.round((performance.now() - startTime) * 100) / 100;
    return {
      columns: ['error'],
      rows: [{ error: err.message }],
      executionTimeMs,
      error: err.message
    };
  }
}

export function getTableData(tableName: string, limit: number = 100) {
  if (!ALL_TABLE_NAMES.includes(tableName as any)) {
    throw new Error(`Недопустимая таблица: ${tableName}`);
  }
  const rows = db.prepare(`SELECT * FROM ${tableName} LIMIT ?`).all(limit) as any[];
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { columns, rows };
}

export function getBackupData() {
  const backup: Record<string, any[]> = {};
  for (const table of ALL_TABLE_NAMES) {
    try {
      backup[table] = db.prepare(`SELECT * FROM ${table}`).all();
    } catch {
      backup[table] = [];
    }
  }
  return {
    version: '1.0',
    timestamp: new Date().toISOString(),
    database: 'eventtech.db',
    tables: backup
  };
}

export function restoreBackupData(dump: any, userName = 'Андрей Абрамов', userRole = 'admin') {
  if (!dump || !dump.tables || typeof dump.tables !== 'object') {
    throw new Error('Некорректный формат файла резервной копии (.json)');
  }

  const restoreTx = db.transaction(() => {
    for (const [table, rows] of Object.entries(dump.tables)) {
      if (!ALL_TABLE_NAMES.includes(table as any) || !Array.isArray(rows)) {
        continue;
      }
      db.prepare(`DELETE FROM ${table}`).run();
      if (rows.length === 0) continue;

      const firstRow = rows[0];
      const cols = Object.keys(firstRow);
      const placeholders = cols.map(() => '?').join(', ');
      const stmt = db.prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders})`);

      for (const row of rows) {
        const values = cols.map(c => row[c] !== undefined ? row[c] : null);
        stmt.run(...values);
      }
    }
  });

  restoreTx();

  logAuditEvent(
    'Восстановление информационной базы',
    'Резервное копирование',
    `Восстановлены таблицы из архива от ${dump.timestamp || 'неизвестно'}`,
    userName,
    userRole
  );

  return getDbState();
}

export function getDbState() {
  const users = (db.prepare('SELECT * FROM users').all() as any[]).map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    position: u.position,
    phone: u.phone || undefined,
    avatarInitials: u.avatarInitials,
    createdAt: u.createdAt,
    isSystemDefault: Boolean(u.isSystemDefault)
  })) as UserProfile[];

  const events = (db.prepare('SELECT data FROM events').all() as any[]).map(r => JSON.parse(r.data));
  const kanbanStages = (db.prepare('SELECT data FROM kanban_stages').all() as any[]).map(r => JSON.parse(r.data));
  const tasks = (db.prepare('SELECT data FROM tasks').all() as any[]).map(r => JSON.parse(r.data));
  const budgetItems = (db.prepare('SELECT data FROM budget_items').all() as any[]).map(r => JSON.parse(r.data));
  const guests = (db.prepare('SELECT data FROM guests').all() as any[]).map(r => JSON.parse(r.data));
  const contractors = (db.prepare('SELECT data FROM contractors').all() as any[]).map(r => JSON.parse(r.data));
  const teamMembers = (db.prepare('SELECT data FROM team_members').all() as any[]).map(r => JSON.parse(r.data));
  const feedbacks = (db.prepare('SELECT data FROM feedbacks').all() as any[]).map(r => JSON.parse(r.data));
  const mailings = (db.prepare('SELECT data FROM mailings').all() as any[]).map(r => JSON.parse(r.data));

  const sysConfig = getSysConfig();
  const sysCatalogs = getSysCatalogs();
  const auditLog = getAuditLog(100);
  const tableStats = getTableStats();

  let dbSizeKB = 0;
  if (fs.existsSync(DB_FILE_PATH)) {
    const stats = fs.statSync(DB_FILE_PATH);
    dbSizeKB = Math.round((stats.size / 1024) * 10) / 10;
  }

  const totalRecords = tableStats.reduce((acc, curr) => acc + curr.rowCount, 0);

  return {
    users,
    events,
    kanbanStages,
    tasks,
    budgetItems,
    guests,
    contractors,
    teamMembers,
    feedbacks,
    mailings,
    sysConfig,
    sysCatalogs,
    auditLog,
    tableStats,
    meta: {
      dbEngine: 'SQLite 3 (WAL)',
      dbFile: 'data/eventtech.db',
      dbSizeKB,
      totalRecords
    }
  };
}

export function syncDbState(state: any, userName = 'Андрей Абрамов', userRole = 'admin') {
  const syncTx = db.transaction(() => {
    if (Array.isArray(state.users)) {
      db.prepare('DELETE FROM users').run();
      const insertUser = db.prepare(`
        INSERT INTO users (id, name, email, role, position, phone, avatarInitials, createdAt, isSystemDefault)
        VALUES (@id, @name, @email, @role, @position, @phone, @avatarInitials, @createdAt, @isSystemDefault)
      `);
      for (const u of state.users) {
        insertUser.run({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role,
          position: u.position,
          phone: u.phone || null,
          avatarInitials: u.avatarInitials,
          createdAt: u.createdAt,
          isSystemDefault: u.isSystemDefault ? 1 : 0
        });
      }
    }

    if (Array.isArray(state.events)) {
      db.prepare('DELETE FROM events').run();
      const ins = db.prepare('INSERT INTO events (id, data) VALUES (?, ?)');
      for (const ev of state.events) {
        ins.run(ev.id, JSON.stringify(ev));
      }
    }

    if (Array.isArray(state.kanbanStages)) {
      db.prepare('DELETE FROM kanban_stages').run();
      const ins = db.prepare('INSERT INTO kanban_stages (id, eventId, data) VALUES (?, ?, ?)');
      for (const st of state.kanbanStages) {
        ins.run(st.id, st.eventId, JSON.stringify(st));
      }
    }

    if (Array.isArray(state.tasks)) {
      db.prepare('DELETE FROM tasks').run();
      const ins = db.prepare('INSERT INTO tasks (id, eventId, data) VALUES (?, ?, ?)');
      for (const t of state.tasks) {
        ins.run(t.id, t.eventId, JSON.stringify(t));
      }
    }

    if (Array.isArray(state.budgetItems)) {
      db.prepare('DELETE FROM budget_items').run();
      const ins = db.prepare('INSERT INTO budget_items (id, eventId, data) VALUES (?, ?, ?)');
      for (const b of state.budgetItems) {
        ins.run(b.id, b.eventId, JSON.stringify(b));
      }
    }

    if (Array.isArray(state.guests)) {
      db.prepare('DELETE FROM guests').run();
      const ins = db.prepare('INSERT INTO guests (id, eventId, data) VALUES (?, ?, ?)');
      for (const g of state.guests) {
        ins.run(g.id, g.eventId, JSON.stringify(g));
      }
    }

    if (Array.isArray(state.contractors)) {
      db.prepare('DELETE FROM contractors').run();
      const ins = db.prepare('INSERT INTO contractors (id, eventId, data) VALUES (?, ?, ?)');
      for (const c of state.contractors) {
        ins.run(c.id, c.eventId, JSON.stringify(c));
      }
    }

    if (Array.isArray(state.teamMembers)) {
      db.prepare('DELETE FROM team_members').run();
      const ins = db.prepare('INSERT INTO team_members (id, eventId, data) VALUES (?, ?, ?)');
      for (const tm of state.teamMembers) {
        ins.run(tm.id, tm.eventId, JSON.stringify(tm));
      }
    }

    if (Array.isArray(state.feedbacks)) {
      db.prepare('DELETE FROM feedbacks').run();
      const ins = db.prepare('INSERT INTO feedbacks (id, eventId, data) VALUES (?, ?, ?)');
      for (const fb of state.feedbacks) {
        ins.run(fb.id, fb.eventId, JSON.stringify(fb));
      }
    }

    if (Array.isArray(state.mailings)) {
      db.prepare('DELETE FROM mailings').run();
      const ins = db.prepare('INSERT INTO mailings (id, eventId, data) VALUES (?, ?, ?)');
      for (const m of state.mailings) {
        ins.run(m.id, m.eventId, JSON.stringify(m));
      }
    }
  });

  syncTx();

  logAuditEvent(
    'Синхронизация рабочей базы',
    'Документы и регистры',
    'Автоматическая фоновая запись изменений рабочей базы данных',
    userName,
    userRole
  );

  return getDbState();
}

export function resetDbState(userName = 'Андрей Абрамов', userRole = 'admin') {
  seedDatabase(true);
  logAuditEvent(
    'Сброс базы данных',
    'Информационная база',
    'Выполнен сброс всех таблиц к первоначальным демо-данным',
    userName,
    userRole
  );
  return getDbState();
}
