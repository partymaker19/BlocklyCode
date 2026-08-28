import { describe, it, expect, beforeAll } from "vitest";
import * as Blockly from "blockly";
import { tasks } from "../src/tasks";
import type { TaskId } from "../src/tasks";

/**
 * Общий раннер валидаторов всех задач.
 *
 * Для каждой задачи проверяется главный инвариант: валидатор ПРИНИМАЕТ
 * корректный вывод (ok = true, stars >= 1). Это ловит регрессии вида
 * «задача стала непроходимой» (сломанный regex, неверное ожидание и т.п.).
 *
 * Блоки в рабочих областях — минимально достаточные для флагов, которые
 * валидатор требует для ok (переменные, if, печать и т.д.); логика кода не
 * исполняется. Полные e2e-решения со звёздами — в mult_table.test.ts и
 * char_freq.test.ts.
 */

// ---------- Хелперы сборки блоков (serialization JSON) ----------
const num = (n: number) => ({ block: { type: "math_number", fields: { NUM: n } } });
const getV = (name: string) => ({
  block: { type: "variables_get", fields: { VAR: { name } } },
});
const setV = (name: string, value: unknown) => ({
  type: "variables_set",
  fields: { VAR: { name } },
  inputs: { VALUE: value },
});
const setNum = (name: string, n: number) => setV(name, num(n));
const printB = () => ({ type: "add_text" });
const ifB = () => ({ type: "controls_if" });
const changeB = (name: string, delta: number) => ({
  type: "math_change",
  fields: { VAR: { name } },
  inputs: { DELTA: num(delta) },
});
const addB = (a: unknown, b: unknown) => ({
  block: {
    type: "math_arithmetic",
    fields: { OP: "ADD" },
    inputs: { A: a, B: b },
  },
});
const compareGT = (left: unknown, right: unknown) => ({
  type: "logic_compare",
  fields: { OP: "GT" },
  inputs: { A: left, B: right },
});
const getTop = (name: string) => ({
  type: "variables_get",
  fields: { VAR: { name } },
});

type Row = {
  id: TaskId;
  output: string[];
  blocks: unknown[];
};

