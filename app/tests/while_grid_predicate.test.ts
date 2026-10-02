/**
 * E2E для шести задач, закрывающих пробелы курса: цикл «пока / пока не»,
 * повторный запрос ввода, пустой список как условие, список списков (поле 3×3),
 * функция-предикат и мини-игра «Охота за кладом».
 *
 * 1) эталонное решение из solutions/<id>.xml обязано проходить валидацию на 3★;
 * 2) тот же вывод, напечатанный текстовыми блоками, не засчитывается;
 * 3) пустой вывод не проходит ни одну задачу.
 *
 * Задачи с вводом и случайным выбором (loop_while_input, proj_treasure_hunt)
 * проверяются с «банка» выводом: блоки из XML гарантируют структуру решения.
 */
import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import { forBlock as jsForBlock } from "../src/generators/javascript";
import { tasks } from "../src/tasks";
import type { TaskId } from "../src/tasks";

Object.assign(javascriptGenerator.forBlock, jsForBlock);

const SOLUTIONS_DIR = path.resolve(__dirname, "../../solutions");

/** Задачи, чей эталон можно реально исполнить (без input() и рандома). */
const RUNNABLE: Array<[TaskId, string[]]> = [
  ["loop_while_count", ["0", "1", "2", "3", "4"]],
  ["list_until_empty", ["hammer", "saw", "chisel"]],
  ["list_grid", ["E", "C", "G"]],
  ["function_predicate", ["NO", "NO", "NO", "YES"]],
];

/** Задачи с вводом/рандомом: вывод подаётся вручную, структура берётся из XML. */
const CANNED: Array<[TaskId, string[]]> = [
  ["loop_while_input", ["Спрашиваю ещё раз…", "4"]],
  ["proj_treasure_hunt", ["sunny beach", "3"]],
];

beforeAll(() => {
  document.body.innerHTML = `<div id="output"></div>`;
});

function fillOutput(lines: string[]) {
  const out = document.getElementById("output") as HTMLDivElement;
  out.innerHTML = lines.map((l) => `<p>${l}</p>`).join("");
}

function loadSolution(id: TaskId): Blockly.Workspace {
  const xml = fs.readFileSync(path.join(SOLUTIONS_DIR, `${id}.xml`), "utf-8");
  const ws = new Blockly.Workspace();
  Blockly.Xml.domToWorkspace(Blockly.utils.xml.textToDom(xml), ws);
  return ws;
}

function runCode(ws: Blockly.Workspace): string[] {
  const code = javascriptGenerator.workspaceToCode(ws);
  const logs: string[] = [];
  const orig = console.log;
  console.log = (...args: unknown[]) => logs.push(args.map(String).join(" "));
  try {
    eval(code);
  } finally {
    console.log = orig;
  }
  return logs;
}

describe("новые задачи: эталоны дают максимум звёзд", () => {
  for (const [id, expected] of RUNNABLE) {
    it(`${id}: вывод ${expected.join(", ")}`, async () => {
      const ws = loadSolution(id);
      const lines = runCode(ws);
      fillOutput(lines);
      const res = await tasks[id].validate(ws as never, lines, "ru");
      expect(lines).toEqual(expected);
      expect(res.ok, `${id}: эталон не прошёл валидацию`).toBe(true);
      expect(res.stars).toBe(3);
      ws.dispose();
    });
  }

  for (const [id, lines] of CANNED) {
    it(`${id}: 3★ на эталонном XML`, async () => {
      const ws = loadSolution(id);
      fillOutput(lines);
      const res = await tasks[id].validate(ws as never, lines, "ru");
      expect(res.ok, `${id}: эталон не прошёл валидацию`).toBe(true);
      expect(res.stars).toBe(3);
      ws.dispose();
    });
  }
});

describe("новые задачи: обман печатью не засчитывается", () => {
  const printOnly = (values: string[]) => ({
    blocks: {
      languageVersion: 0,
      blocks: values.map((text, i) => ({
        type: "add_text",
        x: 40,
        y: 40 + i * 80,
        inputs: { TEXT: { block: { type: "text", fields: { TEXT: text } } } },
      })),
    },
  });

  for (const [id, values] of [...RUNNABLE, ...CANNED]) {
    it(`${id}: печать констант ok=false`, async () => {
      const ws = new Blockly.Workspace();
      Blockly.serialization.workspaces.load(printOnly(values) as never, ws);
      fillOutput(values);
      const res = await tasks[id].validate(ws as never, values, "ru");
      expect(res.ok, `${id}: засчитала вывод без нужных блоков`).toBe(false);
      ws.dispose();
    });
  }
});

describe("новые задачи: пустой вывод не проходит", () => {
  for (const [id] of [...RUNNABLE, ...CANNED]) {
    it(`${id}: ok=false, stars=0`, async () => {
      const ws = new Blockly.Workspace();
      fillOutput([]);
      const res = await tasks[id].validate(ws as never, [], "ru");
      expect(res.ok).toBe(false);
      expect(res.stars).toBe(0);
      ws.dispose();
    });
  }
});
