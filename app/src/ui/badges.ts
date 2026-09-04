/**
 * Серия дней и достижения.
 *
 * Серия (streak): дата последней активности хранится в localStorage;
 * при решении задачи день отмечается. Серия растёт, если активность
 * была и вчера (или сегодня уже отмечена), обнуляется при пропуске
 * суток. Рекорд хранится рядом.
 *
 * Достижения — чистые функции от прогресса: без сервера, без времени
 * (кроме серии дней), легко тестируются.
 */

const STREAK_KEY = "task_streak_v1";

export interface StreakState {
  /** Дата последней активности в формате YYYY-MM-DD (local). */
  lastDay: string | null;
  /** Текущая серия дней подряд. */
  current: number;
  /** Лучший рекорд серии. */
  best: number;
}

function todayLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayLocal(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function loadStreak(): StreakState {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return { lastDay: null, current: 0, best: 0 };
    const parsed = JSON.parse(raw) as Partial<StreakState>;
    return {
      lastDay: typeof parsed.lastDay === "string" ? parsed.lastDay : null,
      current: Number(parsed.current) || 0,
      best: Number(parsed.best) || 0,
    };
  } catch {
    return { lastDay: null, current: 0, best: 0 };
  }
}

function saveStreak(state: StreakState): void {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(state));
  } catch {
    /* приватный режим — серия не переживёт сессию, не критично */
  }
}

/**
 * Текущее состояние серии с учётом просрочки: если последний раз
 * заходили позавчера и раньше — серия уже оборвана, показываем 0.
 */
export function streakInfo(): StreakState {
  const s = loadStreak();
  if (!s.lastDay) return { ...s, current: 0 };
  if (s.lastDay !== todayLocal() && s.lastDay !== yesterdayLocal()) {
    return { ...s, current: 0 };
  }
  return { lastDay: s.lastDay, current: s.current, best: s.best };
}

/**
 * Отметить активность сегодня. Вызывать при каждом решённой задаче.
 * Многократный вызов в течение дня безопасен (идемпотентен).
 */
export function markActivityToday(): void {
  const today = todayLocal();
  const s = loadStreak();
  if (s.lastDay === today) return; // уже отмечено

  const cont = s.lastDay === yesterdayLocal();
  const current = cont ? s.current + 1 : 1;
  saveStreak({
    lastDay: today,
    current,
    best: Math.max(s.best, current),
  });
}

// ---------- Достижения ----------

export type BadgeId =
  | "first_step"
  | "ten_tasks"
  | "half_way"
  | "all_basic"
  | "all_tasks"
  | "star_collector"
  | "perfect_ten"
  | "week_streak";

export interface BadgeContext {
  solvedCount: number;
  totalStars: number;
  streakDays: number;
  progress: Record<string, { solved: boolean; stars: number }>;
  /** Сколько базовых задач решено (считает caller — знает список). */
  solvedBasicCount: number;
  /** Всего базовых задач. */
  basicTotal: number;
}

export interface BadgeDef {
  id: BadgeId;
  icon: string;
  /** Название (локализуется в ui/stats.ts через t()). */
  name: string;
  hint: string;
  earned: boolean;
}

/** Все достижения — чистая функция от контекста. Порядок фиксирован. */
export function computeBadges(ctx: BadgeContext): BadgeDef[] {
  return [
    {
      id: "first_step",
      icon: "🌱",
      name: "Первый шаг",
      hint: "Решите первую задачу",
      earned: ctx.solvedCount >= 1,
    },
    {
      id: "ten_tasks",
      icon: "🔟",
      name: "Десятка",
      hint: "Решите 10 задач",
      earned: ctx.solvedCount >= 10,
    },
    {
      id: "half_way",
      icon: "🧭",
      name: "Путь до середины",
      hint: "Решите 15 задач",
      earned: ctx.solvedCount >= 15,
    },
    {
      id: "all_basic",
      icon: "🎓",
      name: "База освоена",
      hint: "Решите все базовые задачи",
      earned: ctx.basicTotal > 0 && ctx.solvedBasicCount >= ctx.basicTotal,
    },
    {
      id: "all_tasks",
      icon: "👑",
      name: "Полное прохождение",
      hint: "Решите все 30 задач",
      earned: ctx.solvedCount >= 30,
    },
    {
      id: "star_collector",
      icon: "⭐",
      name: "Звездочёт",
      hint: "Соберите 50 звёзд",
      earned: ctx.totalStars >= 50,
    },
    {
      id: "perfect_ten",
      icon: "💫",
      name: "Перфекционист",
      hint: "10 задач на 3 звезды",
      earned:
        Object.values(ctx.progress).filter((p) => p.solved && p.stars >= 3)
          .length >= 10,
    },
    {
      id: "week_streak",
      icon: "🔥",
      name: "Неделя огня",
      hint: "Решайте 7 дней подряд",
      earned: ctx.streakDays >= 7,
    },
  ];
}
