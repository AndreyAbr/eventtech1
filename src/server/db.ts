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
import { UserProfile } from '../types/event';

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
`);

export function seedDatabase(force: boolean = false) {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (!force && userCount.count > 0) {
    return;
  }

  const seedTx = db.transaction(() => {
    // Clear existing
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
  });

  seedTx();
}

// Auto seed on boot if empty
seedDatabase(false);

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

  let dbSizeKB = 0;
  if (fs.existsSync(DB_FILE_PATH)) {
    const stats = fs.statSync(DB_FILE_PATH);
    dbSizeKB = Math.round((stats.size / 1024) * 10) / 10;
  }

  const totalRecords =
    users.length +
    events.length +
    kanbanStages.length +
    tasks.length +
    budgetItems.length +
    guests.length +
    contractors.length +
    teamMembers.length +
    feedbacks.length +
    mailings.length;

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
    meta: {
      dbEngine: 'SQLite 3 (WAL)',
      dbFile: 'data/eventtech.db',
      dbSizeKB,
      totalRecords
    }
  };
}

export function syncDbState(state: any) {
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
  return getDbState();
}

export function resetDbState() {
  seedDatabase(true);
  return getDbState();
}
