/**
 * Тесты справочника тем (ui/glossary.ts).
 *
 * Инварианты: каждая тема рендерит примеры на четырёх языках, каждая тема
 * привязана хотя бы к одной задаче через infoTopics,
 * setActiveTask показывает/скрывает контейнер справочника и
 * подавляет fallback-секцию «вывод в консоль» при активной теме.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const state = vi.hoisted(() => ({ lang: "ru" as "ru" | "en" }));
vi.mock("../src/localization", () => ({
  getAppLang: () => state.lang,
}));

import {
  GLOSSARY_TOPICS,
  glossaryTopicHtml,
  mountGlossaryForTask,
  type GlossaryTopicId,
} from "../src/ui/glossary";
import { setActiveTask, tasks } from "../src/tasks";

const ALL_TOPICS: GlossaryTopicId[] = GLOSSARY_TOPICS;
const LANGS = ["JavaScript", "Python", "Lua", "PHP"];

const SIDEBAR_HTML = `
  <div id="consoleOutputInfoSection" class="console-output-info"></div>
  <div id="glossaryInfoSection" style="display:none;"></div>`;

beforeEach(() => {
  state.lang = "ru";
  document.body.innerHTML = SIDEBAR_HTML;
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("содержимое тем", () => {
  for (const topic of ALL_TOPICS) {
    it(`${topic}: заголовок, определения и примеры на 4 языках (RU)`, () => {
      const html = glossaryTopicHtml(topic);
      expect(html).toContain("<h4>");
      expect(html).toContain('ul class="code-examples"');
      for (const lang of LANGS) expect(html).toContain(`<strong>${lang}</strong>`);
    });
  }

  it("RU и EN версии различаются, но обе содержат все языки", () => {
    state.lang = "ru";
    const ru = glossaryTopicHtml("functions");
    state.lang = "en";
    const en = glossaryTopicHtml("functions");
    expect(ru).not.toBe(en);
    expect(ru).toContain("Функция");
    expect(en).toContain("named piece");
    for (const lang of LANGS) {
      expect(ru).toContain(`<strong>${lang}</strong>`);
      expect(en).toContain(`<strong>${lang}</strong>`);
    }
  });

  it("HTML-спецсимволы в коде экранированы", () => {
    const html = glossaryTopicHtml("nested_loops");
    expect(html).toContain("&lt;=");
    expect(html).not.toContain("i <= 3");
  });
});

describe("привязка тем к задачам", () => {
  const expected: Array<[string, GlossaryTopicId]> = [
    ["first_function", "functions"],
    ["function_with_param", "functions"],
    ["function_return", "functions"],
    ["mult_table", "nested_loops"],
    ["first_even_break", "break_continue"],
    ["list_sort_min_max", "sorting"],
    ["dice_rolls", "repeat_n_times"],
    ["dice_rolls", "random_numbers"],
    ["chatterbox", "user_input"],
    ["list_inventory_index", "list_indexing"],
    ["list_inventory_remove", "list_add_remove"],
    ["list_inventory_random", "list_random_choice"],
    ["str_echo", "string_accumulate"],
    ["logic_gate_check", "boolean_logic"],
    ["loop_while_count", "while_until"],
    ["list_until_empty", "list_is_empty"],
    ["list_grid", "nested_lists"],
    ["function_predicate", "predicate_functions"],
  ];
  for (const [taskId, topic] of expected) {
    it(`${taskId} → ${topic}`, () => {
      expect(tasks[taskId as keyof typeof tasks].infoTopics).toContain(topic);
    });
  }

  it("ни одна тема не осталась не привязанной к задаче", () => {
    const used = new Set(Object.values(tasks).flatMap((def) => def.infoTopics ?? []));
    for (const topic of GLOSSARY_TOPICS) {
      expect(used.has(topic), `тема ${topic} не открыта ни одной задачей`).toBe(true);
    }
  });
});

describe("mountGlossaryForTask", () => {
  it("рендерит по div на тему и показывает контейнер", () => {
    const el = document.getElementById("glossaryInfoSection")!;
    mountGlossaryForTask(el, "first_function");
    expect(el.style.display).toBe("");
    expect(el.querySelectorAll("[data-glossary-topic]")).toHaveLength(1);
    expect(el.innerHTML).toContain("JavaScript");
  });

  it("скрывает контейнер и очищает его для задачи без тем", () => {
    const el = document.getElementById("glossaryInfoSection")!;
    mountGlossaryForTask(el, "first_function");
    mountGlossaryForTask(el, "hello_world");
    expect(el.style.display).toBe("none");
    expect(el.innerHTML).toBe("");
  });
});

describe("setActiveTask и справочник", () => {
  it("задача с темой: справочник виден, консольная заглушка скрыта", () => {
    setActiveTask("mult_table");
    const glossary = document.getElementById("glossaryInfoSection")!;
    const consoleSection = document.getElementById("consoleOutputInfoSection")!;
    expect(glossary.style.display).toBe("");
    expect(glossary.innerHTML).toContain("Вложенный цикл");
    expect(consoleSection.style.display).toBe("none");
  });

  it("темы не «переезжают» при переходе на задачу без справочника", () => {
    setActiveTask("first_even_break");
    expect(document.getElementById("glossaryInfoSection")!.innerHTML).toContain("break");
    setActiveTask("hello_world");
    const glossary = document.getElementById("glossaryInfoSection")!;
    expect(glossary.innerHTML).toBe("");
    expect(glossary.style.display).toBe("none");
    expect(document.getElementById("consoleOutputInfoSection")!.style.display).toBe("");
  });
});
