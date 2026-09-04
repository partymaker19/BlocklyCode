/**
 * Синхронизация прогресса задач: localStorage (гости/офлайн) ↔ сервер
 * (авторизованные). Локальная запись — источник немедленного UI,
 * серверная — источник для дашборда учителя и переноса между устройствами.
 *
 * Стратегия слияния: для каждой задачи берём максимум — решено на любой
 * стороне; звёзды — наибольшие из двух. Это безопасно, потому что звёзды
 * только накапливаются (перерешал оптимальнее — получил больше).
 */

import { isAuthenticated } from "./authClient";
import type { TaskId } from "./tasks";
import { markActivityToday } from "./ui/badges";

export interface TaskProgressEntry {
  solved: boolean;
  stars: number;
}

export type TaskProgressMap = Partial<Record<TaskId, TaskProgressEntry>>;

const PROGRESS_KEY = "task_progress_v1";

function loadLocal(): TaskProgressMap {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as TaskProgressMap;
  } catch {
    return {};
  }
}

function saveLocal(map: TaskProgressMap): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(map));
  } catch {
    /* приватный режим браузера — игнорируем */
  }
}

/** Объединяет две карты прогресса (максимум по solved и звёздам). */
export function mergeProgress(
  a: TaskProgressMap,
  b: TaskProgressMap,
): TaskProgressMap {
  const merged: TaskProgressMap = { ...a };
  for (const key of Object.keys(b) as TaskId[]) {
    const ea = merged[key];
    const eb = b[key];
    if (!eb) continue;
    if (!ea) {
      merged[key] = { ...eb };
      continue;
    }
    merged[key] = {
      solved: ea.solved || eb.solved,
      stars: Math.max(ea.stars, eb.stars),
    };
  }
  return merged;
}

async function fetchServerProgress(): Promise<TaskProgressMap | null> {
  try {
    const res = await fetch("/api/progress", { credentials: "include" });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      progress?: Record<
        string,
        { solved: boolean; stars: number; updatedAt?: string }
      >;
    };
    const map: TaskProgressMap = {};
    for (const [taskId, entry] of Object.entries(data.progress || {})) {
      map[taskId as TaskId] = {
        solved: !!entry.solved,
        stars: Number(entry.stars) || 0,
      };
    }
    return map;
  } catch {
    return null;
  }
}

async function pushServerProgress(
  taskId: TaskId,
  entry: TaskProgressEntry,
): Promise<void> {
  try {
    await fetch(`/api/progress/${encodeURIComponent(taskId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ solved: entry.solved, stars: entry.stars }),
    });
  } catch {
    /* офлайн — локальная копия уже сохранена */
  }
}

/**
 * Отмечает задачу решённой: пишет в localStorage и (если авторизован)
 * на сервер. Серверная отправка — «fire and forget», не блокирует UI.
 */
export function reportSolved(taskId: TaskId, stars: number): void {
  const local = loadLocal();
  const prev = local[taskId];
  local[taskId] = {
    solved: true,
    stars: Math.max(prev?.stars ?? 0, stars),
  };
  saveLocal(local);
  // День активности для серии (streak) — идемпотентно в течение дня
  markActivityToday();
  if (isAuthenticated()) {
    void pushServerProgress(taskId, local[taskId]);
  }
}

export function getLocalProgress(): TaskProgressMap {
  return loadLocal();
}

export function isSolvedLocal(taskId: TaskId): boolean {
  return !!loadLocal()[taskId]?.solved;
}

/**
 * Синхронизация при старте/логине: подтягивает серверный прогресс,
 * сливает с локальным, результат — в оба хранилища (на сервер уходит
 * только то, чего там не было, по-задачно).
 * Возвращает итоговую карту для обновления UI.
 */
export async function syncProgress(): Promise<TaskProgressMap> {
  const local = loadLocal();
  if (!isAuthenticated()) return local;

  const server = await fetchServerProgress();
  if (!server) return local;

  const merged = mergeProgress(local, server);
  saveLocal(merged);

  // Отправляем на сервер задачи, которых там нет или где локально лучше
  const promises: Promise<void>[] = [];
  for (const key of Object.keys(merged) as TaskId[]) {
    const s = server[key];
    const m = merged[key];
    if (!m?.solved) continue;
    if (!s || !s.solved || m.stars > s.stars) {
      promises.push(pushServerProgress(key, m));
    }
  }
  await Promise.all(promises);
  return merged;
}
