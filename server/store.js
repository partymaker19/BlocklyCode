// Хранилище на SQLite (node:sqlite, встроен в Node 22+). Если недоступен — JSON-файл.
// Единый интерфейс: run/get/all + отдельные методы для сущностей.
"use strict";

const fs = require("fs");
const path = require("path");

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function loadJsonFile(file) {
  try {
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

let driver = "sqlite";
let db = null;

// ---------- Попытка подключить SQLite ----------
try {
  const { DatabaseSync } = require("node:sqlite");
  db = new DatabaseSync(path.join(DATA_DIR, "blocklycode.db"));
  db.exec("PRAGMA journal_mode = WAL;");
} catch (e) {
  driver = "json";
  console.warn(
    "[store] node:sqlite недоступен (" +
      (e && e.message ? e.message : e) +
      "), используется JSON-файл",
  );
}

const JSON_FILE = path.join(DATA_DIR, "db.json");

// ---------- Схема ----------
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT,
  password_salt TEXT,
  provider TEXT NOT NULL DEFAULT 'local',
  avatar_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS workspaces (
  user_id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS custom_blocks (
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  data TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, type)
);
CREATE TABLE IF NOT EXISTS task_progress (
  user_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  solved INTEGER NOT NULL DEFAULT 0,
  stars INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, task_id)
);
CREATE TABLE IF NOT EXISTS classes (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS class_members (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  joined_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
);
CREATE TABLE IF NOT EXISTS class_tasks (
  id TEXT PRIMARY KEY,
  class_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  assigned_by TEXT NOT NULL,
  assigned_to TEXT NOT NULL,
  assigned_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'assigned',
  due_date TEXT,
  completed_at TEXT,
  completion_notes TEXT
);
`;

// ---------- Загрузка JSON-драйвера ----------
function loadJsonDb() {
  try {
    const raw = fs.readFileSync(JSON_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return {
      users: new Map(parsed.users || []),
      sessions: new Map(parsed.sessions || []),
      workspaces: new Map(parsed.workspaces || []),
      customBlocks: new Map(parsed.customBlocks || []),
      taskProgress: new Map(parsed.taskProgress || []),
    };
  } catch {
    return {
      users: new Map(),
      sessions: new Map(),
      workspaces: new Map(),
      customBlocks: new Map(),
      taskProgress: new Map(),
    };
  }
}

const json = loadJsonDb();

const CLASSES_JSON_FILE = path.join(DATA_DIR, "classes.json");
const CLASS_MEMBERS_JSON_FILE = path.join(DATA_DIR, "class_members.json");
const CLASS_TASKS_JSON_FILE = path.join(DATA_DIR, "class_tasks.json");

let classesJson = loadJsonFile(CLASSES_JSON_FILE);
let classMembersJson = loadJsonFile(CLASS_MEMBERS_JSON_FILE);
let classTasksJson = loadJsonFile(CLASS_TASKS_JSON_FILE);

let saveTimer = null;
function persistJson() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    saveTimer = null;
    const payload = {
      users: [...json.users.entries()],
      sessions: [...json.sessions.entries()],
      workspaces: [...json.workspaces.entries()],
      customBlocks: [...json.customBlocks.entries()],
      taskProgress: [...json.taskProgress.entries()],
    };
    try {
      const tmp = JSON_FILE + ".tmp";
      fs.writeFileSync(tmp, JSON.stringify(payload), "utf8");
      fs.renameSync(tmp, JSON_FILE);
    } catch (e) {
      console.error("[store] JSON persist failed:", e && e.message);
    }
  }, 250);
}

if (db) db.exec(SCHEMA);
else persistJson();

// ---------- Универсальные помощники ----------
function now() {
  return new Date().toISOString();
}

function userRow(u) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    provider: u.provider || "local",
    avatarUrl: u.avatar_url || u.avatarUrl || null,
    createdAt: u.created_at || u.createdAt || null,
  };
}

// ---------- API хранилища ----------
const store = {
  driver,
  DATA_DIR,

  // --- users ---
  getUserByEmail(email) {
    const e = String(email || "").toLowerCase();
    if (driver === "sqlite") {
      return userRow(
        db.prepare("SELECT * FROM users WHERE email = ?").get(e) || null,
      );
    }
    for (const u of json.users.values()) {
      if (String(u.email).toLowerCase() === e) return userRow(u);
    }
    return null;
  },

  getUserById(id) {
    if (driver === "sqlite") {
      return userRow(db.prepare("SELECT * FROM users WHERE id = ?").get(id) || null);
    }
    return userRow(json.users.get(id) || null);
  },

  // Возвращает полные данные (включая хэш пароля) — только для auth
  _getUserRawByEmail(email) {
    const e = String(email || "").toLowerCase();
    if (driver === "sqlite") {
      return db.prepare("SELECT * FROM users WHERE email = ?").get(e) || null;
    }
    for (const u of json.users.values()) {
      if (String(u.email).toLowerCase() === e) return u;
    }
    return null;
  },

  createUser({ id, email, name, passwordHash, passwordSalt, provider }) {
    const t = now();
    const user = {
      id,
      email: String(email).toLowerCase(),
      name: name || String(email).split("@")[0],
      password_hash: passwordHash || null,
      password_salt: passwordSalt || null,
      provider: provider || "local",
      avatar_url: null,
      created_at: t,
      updated_at: t,
    };
    if (driver === "sqlite") {
      db.prepare(
        "INSERT INTO users (id, email, name, password_hash, password_salt, provider, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(
        user.id,
        user.email,
        user.name,
        user.password_hash,
        user.password_salt,
        user.provider,
        user.avatar_url,
        user.created_at,
        user.updated_at,
      );
    } else {
      json.users.set(user.id, user);
      persistJson();
    }
    return userRow(user);
  },

  updateUserProfile(id, { name, avatarUrl }) {
    const t = now();
    if (driver === "sqlite") {
      const sets = [];
      const vals = [];
      if (name !== undefined) {
        sets.push("name = ?");
        vals.push(String(name));
      }
      if (avatarUrl !== undefined) {
        sets.push("avatar_url = ?");
        vals.push(avatarUrl == null ? null : String(avatarUrl));
      }
      if (!sets.length) return this.getUserById(id);
      sets.push("updated_at = ?");
      vals.push(t, id);
      db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
    } else {
      const u = json.users.get(id);
      if (!u) return null;
      if (name !== undefined) u.name = String(name);
      if (avatarUrl !== undefined)
        u.avatar_url = avatarUrl == null ? null : String(avatarUrl);
      u.updated_at = t;
      persistJson();
    }
    return this.getUserById(id);
  },

  // --- sessions ---
  createSession(sid, userId, ttlMs) {
    const expires = new Date(Date.now() + ttlMs).toISOString();
    if (driver === "sqlite") {
      db.prepare(
        "INSERT OR REPLACE INTO sessions (sid, user_id, expires_at) VALUES (?, ?, ?)",
      ).run(sid, userId, expires);
    } else {
      json.sessions.set(sid, { user_id: userId, expires_at: expires });
      persistJson();
    }
  },

  getSession(sid) {
    if (!sid) return null;
    if (driver === "sqlite") {
      const row = db
        .prepare("SELECT * FROM sessions WHERE sid = ? AND expires_at > ?")
        .get(sid, now());
      return row ? { userId: row.user_id, expiresAt: row.expires_at } : null;
    }
    const row = json.sessions.get(sid);
    if (!row) return null;
    if (new Date(row.expires_at).getTime() <= Date.now()) {
      json.sessions.delete(sid);
      persistJson();
      return null;
    }
    return { userId: row.user_id, expiresAt: row.expires_at };
  },

  destroySession(sid) {
    if (!sid) return;
    if (driver === "sqlite") {
      db.prepare("DELETE FROM sessions WHERE sid = ?").run(sid);
    } else {
      json.sessions.delete(sid);
      persistJson();
    }
  },

  // --- workspaces ---
  getWorkspace(userId) {
    if (driver === "sqlite") {
      const row = db
        .prepare("SELECT data, updated_at FROM workspaces WHERE user_id = ?")
        .get(userId);
      if (!row) return null;
      try {
        return { data: JSON.parse(row.data), updatedAt: row.updated_at };
      } catch {
        return null;
      }
    }
    const row = json.workspaces.get(userId);
    if (!row) return null;
    try {
      return { data: JSON.parse(row.data), updatedAt: row.updated_at };
    } catch {
      return null;
    }
  },

  saveWorkspace(userId, data) {
    const t = now();
    const serialized = JSON.stringify(data);
    if (driver === "sqlite") {
      db.prepare(
        "INSERT INTO workspaces (user_id, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
      ).run(userId, serialized, t);
    } else {
      json.workspaces.set(userId, { data: serialized, updated_at: t });
      persistJson();
    }
    return { updatedAt: t };
  },

  // --- custom blocks ---
  getCustomBlocks(userId) {
    let rows;
    if (driver === "sqlite") {
      rows = db
        .prepare("SELECT type, data, updated_at FROM custom_blocks WHERE user_id = ?")
        .all(userId);
    } else {
      const m = json.customBlocks.get(userId) || new Map();
      rows = [...m.entries()].map(([type, v]) => ({
        type,
        data: v.data,
        updated_at: v.updated_at,
      }));
    }
    return rows.map((r) => {
      let def;
      try {
        def = JSON.parse(r.data);
      } catch {
        return null;
      }
      return {
        type: r.type,
        definition: def,
        updatedAt: r.updated_at,
      };
    }).filter(Boolean);
  },

  upsertCustomBlock(userId, type, definition) {
    const t = now();
    const serialized = JSON.stringify(definition);
    if (driver === "sqlite") {
      db.prepare(
        "INSERT INTO custom_blocks (user_id, type, data, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, type) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at",
      ).run(userId, type, serialized, t);
    } else {
      const m = json.customBlocks.get(userId) || new Map();
      m.set(type, { data: serialized, updated_at: t });
      json.customBlocks.set(userId, m);
      persistJson();
    }
    return { updatedAt: t };
  },

  deleteCustomBlock(userId, type) {
    if (driver === "sqlite") {
      db.prepare("DELETE FROM custom_blocks WHERE user_id = ? AND type = ?").run(
        userId,
        type,
      );
    } else {
      const m = json.customBlocks.get(userId);
      if (m && m.delete(type)) persistJson();
    }
  },

  // --- task progress ---
  getTaskProgress(userId) {
    let rows;
    if (driver === "sqlite") {
      rows = db
        .prepare("SELECT task_id, solved, stars, updated_at FROM task_progress WHERE user_id = ?")
        .all(userId);
    } else {
      const m = json.taskProgress.get(userId) || new Map();
      rows = [...m.entries()].map(([taskId, v]) => ({
        task_id: taskId,
        solved: v.solved,
        stars: v.stars,
        updated_at: v.updated_at,
      }));
    }
    const progress = {};
    for (const r of rows) {
      progress[r.task_id] = {
        solved: !!r.solved,
        stars: r.stars,
        updatedAt: r.updated_at,
      };
    }
    return progress;
  },

  setTaskProgress(userId, taskId, solved, stars) {
    const t = now();
    if (driver === "sqlite") {
      db.prepare(
        "INSERT INTO task_progress (user_id, task_id, solved, stars, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id, task_id) DO UPDATE SET solved = excluded.solved, stars = excluded.stars, updated_at = excluded.updated_at",
      ).run(userId, taskId, solved ? 1 : 0, Math.max(0, Math.min(3, stars | 0)), t);
    } else {
      const m = json.taskProgress.get(userId) || new Map();
      m.set(taskId, { solved: solved ? 1 : 0, stars, updated_at: t });
      json.taskProgress.set(userId, m);
      persistJson();
    }
  },

  // --- статистика ---
  getStats(userId) {
    const progress = this.getTaskProgress(userId);
    const tasks = Object.keys(progress);
    const solved = tasks.filter((t) => progress[t].solved);
    const stars = solved.reduce((acc, t) => acc + (progress[t].stars || 0), 0);
    const blocks = this.getCustomBlocks(userId).length;
    let lastActivity = null;
    for (const t of tasks) {
      const ua = progress[t].updatedAt;
      if (ua && (!lastActivity || ua > lastActivity)) lastActivity = ua;
    }
    return {
      tasksSolved: solved.length,
      tasksTotal: tasks.length,
      stars,
      customBlocks: blocks,
      lastActivity,
    };
  },

  // --- classes ---
  createClass({ id, teacherId, name, description }) {
    const t = now();
    const classItem = {
      id,
      teacher_id: teacherId,
      name,
      description,
      created_at: t,
      updated_at: t,
    };
    if (driver === "sqlite") {
      db.prepare(
        "INSERT INTO classes (id, teacher_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
      ).run(classItem.id, classItem.teacher_id, classItem.name, classItem.description, classItem.created_at, classItem.updated_at);
    } else {
      classesJson.push(classItem);
      this.persistClasses();
    }
    return classItem;
  },

  getClasses(teacherId) {
    if (driver === "sqlite") {
      return db.prepare("SELECT * FROM classes WHERE teacher_id = ?").all(teacherId);
    }
    return classesJson.filter(c => c.teacher_id === teacherId);
  },

  getClass(classId) {
    if (driver === "sqlite") {
      return db.prepare("SELECT * FROM classes WHERE id = ?").get(classId);
    }
    return classesJson.find(c => c.id === classId) || null;
  },

  updateClass(classId, updates) {
    const t = now();
    const classItem = this.getClass(classId);
    if (!classItem) return null;
    const updated = {
      ...classItem,
      ...updates,
      updated_at: t,
    };
    if (driver === "sqlite") {
      const sets = [];
      const vals = [];
      for (const key in updates) {
        if (key === 'id') continue;
        sets.push(`${key} = ?`);
        vals.push(updates[key]);
      }
      sets.push("updated_at = ?");
      vals.push(t, classId);
      db.prepare(`UPDATE classes SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
    } else {
      const idx = classesJson.findIndex(c => c.id === classId);
      if (idx >= 0) {
        classesJson[idx] = updated;
        this.persistClasses();
      }
    }
    return updated;
  },

  deleteClass(classId) {
    if (driver === "sqlite") {
      db.prepare("DELETE FROM classes WHERE id = ?").run(classId);
    } else {
      const idx = classesJson.findIndex(c => c.id === classId);
      if (idx >= 0) {
        classesJson.splice(idx, 1);
        this.persistClasses();
      }
    }
  },

  // --- class members ---
  addStudentToClass({ id, classId, userId, role }) {
    const t = now();
    const member = {
      id,
      class_id: classId,
      user_id: userId,
      role,
      joined_at: t,
      status: "active",
    };
    if (driver === "sqlite") {
      db.prepare(
        "INSERT INTO class_members (id, class_id, user_id, role, joined_at, status) VALUES (?, ?, ?, ?, ?, ?)",
      ).run(member.id, member.class_id, member.user_id, member.role, member.joined_at, member.status);
    } else {
      classMembersJson.push(member);
      this.persistClassMembers();
    }
    return member;
  },

  getClassMembers(classId) {
    if (driver === "sqlite") {
      return db.prepare("SELECT * FROM class_members WHERE class_id = ?").all(classId);
    }
    return classMembersJson.filter(m => m.class_id === classId);
  },

  getUserClass(userId) {
    if (driver === "sqlite") {
      return db.prepare("SELECT * FROM class_members WHERE user_id = ?").all(userId);
    }
    return classMembersJson.filter(m => m.user_id === userId);
  },

  // --- class tasks ---
  assignTask({ id, classId, taskId, assignedBy, assignedTo, dueDate }) {
    const t = now();
    const task = {
      id,
      class_id: classId,
      task_id: taskId,
      assigned_by: assignedBy,
      assigned_to: assignedTo,
      assigned_at: t,
      status: "assigned",
      due_date: dueDate,
      completed_at: null,
      completion_notes: null,
    };
    if (driver === "sqlite") {
      db.prepare(
        "INSERT INTO class_tasks (id, class_id, task_id, assigned_by, assigned_to, assigned_at, status, due_date, completed_at, completion_notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      ).run(task.id, task.class_id, task.task_id, task.assigned_by, task.assigned_to, task.assigned_at, task.status, task.due_date, task.completed_at, task.completion_notes);
    } else {
      classTasksJson.push(task);
      this.persistClassTasks();
    }
    return task;
  },

  getClassTasks(classId) {
    if (driver === "sqlite") {
      return db.prepare("SELECT * FROM class_tasks WHERE class_id = ?").all(classId);
    }
    return classTasksJson.filter(t => t.class_id === classId);
  },

  getStudentTasks(studentId) {
    if (driver === "sqlite") {
      return db.prepare("SELECT * FROM class_tasks WHERE assigned_to = ?").all(studentId);
    }
    return classTasksJson.filter(t => t.assigned_to === studentId);
  },

  updateTaskStatus(taskId, status, completionNotes) {
    const t = now();
    const updateFields = {
      status,
      completed_at: status === "completed" ? t : null,
      completion_notes: completionNotes,
    };
    if (driver === "sqlite") {
      const sets = [];
      const vals = [];
      for (const key in updateFields) {
        if (updateFields[key] !== undefined) {
          sets.push(`${key} = ?`);
          vals.push(updateFields[key]);
        }
      }
      sets.push("updated_at = ?");
      vals.push(t, taskId);
      db.prepare(`UPDATE class_tasks SET ${sets.join(", ")} WHERE id = ?`).run(...vals);
    } else {
      const idx = classTasksJson.findIndex(t => t.id === taskId);
      if (idx >= 0) {
        classTasksJson[idx] = { ...classTasksJson[idx], ...updateFields };
        this.persistClassTasks();
      }
    }
  },

  // --- persistence helpers ---
  persistClasses() {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      try {
        const tmp = CLASSES_JSON_FILE + ".tmp";
        fs.writeFileSync(tmp, JSON.stringify(classesJson), "utf8");
        fs.renameSync(tmp, CLASSES_JSON_FILE);
      } catch (e) {
        console.error("[store] classes persist failed:", e && e.message);
      }
    }, 250);
  },

  persistClassMembers() {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      try {
        const tmp = CLASS_MEMBERS_JSON_FILE + ".tmp";
        fs.writeFileSync(tmp, JSON.stringify(classMembersJson), "utf8");
        fs.renameSync(tmp, CLASS_MEMBERS_JSON_FILE);
      } catch (e) {
        console.error("[store] class_members persist failed:", e && e.message);
      }
    }, 250);
  },

  persistClassTasks() {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      try {
        const tmp = CLASS_TASKS_JSON_FILE + ".tmp";
        fs.writeFileSync(tmp, JSON.stringify(classTasksJson), "utf8");
        fs.renameSync(tmp, CLASS_TASKS_JSON_FILE);
      } catch (e) {
        console.error("[store] class_tasks persist failed:", e && e.message);
      }
    }, 250);
  },
};

module.exports = store;
