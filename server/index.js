// BlocklyCode API server: реальная аутентификация (email+пароль), сессии в SQLite,
// хранение workspace, пользовательских блоков и прогресса задач.
"use strict";

const express = require("express");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");

const store = require("./store");
const { hashPassword, verifyPassword } = require("./passwords");
const { submitFeedback, TYPES } = require("./feedback");

const HOST = process.env.HOST || "0.0.0.0";
const PORT = parseInt(process.env.PORT || "4000", 10);
const SESSION_COOKIE = "bc_sid";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 дней
const IS_PROD = process.env.NODE_ENV === "production";

const app = express();
app.set("trust proxy", 1);

// ---------- Security/COOP/COEP headers ----------
app.use((req, res, next) => {
  try {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
    res.setHeader("Origin-Agent-Cluster", "?1");
  } catch {}
  next();
});

app.use(express.json({ limit: "4mb" }));
app.use(cookieParser());

// ---------- Helper functions ----------
function generateId() {
  return crypto.randomUUID();
}

// ---------- Session middleware ----------
app.use((req, res, next) => {
  req.user = null;
  const sid = req.cookies ? req.cookies[SESSION_COOKIE] : null;
  const session = store.getSession(sid);
  if (session) {
    const user = store.getUserById(session.userId);
    if (user) req.user = user;
  }
  next();
});

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  next();
}

function setSessionCookie(res, sid) {
  res.cookie(SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PROD,
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

function startSession(res, userId) {
  const sid = crypto.randomBytes(32).toString("hex");
  store.createSession(sid, userId, SESSION_TTL_MS);
  setSessionCookie(res, sid);
}

function publicUser(u) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    provider: u.provider || "local",
    avatarUrl: u.avatarUrl || null,
    createdAt: u.createdAt || null,
  };
}

// ---------- Auth: me ----------
app.get("/api/auth/me", (req, res) => {
  if (!req.user) return res.status(401).json({ error: "Not authenticated" });
  res.json({ user: publicUser(req.user) });
});

