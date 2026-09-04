/**
 * Тесты достижений и серии дней (ui/badges.ts).
 * localStorage эмулируется через jsdom (настроен в vitest.config.ts).
 */
import { beforeEach, describe, expect, it } from "vitest";
import { computeBadges, markActivityToday, streakInfo } from "../src/ui/badges";

function setStreak(lastDay: string | null, current: number, best: number) {
  localStorage.setItem(
    "task_streak_v1",
    JSON.stringify({ lastDay, current, best }),
  );
}

function isoDay(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

beforeEach(() => {
  localStorage.clear();
});

describe("streak (серия дней)", () => {
  it("новый пользователь: серия 0", () => {
    const s = streakInfo();
    expect(s.current).toBe(0);
    expect(s.lastDay).toBeNull();
  });

  it("первая решённая задача запускает серию 1", () => {
    markActivityToday();
    const s = streakInfo();
    expect(s.current).toBe(1);
    expect(s.best).toBe(1);
    expect(s.lastDay).toBe(isoDay(0));
  });

  it("повторные решения в тот же день не растят серию (идемпотентно)", () => {
    markActivityToday();
    markActivityToday();
    markActivityToday();
    expect(streakInfo().current).toBe(1);
  });

  it("активность вчера и сегодня — серия продолжается", () => {
    setStreak(isoDay(-1), 3, 5);
    markActivityToday();
    const s = streakInfo();
    expect(s.current).toBe(4);
    expect(s.best).toBe(5); // рекорд не тронут
  });

  it("пропуск суток обнуляет серию при чтении", () => {
    setStreak(isoDay(-3), 7, 7);
    const s = streakInfo();
    expect(s.current).toBe(0);
    expect(s.best).toBe(7); // рекорд хранится
  });

  it("после пропуска новая активность стартует серию заново, рекорд растёт при необходимости", () => {
    setStreak(isoDay(-3), 2, 2);
    markActivityToday();
    const s = streakInfo();
    expect(s.current).toBe(1);
    expect(s.best).toBe(2);
  });
});

describe("computeBadges (достижения)", () => {
  const base = {
    totalStars: 0,
    streakDays: 0,
    progress: {} as Record<string, { solved: boolean; stars: number }>,
    solvedBasicCount: 0,
    basicTotal: 26,
  };

  it("новичок: ничего не заработано", () => {
    const badges = computeBadges({ ...base, solvedCount: 0 });
    expect(badges.every((b) => !b.earned)).toBe(true);
    expect(badges).toHaveLength(8);
  });

  it("первая задача — значок first_step", () => {
    const badges = computeBadges({ ...base, solvedCount: 1 });
    expect(badges.find((b) => b.id === "first_step")!.earned).toBe(true);
    expect(badges.find((b) => b.id === "ten_tasks")!.earned).toBe(false);
  });

  it("все базовые — all_basic, независим от общего счётчика", () => {
    const badges = computeBadges({
      ...base,
      solvedCount: 26,
      solvedBasicCount: 26,
      basicTotal: 26,
    });
    expect(badges.find((b) => b.id === "all_basic")!.earned).toBe(true);
    expect(badges.find((b) => b.id === "all_tasks")!.earned).toBe(false);
  });

  it("перфекционист: 10 задач с 3 звёздами", () => {
    const progress: Record<string, { solved: boolean; stars: number }> = {};
    for (let i = 0; i < 9; i++) progress[`t${i}`] = { solved: true, stars: 3 };
    progress["t9"] = { solved: true, stars: 2 };
    const no = computeBadges({ ...base, solvedCount: 10, progress });
    expect(no.find((b) => b.id === "perfect_ten")!.earned).toBe(false);
    progress["t9"] = { solved: true, stars: 3 };
    const yes = computeBadges({ ...base, solvedCount: 10, progress });
    expect(yes.find((b) => b.id === "perfect_ten")!.earned).toBe(true);
  });

  it("звездочёт: 50 звёзд", () => {
    const badges = computeBadges({ ...base, solvedCount: 20, totalStars: 50 });
    expect(badges.find((b) => b.id === "star_collector")!.earned).toBe(true);
  });

  it("неделя огня: серия 7 дней", () => {
    const badges = computeBadges({ ...base, solvedCount: 7, streakDays: 7 });
    expect(badges.find((b) => b.id === "week_streak")!.earned).toBe(true);
  });
});