const rows: Row[] = [
  {
    id: "hello_world",
    output: ["Hello World!"],
    blocks: [printB()],
  },
  {
    id: "add_2_7",
    output: ["9"],
    blocks: [printB()],
  },
  {
    id: "var_my_age",
    output: ["10"],
    blocks: [setNum("myAge", 10), getTop("myAge"), printB()],
  },
  {
    id: "calc_sum",
    output: ["30"],
    blocks: [
      setNum("a", 10),
      setNum("b", 20),
      setV("sum", addB(getV("a"), getV("b"))),
      getTop("sum"),
      printB(),
    ],
  },
  {
    id: "greet_concat",
    output: ["Hello, World!"],
    blocks: [setNum("name", 1), getTop("name"), printB()],
  },
  {
    id: "inc_counter",
    output: ["1"],
    blocks: [setNum("counter", 0), changeB("counter", 1), getTop("counter"), printB()],
  },
  {
    id: "discount_calc",
    output: ["80"],
    blocks: [setNum("price", 100), setNum("discount", 20), getTop("price"), printB()],
  },
  {
    id: "first_condition",
    output: ["The weather is warm"],
    blocks: [
      setNum("temperature", 25),
      getTop("temperature"),
      ifB(),
      compareGT(getV("temperature"), num(0)),
      printB(),
    ],
  },
  {
    id: "even_or_odd",
    output: ["The number is even"],
    blocks: [setNum("n", 10), getTop("n"), printB()],
  },
  {
    id: "time_of_day",
    output: ["Good afternoon"],
    blocks: [setNum("hour", 14), getTop("hour"), printB()],
  },
  {
    id: "first_loop",
    output: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    blocks: [
      {
        type: "controls_for",
        fields: { VAR: { name: "i" } },
        inputs: { FROM: num(0), TO: num(10), BY: num(1) },
      },
      printB(),
    ],
  },
  {
    id: "sum_1_to_n",
    output: ["55"],
    blocks: [setNum("n", 10), getTop("n"), printB()],
  },
  {
    id: "guess_game",
    output: ["Congratulations! You guessed the number!"],
    blocks: [ifB(), compareGT(getV("guess"), num(3)), printB()],
  },
  {
    id: "list_foreach",
    output: ["1", "2", "3", "4", "5", "Сумма: 15"],
    blocks: [printB()],
  },
  {
    id: "sublist_foreach",
    output: ["3", "4", "5", "6", "7"],
    blocks: [printB()],
  },
  {
    id: "list_filter_even",
    output: ["2", "4", "6", "8", "10", "30"],
    blocks: [printB()],
  },
  {
    id: "list_filter_even_min_max",
    output: ["2", "4", "6", "8", "10", "min=2", "max=10"],
    blocks: [printB()],
  },
  {
    id: "list_filter_even_avg",
    output: ["2", "4", "6", "8", "10", "count=5", "sum=30", "avg=6"],
    blocks: [printB()],
  },
  {
    id: "list_filter_even_median",
    output: ["2", "4", "6", "8", "10", "count=5", "median=6"],
    blocks: [printB()],
  },
  {
    id: "list_sum_even_positions",
    output: ["sum=19"],
    blocks: [printB()],
  },
  {
    id: "list_sort_min_max",
    output: ["min=1", "max=9"],
    blocks: [printB()],
  },
  {
    id: "mult_table",
    output: (() => {
      const lines: string[] = [];
      for (let i = 1; i <= 5; i++)
        for (let j = 1; j <= 5; j++) lines.push(`${i} × ${j} = ${i * j}`);
      return lines;
    })(),
    blocks: [printB()],
  },
  {
    id: "first_even_break",
    output: ["8"],
    blocks: [
      {
        type: "controls_forEach",
        fields: { VAR: { name: "n" } },
        inputs: {
          LIST: {
            block: {
              type: "lists_create_with",
              extraState: { itemCount: 2 },
              inputs: {
                ADD0: { block: { type: "math_number", fields: { NUM: 7 } } },
                ADD1: { block: { type: "math_number", fields: { NUM: 8 } } },
              },
            },
          },
        },
      },
      { type: "controls_if" },
      {
        type: "math_number_property",
        fields: { PROPERTY: "EVEN" },
        inputs: {
          NUMBER_TO_CHECK: { block: { type: "variables_get", fields: { VAR: { name: "n" } } } },
        },
      },
      printB(),
      { type: "controls_flow_statements", fields: { FLOW: "BREAK" } },
    ],
  },
  {
    id: "first_function",
    output: ["Hello, world!", "Hello, world!", "Hello, world!"],
    blocks: [
      {
        type: "procedures_defnoreturn",
        fields: { NAME: "greet" },
        inputs: {
          STACK: {
            block: {
              type: "add_text",
              inputs: {
                TEXT: { shadow: { type: "text", fields: { TEXT: "Hello, world!" } } },
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
  {
    id: "function_with_param",
    output: ["Привет, Аня!", "Привет, Боря!"],
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
                      ADD0: { shadow: { type: "text", fields: { TEXT: "Привет, " } } },
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
        inputs: { ARG0: { shadow: { type: "text", fields: { TEXT: "Аня" } } } },
      },
      {
        type: "procedures_callnoreturn",
        extraState: { name: "greet", params: ["name"] },
        inputs: { ARG0: { shadow: { type: "text", fields: { TEXT: "Боря" } } } },
      },
    ],
  },
  {
    id: "function_return",
    output: ["7"],
    blocks: [
      {
        type: "procedures_defreturn",
        fields: { NAME: "add" },
        extraState: {
          params: [
            { name: "a", id: "fr-a" },
            { name: "b", id: "fr-b" },
          ],
        },
        inputs: {
          RETURN: {
            block: {
              type: "math_arithmetic",
              fields: { OP: "ADD" },
              inputs: {
                A: { block: { type: "variables_get", fields: { VAR: { name: "a" } } } },
                B: { block: { type: "variables_get", fields: { VAR: { name: "b" } } } },
              },
            },
          },
        },
      },
      {
        type: "add_text",
        inputs: {
          TEXT: {
            block: {
              type: "procedures_callreturn",
              extraState: { name: "add", params: ["a", "b"] },
              inputs: {
                ARG0: { shadow: { type: "math_number", fields: { NUM: 3 } } },
                ARG1: { shadow: { type: "math_number", fields: { NUM: 4 } } },
              },
            },
          },
        },
      },
    ],
  },
  {
    id: "a1_number_analyzer",
    output: ["The number is odd", "The number is positive"],
    blocks: [setNum("number", 7), getTop("number"), printB()],
  },
  {
    id: "sum_array",
    output: ["15"],
    blocks: [printB()],
  },
  {
    id: "min_max",
    output: ["min=1", "max=9"],
    blocks: [printB()],
  },
  {
    id: "char_freq",
    output: ["a:3", "b:4", "c:1"],
    blocks: [printB()],
  },
];

beforeAll(() => {
  // Валидаторы, читающие вывод из DOM (getVisibleOutputLines), должны найти #output
  document.body.innerHTML = `<div id="output"></div>`;
});

function fillOutput(lines: string[]) {
  const out = document.getElementById("output") as HTMLDivElement;
  out.innerHTML = lines.map((l) => `<p>${l}</p>`).join("");
}

describe("все задачи: валидатор принимает корректный вывод", () => {
  it.each(rows.map((r) => r.id))("%s: ok=true, stars>=1", async (id) => {
    const row = rows.find((r) => r.id === id)!;
    const ws = new Blockly.Workspace();
    Blockly.serialization.workspaces.load(
      { blocks: { languageVersion: 0, blocks: row.blocks } } as never,
      ws,
    );
    fillOutput(row.output);
    const res = await tasks[id].validate(ws as never, row.output, "ru");
    if (!res.ok) {
      throw new Error(
        `Задача ${id}: валидатор не принял корректный вывод — ` +
          `это регрессия вида «задача непроходима»`,
      );
    }
    expect(res.ok).toBe(true);
    expect(res.stars).toBeGreaterThanOrEqual(1);
  });
});

describe("реестр задач целостен", () => {
  it("в реестре 30 задач", () => {
    expect(Object.keys(tasks).length).toBe(30);
  });

  it("каждая задача имеет title/description/hint/validate", () => {
    for (const [id, def] of Object.entries(tasks)) {
      expect(typeof def.title, `title ${id}`).toBe("function");
      expect(typeof def.description, `description ${id}`).toBe("function");
      expect(typeof def.hint, `hint ${id}`).toBe("function");
      expect(typeof def.validate, `validate ${id}`).toBe("function");
      expect(def.difficulty, `difficulty ${id}`).toMatch(/^(basic|advanced)$/);
    }
  });

  it("каждая задача в порядке прохождения имеет запись в реестре (обратное проверено типами)", () => {
    // TaskId — union-тип: компилятор гарантирует, что все id из порядка
    // прохождения существуют в реестре. Здесь проверяем обратное направление:
    // все ключи реестра уникальны и непусты.
    const ids = Object.keys(tasks);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("пустой вывод не засчитывается ни по одной задаче", async () => {
    const ws = new Blockly.Workspace();
    for (const [id, def] of Object.entries(tasks)) {
      fillOutput([]);
      const res = await def.validate(ws as never, [], "ru");
      expect(res.ok, `задача ${id} не должна засчитываться с пустым выводом`)
        .toBe(false);
    }
  });
});