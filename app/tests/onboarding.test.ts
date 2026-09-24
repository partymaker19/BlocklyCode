/**
 * Тесты онбординг-тура (ui/onboarding.ts).
 *
 * Инварианты: структура шагов (первый/последний без цели, полнота
 * RU/EN строк), логика пропуска невидимых целей, флаг «показано»
 * в localStorage, навигация оверлея в DOM.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const state = vi.hoisted(() => ({ lang: "ru" as "ru" | "en" }));
vi.mock("../src/localization", () => ({
  getAppLang: () => state.lang,
}));

import {
  TOUR_STEPS,
  ONBOARDING_FLAG_KEY,
  ONBOARDING_FLAG_VALUE,
  shouldShowOnboarding,
  nextVisibleIndex,
  prevVisibleIndex,
  startOnboarding,
  maybeStartOnboarding,
  type VisibilityCheck,
} from "../src/ui/onboarding";

const TARGET_HTML = `
  <div class="blocklyToolboxDiv"></div>
  <div id="blocklyDiv"></div>
  <div id="editor"></div>
  <button id="aceRunBtn"></button>
  <div id="output"></div>
  <button id="taskSolutionBtn"></button>
  <div id="genLangHeaderSelect"></div>
  <button id="importBlockBtn"></button>
`;

const allVisible: VisibilityCheck = () => true;
const noneVisible: VisibilityCheck = () => false;

function stubRects() {
  Element.prototype.getBoundingClientRect = function () {
    return {
      x: 10,
      y: 20,
      width: 200,
      height: 80,
      left: 10,
      top: 20,
      right: 210,
      bottom: 100,
      toJSON: () => ({}),
    } as DOMRect;
  };
}

let realRect: () => DOMRect;

beforeEach(() => {
  localStorage.clear();
  document.body.innerHTML = TARGET_HTML;
  state.lang = "ru";
  realRect = Element.prototype.getBoundingClientRect;
});

afterEach(() => {
  Element.prototype.getBoundingClientRect = realRect;
  document.body.innerHTML = "";
});

describe("структура тура", () => {
  it("первый и последний шаги без цели (приветствие/финал)", () => {
    expect(TOUR_STEPS[0].target).toBeNull();
    expect(TOUR_STEPS[TOUR_STEPS.length - 1].target).toBeNull();
  });

  it("id шагов уникальны", () => {
    const ids = TOUR_STEPS.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("каждый шаг имеет непустые тексты в RU и EN", () => {
    for (const lang of ["ru", "en"] as const) {
      state.lang = lang;
      for (const s of TOUR_STEPS) {
        expect(s.title().trim(), `${s.id}: title ${lang}`).not.toBe("");
        expect(s.body().trim(), `${s.id}: body ${lang}`).not.toBe("");
      }
    }
    state.lang = "ru";
  });
});

describe("пропуск недоступных шагов", () => {
  it("nextVisibleIndex идёт к следующему видимому", () => {
    expect(nextVisibleIndex(TOUR_STEPS, 0, allVisible)).toBe(1);
    const hide: VisibilityCheck = (sel) => sel !== "#aceRunBtn";
    // index 3 = code, index 4 = run (скрыт) → пропускаем к 5 (output)
    expect(nextVisibleIndex(TOUR_STEPS, 3, hide)).toBe(5);
  });

  it("nextVisibleIndex возвращает -1 на последнем видимом", () => {
    expect(
      nextVisibleIndex(TOUR_STEPS, TOUR_STEPS.length - 1, allVisible),
    ).toBe(-1);
  });

  it("при невидимых целях остаются только шаги без цели", () => {
    expect(nextVisibleIndex(TOUR_STEPS, 0, noneVisible)).toBe(
      TOUR_STEPS.length - 1,
    );
    expect(prevVisibleIndex(TOUR_STEPS, TOUR_STEPS.length - 1, noneVisible)).toBe(0);
  });

  it("prevVisibleIndex симметричен nextVisibleIndex", () => {
    expect(prevVisibleIndex(TOUR_STEPS, 4, allVisible)).toBe(3);
    expect(prevVisibleIndex(TOUR_STEPS, 0, allVisible)).toBe(-1);
  });
});

describe("флаг показа", () => {
  it("null/мусор → показывать, значение флага → нет", () => {
    expect(shouldShowOnboarding(null)).toBe(true);
    expect(shouldShowOnboarding("junk")).toBe(true);
    expect(shouldShowOnboarding(ONBOARDING_FLAG_VALUE)).toBe(false);
  });
});

describe("оверлей тура (DOM)", () => {
  it("старт показывает карточку с первым шагом; навигация и Escape", () => {
    stubRects();
    startOnboarding();
    const card = document.querySelector(".ob-card");
    expect(card).not.toBeNull();
    expect(document.querySelector(".ob-title")!.textContent).toBe(
      TOUR_STEPS[0].title(),
    );
    expect(document.querySelector(".ob-counter")!.textContent).toBe(
      `1 / ${TOUR_STEPS.length}`,
    );

    (document.querySelector(".ob-next") as HTMLButtonElement).click();
    expect(document.querySelector(".ob-counter")!.textContent).toBe(
      `2 / ${TOUR_STEPS.length}`,
    );
    (document.querySelector(".ob-prev") as HTMLButtonElement).click();
    expect(document.querySelector(".ob-counter")!.textContent).toBe(
      `1 / ${TOUR_STEPS.length}`,
    );

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(document.querySelector(".ob-card")).toBeNull();
    // Escape = «Пропустить»: флаг выставляется, тур больше не автозапустится
    expect(localStorage.getItem(ONBOARDING_FLAG_KEY)).toBe(
      ONBOARDING_FLAG_VALUE,
    );
  });

  it("естественное завершение (кнопка на последнем шаге) ставит флаг", () => {
    stubRects();
    startOnboarding();
    const next = document.querySelector(".ob-next") as HTMLButtonElement;
    for (let i = 0; i < TOUR_STEPS.length; i++) next.click();
    expect(document.querySelector(".ob-card")).toBeNull();
    expect(localStorage.getItem(ONBOARDING_FLAG_KEY)).toBe(
      ONBOARDING_FLAG_VALUE,
    );
  });

  it("скрытые цели автоматически пропускаются (нулевые rect в jsdom)", () => {
    // Без стаба getBoundingClientRect все цели невидимы в jsdom:
    // тур идёт welcome → finish.
    startOnboarding();
    (document.querySelector(".ob-next") as HTMLButtonElement).click();
    expect(document.querySelector(".ob-counter")!.textContent).toBe(
      `${TOUR_STEPS.length} / ${TOUR_STEPS.length}`,
    );
    expect(document.querySelector(".ob-title")!.textContent).toBe(
      TOUR_STEPS[TOUR_STEPS.length - 1].title(),
    );
  });

  it("skip-кнопка закрывает тур и ставит флаг", () => {
    stubRects();
    startOnboarding();
    (document.querySelector(".ob-skip") as HTMLButtonElement).click();
    expect(document.querySelector(".ob-card")).toBeNull();
    expect(localStorage.getItem(ONBOARDING_FLAG_KEY)).toBe(
      ONBOARDING_FLAG_VALUE,
    );
  });
});

describe("maybeStartOnboarding", () => {
  it("при выставленном флаге тур не открывается", async () => {
    localStorage.setItem(ONBOARDING_FLAG_KEY, ONBOARDING_FLAG_VALUE);
    maybeStartOnboarding(0);
    await new Promise((r) => setTimeout(r, 20));
    expect(document.querySelector(".ob-card")).toBeNull();
  });

  it("первый визит — тур открывается", async () => {
    stubRects();
    maybeStartOnboarding(0);
    await new Promise((r) => setTimeout(r, 20));
    expect(document.querySelector(".ob-card")).not.toBeNull();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  });
});
