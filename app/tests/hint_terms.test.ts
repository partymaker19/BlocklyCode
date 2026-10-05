/**
 * Тесты выделения названий блоков/разделов в подсказках (ui/hintTerms.ts).
 *
 * Последний тест — guard дрейфа: частые фразы в кавычках из подсказок всех
 * задач либо опознаны как термин, либо лежат в NOT_A_TERM. Новый блок,
 * упомянутый в подсказке без регистрации в словаре, уронит этот тест.
 */
import { describe, expect, it } from "vitest";
import { tasks } from "../src/tasks";
import {
  matchHintTerm,
  normalizeTerm,
  renderHintText,
  type HintTermStyle,
} from "../src/ui/hintTerms";

describe("matchHintTerm", () => {
  it("узнаёт точное название блока", () => {
    expect(matchHintTerm("Вывести … цвет …")).toBe("text_category");
    expect(matchHintTerm("Print … color …")).toBe("text_category");
    expect(matchHintTerm("создать список из")).toBe("list_category");
  });

  it("нормализует ASCII-многоточие и лишний пробел", () => {
    expect(matchHintTerm("Вывести ... цвет ...")).toBe("text_category");
    expect(matchHintTerm("  Вывести   …   цвет   …  ")).toBe("text_category");
  });

  it("узнаёт блок с подставленными значениями", () => {
    expect(matchHintTerm("увеличить sum на i")).toBe("variable_category");
    expect(matchHintTerm("цикл по i от 1 до 4 с шагом 1")).toBe("loop_category");
    expect(matchHintTerm("в списке inventory взять № 1")).toBe("list_category");
    expect(matchHintTerm("change sum by i")).toBe("variable_category");
    expect(matchHintTerm("count with i from 1 to 4 by 1")).toBe("loop_category");
  });

  it("узнаёт названия разделов, включая падежные формы", () => {
    expect(matchHintTerm("Текст")).toBe("text_category");
    expect(matchHintTerm("Математики")).toBe("math_category");
    expect(matchHintTerm("Функциях")).toBe("procedure_category");
    expect(matchHintTerm("Custom blocks")).toBe("custom");
  });

  it("не считает термином ожидаемый вывод и имена переменных", () => {
    expect(matchHintTerm("Hello, World!")).toBeNull();
    expect(matchHintTerm("banana")).toBeNull();
    expect(matchHintTerm("▶")).toBeNull();
    expect(matchHintTerm("Проверить решение")).toBeNull();
    expect(matchHintTerm("The number is even")).toBeNull();
  });

  it("не раскрывает wildcard в шаблоне, начинающемся со слота", () => {
    expect(matchHintTerm("текст и ещё текст")).toBeNull();
    expect(matchHintTerm("… и …")).toBe("logic_category");
  });

  it("нормализация приводит фразы к одному виду", () => {
    expect(normalizeTerm("Вывести ... цвет ...")).toBe("вывести … цвет …");
    expect(normalizeTerm("  Повторять,   пока …  ")).toBe("повторять, пока …");
  });
});

describe("renderHintText", () => {
  it("заворачивает термины в span с цветом категории", () => {
    const frag = renderHintText(
      "В категории «Текст» возьмите блок «Вывести … цвет …» и нажмите «Проверить решение».",
    );
    const host = document.createElement("div");
    host.appendChild(frag);
    const terms = [...host.querySelectorAll("span.hint-term")];
    expect(terms).toHaveLength(2);
    expect(terms[0].textContent).toBe("«Текст»");
    expect(terms[1].textContent).toBe("«Вывести … цвет …»");
    expect(terms[0].style.getPropertyValue("--hint-term")).toMatch(/^#/);
    expect(host.textContent).toContain("«Проверить решение»");
  });

  it("сохраняет текст без изменений, если терминов нет", () => {
    const frag = renderHintText("Просто текст без «названий блоков».");
    const host = document.createElement("div");
    host.appendChild(frag);
    expect(host.querySelector("span")).toBeNull();
    expect(host.textContent).toBe("Просто текст без «названий блоков».");
  });
});

/** Фразы в кавычках, которые называются часто, но блоками не являются. */
const NOT_A_TERM = new Set([
  "проверить решение",
  "check solution",
  "▶",
  "blockly",
  "a",
  "ss",
  "sh",
  "banana",
  "mississippi",
  "hello,",
  "the number is even",
  "the number is odd",
  "запустить код",
  "run code",
]);

describe("guard дрейфа по всем подсказкам", () => {
  it("каждая частая фраза в кавычках — термин или в списке исключений", () => {
    const counts = new Map<string, number>();
    for (const task of Object.values(tasks)) {
      for (const lang of ["ru", "en"] as const) {
        for (const m of task.hint(lang).matchAll(/[«“]([^»”\n]{1,90})[»”]/g)) {
          const key = normalizeTerm(m[1]);
          counts.set(key, (counts.get(key) ?? 0) + 1);
        }
      }
    }
    const unsorted: string[] = [];
    for (const [phrase, n] of counts) {
      if (n < 3 || NOT_A_TERM.has(phrase)) continue;
      if (!matchHintTerm(phrase)) unsorted.push(`${n}× ${phrase}`);
    }
    expect(unsorted).toEqual([]);
  });

  it("каждый зарегистрированный стиль отдаёт цвет", () => {
    const styles: HintTermStyle[] = [
      "logic_category",
      "loop_category",
      "math_category",
      "text_category",
      "list_category",
      "variable_category",
      "procedure_category",
      "custom",
    ];
    for (const style of styles) {
      const sample =
        style === "custom" ? "Битмап: …" : samplePhraseOf(style);
      expect(matchHintTerm(sample)).toBe(style);
    }
  });
});

/** Опорная фраза для стиля — используется только в тесте цветов. */
function samplePhraseOf(style: HintTermStyle): string {
  const samples: Record<HintTermStyle, string> = {
    logic_category: "если … иначе",
    loop_category: "повторить … раз",
    math_category: "округлить …",
    text_category: "длина …",
    list_category: "создать список из",
    variable_category: "присвоить …",
    procedure_category: "вернуть …",
    custom: "Слайдер: …",
  };
  return samples[style];
}
