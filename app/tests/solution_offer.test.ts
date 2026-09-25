/**
 * Регресс (ui): плашка «✓ Решение добавлено на поле справа» живёт в
 * #taskSolutionOffer и не должна переноситься на другие задачи —
 * setActiveTask обязан очищать контейнер при любом переходе.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { setActiveTask } from "../src/tasks";

beforeEach(() => {
  document.body.innerHTML = "";
});

afterEach(() => {
  document.body.innerHTML = "";
});

describe("смена задачи и предложение решения", () => {
  it("setActiveTask очищает #taskSolutionOffer", () => {
    document.body.innerHTML = `
      <div id="taskSolutionOffer">
        <button disabled>✓ Решение добавлено на поле справа</button>
      </div>`;

    setActiveTask("hello_world");
    expect(document.getElementById("taskSolutionOffer")?.innerHTML).toBe("");

    // и при повторном переходе — тоже
    document.getElementById("taskSolutionOffer")!.innerHTML = "<b>остаток</b>";
    setActiveTask("add_2_7");
    expect(document.getElementById("taskSolutionOffer")?.innerHTML).toBe("");
  });
});
