/**
 * Если имя переменной ученика совпадает со служебным словом языка, Blockly
 * добавляет к нему цифру (`name` → `name2`). В панели кода над таким
 * объявлением должен появляться комментарий с причиной — иначе ученик видит
 * переменную, которой он не создавал.
 */
import { describe, it, expect, afterEach } from "vitest";
import * as Blockly from "blockly";
import { javascriptGenerator } from "blockly/javascript";
import { pythonGenerator } from "blockly/python";
import { luaGenerator } from "blockly/lua";
import { phpGenerator } from "blockly/php";
import { annotateRenamedVariables } from "../src/variableRenameNotes";
import { setAppLang } from "../src/localization";
import type { SupportedLanguage } from "../src/types/messages";

const generators: Record<SupportedLanguage, Blockly.CodeGenerator> = {
  javascript: javascriptGenerator,
  typescript: javascriptGenerator,
  python: pythonGenerator,
  lua: luaGenerator,
  php: phpGenerator,
};

/** Стопка блоков: переменная без использования не попадает в код. */
function program(...variables: string[]) {
  let next: object | undefined;
  for (const name of [...variables].reverse()) {
    next = {
      type: "variables_set",
      fields: { VAR: { name } },
      inputs: {
        VALUE: { block: { type: "text", fields: { TEXT: "Ilya" } } },
      },
      ...(next ? { next: { block: next } } : {}),
    };
  }
  return {
    blocks: {
      languageVersion: 0,
      variables: variables.map((name) => ({ name })),
      blocks: [next],
    },
  };
}

function annotate(lang: SupportedLanguage, variables: string[]): string[] {
  const generator = generators[lang];
  const ws = new Blockly.Workspace();
  try {
    Blockly.serialization.workspaces.load(program(...variables) as never, ws);
    const code = generator.workspaceToCode(ws);
    return annotateRenamedVariables(code, ws, generator, lang).split("\n");
  } finally {
    ws.dispose();
  }
}

function lineOf(lines: string[], needle: RegExp): number {
  return lines.findIndex((row) => needle.test(row));
}

afterEach(() => setAppLang("ru"));

describe("пояснение переименованных переменных в панели кода", () => {
  it("JavaScript: комментарий стоит над var name2", () => {
    const lines = annotate("javascript", ["name"]);
    const note = lineOf(lines, /Имя «name» занято языком JavaScript/);
    const declaration = lineOf(lines, /var name2/);
    expect(declaration).toBeGreaterThan(-1);
    expect(note).toBeGreaterThan(-1);
    expect(note).toBe(declaration - 1);
    expect(lines[note]).toMatch(/^\/\/ /);
  });

  it("Python: комментарий с символом # над sum2", () => {
    const lines = annotate("python", ["sum"]);
    const note = lineOf(lines, /Имя «sum» занято языком Python/);
    const declaration = lineOf(lines, /sum2 = None/);
    expect(declaration).toBeGreaterThan(-1);
    expect(note).toBeGreaterThan(-1);
    expect(note).toBe(declaration - 1);
    expect(lines[note]).toMatch(/^# /);
  });

  it("PHP: комментарий над $name2, когда имя занято", () => {
    const lines = annotate("php", ["list"]);
    const note = lineOf(lines, /Имя «list»/);
    const declaration = lineOf(lines, /\$list2 = /);
    expect(declaration).toBeGreaterThan(-1);
    expect(note).toBeGreaterThan(-1);
    expect(note).toBe(declaration - 1);
    expect(lines[note]).toMatch(/^\/\/ /);
  });

  it("Lua: name не служебное слово — пояснения нет", () => {
    const lines = annotate("lua", ["name"]);
    expect(lines.some((row) => row.startsWith("-- Имя"))).toBe(false);
  });

  it("Транслитерацию кириллицы не комментируем", () => {
    const lines = annotate("javascript", ["моя переменная"]);
    expect(lines.some((row) => row.startsWith("// Имя"))).toBe(false);
  });

  it("Три переименования — три комментария", () => {
    const lines = annotate("javascript", ["name", "class", "print"]);
    const notes = lines.filter((row) => row.startsWith("// Имя «"));
    expect(notes.length).toBe(3);
  });

  it("Английский интерфейс: текст пояснения на английском", () => {
    setAppLang("en");
    const lines = annotate("javascript", ["name"]);
    expect(
      lines.some((row) =>
        row.startsWith(
          '// "name" is a reserved word in JavaScript, so Blockly renamed',
        ),
      ),
    ).toBe(true);
  });

  it("Пояснение не ломает выполнение сгенерированного JS", () => {
    const code = annotate("javascript", ["name"]).join("\n");
    const printed: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) =>
      void printed.push(args.map(String).join(" "));
    try {
      new Function(`${code}\nconsole.log(name2);`)();
    } finally {
      console.log = originalLog;
    }
    expect(printed).toEqual(["Ilya"]);
  });
});
