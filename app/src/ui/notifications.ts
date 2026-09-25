/**
 * Лента уведомлений учителя: «ученик выполнил задание».
 * Уведомления создаёт сервер при завершении назначения (server/index.js);
 * здесь — бейдж непрочитанных на кнопке «⋯» и модальная панель со списком.
 */

import { addAuthChangeListener, isAuthenticated } from "../authClient";
import { getAppLang } from "../localization";

export interface TaskCompletedPayload {
  student_id?: string;
  student_name?: string;
  class_id?: string;
  class_name?: string | null;
  task_id?: string;
}

export interface AppNotification {
  id: string;
  type: string;
  class_id: string | null;
  payload: TaskCompletedPayload;
  created_at: string;
  read_at: string | null;
}

const POLL_INTERVAL_MS = 60_000;

function byId<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function t(ru: string, en: string): string {
  return getAppLang() === "ru" ? ru : en;
}

/** Название задачи из реестра (window.__BC_TASKS__), иначе — сам id. */
export function taskTitleFor(taskId: string): string {
  if (!taskId) return taskId;
  const def = (window as any).__BC_TASKS__?.[taskId];
  if (def && typeof def.title === "function") {
    try {
      return def.title(getAppLang() === "ru" ? "ru" : "en");
    } catch {
      return taskId;
    }
  }
  return taskId;
}

/** Текст одного уведомления для списка. */
export function notificationText(n: AppNotification): string {
  const lang = getAppLang() === "ru" ? "ru" : "en";
  const name = n.payload.student_name || n.payload.student_id || "?";
  const title = taskTitleFor(n.payload.task_id || "");
  const cls = n.payload.class_name;
  if (lang === "ru") {
    return `${name} выполнил(а) задание «${title}»${cls ? ` — класс ${cls}` : ""}`;
  }
  return `${name} completed the task "${title}"${cls ? ` — class ${cls}` : ""}`;
}

/** Короткая строка для бейджа/списка: «3 unread»-style счётчик не нужен — бейдж показывает число. */
export function badgeLabel(unread: number): string {
  if (unread <= 0) return "";
  return unread > 9 ? "9+" : String(unread);
}

export async function fetchNotifications(): Promise<{
  notifications: AppNotification[];
  unread: number;
}> {
  const res = await fetch("/api/notifications", { credentials: "include" });
  const data = (await res.json().catch(() => ({}))) as {
    notifications?: AppNotification[];
    unread?: number;
    error?: string;
  };
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return {
    notifications: data.notifications || [],
    unread: Number(data.unread) || 0,
  };
}

export async function markNotificationsRead(): Promise<void> {
  try {
    await fetch("/api/notifications/read", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    /* сеть недоступна — бейдж обновится при следующем поллинге */
  }
}

let lastNotifications: AppNotification[] = [];
let unread = 0;
let modalOpen = false;

function renderBadge(): void {
  const badge = byId<HTMLElement>("headerMoreBadge");
  if (!badge) return;
  const label = badgeLabel(unread);
  badge.hidden = !label;
  badge.textContent = label;
}

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function renderList(body: HTMLElement): void {
  if (!lastNotifications.length) {
    body.innerHTML = `<p class="classes-empty">${esc(
      t(
        "Пока нет уведомлений. Здесь появятся сообщения, когда ученики выполнят назначенные задания.",
        "No notifications yet. Messages appear here when students complete assigned tasks.",
      ),
    )}</p>`;
    return;
  }
  body.innerHTML = lastNotifications
    .map(
      (n) => `
      <div class="notif-item${n.read_at ? "" : " unread"}">
        <div class="notif-text">${esc(notificationText(n))}</div>
        <div class="notif-time">${esc(fmtDateTime(n.created_at))}</div>
      </div>`,
    )
    .join("");
}

async function refresh(): Promise<void> {
  if (!isAuthenticated()) {
    lastNotifications = [];
    unread = 0;
    renderBadge();
    return;
  }
  try {
    const data = await fetchNotifications();
    lastNotifications = data.notifications;
    unread = data.unread;
    renderBadge();
    const body = byId<HTMLElement>("notificationsBody");
    if (body && modalOpen) renderList(body);
  } catch {
    /* 401/сеть — тихо, поллинг повторит */
  }
}

async function openModal(): Promise<void> {
  const modal = byId<HTMLElement>("notificationsModal");
  if (!modal) return;
  modal.style.display = "block";
  modalOpen = true;
  await refresh();
  if (unread > 0) {
    await markNotificationsRead();
    unread = 0;
    renderBadge();
  }
}

function closeModal(): void {
  const modal = byId<HTMLElement>("notificationsModal");
  if (modal) modal.style.display = "none";
  modalOpen = false;
}

/** Инициализация: кнопка, модалка, поллинг непрочитанных, видимость по авторизации. */
export function initNotificationsUI(): void {
  const openBtn = byId<HTMLButtonElement>("notificationsBtn");
  const closeBtn = byId<HTMLElement>("closeNotificationsModal");
  const modal = byId<HTMLElement>("notificationsModal");
  const mobileBtn = byId<HTMLButtonElement>("mobileNotificationsBtn");

  openBtn?.addEventListener("click", () => void openModal());
  closeBtn?.addEventListener("click", closeModal);
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  const syncVisibility = () => {
    const authed = isAuthenticated();
    if (openBtn) openBtn.style.display = authed ? "inline-flex" : "none";
    if (mobileBtn) mobileBtn.style.display = authed ? "" : "none";
  };
  addAuthChangeListener(() => {
    syncVisibility();
    void refresh();
  });
  syncVisibility();
  void refresh();
  setInterval(() => void refresh(), POLL_INTERVAL_MS);
}
