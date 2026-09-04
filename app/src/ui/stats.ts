/**
 * Экран статистики ученика: решённые задачи, звёзды, серия дней,
 * достижения. Данные — из прогресса задач (progressSync) + локальный
 * счётчик серии дней. Чистые функции достижений вынесены в badges.ts.
 */

import { getAppLang } from "../localization";
import { getLocalProgress } from "../progressSync";
import { tasks, type TaskId } from "../tasks";
import {
  computeBadges,
  streakInfo,
  markActivityToday,
  type BadgeId,
} from "./badges";

function byId<T extends HTMLElement = HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function t(ru: string, en: string): string {
  return getAppLang() === "ru" ? ru : en;
}

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Открывает экран статистики (модалка statsModal из index.html).
 * Пересчитывает всё при каждом открытии — прогресс мог измениться.
 */
export function openStatsModal(): void {
  const modal = byId<HTMLDivElement>("statsModal");
  const body = byId("statsBody");
  if (!modal || !body) return;

  // Активность сегодня (открыл статистику — тоже engaged, но честнее
  // отмечать только решения; серию двигает markActivityToday из задач)
  const progress = getLocalProgress();
  const solvedIds = (Object.keys(progress) as TaskId[]).filter(
    (id) => progress[id]?.solved,
  );
  const totalStars = solvedIds.reduce(
    (acc, id) => acc + (progress[id]?.stars || 0),
    0,
  );
  const maxStars = (Object.keys(tasks) as TaskId[]).length * 3;

  const basicIds = (Object.keys(tasks) as TaskId[]).filter(
    (id) => tasks[id].difficulty === "basic",
  );
  const advancedIds = (Object.keys(tasks) as TaskId[]).filter(
    (id) => tasks[id].difficulty === "advanced",
  );
  const solvedBasic = basicIds.filter((id) => progress[id]?.solved).length;
  const solvedAdvanced = advancedIds.filter((id) => progress[id]?.solved).length;

  const streak = streakInfo();
  const badges = computeBadges({
    solvedCount: solvedIds.length,
    totalStars,
    streakDays: streak.current,
    progress: progress as Record<string, { solved: boolean; stars: number }>,
    solvedBasicCount: solvedBasic,
    basicTotal: basicIds.length,
  });

  // Локализация названий значков
  const badgeNames: Record<string, [string, string]> = {
    first_step: ["Первый шаг", "First step"],
    ten_tasks: ["Десятка", "Ten down"],
    half_way: ["Путь до середины", "Halfway there"],
    all_basic: ["База освоена", "Basics done"],
    all_tasks: ["Полное прохождение", "Full clear"],
    star_collector: ["Звездочёт", "Star gazer"],
    perfect_ten: ["Перфекционист", "Perfectionist"],
    week_streak: ["Неделя огня", "Week on fire"],
  };
  for (const b of badges) {
    const pair = badgeNames[b.id];
    if (pair) b.name = t(pair[0], pair[1]);
  }

  const bar = (current: number, max: number) => {
    const pct = max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 0;
    return `<div class="stats-bar"><div class="stats-bar-fill" style="width:${pct}%"></div><span class="stats-bar-label">${current} / ${max}</span></div>`;
  };

  body.innerHTML = `
    <div class="stats-cards">
      <div class="stats-card">
        <div class="stats-card-value">${solvedIds.length}</div>
        <div class="stats-card-label">${esc(t("задач решено", "tasks solved"))}</div>
        ${bar(solvedIds.length, (Object.keys(tasks) as TaskId[]).length)}
      </div>
      <div class="stats-card">
        <div class="stats-card-value">★ ${totalStars}</div>
        <div class="stats-card-label">${esc(t("звёзд собрано", "stars collected"))}</div>
        ${bar(totalStars, maxStars)}
      </div>
      <div class="stats-card">
        <div class="stats-card-value">🔥 ${streak.current}</div>
        <div class="stats-card-label">${esc(t("дней подряд", "day streak"))}</div>
        <div class="stats-card-sub">${esc(t(`Рекорд: ${streak.best}`, `Best: ${streak.best}`))}</div>
      </div>
    </div>

    <div class="stats-section">
      <h4>${esc(t("По уровням", "By level"))}</h4>
      <div class="stats-level">
        <span>${esc(t("Основа", "Basic"))}</span>
        ${bar(solvedBasic, basicIds.length)}
      </div>
      <div class="stats-level">
        <span>${esc(t("Продвинутый", "Advanced"))}</span>
        ${bar(solvedAdvanced, advancedIds.length)}
      </div>
    </div>

    <div class="stats-section">
      <h4>${esc(t("Достижения", "Achievements"))}</h4>
      <div class="badges-grid">
        ${badges
          .map(
            (b) => `
          <div class="badge ${b.earned ? "earned" : ""}" title="${esc(b.hint)}">
            <div class="badge-icon">${b.icon}</div>
            <div class="badge-name">${esc(b.name)}</div>
            <div class="badge-state">${b.earned ? "✓" : "·"}</div>
          </div>`,
          )
          .join("")}
      </div>
    </div>`;

  modal.style.display = "block";
}

/** Инициализация: кнопка в шапке + открытие/закрытие модалки. */
export function initStatsUI(): void {
  const openBtn = byId<HTMLButtonElement>("statsBtn");
  const closeBtn = byId("closeStatsModal");
  const modal = byId<HTMLDivElement>("statsModal");
  if (!openBtn || !modal) return;

  openBtn.addEventListener("click", openStatsModal);
  closeBtn?.addEventListener("click", () => {
    modal.style.display = "none";
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
}

/** Реэкспорт для задач: отмечать день активности при решении. */
export { markActivityToday, type BadgeId };
