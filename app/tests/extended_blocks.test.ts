/**
 * E2E для задач раздела «Основа», построенных вокруг «умных» блоков
 * (поиск/подсчёт/замена в строке, логические операции, тернарный выбор,
 * математические блоки, чтение и правка списков):
 * 1) эталонное решение из solutions/<id>.xml обязано давать 3★ и нужный вывод;
 * 2) тот же вывод, напечатанный текстовыми блоками, не засчитывается;
 * 3) пустой вывод не проходит ни одну задачу.
 *
 * Задачи со случайным выводом (list_inventory_random, proj_inventory,
 * dice_rolls) здесь не проверяются: их решения гоняет solutions.test.ts.
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

const CASES: Array<[TaskId, string[]]> = [
  ["str_indexof", ["2", "6", "0"]],
  ["str_count", ["3", "2", "0"]],
  ["str_replace", ["M1ss1ss1pp1", "Mishishippi", "Mississippi"]],
  ["logic_and_or_not", ["NO", "YES", "NO"]],
  ["logic_ternary_task", ["MORE", "EMPTY", "NO VALUE"]],
  ["math_functions", ["12", "7", "3", "-5"]],
  ["math_round_clamp", ["4", "5", "5", "4", "100", "0"]],
  ["list_split_join", ["10", "20", "30", "10-20-30"]],
  ["list_operations", ["3", "2", "1", "5", "2"]],
  ["logic_gate_check", ["YES", "NO", "YES"]],
  ["list_inventory_index", ["3", "sword", "shield", "potion"]],
  ["list_inventory_replace", ["2", "steel sword", "wooden shield"]],
  ["list_inventory_add", ["2", "3", "magic scroll"]],
  ["list_inventory_remove", ["2", "broken helmet", "2", "mana potion", "lucky amulet"]],
];

beforeAll(() => {
  document.body.innerHTML = `<div id="output"></div>`;
});

function fillOutput(lines: string[]) {
  const out = document.getElementById("output") as HTMLDivElement;
  out.innerHTML = lines.map((l) => `<p>${l}</p>`).join("");
}

function loadXml(xml: string): Blockly.Workspace {
  const dom = Blockly.utils.xml.textToDom(xml);
  const ws = new Blockly.Workspace();
  Blockly.Xml.domToWorkspace(dom, ws);
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

/** Собирает рабочую область из XML эталонного решения и прогоняет её. */
async function checkSolution(id: TaskId): Promise<{ lines: string[]; stars: number }> {
  const xml = fs.readFileSync(path.join(SOLUTIONS_DIR, `${id}.xml`), "utf-8");
  const ws = loadXml(xml);
  const lines = runCode(ws);
  fillOutput(lines);
  const res = await tasks[id].validate(ws as never, lines, "ru");
  expect(res.ok, `${id}: эталон не прошёл валидацию`).toBe(true);
  return { lines, stars: res.stars };
}

describe("расширенные блоки: эталоны дают максимум звёзд", () => {
  for (const [id, expected] of CASES) {
    it(`${id}: вывод ${expected.join(", ")}`, async () => {
      const { lines, stars } = await checkSolution(id);
      expect(lines).toEqual(expected);
      expect(stars).toBe(3);
    });
  }
});

describe("расширенные блоки: обман печатью не засчитывается", () => {
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

  for (const [id, values] of CASES) {
    it(`${id}: печать констант ok=false`, async () => {
      const ws = new Blockly.Workspace();
      Blockly.serialization.workspaces.load(printOnly(values) as never, ws);
      fillOutput(values);
      const res = await tasks[id].validate(ws as never, values, "ru");
      expect(res.ok, `${id}: засчитала вывод без нужных блоков`).toBe(false);
    });
  }

  it("пустой вывод не проходит ни одну из девяти задач", async () => {
    const ws = new Blockly.Workspace();
    fillOutput([]);
    for (const [id] of CASES) {
      const res = await tasks[id].validate(ws as never, [], "ru");
      expect(res.ok, id).toBe(false);
      expect(res.stars, id).toBe(0);
    }
  });
});
