import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import { forBlock as jsForBlock } from "../src/generators/javascript";
import { tasks } from "../src/tasks";

Object.assign(javascriptGenerator.forBlock, jsForBlock);

// Решение: функция greet с параметром name печатает «Привет, <имя>!»,
// два вызова — с именами Аня и Боря
const solutionJson = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: "procedures_defnoreturn",
        fields: { NAME: "greet" },
        extraState: { params: [{ name: "name", id: "gwp-name" }] },
        inputs: {
          STACK: {
            block: {
              type: "add_text",
              inputs: {
                TEXT: {
                  block: {
                    type: "text_join",
                    extraState: { itemCount: 3 },
                    inputs: {
                      ADD0: {
                        shadow: { type: "text", fields: { TEXT: "Привет, " } },
                      },
                      ADD1: {
                        block: {
                          type: "variables_get",
                          fields: { VAR: { name: "name" } },
                        },
                      },
                      ADD2: { shadow: { type: "text", fields: { TEXT: "!" } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        type: "procedures_callnoreturn",
        extraState: { name: "greet", params: ["name"] },
        inputs: {
          ARG0: { shadow: { type: "text", fields: { TEXT: "Аня" } } },
        },
      },
      {
        type: "procedures_callnoreturn",
        extraState: { name: "greet", params: ["name"] },
        inputs: {
          ARG0: { shadow: { type: "text", fields: { TEXT: "Боря" } } },
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
  console.log = (...args: unknown[]) => logs.push(args.map(String).join(" "));
  try {
    eval(code);
  } finally {
    console.log = orig;
  }
  return logs;
}

describe("task function_with_param (Функция с параметром)", () => {
  it("функция с параметром + два вызова: ok и 3 звезды", async () => {
    const ws = buildWorkspace(solutionJson);
    const logs = runCode(ws);
    expect(logs).toEqual(["Привет, Аня!", "Привет, Боря!"]);

    const res = await tasks["function_with_param"].validate(
      ws as never,
      logs,
      "ru",
    );
    expect(res.ok).toBe(true);
    expect(res.stars).toBe(3);
  });

  it("XML-решение из solutions/ проходит валидацию (3 звезды)", async () => {
    const xmlPath = path.resolve(
      __dirname,
      "../../solutions/task_25_function_with_param.xml",
    );
    const xml = fs.readFileSync(xmlPath, "utf-8");
    const dom = Blockly.utils.xml.textToDom(xml);
    const ws = new Blockly.Workspace();
    Blockly.Xml.domToWorkspace(dom, ws);

    const logs = runCode(ws);
    expect(logs).toEqual(["Привет, Аня!", "Привет, Боря!"]);

    const res = await tasks["function_with_param"].validate(
      ws as never,
      logs,
      "ru",
    );
    expect(res.ok).toBe(true);
    expect(res.stars).toBe(3);
  });
});
