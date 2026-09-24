// Задачи группы «conditions»: тексты заданий и валидаторы.
import * as Blockly from "blockly";
import { getAppLang } from "../localization";
import { countNonShadowBlocks, getNonShadowBlocks } from "../workspaceUtils";
import { getVisibleOutputLines, getVarFieldText, tryGetAssignedNumber } from "./utils";
import type { TaskRegistry } from "./types";

async function validateFirstCondition(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();

  const nonShadowBlocks = getNonShadowBlocks(ws);

  let hasSetTemperature = false;
  let hasGetTemperature = false;
  let hasIf = false;
  let hasCompare = false;
  let hasGreaterThanZero = false;
  let hasPrint = false;
  let tempValue: number | null = null;

  for (const b of nonShadowBlocks) {
    const t = (b as any).type;

    if (t === "variables_set") {
      hasSetTemperature = true;
      const n = tryGetAssignedNumber(b);
      if (n !== null) tempValue = n;
    }

    if (t === "variables_get") hasGetTemperature = true;

    if (t === "controls_if") hasIf = true;
    if (t === "logic_compare") {
      hasCompare = true;
      try {
        const op =
          typeof (b as any).getFieldValue === "function"
            ? (b as any).getFieldValue("OP")
            : undefined;
        if (op === "GT" || op === "GTE") {
          const left =
            typeof (b as any).getInputTargetBlock === "function"
              ? (b as any).getInputTargetBlock("A")
              : null;
          const right =
            typeof (b as any).getInputTargetBlock === "function"
              ? (b as any).getInputTargetBlock("B")
              : null;
          const isTemp = (x: any) =>
            x && (x as any).type === "variables_get" && getVarFieldText(x) === "temperature";
          const isZero = (x: any) => {
            if (!x || (x as any).type !== "math_number") return false;
            const raw =
              typeof (x as any).getFieldValue === "function"
                ? (x as any).getFieldValue("NUM")
                : undefined;
            return String(raw).trim() === "0";
          };
          if ((isTemp(left) && isZero(right)) || (isZero(left) && isTemp(right))) {
            hasGreaterThanZero = true;
          }
        }
      } catch {}
    }

    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const hasWarmOutput = lines.some((l) => l.trim().toLowerCase().includes("the weather is warm"));

  const ok =
    nonShadowBlocks.length === 0
      ? hasWarmOutput
      : hasSetTemperature && hasGetTemperature && hasIf && hasCompare && hasPrint && hasWarmOutput;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = hasGreaterThanZero && hasIf && hasCompare;
    if (usedCore && count <= 14) stars = 3;
    else if (count <= 18) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateEvenOrOdd(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lang = getAppLang();
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);

  const normalized = lines.map((l) =>
    l
      .replace(/[.!]+$/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
  );

  const tryGetAssignedInt = (setBlock: any): number | null => {
    const n = tryGetAssignedNumber(setBlock);
    if (n === null) return null;
    if (!Number.isInteger(n)) return null;
    return n;
  };

  let n: number | null = null;
  let hasSetNumber = false;
  let hasGetNumber = false;
  let hasPrint = false;
  let usedIf = false;
  let usedIfElse = false;
  let usedCompare = false;
  let usedModulo = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "variables_set") {
      hasSetNumber = true;
      const assigned = tryGetAssignedInt(b);
      if (assigned !== null) n = assigned;
    }
    if (t === "variables_get") hasGetNumber = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;

    if (t === "controls_if") {
      usedIf = true;
      try {
        if (typeof (b as any).getInput === "function") {
          const hasElseInput = !!(b as any).getInput("ELSE");
          if (hasElseInput) usedIfElse = true;
        }
      } catch {}
    }

    if (t === "logic_compare") usedCompare = true;
    if (t === "math_modulo") usedModulo = true;
    if (t === "math_arithmetic") {
      try {
        const op =
          typeof (b as any).getFieldValue === "function"
            ? (b as any).getFieldValue("OP")
            : undefined;
        if (String(op).toUpperCase().includes("MOD")) usedModulo = true;
      } catch {}
    }
  }

  const ok = (() => {
    if (blocks.length === 0) {
      const hasAnyParity = normalized.some(
        (l) =>
          l.includes("the number is even") ||
          l.includes("the number is odd") ||
          l.includes("число чётное") ||
          l.includes("число четное") ||
          l.includes("число нечётное") ||
          l.includes("число нечетное")
      );
      return hasAnyParity;
    }
    if (!hasSetNumber || !hasGetNumber || !hasPrint) return false;
    if (n === null) return false;
    const parity = n % 2 === 0 ? "even" : "odd";
    const enExpected = `the number is ${parity}`.toLowerCase();
    const ruExpected =
      parity === "even" ? ["число чётное", "число четное"] : ["число нечётное", "число нечетное"];
    const hasEn = normalized.includes(enExpected);
    const hasRu = ruExpected.some((s) => normalized.includes(s));
    if (lang === "ru") return hasRu || hasEn;
    return hasEn || hasRu;
  })();

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = usedIfElse && usedCompare && usedModulo;
    if (usedCore && count <= 10) stars = 3;
    else if ((usedIf || usedCompare || usedModulo) && count <= 14) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateTimeOfDay(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lang = getAppLang();
  const lines = getVisibleOutputLines()
    .map((l) => l.trim())
    .filter(Boolean);
  const normalized = lines.map((l) =>
    l
      .replace(/[.!]+$/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
  );

  const tryGetAssignedInt = (setBlock: any): number | null => {
    const n = tryGetAssignedNumber(setBlock);
    if (n === null) return null;
    if (!Number.isInteger(n)) return null;
    return n;
  };

  let hour: number | null = null;
  let hasSetHour = false;
  let hasGetHour = false;
  let hasPrint = false;

  let ifBlocksCount = 0;
  let hasElseIfChain = false;
  let hasElseBranch = false;

  let usedCompare = false;

  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    const t = (b as any).type;
    if (t === "variables_set") {
      hasSetHour = true;
      const assigned = tryGetAssignedInt(b);
      if (assigned !== null) hour = assigned;
    }
    if (t === "variables_get") hasGetHour = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;

    if (t === "controls_if") {
      ifBlocksCount += 1;
      try {
        if (typeof (b as any).getInput === "function") {
          let elseIfCount = 0;
          for (let i = 1; i < 10; i++) {
            if ((b as any).getInput(`IF${i}`)) elseIfCount += 1;
            else break;
          }
          if (elseIfCount >= 2) hasElseIfChain = true;
          if ((b as any).getInput("ELSE")) hasElseBranch = true;
        }
      } catch {}
    }

    if (t === "logic_compare") usedCompare = true;
  }

  const expectedKey = (() => {
    if (hour === null) return null;
    if (hour >= 6 && hour <= 11) return "morning";
    if (hour >= 12 && hour <= 17) return "afternoon";
    if (hour >= 18 && hour <= 22) return "evening";
    return "night";
  })();

  const ok = (() => {
    if (blocks.length === 0) {
      const hasAnyGreeting = normalized.some(
        (l) =>
          l.includes("good morning") ||
          l.includes("good afternoon") ||
          l.includes("good evening") ||
          l.includes("good night") ||
          l.includes("доброе утро") ||
          l.includes("добрый день") ||
          l.includes("добрый вечер") ||
          l.includes("спокойной ночи") ||
          l.includes("доброй ночи")
      );
      return hasAnyGreeting;
    }
    if (!hasSetHour || !hasGetHour || !hasPrint) return false;
    if (!expectedKey) return false;
    const enExpected =
      expectedKey === "morning"
        ? "good morning"
        : expectedKey === "afternoon"
          ? "good afternoon"
          : expectedKey === "evening"
            ? "good evening"
            : "good night";
    const ruExpected =
      expectedKey === "morning"
        ? ["доброе утро"]
        : expectedKey === "afternoon"
          ? ["добрый день"]
          : expectedKey === "evening"
            ? ["добрый вечер"]
            : ["спокойной ночи", "доброй ночи"];

    const hasEn = normalized.some((l) => l.includes(enExpected));
    const hasRu = ruExpected.some((s) => normalized.some((l) => l.includes(s)));
    if (lang === "ru") return hasRu || hasEn;
    return hasEn || hasRu;
  })();

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = ifBlocksCount === 1 && hasElseIfChain && hasElseBranch && usedCompare;
    if (usedCore && count <= 18) stars = 3;
    else if (count <= 26) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

export const conditionsTasks: Pick<
  TaskRegistry,
  "first_condition" | "even_or_odd" | "time_of_day"
> = {
  first_condition: {
    id: "first_condition",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 8: Первое условие" : "Task 8: First condition"),
    description: (lang) =>
      lang === "ru"
        ? 'Создайте переменную <strong>temperature</strong> и сохраните в неё какое-либо число. Задача: проверьте, что температура выше нуля. Если это так — выведите фразу <strong>"The weather is warm"</strong>. Если нет — не выводите ничего.'
        : 'Create a variable <strong>temperature</strong> and store any number in it. Task: check that the temperature is above zero. If yes, print <strong>"The weather is warm"</strong>. If not, print nothing.',
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную temperature и присвойте ей число больше нуля (например, 25).\n2. В категории «Логика» возьмите блок «если».\n3. В условие блока вложите сравнение: блок «>» из «Логика» — влево переменную temperature, вправо число 0.\n4. Внутрь блока «если» вложите «Добавить текст … цвет …» с фразой The weather is warm и нажмите «▶», затем «Проверить решение»."
        : "Step by step:\n1. Create a variable temperature and set it to a number greater than zero (e.g. 25).\n2. In the Logic category take the “if” block.\n3. Put a comparison in the condition: a “>” block from Logic — temperature on the left, 0 on the right.\n4. Put “Add text … color …” with the phrase The weather is warm inside the “if” block, press “▶”, then “Check solution”.",
    validate: validateFirstCondition,
  },
  even_or_odd: {
    id: "even_or_odd",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 9: Чётное или нечётное" : "Task 9: Even or Odd"),
    description: (lang) =>
      lang === "ru"
        ? 'Создайте переменную <strong>number</strong> и сохраните в неё любое целое число. Напишите программу, которая определяет, является ли число <strong>чётным</strong> или <strong>нечётным</strong>, и выводит сообщение:<br><br>Если число чётное, выведите <strong>"Число чётное"</strong> (или <strong>"The number is even"</strong>).<br>Если число нечётное, выведите <strong>"Число нечётное"</strong> (или <strong>"The number is odd"</strong>).'
        : 'Create a variable <strong>number</strong> and store any integer in it. Determine whether the number is <strong>even</strong> or <strong>odd</strong>, and print a message:<br><br>If even, print <strong>"The number is even"</strong>.<br>If odd, print <strong>"The number is odd"</strong>.',
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную number и присвойте ей целое число.\n2. Возьмите блок «если … иначе» из «Логика» (нажмите шестерёнку и добавьте «иначе»).\n3. Условие чётности: из «Математики» блок «остаток от … ÷ …» (number ÷ 2) и сравнение равно 0 из «Логика». Или блок «нечётное?/чётное?» из «Математики».\n4. В ветку «если» вложите «Добавить текст … цвет …» с «The number is even», в «иначе» — с «The number is odd»."
        : "Step by step:\n1. Create a variable number and set it to any integer.\n2. Take the “if … else” block from Logic (click the gear and add “else”).\n3. Even check: “remainder of … ÷ …” (number ÷ 2) from Math compared to 0 with “=” from Logic, or the “is even” block from Math.\n4. Put “Add text … color …” with “The number is even” in the if branch and “The number is odd” in the else branch.",
    validate: validateEvenOrOdd,
  },
  time_of_day: {
    id: "time_of_day",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 10: Время суток" : "Task 10: Time of Day"),
    description: (lang) =>
      lang === "ru"
        ? 'Создайте переменную <strong>hour</strong> и сохраните в неё текущий час (число от <strong>0</strong> до <strong>23</strong>). Напишите программу, которая определяет время суток и выводит сообщение:<br><br>Если <strong>hour</strong> от <strong>6</strong> до <strong>11</strong> → <strong>"Good morning!"</strong><br>Если <strong>hour</strong> от <strong>12</strong> до <strong>17</strong> → <strong>"Good afternoon!"</strong><br>Если <strong>hour</strong> от <strong>18</strong> до <strong>22</strong> → <strong>"Good evening!"</strong><br>Иначе → <strong>"Good night!"</strong>'
        : 'Create a variable <strong>hour</strong> and store the current hour (0 to 23). Determine the time of day and print:<br><br>If <strong>hour</strong> is 6..11 → <strong>"Good morning!"</strong><br>If 12..17 → <strong>"Good afternoon!"</strong><br>If 18..22 → <strong>"Good evening!"</strong><br>Else → <strong>"Good night!"</strong>',
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную hour и присвойте ей число от 0 до 23 (например, 9).\n2. Возьмите блок «если» из «Логика», нажмите шестерёнку и добавьте два «иначе если» и один «иначе».\n3. Проверка диапазона: блок «и» из «Логика» объединяет два сравнения — «hour ≥ 6» и «hour ≤ 11». Аналогично для 12..17 и 18..22.\n4. В каждую ветку вставьте «Добавить текст … цвет …»: «Good morning!», «Good afternoon!», «Good evening!», в «иначе» — «Good night!».\n5. Запустите код и проверьте вывод."
        : "Step by step:\n1. Create a variable hour and set it to a number from 0 to 23 (e.g. 9).\n2. Take the “if” block from Logic, click the gear and add two “else if” and one “else”.\n3. Range check: the “and” block from Logic combines two comparisons — “hour ≥ 6” and “hour ≤ 11”. The same for 12..17 and 18..22.\n4. Put “Add text … color …” in each branch: “Good morning!”, “Good afternoon!”, “Good evening!”, and “Good night!” in else.\n5. Run the code and check the output.",
    validate: validateTimeOfDay,
  },
};
