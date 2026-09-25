/**
 * Тесты уведомлений учителя (ui/notifications.ts).
 *
 * Инварианты: текст/заголовок уведомления (RU и EN, фолбэки), бейдж
 * непрочитанных (включая «9+»), загрузка ленты и отметка о прочтении,
 * скрытие кнопки у гостей, поллинг по таймеру.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const langState = vi.hoisted(() => ({ lang: "ru" as "ru" | "en" }));
vi.mock("../src/localization", () => ({
  getAppLang: () => langState.lang,
}));

const authState = vi.hoisted(() => ({ authed: true }));
vi.mock("../src/authClient", () => ({
  isAuthenticated: () => authState.authed,
  addAuthChangeListener: (_cb: unknown) => {},
}));

import {
  badgeLabel,
  taskTitleFor,
  notificationText,
  initNotificationsUI,
  type AppNotification,
} from "../src/ui/notifications";

const HTML = `
  <div id="headerMoreBadge" class="header-more-badge" hidden></div>
  <button id="notificationsBtn" style="display:none;"></button>
  <div id="notificationsModal" class="modal" style="display:none">
    <span id="closeNotificationsModal">&times;</span>
    <div id="notificationsBody"></div>
  </div>
`;

function notif(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: "n1",
    type: "task_completed",
    class_id: "c1",
    payload: {
      student_id: "u1",
      student_name: "Пётр",
      class_id: "c1",
      class_name: "7А",
      task_id: "hello_world",
    },
    created_at: "2026-09-25T10:00:00.000Z",
    read_at: null,
    ...overrides,
  };
}

function mockFetch(notifications: AppNotification[], unread: number) {
  const fn = vi.fn(async (url: string) => {
    if (String(url).endsWith("/api/notifications/read")) {
      return { ok: true, status: 200, json: async () => ({ ok: true }) };
    }
    return { ok: true, status: 200, json: async () => ({ notifications, unread }) };
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

beforeEach(() => {
  document.body.innerHTML = HTML;
  langState.lang = "ru";
  authState.authed = true;
  (window as any).__BC_TASKS__ = {
    hello_world: {
      id: "hello_world",
      title: (lang: string) =>
        lang === "ru" ? "Привет, мир!" : "Hello, World!",
    },
  };
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  delete (window as any).__BC_TASKS__;
  document.body.innerHTML = "";
});

describe("чистые хелперы", () => {
  it("badgeLabel: пусто, число, 9+", () => {
    expect(badgeLabel(0)).toBe("");
    expect(badgeLabel(-1)).toBe("");
    expect(badgeLabel(5)).toBe("5");
    expect(badgeLabel(12)).toBe("9+");
  });

  it("taskTitleFor берёт название из реестра, иначе id", () => {
    expect(taskTitleFor("hello_world")).toBe("Привет, мир!");
    expect(taskTitleFor("unknown_task")).toBe("unknown_task");
    langState.lang = "en";
    expect(taskTitleFor("hello_world")).toBe("Hello, World!");
  });

  it("notificationText по-русски с классом", () => {
    expect(notificationText(notif())).toBe(
      "Пётр выполнил(а) задание «Привет, мир!» — класс 7А",
    );
  });

  it("notificationText по-английски без класса", () => {
    langState.lang = "en";
    const n = notif();
    n.payload.class_name = null;
    expect(notificationText(n)).toBe(
      'Пётр completed the task "Hello, World!"',
    );
  });

  it("notificationText: нет имени — id ученика, нет ничего — «?»", () => {
    const n = notif();
    delete n.payload.student_name;
    expect(notificationText(n)).toContain("u1");
    const m = notif();
    delete m.payload.student_name;
    m.payload.student_id = "";
    expect(notificationText(m)).toContain("?");
  });
});

describe("UI в DOM", () => {
  it("init под авторизацией показывает кнопку и рисует бейдж", async () => {
    mockFetch([notif()], 2);
    initNotificationsUI();
    await vi.advanceTimersByTimeAsync(0);

    const btn = document.getElementById("notificationsBtn");
    const badge = document.getElementById("headerMoreBadge");
    expect(btn?.style.display).toBe("inline-flex");
    expect(badge?.hidden).toBe(false);
    expect(badge?.textContent).toBe("2");
  });

  it("гость: кнопка скрыта, запросов нет", async () => {
    authState.authed = false;
    const fn = mockFetch([], 0);
    initNotificationsUI();
    await vi.advanceTimersByTimeAsync(0);

    expect(document.getElementById("notificationsBtn")?.style.display).toBe(
      "none",
    );
    expect(fn).not.toHaveBeenCalled();
  });

  it("открытие: список отрендерен, прочитанное отмечает бейдж пустым", async () => {
    const fn = mockFetch([notif()], 1);
    initNotificationsUI();
    await vi.advanceTimersByTimeAsync(0);

    document
      .getElementById("notificationsBtn")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(0);

    expect(
      (document.getElementById("notificationsModal") as HTMLElement).style
        .display,
    ).toBe("block");
    const body = document.getElementById("notificationsBody");
    expect(body?.innerHTML).toContain("Пётр выполнил(а) задание");
    expect(
      fn.mock.calls.some((c) => String(c[0]).endsWith("/api/notifications/read")),
    ).toBe(true);
    const badge = document.getElementById("headerMoreBadge");
    expect(badge?.hidden).toBe(true);
  });

  it("пустая лента — подсказка об отсутствии уведомлений", async () => {
    mockFetch([], 0);
    initNotificationsUI();
    await vi.advanceTimersByTimeAsync(0);

    document
      .getElementById("notificationsBtn")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await vi.advanceTimersByTimeAsync(0);

    expect(document.getElementById("notificationsBody")?.textContent).toContain(
      "Пока нет уведомлений",
    );
  });

  it("поллинг: через 60 секунд — новый запрос ленты", async () => {
    const fn = mockFetch([notif()], 1);
    initNotificationsUI();
    await vi.advanceTimersByTimeAsync(0);
    const before = fn.mock.calls.length;

    await vi.advanceTimersByTimeAsync(60_000);
    expect(fn.mock.calls.length).toBeGreaterThan(before);
  });
});
