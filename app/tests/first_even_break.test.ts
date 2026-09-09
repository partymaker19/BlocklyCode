import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import { forBlock as jsForBlock } from "../src/generators/javascript";
import { tasks } from "../src/tasks";

Object.assign(javascriptGenerator.forBlock, jsForBlock);

// Решение: список [7,3,8,5,2,9], forEach, если чётное → печать + прервать цикл
const solutionJson = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: "variables_set",
        fields: { VAR: { name: "list" } },
        inputs: {
          VALUE: {
            block: {
              type: "lists_create_with",
              extraState: { itemCount: 6 },
              inputs: {
                ADD0: { block: { type: "math_number", fields: { NUM: 7 } } },
                ADD1: { block: { type: "math_number", fields: { NUM: 3 } } },
                ADD2: { block: { type: "math_number", fields: { NUM: 8 } } },
                ADD3: { block: { type: "math_number", fields: { NUM: 5 } } },
                ADD4: { block: { type: "math_number", fields: { NUM: 2 } } },
                ADD5: { block: { type: "math_number", fields: { NUM: 9 } } },
              },
            },
          },
        },
        next: {
          block: {
            type: "controls_forEach",
            fields: { VAR: { name: "n" } },
            inputs: {
              LIST: {
                block: {
                  type: "variables_get",
                  fields: { VAR: { name: "list" } },
                },
              },
              DO: {
                block: {
                  type: "controls_if",
                  inputs: {
                    IF0: {
                      block: {
                        type: "math_number_property",
                        fields: { PROPERTY: "EVEN" },
                        inputs: {
                          NUMBER_TO_CHECK: {
                            block: {
                              type: "variables_get",
                              fields: { VAR: { name: "n" } },
                            },
                          },
                        },
                      },
                    },
                    DO0: {
                      block: {
                        type: "add_text",
                        inputs: {
                          TEXT: {
                            block: {
                              type: "variables_get",
                              fields: { VAR: { name: "n" } },
                            },
                          },
                        },
                        next: {
                          block: {
                            type: "controls_flow_statements",
                            fields: { FLOW: "BREAK" },
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

// То же решение, но без «прервать цикл» — выводятся все чётные (8 и 2)
const noBreakJson = JSON.parse(JSON.stringify(solutionJson));
(() => {
  const blocks = noBreakJson.blocks.blocks as any[];
  const forEach = blocks[0].next.block;
  const ifBlock = forEach.inputs.DO.block;
  delete ifBlock.inputs.DO0.block.next; // убираем break
})();

function buildWorkspace(json: unknown): Blockly.Workspace {
  const ws = new Blockly.Workspace();
  Blockly.serialization.workspaces.load(json as never, ws);
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

describe("task first_even_break (Найди первое чётное)", () => {
  it("решение с break: вывод только 8, ok и 3 звезды", async () => {
    const ws = buildWorkspace(solutionJson);
    const logs = runCode(ws);
    expect(logs).toEqual(["8"]);

    const res = await tasks["first_even_break"].validate(
      ws as never,
      logs,
      "ru",
    );
    expect(res.ok).toBe(true);
    expect(res.stars).toBe(3);
  });

  it("без break печатаются все чётные (8, 2) — не засчитывается", async () => {
    const ws = buildWorkspace(noBreakJson);
    const logs = runCode(ws);
    expect(logs).toEqual(["8", "2"]);

    const res = await tasks["first_even_break"].validate(
      ws as never,
      logs,
      "ru",
    );
    expect(res.ok).toBe(false);
    expect(res.stars).toBe(0);
  });

  it("лишние блоки понижают звёзды до 2", async () => {
    const ws = buildWorkspace(solutionJson);
    for (let k = 0; k < 8; k++) {
      Blockly.serialization.blocks.append(
        { type: "text", fields: { TEXT: "x" } } as never,
        ws,
      );
    }
    const res = await tasks["first_even_break"].validate(
      ws as never,
      ["8"],
      "ru",
    );
    expect(res.ok).toBe(true);
    expect(res.stars).toBe(2);
  });

  it("XML-решение из solutions/ проходит валидацию (3 звезды)", async () => {
    const xmlPath = path.resolve(
      __dirname,
      "../../solutions/first_even_break.xml",
    );
    const xml = fs.readFileSync(xmlPath, "utf-8");
    const dom = Blockly.utils.xml.textToDom(xml);
    const ws = new Blockly.Workspace();
    Blockly.Xml.domToWorkspace(dom, ws);

    const logs = runCode(ws);
    expect(logs).toEqual(["8"]);

    const res = await tasks["first_even_break"].validate(
      ws as never,
      logs,
      "ru",
    );
    expect(res.ok).toBe(true);
    expect(res.stars).toBe(3);
  });
});