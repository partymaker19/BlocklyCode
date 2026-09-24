// Задачи группы «variables»: тексты заданий и валидаторы.
import * as Blockly from "blockly";
import { countNonShadowBlocks, getNonShadowBlocks } from "../workspaceUtils";
import { getVisibleOutputLines, getVarFieldText, tryGetAssignedNumber, escapeRe } from "./utils";
import type { TaskRegistry, ValidationResult } from "./types";

async function validateVarMyAge(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines;

  const nonShadowBlocks = getNonShadowBlocks(ws);

  let assignedValue: string | null = null;
  let hasSetVar = false;
  let hasGetVar = false;
  let hasPrint = false;
  for (const b of nonShadowBlocks) {
    const t = (b as any).type;
    if (
      t === "variables_set" ||
      t === "let_variable" ||
      t === "py_variable" ||
      t === "lua_local_variable"
    ) {
      hasSetVar = true;
      try {
        const target =
          typeof (b as any).getInputTargetBlock === "function"
            ? (b as any).getInputTargetBlock("VALUE")
            : null;
        if (target && (target as any).type === "math_number") {
          const num =
            typeof (target as any).getFieldValue === "function"
              ? (target as any).getFieldValue("NUM")
              : undefined;
          if (num !== undefined && num !== null) assignedValue = String(num).trim();
        }
      } catch {}
    }
    if (
      t === "variables_get" ||
      t === "let_variable_get" ||
      t === "py_variable_get" ||
      t === "lua_local_variable_get"
    ) {
      hasGetVar = true;
    }
    if (t === "text_print" || t === "add_text") {
      hasPrint = true;
    }
  }

  const ok = (() => {
    if (nonShadowBlocks.length === 0) {
      return lines.some((l) => /\d/.test(l));
    }
    if (!assignedValue) return false;
    const re = new RegExp(`(^|\\b)${escapeRe(assignedValue)}(\\b|$)`);
    const hasValueInOutput = lines.some((l) => re.test(l));
    return hasSetVar && hasValueInOutput;
  })();

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (hasSetVar && hasGetVar && hasPrint && assignedValue && count <= 5) stars = 3;
    else if ((hasPrint || hasGetVar) && count <= 8) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateCalcSum(
  ws: Blockly.WorkspaceSvg,
  outputLines: string[]
): Promise<ValidationResult> {
  const lines = outputLines;

  const nonShadowBlocks = getNonShadowBlocks(ws);

  let aVal: number | null = null;
  let bVal: number | null = null;
  let setVarsCount = 0;
  let getVarsCount = 0;
  let hasSetAnySumLike = false;
  let hasPrint = false;
  let hasSumExpression = false;

  for (const b of nonShadowBlocks) {
    const t = (b as any).type;
    if (t === "variables_set") {
      const name = getVarFieldText(b);
      if (name === "a") {
        const n = tryGetAssignedNumber(b);
        if (n !== null) aVal = n;
        setVarsCount += 1;
      }
      if (name === "b") {
        const n = tryGetAssignedNumber(b);
        if (n !== null) bVal = n;
        setVarsCount += 1;
      }
      if (name === "sum" || name === "total" || name === "result") {
        hasSetAnySumLike = true;
        setVarsCount += 1;
        try {
          const valueBlock =
            typeof (b as any).getInputTargetBlock === "function"
              ? (b as any).getInputTargetBlock("VALUE")
              : null;
          if (valueBlock && (valueBlock as any).type === "math_arithmetic") {
            const op =
              typeof (valueBlock as any).getFieldValue === "function"
                ? (valueBlock as any).getFieldValue("OP")
                : undefined;
            if (op === "ADD") hasSumExpression = true;
          }
        } catch {}
      }
      if (name !== "a" && name !== "b" && name !== "sum" && name !== "total" && name !== "result") {
        const n = tryGetAssignedNumber(b);
        if (n !== null) {
          if (aVal === null) aVal = n;
          else if (bVal === null) bVal = n;
        }
        setVarsCount += 1;
      }
    }
    if (t === "variables_get") {
      getVarsCount += 1;
    }
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const ok = (() => {
    if (nonShadowBlocks.length === 0) {
      return lines.some((l) => /\d/.test(l));
    }
    if (aVal === null || bVal === null) return false;
    const expected = aVal + bVal;
    const re = new RegExp(`(^|\\b)${escapeRe(String(expected))}(\\b|$)`);
    const hasValueInOutput = lines.some((l) => re.test(l));
    return (
      setVarsCount >= 2 &&
      getVarsCount >= 1 &&
      (hasSetAnySumLike || hasSumExpression) &&
      hasValueInOutput
    );
  })();

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (hasPrint && count <= 10) stars = 3;
    else if (count <= 13) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateIncCounter(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();

  const nonShadowBlocks = getNonShadowBlocks(ws);

  let initOk = false;
  let incOk = false;
  let hasGetCounter = false;
  let hasPrint = false;
  let usesMathChange = false;

  for (const b of nonShadowBlocks) {
    const t = (b as any).type;

    if (t === "variables_set") {
      const valueBlock =
        typeof (b as any).getInputTargetBlock === "function"
          ? (b as any).getInputTargetBlock("VALUE")
          : null;

      if (valueBlock && (valueBlock as any).type === "math_number") {
        const n = tryGetAssignedNumber(b);
        if (n === 0) initOk = true;
      }

      if (valueBlock && (valueBlock as any).type === "math_arithmetic") {
        try {
          const op =
            typeof (valueBlock as any).getFieldValue === "function"
              ? (valueBlock as any).getFieldValue("OP")
              : undefined;
          if (op !== "ADD") continue;

          const left =
            typeof (valueBlock as any).getInputTargetBlock === "function"
              ? (valueBlock as any).getInputTargetBlock("A")
              : null;
          const right =
            typeof (valueBlock as any).getInputTargetBlock === "function"
              ? (valueBlock as any).getInputTargetBlock("B")
              : null;

          const isGetCounter = (x: any) => x && (x as any).type === "variables_get";
          const isOne = (x: any) => {
            if (!x || (x as any).type !== "math_number") return false;
            const raw =
              typeof (x as any).getFieldValue === "function"
                ? (x as any).getFieldValue("NUM")
                : undefined;
            return String(raw).trim() === "1";
          };

          if ((isGetCounter(left) && isOne(right)) || (isOne(left) && isGetCounter(right)))
            incOk = true;
        } catch {}
      }
    }

    if (t === "math_change") {
      usesMathChange = true;
      try {
        const delta =
          typeof (b as any).getInputTargetBlock === "function"
            ? (b as any).getInputTargetBlock("DELTA")
            : null;
        if (delta && (delta as any).type === "math_number") {
          const raw =
            typeof (delta as any).getFieldValue === "function"
              ? (delta as any).getFieldValue("NUM")
              : undefined;
          if (String(raw).trim() === "1") incOk = true;
        }
      } catch {}
    }

    if (t === "variables_get") hasGetCounter = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const ok =
    nonShadowBlocks.length === 0
      ? lines.includes("1")
      : initOk && incOk && hasGetCounter && hasPrint && lines.includes("1");

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (hasPrint && count <= 7) stars = 3;
    else if (count <= 10) stars = 2;
    else stars = 1;
  }

  if (ok && usesMathChange && count <= 6) stars = 3;
  return { ok, stars };
}

async function validateDiscountCalc(
  ws: Blockly.WorkspaceSvg
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();

  const nonShadowBlocks = getNonShadowBlocks(ws);

  let priceVal: number | null = null;
  let discountVal: number | null = null;
  let hasSetPrice = false;
  let hasSetDiscount = false;
  let hasGetPrice = false;
  let hasGetDiscount = false;
  let hasPrint = false;

  let usedMinus = false;
  let usedMultiply = false;
  let usedDivide = false;
  let usedPercentConst = false;

  for (const b of nonShadowBlocks) {
    const t = (b as any).type;

    if (t === "variables_set") {
      const name = getVarFieldText(b);
      if (name === "price") {
        hasSetPrice = true;
        const n = tryGetAssignedNumber(b);
        if (n !== null) priceVal = n;
      }
      if (name === "discount") {
        hasSetDiscount = true;
        const n = tryGetAssignedNumber(b);
        if (n !== null) discountVal = n;
      }
      if (name !== "price" && name !== "discount") {
        const n = tryGetAssignedNumber(b);
        if (n !== null) {
          if (priceVal === null) priceVal = n;
          else if (discountVal === null) discountVal = n;
        }
      }
    }

    if (t === "variables_get") {
      const name = getVarFieldText(b);
      if (name === "price") hasGetPrice = true;
      if (name === "discount") hasGetDiscount = true;
      if (name !== "price" && name !== "discount") {
        hasGetPrice = true;
        hasGetDiscount = true;
      }
    }

    if (t === "math_arithmetic") {
      try {
        const op =
          typeof (b as any).getFieldValue === "function"
            ? (b as any).getFieldValue("OP")
            : undefined;
        if (op === "MINUS") usedMinus = true;
        if (op === "MULTIPLY") usedMultiply = true;
        if (op === "DIVIDE") usedDivide = true;
      } catch {}
    }

    if (t === "math_number") {
      try {
        const raw =
          typeof (b as any).getFieldValue === "function"
            ? (b as any).getFieldValue("NUM")
            : undefined;
        if (String(raw).trim() === "100") usedPercentConst = true;
      } catch {}
    }

    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const expected = (() => {
    if (priceVal === null || discountVal === null) return null;
    return priceVal - (priceVal * discountVal) / 100;
  })();

  const hasExpectedInOutput = (() => {
    if (expected === null) return false;
    const s = String(expected);
    const re = new RegExp(`(^|\\b)${escapeRe(s)}(\\b|$)`);
    return lines.some((l) => re.test(l));
  })();

  const ok =
    nonShadowBlocks.length === 0
      ? lines.some((l) => /\d/.test(l))
      : (hasSetPrice || priceVal !== null) &&
        (hasSetDiscount || discountVal !== null) &&
        (hasGetPrice || hasGetDiscount) &&
        hasPrint &&
        expected !== null &&
        hasExpectedInOutput;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedFormulaHints = usedMinus && usedMultiply && usedDivide && usedPercentConst;
    if (usedFormulaHints && count <= 14) stars = 3;
    else if (count <= 18) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

export const variablesTasks: Pick<
  TaskRegistry,
  "var_my_age" | "calc_sum" | "inc_counter" | "discount_calc"
> = {
  var_my_age: {
    id: "var_my_age",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 3: Моя первая переменная" : "Task 3: My first variable",
    description: (lang) =>
      lang === "ru"
        ? "Создайте переменную с именем <strong>myAge</strong> и сохраните в неё число. Затем выведите значение этой переменной в окно вывода.<br><br><strong>Пример:</strong> вы устанавливаете значение <strong>10</strong>, и в окне вывода появляется <strong>10</strong>.<br><br><strong>Дополнительно (для исследования):</strong> после того как получилось, попробуйте изменить число в переменной или создать новую переменную с другим именем (например, <strong>birthYear</strong>) и вывести её."
        : "Create a variable named <strong>myAge</strong> and store a number in it. Then print the value of this variable to the output.<br><br><strong>Example:</strong> you set it to <strong>10</strong>, and the output shows <strong>10</strong>.<br><br><strong>Bonus (explore):</strong> after it works, try changing the number or creating a new variable with another name (e.g. <strong>birthYear</strong>) and printing it.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. В категории «Переменные» нажмите «Создать переменную…» и введите имя myAge.\n2. Перетащите блок «присвоить myAge = …» и вставьте в него число (например, 10).\n3. Перетащите блок «Добавить текст … цвет …» (Текст) и вложите в него переменную myAge.\n4. Нажмите «▶», затем «Проверить решение»."
        : "Step by step:\n1. In the Variables category press “Create variable…” and type myAge.\n2. Drag the “set myAge = …” block and put a number inside (e.g. 10).\n3. Drag “Add text … color …” (Text) and put the variable myAge inside.\n4. Press “▶”, then “Check solution”.",
    validate: validateVarMyAge,
  },
  calc_sum: {
    id: "calc_sum",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 4: Простой калькулятор" : "Task 4: Simple calculator",
    description: (lang) =>
      lang === "ru"
        ? "Создайте две переменные: <strong>a</strong> и <strong>b</strong>. Присвойте им числа. Создайте третью переменную <strong>sum</strong> и сохраните в неё результат сложения <strong>a</strong> и <strong>b</strong>. Выведите значение <strong>sum</strong>."
        : "Create two variables: <strong>a</strong> and <strong>b</strong>. Assign numbers to them. Create a third variable <strong>sum</strong> and store <strong>a + b</strong> in it. Print <strong>sum</strong>.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменные a, b, sum.\n2. Присвойте a и b числа: «присвоить a = …», «присвоить b = …».\n3. Присвойте sum: вложите в него сумму a + b (блок «+ − × ÷» с переменными a и b внутри).\n4. Выведите sum: вложите переменную sum в «Добавить текст … цвет …»."
        : "Step by step:\n1. Create variables a, b, sum.\n2. Set a and b to numbers.\n3. Set sum to a + b (use the “+ − × ÷” block with a and b inside).\n4. Print sum: put variable sum inside “Add text … color …”.",
    validate: validateCalcSum,
  },
  inc_counter: {
    id: "inc_counter",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 6: Счётчик инкремент" : "Task 6: Increment counter"),
    description: (lang) =>
      lang === "ru"
        ? "Создайте переменную <strong>counter</strong> со значением <strong>0</strong>. Затем увеличьте её значение на <strong>1</strong> (используйте блок <strong>counter = counter + 1</strong>). Выведите новое значение."
        : "Create a variable <strong><code>counter</code></strong> with the value <strong>0</strong>. Then increase it by <strong>1</strong> (use <strong>counter = counter + 1</strong>). Print the new value.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменную counter и присвойте ей 0: «присвоить counter = 0».\n2. В категории «Математика» возьмите блок «увеличить counter на 1».\n3. Вложите переменную counter в «Добавить текст … цвет …» и нажмите «▶» — в выводе появится 1.\n4. Нажмите «Проверить решение»."
        : "Step by step:\n1. Create a variable counter and set it to 0: “set counter = 0”.\n2. In the Math category take the “change counter by 1” block.\n3. Put the variable counter inside “Add text … color …” and press “▶” — the output shows 1.\n4. Press “Check solution”.",
    validate: validateIncCounter,
  },
  discount_calc: {
    id: "discount_calc",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 7: Умный калькулятор скидок" : "Task 7: Smart Discount Calculator",
    description: (lang) =>
      lang === "ru"
        ? "Создайте переменную <strong>price</strong> и сохраните в неё цену товара (например, <strong>1000</strong>). Создайте вторую переменную <strong>discount</strong> и сохраните в неё размер скидки в процентах (например, <strong>15</strong>). Вычислите и выведите <strong>финальную цену</strong> по формуле: <strong>price - (price * discount / 100)</strong>."
        : "Create a variable <strong><code>price</code></strong> and store the item price in it (e.g. <strong>1000</strong>). Create a second variable <strong><code>discount</code></strong> and store the discount percent in it (e.g. <strong>15</strong>). Compute and print the <strong>final price</strong> using: <strong>price - (price * discount / 100)</strong>.",
    hint: (lang) =>
      lang === "ru"
        ? "Пошаговое решение:\n1. Создайте переменные price и discount, присвойте им числа (например, 1000 и 15).\n2. Соберите формулу блоками из «Математика»: сначала «price × discount», затем результат «÷ 100».\n3. Итог: блок «−»: влево — price, вправо — результат деления. Присвойте его переменной или сразу вложите в «Добавить текст … цвет …».\n4. Запустите «▶» и проверьте, что вывод — 850 (для 1000 и 15). Нажмите «Проверить решение»."
        : "Step by step:\n1. Create variables price and discount and set them to numbers (e.g. 1000 and 15).\n2. Build the formula with Math blocks: first “price × discount”, then divide the result “÷ 100”.\n3. Final step: a “−” block — price on the left, the division result on the right. Print it with “Add text … color …”.\n4. Press “▶” and check that the output is 850 (for 1000 and 15). Press “Check solution”.",
    validate: validateDiscountCalc,
  },
};
