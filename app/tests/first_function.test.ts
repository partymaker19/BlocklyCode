import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import { forBlock as jsForBlock } from "../src/generators/javascript";
import { tasks } from "../src/tasks";

Object.assign(javascriptGenerator.forBlock, jsForBlock);

// Решение: функция greet печатает Hello, world!, три блока вызова greet
const solutionJson = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: "procedures_defnoreturn",
        fields: { NAME: "greet" },
        inputs: {
          STACK: {
            block: {
              type: "add_text",
              inputs: {
                TEXT: {
                  shadow: { type: "text", fields: { TEXT: "Hello, world!" } },
                },
              },
            },
          },
        },
      },
      { type: "procedures_callnoreturn", extraState: { name: "greet" } },
      { type: "procedures_callnoreturn", extraState: { name: "greet" } },
      { type: "procedures_callnoreturn", extraState: { name: "greet" } },
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

describe("task first_function (Моя первая функция)", () => {
  it("функция + три вызова: вывод трижды, ok и 3 звезды", async () => {
    const ws = buildWorkspace(solutionJson);
    const logs = runCode(ws);
    expect(logs).toEqual(["Hello, world!", "Hello, world!", "Hello, world!"]);

    const res = await tasks["first_function"].validate(ws as never, logs, "ru");
    expect(res.ok).toBe(true);
    expect(res.stars).toBe(3);
  });

  it("только два вызова — не засчитывается", async () => {
    const json = JSON.parse(JSON.stringify(solutionJson));
    (json.blocks.blocks as any[]).pop(); // убираем третий вызов
    const ws = buildWorkspace(json);
    const logs = runCode(ws);
    expect(logs).toEqual(["Hello, world!", "Hello, world!"]);

    const res = await tasks["first_function"].validate(ws as never, logs, "ru");
    expect(res.ok).toBe(false);
    expect(res.stars).toBe(0);
  });

  it("три печати без функции: ok, но только 1 звезда", async () => {
    const ws = new Blockly.Workspace();
    for (let k = 0; k < 3; k++) {
      Blockly.serialization.blocks.append(
        {
          type: "add_text",
          inputs: {
            TEXT: { shadow: { type: "text", fields: { TEXT: "Hello, world!" } } },
          },
        } as never,
        ws,
      );
    }
    const res = await tasks["first_function"].validate(
      ws as never,
      ["Hello, world!", "Hello, world!", "Hello, world!"],
      "ru",
    );
    expect(res.ok).toBe(true);
    expect(res.stars).toBe(1);
  });

  it("лишние блоки понижают звёзды до 2", async () => {
    const ws = buildWorkspace(solutionJson);
    for (let k = 0; k < 6; k++) {
      Blockly.serialization.blocks.append(
        { type: "text", fields: { TEXT: "x" } } as never,
        ws,
      );
    }
    const res = await tasks["first_function"].validate(
      ws as never,
      ["Hello, world!", "Hello, world!", "Hello, world!"],
      "ru",
    );
    expect(res.ok).toBe(true);
    expect(res.stars).toBe(2);
  });

  it("засчитывает русский вариант «Привет, мир!»", async () => {
    const ws = buildWorkspace(solutionJson);
    const res = await tasks["first_function"].validate(
      ws as never,
      ["Привет, мир!", "Привет, мир!", "Привет, мир!"],
      "ru",
    );
    expect(res.ok).toBe(true);
  });

  it("XML-решение из solutions/ проходит валидацию (3 звезды)", async () => {
    const xmlPath = path.resolve(
      __dirname,
      "../../solutions/first_function.xml",
    );
    const xml = fs.readFileSync(xmlPath, "utf-8");
    const dom = Blockly.utils.xml.textToDom(xml);
    const ws = new Blockly.Workspace();
    Blockly.Xml.domToWorkspace(dom, ws);

    const logs = runCode(ws);
    expect(logs).toEqual(["Hello, world!", "Hello, world!", "Hello, world!"]);

    const res = await tasks["first_function"].validate(ws as never, logs, "ru");
    expect(res.ok).toBe(true);
    expect(res.stars).toBe(3);
  });
});
