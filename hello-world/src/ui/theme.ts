/**
 * Управление темой приложения: состояние, переключатель, применение к Blockly workspace.
 */
import * as Blockly from "blockly/core";
import DarkTheme from "@blockly/theme-dark";

export type AppTheme = "light" | "dark";
const APP_THEME_KEY = "app_theme";

let appTheme: AppTheme = "light";
let themeSwitchTimer: number | null = null;

// Элементы UI
let themeSwitchInput: HTMLInputElement | null = null;
let themeLabelLight: HTMLSpanElement | null = null;
let themeLabelDark: HTMLSpanElement | null = null;

// Коллбеки, которые вызываются при смене темы
type ThemeChangeCallback = (theme: AppTheme) => void;
const listeners: ThemeChangeCallback[] = [];

export function getCurrentTheme(): AppTheme {
  return appTheme;
}

export function isDarkTheme(): boolean {
  return appTheme === "dark";
}

/**
 * Получить объект темы для Blockly workspace
 */
export function getBlocklyTheme(): Blockly.Theme {
  return appTheme === "dark"
    ? (DarkTheme as unknown as Blockly.Theme)
    : Blockly.Themes.Classic;
}

/**
 * Цвет сетки в зависимости от темы
 */
export function getGridColor(): string {
  return appTheme === "dark" ? "#374151" : "#ccc";
}

/**
 * Подписаться на изменение темы
 */
export function onThemeChange(cb: ThemeChangeCallback): void {
  listeners.push(cb);
}

function notifyThemeChange() {
  for (const cb of listeners) {
    try {
      cb(appTheme);
    } catch (e) {
      console.error("Theme change listener error:", e);
    }
  }
}

/**
 * Установить тему
 * @param next  Новая тема
 * @param persist  Сохранять ли в localStorage (по умолчанию true)
 */
export function setAppTheme(next: AppTheme, persist = true): void {
  if (appTheme === next) return;
  appTheme = next;

  if (themeLabelLight && themeLabelDark) {
    themeLabelLight.classList.toggle("active", appTheme === "light");
    themeLabelDark.classList.toggle("active", appTheme === "dark");
  }
  document.documentElement.setAttribute("data-theme", appTheme);

  if (persist) {
    try {
      localStorage.setItem(APP_THEME_KEY, appTheme);
    } catch {}
  }

  notifyThemeChange();
}

/**
 * Инициализация: чтение сохранённой темы, привязка UI переключателя
 */
export function initThemeUI(): void {
  // Пробуем восстановить из localStorage
  try {
    const saved = localStorage.getItem(APP_THEME_KEY);
    if (saved === "light" || saved === "dark") {
      appTheme = saved;
    }
  } catch {}

  themeSwitchInput = document.getElementById(
    "themeSwitchInput",
  ) as HTMLInputElement | null;
  themeLabelLight = document.getElementById(
    "theme-light",
  ) as HTMLSpanElement | null;
  themeLabelDark = document.getElementById(
    "theme-dark",
  ) as HTMLSpanElement | null;

  // Применяем начальное состояние
  document.documentElement.setAttribute("data-theme", appTheme);

  if (!themeSwitchInput) return;

  themeSwitchInput.checked = appTheme === "dark";
  if (themeLabelLight && themeLabelDark) {
    themeLabelLight.classList.toggle("active", appTheme === "light");
    themeLabelDark.classList.toggle("active", appTheme === "dark");
  }

  themeSwitchInput.addEventListener("change", (e: Event) => {
    const checked = (e.target as HTMLInputElement).checked;
    if (themeSwitchTimer) clearTimeout(themeSwitchTimer);
    themeSwitchTimer = window.setTimeout(() => {
      setAppTheme(checked ? "dark" : "light");
    }, 120);
  });
}