// ---------- Auth: register ----------
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    if (!email || typeof email !== "string" || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: "Укажите корректный email" });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return res
        .status(400)
        .json({ error: "Пароль должен быть не короче 6 символов" });
    }
    if (name !== undefined && name !== null && name !== "") {
      if (typeof name !== "string" || name.trim().length > 30) {
        return res
          .status(400)
          .json({ error: "Имя не может быть длиннее 30 символов" });
      }
    }
    const existing = store.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: "Пользователь уже существует" });
    }
    const { hash, salt } = hashPassword(password);
    const id = crypto.randomUUID();
    const user = store.createUser({
      id,
      email,
      name: typeof name === "string" && name.trim() ? name.trim() : undefined,
      passwordHash: hash,
      passwordSalt: salt,
      provider: "local",
    });
    startSession(res, user.id);
    res.status(201).json({ user });
  } catch (e) {
    console.error("register error", e);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// ---------- Auth: login ----------
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: "Укажите email и пароль" });
    }
    // Raw lookup: нужен доступ к password_hash
    const raw = store._getUserRawByEmail(email);
    if (!raw || !verifyPassword(password, raw.password_salt, raw.password_hash)) {
      return res.status(401).json({ error: "Неверный email или пароль" });
    }
    const user = store.getUserById(raw.id);
    startSession(res, user.id);
    res.json({ user });
  } catch (e) {
    console.error("login error", e);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// ---------- Auth: logout ----------
app.post("/api/auth/logout", (req, res) => {
  const sid = req.cookies ? req.cookies[SESSION_COOKIE] : null;
  if (sid) store.destroySession(sid);
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  res.json({ ok: true });
});

// ---------- Profile: просмотр и обновление ----------
app.get("/api/profile", requireAuth, (req, res) => {
  const stats = store.getStats(req.user.id);
  res.json({ user: publicUser(req.user), stats });
});

app.patch("/api/profile", requireAuth, (req, res) => {
  try {
    const { name, avatarUrl } = req.body || {};
    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return res.status(400).json({ error: "Имя не может быть пустым" });
    }
    const user = store.updateUserProfile(req.user.id, {
      name: name !== undefined ? name.trim() : undefined,
      avatarUrl,
    });
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });
    res.json({ user });
  } catch (e) {
    console.error("profile update error", e);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// ---------- Workspace ----------
app.get("/api/workspace", requireAuth, (req, res) => {
  const ws = store.getWorkspace(req.user.id);
  res.json({ data: ws ? ws.data : null, updatedAt: ws ? ws.updatedAt : null });
});

app.post("/api/workspace", requireAuth, (req, res) => {
  const { data } = req.body || {};
  if (data === undefined || data === null) {
    return res.status(400).json({ error: "Missing data" });
  }
  const { updatedAt } = store.saveWorkspace(req.user.id, data);
  res.json({ ok: true, updatedAt });
});

// ---------- Custom blocks ----------
app.get("/api/blocks", requireAuth, (req, res) => {
  res.json({ blocks: store.getCustomBlocks(req.user.id) });
});

app.put("/api/blocks/:type", requireAuth, (req, res) => {
  try {
    const type = String(req.params.type || "").trim();
    if (!type) return res.status(400).json({ error: "Missing block type" });
    const { definition } = req.body || {};
    if (!definition || typeof definition !== "object" || !definition.type) {
      return res.status(400).json({ error: "Invalid definition" });
    }
    const { updatedAt } = store.upsertCustomBlock(req.user.id, type, definition);
    res.json({ ok: true, updatedAt });
  } catch (e) {
    console.error("blocks put error", e);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

app.delete("/api/blocks/:type", requireAuth, (req, res) => {
  const type = String(req.params.type || "").trim();
  store.deleteCustomBlock(req.user.id, type);
  res.json({ ok: true });
});

// ---------- Task progress ----------
app.get("/api/progress", requireAuth, (req, res) => {
  res.json({ progress: store.getTaskProgress(req.user.id) });
});

app.post("/api/progress/:taskId", requireAuth, (req, res) => {
  const taskId = String(req.params.taskId || "").trim();
  if (!taskId) return res.status(400).json({ error: "Missing taskId" });
  const { solved, stars } = req.body || {};
  store.setTaskProgress(req.user.id, taskId, !!solved, Number(stars) || 0);

  // Автозавершение: если задача решена и она была назначена ученику —
  // помечаем все активные назначения этой задачи как completed
  if (solved) {
    try {
      for (const t of store.getStudentTasks(req.user.id)) {
        if (t.task_id === taskId && t.status !== "completed") {
          store.updateTaskStatus(t.id, "completed", null);
        }
      }
    } catch (e) {
      console.error("auto-complete assigned tasks error", e);
    }
  }
  res.json({ ok: true });
});

// ---------- Feedback: сообщение владельцу (доступно без авторизации) ----------
const feedbackRate = new Map(); // ip -> [timestamps]
const FEEDBACK_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 час
const FEEDBACK_RATE_MAX = 5; // 5 сообщений в час с одного IP

function feedbackRateLimitOk(ip) {
  const nowTs = Date.now();
  const arr = (feedbackRate.get(ip) || []).filter((ts) => nowTs - ts < FEEDBACK_RATE_WINDOW_MS);
  if (arr.length >= FEEDBACK_RATE_MAX) {
    feedbackRate.set(ip, arr);
    return false;
  }
  arr.push(nowTs);
  feedbackRate.set(ip, arr);
  return true;
}

app.get("/api/feedback/types", (req, res) => {
  res.json({ types: TYPES });
});

app.post("/api/feedback", async (req, res) => {
  try {
    const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").toString();
    if (!feedbackRateLimitOk(ip)) {
      return res
        .status(429)
        .json({ error: "Слишком много сообщений. Попробуйте позже." });
    }
    const { type, message, email, page } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Сообщение не может быть пустым" });
    }
    if (email && !/^\S+@\S+\.\S+$/.test(String(email))) {
      return res.status(400).json({ error: "Некорректный email для ответа" });
    }
    const result = await submitFeedback({ type, message, email, page });
    res.status(201).json(result);
  } catch (e) {
    console.error("feedback error", e);
    res.status(500).json({ error: "Не удалось отправить сообщение. Попробуйте позже." });
  }
});

// ---------- Classes endpoints ----------
app.post("/api/classes", requireAuth, (req, res) => {
  try {
    const { name, description } = req.body || {};
    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Class name is required" });
    }
    // Лимит тарифа: количество классов
    const plan = store.getPlan(req.user.id);
    const usage = store.getUsage(req.user.id);
    if (usage.classes >= plan.maxClasses) {
      return res.status(402).json({
        error: `Достигнут лимит тарифа ${plan.name}: ${plan.maxClasses} класс(ов). Обновите подписку до Pro.`,
        code: "PLAN_LIMIT_CLASSES",
        plan: plan.id,
        limit: plan.maxClasses,
        usage: usage.classes,
      });
    }
    const classId = generateId();
    const classItem = store.createClass({
      id: classId,
      teacherId: req.user.id,
      name: name.trim(),
      description: description || "",
    });
    res.status(201).json({ class: classItem });
  } catch (e) {
    console.error("create class error", e);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

app.get("/api/classes", requireAuth, (req, res) => {
  try {
    const classes = store.getClasses(req.user.id);
    res.json({ classes });
  } catch (e) {
    console.error("get classes error", e);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

app.get("/api/classes/:classId", requireAuth, (req, res) => {
  try {
    const classId = String(req.params.classId || "").trim();
    if (!classId) return res.status(400).json({ error: "Missing classId" });
    
    const classItem = store.getClass(classId);
    if (!classItem) return res.status(404).json({ error: "Class not found" });
    
    if (classItem.teacher_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const members = store.getClassMembers(classId);
    const students = members.filter(m => m.role === "student");
    
    res.json({ class: classItem, students });
  } catch (e) {
    console.error("get class error", e);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

app.put("/api/classes/:classId", requireAuth, (req, res) => {
  try {
    const classId = String(req.params.classId || "").trim();
    if (!classId) return res.status(400).json({ error: "Missing classId" });
    
    const classItem = store.getClass(classId);
    if (!classItem) return res.status(404).json({ error: "Class not found" });
    
    if (classItem.teacher_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const { name, description } = req.body || {};
    const updates = {};
    if (name !== undefined) {
      if (!name || typeof name !== "string" || !name.trim()) {
        return res.status(400).json({ error: "Class name is required" });
      }
      updates.name = name.trim();
    }
    if (description !== undefined) {
      updates.description = description;
    }
    
    const updated = store.updateClass(classId, updates);
    res.json({ class: updated });
  } catch (e) {
    console.error("update class error", e);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

app.delete("/api/classes/:classId", requireAuth, (req, res) => {
  try {
    const classId = String(req.params.classId || "").trim();
    if (!classId) return res.status(400).json({ error: "Missing classId" });
    
    const classItem = store.getClass(classId);
    if (!classItem) return res.status(404).json({ error: "Class not found" });
    
    if (classItem.teacher_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    store.deleteClass(classId);
    res.json({ ok: true });
  } catch (e) {
    console.error("delete class error", e);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

app.post("/api/classes/:classId/students", requireAuth, (req, res) => {
  try {
    const classId = String(req.params.classId || "").trim();
    if (!classId) return res.status(400).json({ error: "Missing classId" });

    const classItem = store.getClass(classId);
    if (!classItem) return res.status(404).json({ error: "Class not found" });

    if (classItem.teacher_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    const { studentId, email } = req.body || {};
    let student = null;
    if (studentId) student = store.getUserById(studentId);
    if (!student && email) student = store.getUserByEmail(email);
    if (!student) {
      return res
        .status(404)
        .json({ error: "Пользователь не найден. Ученик должен зарегистрироваться по email." });
    }

    const existing = store
      .getClassMembers(classId)
      .find((m) => m.user_id === student.id);
    if (existing) {
      return res.status(409).json({ error: "Ученик уже в классе" });
    }

    // Лимит тарифа: количество учеников (уникальных по всем классам)
    const plan = store.getPlan(req.user.id);
    const usage = store.getUsage(req.user.id);
    // Ученик уже может быть в другом классе — тогда лимит не расходуется
    const alreadyStudentElsewhere = store
      .getUserClass(student.id)
      .some((m) => m.role === "student");
    if (!alreadyStudentElsewhere && usage.students >= plan.maxStudents) {
      return res.status(402).json({
        error: `Достигнут лимит тарифа ${plan.name}: ${plan.maxStudents} учеников. Обновите подписку до Pro.`,
        code: "PLAN_LIMIT_STUDENTS",
        plan: plan.id,
        limit: plan.maxStudents,
        usage: usage.students,
      });
    }

    const memberId = generateId();
    const member = store.addStudentToClass({
      id: memberId,
      classId,
      userId: student.id,
      role: "student",
    });

    res.status(201).json({ member: { ...member, user: student } });
  } catch (e) {
    console.error("add student to class error", e);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

app.delete("/api/classes/:classId/students/:userId", requireAuth, (req, res) => {
  try {
    const classId = String(req.params.classId || "").trim();
    const userId = String(req.params.userId || "").trim();
    if (!classId || !userId) {
      return res.status(400).json({ error: "Missing classId or userId" });
    }

    const classItem = store.getClass(classId);
    if (!classItem) return res.status(404).json({ error: "Class not found" });

    if (classItem.teacher_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    store.removeStudentFromClass(classId, userId);
    res.json({ ok: true });
  } catch (e) {
    console.error("remove student from class error", e);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

app.get("/api/classes/:classId/students", requireAuth, (req, res) => {
  try {
    const classId = String(req.params.classId || "").trim();
    if (!classId) return res.status(400).json({ error: "Missing classId" });
    
    const classItem = store.getClass(classId);
    if (!classItem) return res.status(404).json({ error: "Class not found" });
    
    if (classItem.teacher_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const members = store.getClassMembers(classId);
    const students = [];
    
    for (const member of members) {
      const user = store.getUserById(member.user_id);
      if (user) {
        students.push({
          ...member,
          user,
        });
      }
    }
    
    res.json({ students });
  } catch (e) {
    console.error("get class students error", e);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// Прогресс конкретного ученика класса (только владелец-учитель)
app.get("/api/classes/:classId/students/:userId/progress", requireAuth, (req, res) => {
  try {
    const classId = String(req.params.classId || "").trim();
    const userId = String(req.params.userId || "").trim();
    if (!classId || !userId) {
      return res.status(400).json({ error: "Missing classId or userId" });
    }

    const classItem = store.getClass(classId);
    if (!classItem) return res.status(404).json({ error: "Class not found" });

    if (classItem.teacher_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }

    // Ученик должен состоять в классе
    const member = store
      .getClassMembers(classId)
      .find((m) => m.user_id === userId);
    if (!member) {
      return res.status(404).json({ error: "Student not in class" });
    }

    const student = store.getUserById(userId);
    const progress = store.getTaskProgress(userId);
    const stats = store.getStats(userId);
    const assigned = store.getClassTasks(classId).filter((t) => t.assigned_to === userId);

    const assignments = assigned.map((t) => ({
      id: t.id,
      taskId: t.task_id,
      status: t.status,
      assignedAt: t.assigned_at,
      dueDate: t.due_date,
      completedAt: t.completed_at,
      taskProgress: progress[t.task_id] || null,
    }));

    res.json({
      student: student
        ? { id: student.id, name: student.name, email: student.email }
        : { id: userId },
      stats,
      progress,
      assignments,
    });
  } catch (e) {
    console.error("get student progress error", e);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

app.post("/api/classes/:classId/tasks", requireAuth, (req, res) => {
  try {
    const classId = String(req.params.classId || "").trim();
    if (!classId) return res.status(400).json({ error: "Missing classId" });
    
    const classItem = store.getClass(classId);
    if (!classItem) return res.status(404).json({ error: "Class not found" });
    
    if (classItem.teacher_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const { taskId, studentId, dueDate } = req.body || {};
    if (!taskId) return res.status(400).json({ error: "Missing taskId" });
    if (!studentId) return res.status(400).json({ error: "Missing studentId" });

    const student = store.getUserById(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const existingTask = store
      .getClassTasks(classId)
      .find((t) => t.assigned_to === studentId && t.task_id === taskId);
    if (existingTask && existingTask.status !== "completed") {
      return res.status(409).json({ error: "Task already assigned to student" });
    }

    // Лимит тарифа: назначение заданий в текущем месяце
    const plan = store.getPlan(req.user.id);
    if (Number.isFinite(plan.monthlyAssignments)) {
      const usage = store.getUsage(req.user.id);
      if (usage.monthlyAssignments >= plan.monthlyAssignments) {
        return res.status(402).json({
          error: `Достигнут лимит тарифа ${plan.name}: ${plan.monthlyAssignments} назначений заданий в месяц. Обновите подписку до Pro.`,
          code: "PLAN_LIMIT_ASSIGNMENTS",
          plan: plan.id,
          limit: plan.monthlyAssignments,
          usage: usage.monthlyAssignments,
        });
      }
    }

    const assignmentId = generateId();
    const assignedTask = store.assignTask({
      id: assignmentId,
      classId,
      taskId,
      assignedBy: req.user.id,
      assignedTo: studentId,
      dueDate,
    });
    
    res.status(201).json({ task: assignedTask });
  } catch (e) {
    console.error("assign task error", e);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

app.get("/api/classes/:classId/tasks", requireAuth, (req, res) => {
  try {
    const classId = String(req.params.classId || "").trim();
    if (!classId) return res.status(400).json({ error: "Missing classId" });
    
    const classItem = store.getClass(classId);
    if (!classItem) return res.status(404).json({ error: "Class not found" });
    
    if (classItem.teacher_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" });
    }
    
    const tasks = store.getClassTasks(classId);
    
    const tasksWithDetails = [];
    for (const task of tasks) {
      const assignedBy = store.getUserById(task.assigned_by);
      const assignedTo = store.getUserById(task.assigned_to);
      
      tasksWithDetails.push({
        ...task,
        assignedBy,
        assignedTo,
      });
    }
    
    res.json({ tasks: tasksWithDetails });
  } catch (e) {
    console.error("get class tasks error", e);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

app.get("/api/student/tasks", requireAuth, (req, res) => {
  try {
    const tasks = store.getStudentTasks(req.user.id);
    const progress = store.getTaskProgress(req.user.id);

    const tasksWithDetails = [];
    for (const task of tasks) {
      const classItem = store.getClass(task.class_id);

      tasksWithDetails.push({
        ...task,
        class: classItem,
        progress: progress[task.task_id] || null,
      });
    }

    res.json({ tasks: tasksWithDetails });
  } catch (e) {
    console.error("get student tasks error", e);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

app.put("/api/student/tasks/:taskId", requireAuth, (req, res) => {
  try {
    const taskId = String(req.params.taskId || "").trim();
    if (!taskId) return res.status(400).json({ error: "Missing taskId" });
    
    const { status, completionNotes, solved, stars } = req.body || {};

    const task = store.getStudentTasks(req.user.id).find((t) => t.id === taskId);
    if (!task) return res.status(404).json({ error: "Task not found" });

    if (solved !== undefined || stars !== undefined) {
      const allProgress = store.getTaskProgress(req.user.id);
      const current = allProgress[task.task_id] || {};
      store.setTaskProgress(
        req.user.id,
        task.task_id,
        solved !== undefined ? !!solved : !!current.solved,
        stars !== undefined ? Number(stars) : Number(current.stars) || 0,
      );
    }

    store.updateTaskStatus(taskId, status, completionNotes);
    res.json({ ok: true });
  } catch (e) {
    console.error("update task status error", e);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// ---------- Billing: подписка и тарифы ----------
app.get("/api/billing/plan", requireAuth, (req, res) => {
  const plan = store.getPlan(req.user.id);
  const usage = store.getUsage(req.user.id);
  const sub = store.getSubscription(req.user.id);
  res.json({
    plan: {
      id: plan.id,
      name: plan.name,
      maxClasses: Number.isFinite(plan.maxClasses) ? plan.maxClasses : null,
      maxStudents: Number.isFinite(plan.maxStudents) ? plan.maxStudents : null,
      monthlyAssignments: Number.isFinite(plan.monthlyAssignments) ? plan.monthlyAssignments : null,
    },
    usage,
    subscription: sub
      ? {
          plan: sub.plan,
          status: sub.status,
          promoCode: sub.promo_code,
          startedAt: sub.started_at,
          expiresAt: sub.expires_at,
        }
      : null,
  });
});

app.post("/api/billing/upgrade", requireAuth, (req, res) => {
  try {
    const { promoCode } = req.body || {};
    if (!promoCode || typeof promoCode !== "string" || !promoCode.trim()) {
      return res.status(400).json({ error: "Укажите промокод" });
    }
    const result = store.usePromoCode(promoCode, req.user.id);
    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }
    const plan = store.getPlan(req.user.id);
    const usage = store.getUsage(req.user.id);
    res.json({
      ok: true,
      plan: { id: plan.id, name: plan.name },
      expiresAt: result.expiresAt,
      usage,
    });
  } catch (e) {
    console.error("billing upgrade error", e);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// Отмена подписки (возврат на Free) — пока единственный способ «не продлевать»
app.post("/api/billing/cancel", requireAuth, (req, res) => {
  try {
    const sub = store.getSubscription(req.user.id);
    if (!sub) return res.json({ ok: true, plan: "free" });
    store.setSubscription({
      userId: req.user.id,
      plan: sub.plan,
      status: "cancelled",
      promoCode: sub.promo_code,
      expiresAt: sub.expires_at,
    });
    res.json({ ok: true, plan: "free" });
  } catch (e) {
    console.error("billing cancel error", e);
    res.status(500).json({ error: "Внутренняя ошибка сервера" });
  }
});

// ---------- OAuth (позже): заглушки, чтобы фронтенд не падал ----------
const OAUTH_CONFIGURED = {
  google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
  yandex: !!(process.env.YANDEX_CLIENT_ID && process.env.YANDEX_CLIENT_SECRET),
  github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
};

// Какие провайдеры реально работают — фронт показывает только их
app.get("/api/auth/providers", (req, res) => {
  res.json({ providers: OAUTH_CONFIGURED });
});

app.get("/api/auth/:provider", (req, res) => {
  const { provider } = req.params;
  if (!(provider in OAUTH_CONFIGURED) || !OAUTH_CONFIGURED[provider]) {
    return res
      .status(501)
      .json({ error: "Провайдер пока не настроен. Используйте вход по email." });
  }
  res.status(501).json({ error: "OAuth появится в следующей версии" });
});

// ---------- Static frontend ----------
const DIST_DIR = path.join(__dirname, "..", "app", "dist");
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR, { index: "index.html" }));
  // SPA fallback: любые не-API GET-запросы отдаём index.html
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(DIST_DIR, "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res
      .status(200)
      .send(
        "BlocklyCode API server. Frontend not built yet — run `npm run build` in app/.",
      );
  });
}

// ---------- Error handler ----------
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) return;
  res.status(500).json({ error: "Внутренняя ошибка сервера" });
});

// В тестовом режиме (BC_TEST=1) приложение экспортируется без listen:
// supertest поднимает его на эфемерном порту с временной DATA_DIR.
if (process.env.BC_TEST === "1") {
  console.log("BOOTSTRAP_SERVER (test mode, no listen)");
  module.exports = app;
} else {
  console.log("BOOTSTRAP_SERVER");
  const server = app.listen(PORT, HOST, () => {
    console.log(
      `API server running at http://${HOST}:${PORT} (driver: ${store.driver}, data: ${store.DATA_DIR})`,
    );
    // Сид тестового промокода PRO-TEST (активирует Pro на 30 дней)
    try {
      const seedCodes = ["PRO-TEST"];
      for (const code of seedCodes) {
        if (!store.getPromoCode(code)) {
          store.createPromoCode({ code, plan: "pro", expiresInDays: 365 });
          console.log(`[billing] сид промокода создан: ${code}`);
        }
      }
    } catch (e) {
      console.warn("[billing] не удалось создать сид промокодов:", e && e.message);
    }
  });
  server.on("error", (err) => {
    console.error(
      "SERVER_ERROR",
      err && (err.code || err.message),
      err && err.stack ? err.stack : "",
    );
  });
  module.exports = app;
}
