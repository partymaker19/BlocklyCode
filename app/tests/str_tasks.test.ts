/**
 * E2E для задач раздела «Основа» про строки (29–32):
 * 1) эталонное решение из solutions/str_*.xml обязано давать 3★;
 * 2) подмена «честного» блока printing-ом константы не засчитывается;
 * 3) пустое поле и пустой вывод не проходят ни одну задачу.
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

describe("задачи про строки: эталоны дают максимум звёзд", () => {
  it("str_length: длина и разворот", async () => {
    const { lines, stars } = await checkSolution("str_length");
    expect(lines).toEqual(["7", "ylkcolB"]);
    expect(stars).toBe(3);
  });

  it("str_charat: первый, последний и третий символы", async () => {
    const { lines, stars } = await checkSolution("str_charat");
    expect(lines).toEqual(["B", "y", "o"]);
    expect(stars).toBe(3);
  });

  it("str_substring: три куска слова", async () => {
    const { lines, stars } = await checkSolution("str_substring");
    expect(lines).toEqual(["Blo", "kly", "lockl"]);
    expect(stars).toBe(3);
  });

  it("str_clean: append + trim + верхний регистр", async () => {
    const { lines, stars } = await checkSolution("str_clean");
    expect(lines).toEqual(["PRIVET!"]);
    expect(stars).toBe(3);
  });
});

describe("задачи про строки: обман печатью не засчитывается", () => {
  // Тот же вывод, но полученный текстовыми блоками без «умных» блоков.
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

  const cases: Array<[TaskId, string[]]> = [
    ["str_length", ["7", "ylkcolB"]],
    ["str_charat", ["B", "y", "o"]],
    ["str_substring", ["Blo", "kly", "lockl"]],
    ["str_clean", ["PRIVET!"]],
  ];

  for (const [id, values] of cases) {
    it(`${id}: печать констант ok=false`, async () => {
      const ws = new Blockly.Workspace();
      Blockly.serialization.workspaces.load(printOnly(values) as never, ws);
      fillOutput(values);
      const res = await tasks[id].validate(ws as never, values, "ru");
      expect(res.ok, `${id}: засчитала вывод без нужных блоков`).toBe(false);
    });
  }

  it("пустой вывод не проходит ни одну из четырёх задач", async () => {
    const ws = new Blockly.Workspace();
    fillOutput([]);
    for (const [id] of cases) {
      const res = await tasks[id].validate(ws as never, [], "ru");
      expect(res.ok, id).toBe(false);
      expect(res.stars, id).toBe(0);
    }
  });
});
