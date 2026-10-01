/**
 * Блок «увеличить X на …» (math_change) должен давать одну простую операцию
 * на всех четырёх языках. Штатный генератор Blockly для Python оборачивал
 * прибавление в isinstance(..., Number) и добавлял «from numbers import
 * Number» — переопределение в src/generators/python.ts это убирает.
 */
import { describe, it, expect } from "vitest";
import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import { pythonGenerator } from "blockly/python";
import { luaGenerator } from "blockly/lua";
import { phpGenerator } from "blockly/php";
import { forBlock as jsForBlock } from "../src/generators/javascript";
import { forBlock as pyForBlock } from "../src/generators/python";
import { forBlock as luaForBlock } from "../src/generators/lua";
import { forBlock as phpForBlock } from "../src/generators/php";

// Регистрируем переопределения так же, как это делает index.ts
Object.assign(javascriptGenerator.forBlock, jsForBlock);
Object.assign(pythonGenerator.forBlock, pyForBlock);
Object.assign(luaGenerator.forBlock, luaForBlock);
Object.assign(phpGenerator.forBlock, phpForBlock);

const num = (n: number) => ({ block: { type: "math_number", fields: { NUM: n } } });

// sum = 0; для каждого i в [1,2,3]: sum += i; печать sum
const program = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: "variables_set",
        fields: { VAR: { name: "sum" } },
        inputs: { VALUE: num(0) },
      },
      {
        type: "controls_forEach",
        fields: { VAR: { name: "i" } },
        inputs: {
          LIST: {
            block: {
              type: "lists_create_with",
              extraState: { itemCount: 3 },
              inputs: {
                ADD0: { shadow: { type: "math_number", fields: { NUM: 1 } } },
                ADD1: { shadow: { type: "math_number", fields: { NUM: 2 } } },
                ADD2: { shadow: { type: "math_number", fields: { NUM: 3 } } },
              },
            },
          },
          DO: {
            block: {
              type: "math_change",
              fields: { VAR: { name: "sum" } },
              inputs: {
                DELTA: {
                  block: {
                    type: "variables_get",
                    fields: { VAR: { name: "i" } },
                  },
                },
              },
            },
          },
        },
      },
      {
        type: "add_text",
        inputs: {
          TEXT: {
            block: { type: "variables_get", fields: { VAR: { name: "sum" } } },
          },
        },
      },
    ],
  },
};

function codeFor(generator: Blockly.CodeGenerator): string {
  const ws = new Blockly.Workspace();
  try {
    Blockly.serialization.workspaces.load(program as never, ws);
    return generator.workspaceToCode(ws);
  } finally {
    ws.dispose();
  }
}

describe("math_change: простая генерация на всех языках", () => {
  it("Python: sum += i без isinstance и лишних импортов", () => {
    const code = codeFor(pythonGenerator);
    expect(code).toMatch(/sum\w* \+= i/);
    expect(code).not.toMatch(/isinstance/);
    expect(code).not.toMatch(/from numbers import Number/);
  });

  it("JavaScript и PHP: одна операция +=, как в Python", () => {
    expect(codeFor(javascriptGenerator)).toMatch(/sum \+= i;/);
    expect(codeFor(phpGenerator)).toMatch(/\$sum \+= \$i;/);
  });

  it("Lua: sum = sum + i", () => {
    expect(codeFor(luaGenerator)).toMatch(/sum = sum \+ i/);
  });

  it("JS-код из той же программы считается правильно (sum = 6)", () => {
    const lines: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) =>
      void lines.push(args.map(String).join(" "));
    try {
      new Function(codeFor(javascriptGenerator))();
    } finally {
      console.log = originalLog;
    }
    expect(lines).toEqual(["6"]);
  });
});
