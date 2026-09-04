/**
 * Тесты пошаговых подсказок (ui/hintSteps.ts):
 * парсер разбора hint-строк «Пошаговое решение:\n1. …\n2. …».
 */
import { describe, expect, it } from "vitest";
import { parseHintSteps } from "../src/ui/hintSteps";

describe("parseHintSteps", () => {
  it("разбирает пронумерованный список с заголовком", () => {
    const hint =
      "Пошаговое решение:\n1. Первый шаг.\n2. Второй шаг.\n3. Третий шаг.";
    expect(parseHintSteps(hint)).toEqual([
      "Первый шаг.",
      "Второй шаг.",
      "Третий шаг.",
    ]);
  });

  it("разбирает список со скобочной нумерацией 1)", () => {
    const hint = "Step by step:\n1) Take a block\n2) Run code";
    expect(parseHintSteps(hint)).toEqual(["Take a block", "Run code"]);
  });

  it("склеивает строки-продолжения с предыдущим шагом", () => {
    const hint = "Решение:\n1. Шаг первый\nи его продолжение\n2. Шаг второй";
    expect(parseHintSteps(hint)).toEqual([
      "Шаг первый и его продолжение",
      "Шаг второй",
    ]);
  });

  it("возвращает null для обычного текста без нумерации", () => {
    expect(parseHintSteps("Просто подсказка без шагов.")).toBeNull();
  });

  it("возвращает null для одиночного шага (нет смысла дробить)", () => {
    expect(parseHintSteps("Шаги:\n1. Единственный шаг.")).toBeNull();
  });

  it("реальный формат задачи hello_world (RU)", () => {
    const hint =
      "Пошаговое решение:\n1. В категории «Текст» возьмите блок «Добавить текст … цвет …» и перетащите его на рабочее поле.\n2. Впишите в поле блока фразу Hello World! (цвет можно оставить пустым).\n3. Нажмите кнопку «▶» («Запустить код») в редакторе — в окне вывода появится Hello World!.\n4. Нажмите «Проверить решение» — задача будет засчитана.";
    const steps = parseHintSteps(hint);
    expect(steps).not.toBeNull();
    expect(steps).toHaveLength(4);
    expect(steps![0]).toContain("Добавить текст");
    expect(steps![3]).toContain("Проверить решение");
  });

  it("реальный формат задачи hello_world (EN)", () => {
    const hint =
      "Step by step:\n1. In the Text category, take the “Add text … color …” block and drag it onto the workspace.\n2. Type the phrase Hello World! directly into the block's text field (you can leave the color empty).\n3. Press the “▶” (“Run code”) button in the editor — the output will show Hello World!.\n4. Press “Check solution” — the task will be accepted.";
    const steps = parseHintSteps(hint);
    expect(steps).toHaveLength(4);
    expect(steps![1]).toContain("Hello World!");
  });
});
