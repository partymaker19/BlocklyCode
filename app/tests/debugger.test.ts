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
import { generateCode } from "../src/codeExecution";
import type { SupportedLanguage } from "../src/types/messages";

// Регистрируем генераторы всех языков, как это делает index.ts
Object.assign(javascriptGenerator.forBlock, jsForBlock);
Object.assign(pythonGenerator.forBlock, pyForBlock);
Object.assign(luaGenerator.forBlock, luaForBlock);
Object.assign(phpGenerator.forBlock, phpForBlock);

// Простая программа: печать строки
const programJson = {
  blocks: {
    languageVersion: 0,
    blocks: [
      {
        type: "add_text",
        inputs: {
          TEXT: { shadow: { type: "text", fields: { TEXT: "Hi" } } },
        },
      },
    ],
  },
};

const langs: SupportedLanguage[] = [
  "javascript",
  "python",
  "lua",
  "php",
  "typescript",
];

function buildWorkspace(): Blockly.Workspace {
  const ws = new Blockly.Workspace();
  Blockly.serialization.workspaces.load(programJson as never, ws);
  return ws;
}

describe("debugger: инъекция подсветки блоков в генераторы", () => {
  it("debug=true добавляет вызовы подсветки для JS/Python/Lua/TS", () => {
    for (const lang of ["javascript", "typescript", "python", "lua"] as const) {
      const ws = buildWorkspace();
      const code = generateCode(ws, lang, true);
      const fn = lang === "python" || lang === "lua" ? "highlight_block" : "highlightBlock";
      expect(code.includes(`${fn}('`), `${lang}: нет вызова ${fn}`).toBe(true);
    }
  });

  it("debug=false не добавляет подсветку", () => {
    for (const lang of langs) {
      const ws = buildWorkspace();
      const code = generateCode(ws, lang, false);
      expect(code.includes("highlightBlock")).toBe(false);
      expect(code.includes("highlight_block")).toBe(false);
    }
  });

  it("для PHP подсветки нет даже в debug-режиме (нет моста PHP→JS)", () => {
    const ws = buildWorkspace();
    const code = generateCode(ws, "php", true);
    expect(code.includes("highlight")).toBe(false);
  });

  it("STATEMENT_PREFIX сбрасывается после генерации", () => {
    const ws = buildWorkspace();
    generateCode(ws, "javascript", true);
    generateCode(ws, "python", true);
    generateCode(ws, "lua", true);
    expect(javascriptGenerator.STATEMENT_PREFIX).toBeNull();
    expect(pythonGenerator.STATEMENT_PREFIX).toBeNull();
    expect(luaGenerator.STATEMENT_PREFIX).toBeNull();
    // Обычная генерация после debug не содержит подсветку
    const clean = generateCode(ws, "javascript", false);
    expect(clean.includes("highlightBlock")).toBe(false);
  });

  it("ID блоков в подсветке существуют в workspace", () => {
    const ws = buildWorkspace();
    const code = generateCode(ws, "javascript", true);
    const m = code.match(/highlightBlock\('([^']+)'\)/);
    expect(m).not.toBeNull();
    const id = m![1];
    expect(ws.getBlockById(id)).not.toBeNull();
  });
});
