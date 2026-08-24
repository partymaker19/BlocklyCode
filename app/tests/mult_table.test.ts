import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import { forBlock as jsForBlock } from "../src/generators/javascript";
import { tasks } from "../src/tasks";

// Регистрируем кастомные генераторы JS (как это делает index.ts)
Object.assign(javascriptGenerator.forBlock, jsForBlock);

// Решение: вложенные циклы i (1..5) и j (1..5), внутри — печать строки
// "i × j = i*j", собранной через «создать текст из»
const nestedSolutionJson = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: "controls_for",
        fields: { VAR: { name: "i" } },
        inputs: {
          FROM: { shadow: { type: "math_number", fields: { NUM: 1 } } },
          TO: { shadow: { type: "math_number", fields: { NUM: 5 } } },
          BY: { shadow: { type: "math_number", fields: { NUM: 1 } } },
          DO: {
            block: {
              type: "controls_for",
              fields: { VAR: { name: "j" } },
              inputs: {
                FROM: { shadow: { type: "math_number", fields: { NUM: 1 } } },
                TO: { shadow: { type: "math_number", fields: { NUM: 5 } } },
                BY: { shadow: { type: "math_number", fields: { NUM: 1 } } },
                DO: {
                  block: {
                    type: "add_text",
                    inputs: {
                      TEXT: {
                        block: {
                          type: "text_join",
                          extraState: { itemCount: 5 },
                          inputs: {
                            ADD0: {
                              block: {
                                type: "variables_get",
                                fields: { VAR: { name: "i" } },
                              },
                            },
                            ADD1: {
                              shadow: { type: "text", fields: { TEXT: "×" } },
                            },
                            ADD2: {
                              block: {
                                type: "variables_get",
                                fields: { VAR: { name: "j" } },
                              },
                            },
                            ADD3: {
                              shadow: { type: "text", fields: { TEXT: "=" } },
                            },
                            ADD4: {
                              block: {
                                type: "math_arithmetic",
                                fields: { OP: "MULTIPLY" },
                                inputs: {
                                  A: {
                                    block: {
                                      type: "variables_get",
                                      fields: { VAR: { name: "i" } },
                                    },
                                  },
                                  B: {
                                    block: {
                                      type: "variables_get",
                                      fields: { VAR: { name: "j" } },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    ],
  },
};

function buildWorkspace(json: unknown): Blockly.Workspace {
  const ws = new Blockly.Workspace();
  Blockly.serialization.workspaces.load(json as never, ws);
  return ws;
}

function runCode(ws: Blockly.Workspace): string[] {
  const code = javascriptGenerator.workspaceToCode(ws);
  const logs: string[] = [];
  const orig = console.log;
  console.log = (...args: unknown[]) =>
    logs.push(args.map(String).join(" "));
  try {
    eval(code);
  } finally {
    console.log = orig;
  }
  return logs;
}

function makeTable(sep = "×"): string[] {
  const lines: string[] = [];
  for (let i = 1; i <= 5; i++) {
    for (let j = 1; j <= 5; j++) {
      lines.push(`${i} ${sep} ${j} = ${i * j}`);
    }
  }
  return lines;
}

describe("task mult_table (Таблица умножения)", () => {
  it("правильное решение с вложенными циклами: ok, 3 звезды", async () => {
    const ws = buildWorkspace(nestedSolutionJson);
    const logs = runCode(ws);
    expect(logs.length).toBe(25);
    expect(logs).toContain("2×3=6");
    expect(logs).toContain("5×5=25");

    const res = await tasks["mult_table"].validate(
      ws as never,
      logs,
      "ru",
    );
    expect(res.ok).toBe(true);
    expect(res.stars).toBe(3);
  });

  it("неполная таблица (3 строки) не засчитывается", async () => {
    const ws = buildWorkspace(nestedSolutionJson);
    const res = await tasks["mult_table"].validate(
      ws as never,
      ["2 × 3 = 6", "4 × 5 = 20", "5 × 5 = 25"],
      "ru",
    );
    expect(res.ok).toBe(false);
    expect(res.stars).toBe(0);
  });

  it("допускает разделитель '*' вместо '×'", async () => {
    const ws = buildWorkspace(nestedSolutionJson);
    const res = await tasks["mult_table"].validate(
      ws as never,
      makeTable("*"),
      "ru",
    );
    expect(res.ok).toBe(true);
  });

  it("неправильные примеры (2 × 3 = 7) не засчитываются", async () => {
    const ws = buildWorkspace(nestedSolutionJson);
    const bad = makeTable().map((l) =>
      l.includes("2 × 3") ? "2 × 3 = 7" : l,
    );
    const res = await tasks["mult_table"].validate(
      ws as never,
      bad,
      "ru",
    );
    expect(res.ok).toBe(false);
  });

  it("много лишних блоков понижает звёзды до 2", async () => {
    const ws = buildWorkspace(nestedSolutionJson);
    for (let k = 0; k < 14; k++) {
      Blockly.serialization.blocks.append(
        { type: "text", fields: { TEXT: "x" } } as never,
        ws,
      );
    }
    const logs = makeTable();
    const res = await tasks["mult_table"].validate(
      ws as never,
      logs,
      "ru",
    );
    expect(res.ok).toBe(true);
    expect(res.stars).toBe(2);
  });

  it("XML-решение из solutions/ проходит валидацию (3 звезды)", async () => {
    const xmlPath = path.resolve(
      __dirname,
      "../../solutions/task_22_multiplication_table.xml",
    );
    const xml = fs.readFileSync(xmlPath, "utf-8");
    const dom = Blockly.utils.xml.textToDom(xml);
    const ws = new Blockly.Workspace();
    Blockly.Xml.domToWorkspace(dom, ws);

    const logs = runCode(ws);
    expect(logs.length).toBe(25);
    expect(logs).toContain("2×3=6");
    expect(logs).toContain("5×5=25");

    const res = await tasks["mult_table"].validate(
      ws as never,
      logs,
      "ru",
    );
    expect(res.ok).toBe(true);
    expect(res.stars).toBe(3);
  });
});