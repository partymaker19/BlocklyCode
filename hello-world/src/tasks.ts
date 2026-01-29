import * as Blockly from "blockly";
import { getAppLang } from "./localization";
import { countNonShadowBlocks, getNonShadowBlocks } from "./workspaceUtils";

export type InitTaskValidationOptions = {
  checkButton: HTMLButtonElement | null;
  feedbackEl: HTMLDivElement | null;
  starsEl: HTMLDivElement | null;
  // Кнопка перехода к следующей задаче (опционально)
  nextButton?: HTMLButtonElement | null;
  // Кнопка перехода к предыдущей задаче (опционально)
  prevButton?: HTMLButtonElement | null;
};

// ---------- Прогресс и порядок задач ----------
export type TaskId =
  | "hello_world"
  | "add_2_7"
  | "var_my_age"
  | "calc_sum"
  | "greet_concat"
  | "inc_counter"
  | "discount_calc"
  | "sub_10_4"
  | "first_condition"
  | "a1_number_analyzer"
  | "sum_array"
  | "min_max"
  | "char_freq";

export type TaskDifficulty = "basic" | "advanced";

type TaskDef = {
  id: TaskId;
  difficulty: TaskDifficulty;
  title: (lang: "ru" | "en") => string;
  description: (lang: "ru" | "en") => string; // может содержать HTML
  hint: (lang: "ru" | "en") => string;
  validate: (
    ws: Blockly.WorkspaceSvg,
  ) => Promise<{ ok: boolean; stars: number }>;
};

const tasks: Record<TaskId, TaskDef> = {
  hello_world: {
    id: "hello_world",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 1: Hello World" : "Task 1: Hello World",
    description: (lang) =>
      lang === "ru"
        ? "Соберите блоки так, чтобы в окне вывода появилась строка: <strong>Hello World!</strong>"
        : "Assemble blocks so that the output shows: <strong>Hello World!</strong>",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: используйте блок вывода текста и текстовый литерал."
        : "Hint: use a print/output block with a text literal.",
    validate: validateHelloWorld,
  },
  add_2_7: {
    id: "add_2_7",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 2: 2 + 7" : "Task 2: 2 + 7"),
    description: (lang) =>
      lang === "ru"
        ? "Сложите <strong>2</strong> и <strong>7</strong> и выведите результат в окно вывода: должно получиться <strong>9</strong>. Дополнительно: после того как получилось <strong>9</strong>, попробуйте поменять операцию на <strong>−</strong>, <strong>×</strong> или <strong>÷</strong> и посмотрите, как меняется результат (но проверка засчитывает только <strong>2 + 7</strong>)."
        : "Add <strong>2</strong> and <strong>7</strong> and print the result to the output: it should be <strong>9</strong>. Bonus: after you get <strong>9</strong>, try changing the operation to <strong>−</strong>, <strong>×</strong>, or <strong>÷</strong> and see how the result changes (but validation checks only <strong>2 + 7</strong>).",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: используйте блок арифметики из категории Математика и блок печати/вывода."
        : "Hint: use the arithmetic block from Math and a print/output block.",
    validate: validateAdd2Plus7,
  },
  var_my_age: {
    id: "var_my_age",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru"
        ? "Задача 3: Моя первая переменная"
        : "Task 3: My first variable",
    description: (lang) =>
      lang === "ru"
        ? "Создайте переменную с именем <strong>myAge</strong> и сохраните в неё число. Затем выведите значение этой переменной в окно вывода.<br><br><strong>Пример:</strong> вы устанавливаете значение <strong>10</strong>, и в окне вывода появляется <strong>10</strong>.<br><br><strong>Дополнительно (для исследования):</strong> после того как получилось, попробуйте изменить число в переменной или создать новую переменную с другим именем (например, <strong>birthYear</strong>) и вывести её."
        : "Create a variable named <strong>myAge</strong> and store a number in it. Then print the value of this variable to the output.<br><br><strong>Example:</strong> you set it to <strong>10</strong>, and the output shows <strong>10</strong>.<br><br><strong>Bonus (explore):</strong> after it works, try changing the number or creating a new variable with another name (e.g. <strong>birthYear</strong>) and printing it.",
    hint: (lang) =>
      lang === "ru"
        ? 'Подсказка: используйте "create variable..." в категории Variables, затем блок присваивания значения (например, число из Math) и блок вывода.'
        : 'Hint: use "create variable..." in Variables, then a set-value block (e.g. a number from Math) and a print/output block.',
    validate: validateVarMyAge,
  },
  calc_sum: {
    id: "calc_sum",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru"
        ? "Задача 4: Простой калькулятор"
        : "Task 4: Simple calculator",
    description: (lang) =>
      lang === "ru"
        ? "Создайте две переменные: <strong>a</strong> и <strong>b</strong>. Присвойте им числа. Создайте третью переменную <strong>sum</strong> и сохраните в неё результат сложения <strong>a</strong> и <strong>b</strong>. Выведите значение <strong>sum</strong>."
        : "Create two variables: <strong>a</strong> and <strong>b</strong>. Assign numbers to them. Create a third variable <strong>sum</strong> and store <strong>a + b</strong> in it. Print <strong>sum</strong>.",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: задайте a и b через блоки переменных, затем соберите a+b в блоке арифметики и присвойте в sum. Потом выведите sum."
        : "Hint: set a and b using variable blocks, build a+b with an arithmetic block and assign to sum, then print sum.",
    validate: validateCalcSum,
  },
  greet_concat: {
    id: "greet_concat",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru"
        ? "Задача 5: Машина для приветствий"
        : "Task 5: Greeting machine",
    description: (lang) =>
      lang === "ru"
        ? 'Создайте текстовую переменную <strong>name</strong> и сохраните в неё ваше имя (например, <strong>"Anna"</strong>). Используйте соединение строк (конкатенацию), чтобы собрать и вывести фразу <strong>"Hello, " + name + "!"</strong>.<br><br><strong>Для PHP:</strong> <strong>"Hello, " . $name . "!"</strong> (в PHP строки склеиваются через <code>.</code>).'
        : 'Create a text variable <strong>name</strong> and store your name in it (for example, <strong>"Anna"</strong>). Use string concatenation to build and print <strong>"Hello, " + name + "!"</strong>.<br><br><strong>For PHP:</strong> <strong>"Hello, " . $name . "!"</strong> (PHP uses <code>.</code> to concatenate strings).',
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: используйте переменные (set/get), блок text_join из категории Текст и блок вывода."
        : "Hint: use variables (set/get), the text_join block from Text, and a print/output block.",
    validate: validateGreetConcat,
  },
  inc_counter: {
    id: "inc_counter",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru"
        ? "Задача 6: Счётчик инкремент"
        : "Task 6: Increment counter",
    description: (lang) =>
      lang === "ru"
        ? "Создайте переменную <strong>counter</strong> со значением <strong>0</strong>. Затем увеличьте её значение на <strong>1</strong> (используйте блок <strong>counter = counter + 1</strong>). Выведите новое значение."
        : "Create a variable <strong><code>counter</code></strong> with the value <strong>0</strong>. Then increase it by <strong>1</strong> (use <strong>counter = counter + 1</strong>). Print the new value.",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: сначала counter=0, потом сделайте counter=counter+1 и выведите counter."
        : "Hint: first set counter=0, then do counter=counter+1 and print counter.",
    validate: validateIncCounter,
  },
  discount_calc: {
    id: "discount_calc",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru"
        ? "Задача 7: Умный калькулятор скидок"
        : "Task 7: Smart Discount Calculator",
    description: (lang) =>
      lang === "ru"
        ? "Создайте переменную <strong>price</strong> и сохраните в неё цену товара (например, <strong>1000</strong>). Создайте вторую переменную <strong>discount</strong> и сохраните в неё размер скидки в процентах (например, <strong>15</strong>). Вычислите и выведите <strong>финальную цену</strong> по формуле: <strong>price - (price * discount / 100)</strong>."
        : "Create a variable <strong><code>price</code></strong> and store the item price in it (e.g. <strong>1000</strong>). Create a second variable <strong><code>discount</code></strong> and store the discount percent in it (e.g. <strong>15</strong>). Compute and print the <strong>final price</strong> using: <strong>price - (price * discount / 100)</strong>.",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: понадобятся переменные (set/get) и арифметические блоки. Соберите выражение по шагам и выведите результат."
        : "Hint: use variables (set/get) and arithmetic blocks. Build the expression step by step and print the result.",
    validate: validateDiscountCalc,
  },
  first_condition: {
    id: "first_condition",
    difficulty: "basic",
    title: (lang) =>
      lang === "ru" ? "Задача 8: Первое условие" : "Task 8: First condition",
    description: (lang) =>
      lang === "ru"
        ? 'Создайте переменную <strong>temperature</strong> и сохраните в неё какое-либо число. Задача: проверьте, что температура выше нуля. Если это так — выведите фразу <strong>"The weather is warm"</strong>. Если нет — не выводите ничего.'
        : 'Create a variable <strong>temperature</strong> and store any number in it. Task: check that the temperature is above zero. If yes, print <strong>"The weather is warm"</strong>. If not, print nothing.',
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: используйте if/else (Logic) и сравнение (Logic), например temperature > 0."
        : "Hint: use if/else (Logic) and a comparison (Logic), e.g. temperature > 0.",
    validate: validateFirstCondition,
  },
  sub_10_4: {
    id: "sub_10_4",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 9: 10 − 4" : "Task 9: 10 − 4"),
    description: (lang) =>
      lang === "ru"
        ? "Вычтите <strong>4</strong> из <strong>10</strong> и выведите результат в окно вывода: должно получиться <strong>6</strong>."
        : "Subtract <strong>4</strong> from <strong>10</strong> and print the result to the output: it should be <strong>6</strong>.",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: используйте блок вычитания из категории Математика и блок печати/вывода."
        : "Hint: use the subtraction block from Math and a print/output block.",
    validate: validateSub10Minus4,
  },
  a1_number_analyzer: {
    id: "a1_number_analyzer",
    difficulty: "advanced",
    title: (lang) =>
      lang === "ru" ? "Задача A1: Анализ числа" : "Task A1: Number Analyzer",
    description: (lang) =>
      lang === "ru"
        ? 'Создайте переменную <strong>number</strong> и сохраните в неё любое целое число. Программа должна определить и вывести два факта о нём (каждый с новой строки):<br>1) чётное или нечётное (например, <strong>"The number is even"</strong>)<br>2) положительное, отрицательное или ноль (например, <strong>"The number is positive"</strong>).'
        : 'Create a variable <strong>number</strong> and store any integer in it. Print two facts (each on a new line):<br>1) even or odd (e.g. <strong>"The number is even"</strong>)<br>2) positive, negative, or zero (e.g. <strong>"The number is positive"</strong>).',
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: используйте if/else, сравнения (>, <, ==) и остаток от деления (%)."
        : "Hint: use if/else, comparisons (>, <, ==) and modulo (%).",
    validate: validateNumberAnalyzer,
  },
  sum_array: {
    id: "sum_array",
    difficulty: "advanced",
    title: (lang) =>
      lang === "ru" ? "Задача 10: Сумма массива" : "Task 10: Array sum",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список чисел <code>[1, 2, 3, 4, 5]</code> и выведите их сумму: <strong>15</strong>. Можно использовать блоки из категории Списки/Математика или цикл."
        : "Create a list of numbers <code>[1, 2, 3, 4, 5]</code> and print their sum: <strong>15</strong>. You may use list/math blocks or a loop.",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: попробуйте блок ‘операции над списком’ (SUM) или цикл forEach."
        : "Hint: try ‘math on list’ (SUM) or a forEach loop.",
    validate: validateSumArray,
  },
  min_max: {
    id: "min_max",
    difficulty: "advanced",
    title: (lang) =>
      lang === "ru" ? "Задача 11: Минимум и максимум" : "Task 11: Min and Max",
    description: (lang) =>
      lang === "ru"
        ? "Создайте список <code>[5, 1, 9, 3, 7]</code> и выведите минимальное и максимальное значения: <strong>min=1</strong> и <strong>max=9</strong>. Допустимо выводить в одну строку или в две."
        : "Create a list <code>[5, 1, 9, 3, 7]</code> and print min and max: <strong>min=1</strong> and <strong>max=9</strong>. One or two lines are fine.",
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: используйте ‘операции над списком’ MIN/MAX или напишите цикл."
        : "Hint: use ‘math on list’ MIN/MAX or write a loop.",
    validate: validateMinMax,
  },
  char_freq: {
    id: "char_freq",
    difficulty: "advanced",
    title: (lang) =>
      lang === "ru"
        ? "Задача 12: Частоты символов"
        : "Task 12: Character frequencies",
    description: (lang) =>
      lang === "ru"
        ? 'Подсчитайте частоты символов в строке <code>"abcaabbb"</code> и выведите результат, например: <strong>a:3 b:4 c:1</strong> (формат вывода свободный). Рекомендуется использовать блоки словаря из категории Custom.'
        : 'Count character frequencies in the string <code>"abcaabbb"</code> and print the result, e.g. <strong>a:3 b:4 c:1</strong> (any clear format). Using the dictionary blocks from Custom is recommended.',
    hint: (lang) =>
      lang === "ru"
        ? "Подсказка: создайте словарь, проверяйте наличие ключа и увеличивайте счётчик."
        : "Hint: create a dictionary, check key existence, and increment counters.",
    validate: validateCharFreq,
  },
};

let activeTaskId: TaskId = "hello_world";

let activeDifficulty: TaskDifficulty = "basic";

const FREE_TASK_NAV = true;

// Порядок задач для последовательного прохождения
const TASKS_ORDER_BY_DIFFICULTY: Record<TaskDifficulty, TaskId[]> = {
  basic: [
    "hello_world",
    "add_2_7",
    "var_my_age",
    "calc_sum",
    "greet_concat",
    "inc_counter",
    "discount_calc",
    "first_condition",
    "sub_10_4",
  ],
  advanced: ["a1_number_analyzer", "sum_array", "min_max", "char_freq"],
};
const PROGRESS_KEY = "task_progress_v1";

type Progress = Partial<Record<TaskId, { solved: boolean; stars: number }>>;

function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Progress;
  } catch {
    return {};
  }
}

function saveProgress(p: Progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  } catch {
    /* ничего */
  }
}

function markSolved(taskId: TaskId, stars: number) {
  const p = loadProgress();
  p[taskId] = { solved: true, stars };
  saveProgress(p);
}

export function isSolved(taskId: TaskId): boolean {
  const p = loadProgress();
  return !!p[taskId]?.solved;
}

export function getActiveDifficulty(): TaskDifficulty {
  return activeDifficulty;
}

export function setActiveDifficulty(difficulty: TaskDifficulty) {
  activeDifficulty = difficulty;
}

export function getFirstUnsolvedTask(
  difficulty: TaskDifficulty = activeDifficulty,
): TaskId {
  const p = loadProgress();
  const order = TASKS_ORDER_BY_DIFFICULTY[difficulty] || [];
  for (const id of order) {
    if (!p[id]?.solved) return id;
  }
  return order[order.length - 1] || "hello_world";
}

export function getNextTaskId(current: TaskId): TaskId | null {
  const order = TASKS_ORDER_BY_DIFFICULTY[tasks[current].difficulty] || [];
  const idx = order.indexOf(current);
  if (idx < 0) return null;
  return idx + 1 < order.length ? order[idx + 1] : null;
}

export function getPrevTaskId(current: TaskId): TaskId | null {
  const order = TASKS_ORDER_BY_DIFFICULTY[tasks[current].difficulty] || [];
  const idx = order.indexOf(current);
  if (idx <= 0) return null;
  return order[idx - 1] || null;
}

export function getActiveTask(): TaskId {
  return activeTaskId;
}

// ---------- Вспомогательные функции ----------
function collectPrintedLines(el: HTMLDivElement | null): string[] {
  if (!el) return [];
  return Array.from(el.querySelectorAll("p"))
    .map((p) => (p.textContent || "").trim())
    .filter((s) => s.length > 0);
}

function getVisibleOutputLines(): string[] {
  const out = document.getElementById("output") as HTMLDivElement | null;
  return collectPrintedLines(out);
}

function getVarFieldText(b: any): string {
  try {
    const f = typeof b?.getField === "function" ? b.getField("VAR") : null;
    const t = typeof f?.getText === "function" ? f.getText() : "";
    return String(t || "");
  } catch {
    return "";
  }
}

function tryGetAssignedNumber(setBlock: any): number | null {
  try {
    const target =
      typeof setBlock?.getInputTargetBlock === "function"
        ? setBlock.getInputTargetBlock("VALUE")
        : null;
    if (!target || (target as any).type !== "math_number") return null;
    const raw =
      typeof (target as any).getFieldValue === "function"
        ? (target as any).getFieldValue("NUM")
        : undefined;
    if (raw === undefined || raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function validateHelloWorld(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();
  const expected = "Hello World!";
  const ok = lines.includes(expected);

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (count <= 2)
      stars = 3; // печать + текст
    else if (count <= 4) stars = 2;
    else stars = 1;
  } else {
    stars = 0;
  }
  return { ok, stars };
}

async function validateAdd2Plus7(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();
  const expected = "9"; // должно вывести 9
  const ok = lines.includes(expected);

  // Эвристика по звёздам: желательно использовать math_arithmetic с ADD и числами 2 и 7
  let hasAddition = false;
  let has2 = false;
  let has7 = false;
  try {
    const blocks = getNonShadowBlocks(ws);
    for (const b of blocks) {
      if ((b as any).type === "math_arithmetic") {
        const op =
          typeof (b as any).getFieldValue === "function"
            ? (b as any).getFieldValue("OP")
            : undefined;
        if (op === "ADD") hasAddition = true;
      }
      if ((b as any).type === "math_number") {
        const num =
          typeof (b as any).getFieldValue === "function"
            ? (b as any).getFieldValue("NUM")
            : undefined;
        if (String(num) === "2") has2 = true;
        if (String(num) === "7") has7 = true;
      }
    }
  } catch {
    // игнорируем
  }

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (hasAddition && has2 && has7 && count <= 4)
      stars = 3; // печать + math_arithmetic + 2 числа
    else if (count <= 6) stars = 2;
    else stars = 1;
  } else {
    stars = 0;
  }
  return { ok, stars };
}

async function validateVarMyAge(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();

  const nonShadowBlocks = getNonShadowBlocks(ws);

  let assignedValue: string | null = null;
  let hasSetMyAge = false;
  let hasGetMyAge = false;
  let hasPrint = false;
  for (const b of nonShadowBlocks) {
    const t = (b as any).type;
    if (t === "variables_set") {
      const name = getVarFieldText(b);
      if (name === "myAge") {
        hasSetMyAge = true;
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
            if (num !== undefined && num !== null)
              assignedValue = String(num).trim();
          }
        } catch {}
      }
    }
    if (t === "variables_get") {
      const name = getVarFieldText(b);
      if (name === "myAge") hasGetMyAge = true;
    }
    if (t === "text_print" || t === "add_text") {
      hasPrint = true;
    }
  }

  const ok = (() => {
    if (!assignedValue) return false;
    const re = new RegExp(`(^|\\b)${escapeRe(assignedValue)}(\\b|$)`);
    const hasValueInOutput = lines.some((l) => re.test(l));
    return hasSetMyAge && hasGetMyAge && hasValueInOutput;
  })();

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (hasSetMyAge && hasGetMyAge && hasPrint && assignedValue && count <= 5)
      stars = 3;
    else if (count <= 8) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateCalcSum(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();

  const nonShadowBlocks = getNonShadowBlocks(ws);

  let aVal: number | null = null;
  let bVal: number | null = null;
  let hasSetA = false;
  let hasSetB = false;
  let hasSetSum = false;
  let hasGetA = false;
  let hasGetB = false;
  let hasGetSum = false;
  let hasPrint = false;
  let hasSumFromAPlusB = false;

  for (const b of nonShadowBlocks) {
    const t = (b as any).type;
    if (t === "variables_set") {
      const name = getVarFieldText(b);
      if (name === "a") {
        hasSetA = true;
        const n = tryGetAssignedNumber(b);
        if (n !== null) aVal = n;
      }
      if (name === "b") {
        hasSetB = true;
        const n = tryGetAssignedNumber(b);
        if (n !== null) bVal = n;
      }
      if (name === "sum") {
        hasSetSum = true;
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
            if (op === "ADD") {
              const left =
                typeof (valueBlock as any).getInputTargetBlock === "function"
                  ? (valueBlock as any).getInputTargetBlock("A")
                  : null;
              const right =
                typeof (valueBlock as any).getInputTargetBlock === "function"
                  ? (valueBlock as any).getInputTargetBlock("B")
                  : null;
              const leftOk =
                left &&
                (left as any).type === "variables_get" &&
                getVarFieldText(left) === "a";
              const rightOk =
                right &&
                (right as any).type === "variables_get" &&
                getVarFieldText(right) === "b";
              const leftOk2 =
                left &&
                (left as any).type === "variables_get" &&
                getVarFieldText(left) === "b";
              const rightOk2 =
                right &&
                (right as any).type === "variables_get" &&
                getVarFieldText(right) === "a";
              if ((leftOk && rightOk) || (leftOk2 && rightOk2))
                hasSumFromAPlusB = true;
            }
          }
        } catch {}
      }
    }
    if (t === "variables_get") {
      const name = getVarFieldText(b);
      if (name === "a") hasGetA = true;
      if (name === "b") hasGetB = true;
      if (name === "sum") hasGetSum = true;
    }
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const ok = (() => {
    if (aVal === null || bVal === null) return false;
    const expected = aVal + bVal;
    const re = new RegExp(`(^|\\b)${escapeRe(String(expected))}(\\b|$)`);
    const hasValueInOutput = lines.some((l) => re.test(l));
    return (
      hasSetA &&
      hasSetB &&
      hasSetSum &&
      hasGetSum &&
      hasGetA &&
      hasGetB &&
      hasSumFromAPlusB &&
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

async function validateGreetConcat(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();

  const nonShadowBlocks = getNonShadowBlocks(ws);

  let hasSetName = false;
  let hasGetName = false;
  let usedTextJoin = false;
  let usedTextAppend = false;
  let hasPrint = false;

  for (const b of nonShadowBlocks) {
    const t = (b as any).type;
    if (t === "variables_set" && getVarFieldText(b) === "name")
      hasSetName = true;
    if (t === "variables_get" && getVarFieldText(b) === "name")
      hasGetName = true;
    if (t === "text_join") usedTextJoin = true;
    if (t === "text_append") usedTextAppend = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const ok =
    hasSetName &&
    hasGetName &&
    (usedTextJoin || usedTextAppend) &&
    lines.some((l) => /^Hello,\s*.+!$/.test(l.trim()));

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (hasPrint && usedTextJoin && count <= 9) stars = 3;
    else if (count <= 12) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateIncCounter(
  ws: Blockly.WorkspaceSvg,
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

    if (t === "variables_set" && getVarFieldText(b) === "counter") {
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

          const isGetCounter = (x: any) =>
            x &&
            (x as any).type === "variables_get" &&
            getVarFieldText(x) === "counter";
          const isOne = (x: any) => {
            if (!x || (x as any).type !== "math_number") return false;
            const raw =
              typeof (x as any).getFieldValue === "function"
                ? (x as any).getFieldValue("NUM")
                : undefined;
            return String(raw).trim() === "1";
          };

          if (
            (isGetCounter(left) && isOne(right)) ||
            (isOne(left) && isGetCounter(right))
          )
            incOk = true;
        } catch {}
      }
    }

    if (t === "math_change" && getVarFieldText(b) === "counter") {
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

    if (t === "variables_get" && getVarFieldText(b) === "counter")
      hasGetCounter = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const ok = initOk && incOk && hasGetCounter && lines.includes("1");

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
  ws: Blockly.WorkspaceSvg,
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
    }

    if (t === "variables_get") {
      const name = getVarFieldText(b);
      if (name === "price") hasGetPrice = true;
      if (name === "discount") hasGetDiscount = true;
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
    hasSetPrice &&
    hasSetDiscount &&
    hasGetPrice &&
    hasGetDiscount &&
    hasPrint &&
    expected !== null &&
    hasExpectedInOutput;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedFormulaHints =
      usedMinus && usedMultiply && usedDivide && usedPercentConst;
    if (usedFormulaHints && count <= 14) stars = 3;
    else if (count <= 18) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateFirstCondition(
  ws: Blockly.WorkspaceSvg,
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

    if (t === "variables_set" && getVarFieldText(b) === "temperature") {
      hasSetTemperature = true;
      const n = tryGetAssignedNumber(b);
      if (n !== null) tempValue = n;
    }

    if (t === "variables_get" && getVarFieldText(b) === "temperature")
      hasGetTemperature = true;

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
            x &&
            (x as any).type === "variables_get" &&
            getVarFieldText(x) === "temperature";
          const isZero = (x: any) => {
            if (!x || (x as any).type !== "math_number") return false;
            const raw =
              typeof (x as any).getFieldValue === "function"
                ? (x as any).getFieldValue("NUM")
                : undefined;
            return String(raw).trim() === "0";
          };
          if (
            (isTemp(left) && isZero(right)) ||
            (isZero(left) && isTemp(right))
          ) {
            hasGreaterThanZero = true;
          }
        }
      } catch {}
    }

    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const hasWarmOutput = lines.some((l) =>
    l.trim().toLowerCase().includes("the weather is warm"),
  );

  const ok =
    hasSetTemperature &&
    hasGetTemperature &&
    hasIf &&
    hasCompare &&
    hasPrint &&
    hasWarmOutput &&
    tempValue !== null &&
    tempValue > 0;

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

async function validateNumberAnalyzer(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines().map((l) => l.trim());

  const nonShadowBlocks = getNonShadowBlocks(ws);

  const tryGetAssignedInt = (setBlock: any): number | null => {
    try {
      const target =
        typeof setBlock?.getInputTargetBlock === "function"
          ? setBlock.getInputTargetBlock("VALUE")
          : null;
      if (!target || (target as any).type !== "math_number") return null;
      const raw =
        typeof (target as any).getFieldValue === "function"
          ? (target as any).getFieldValue("NUM")
          : undefined;
      if (raw === undefined || raw === null) return null;
      const n = Number(raw);
      if (!Number.isFinite(n)) return null;
      if (!Number.isInteger(n)) return null;
      return n;
    } catch {
      return null;
    }
  };

  let n: number | null = null;
  let hasSetNumber = false;
  let hasGetNumber = false;
  let usedIfElse = false;
  let usedCompare = false;
  let usedModulo = false;
  let hasPrint = false;

  for (const b of nonShadowBlocks) {
    const t = (b as any).type;
    if (t === "variables_set" && getVarFieldText(b) === "number") {
      hasSetNumber = true;
      const cand = tryGetAssignedInt(b);
      if (cand !== null) n = cand;
    }
    if (t === "variables_get" && getVarFieldText(b) === "number")
      hasGetNumber = true;

    if (t === "controls_if") {
      try {
        const elseCount =
          typeof (b as any).elseCount_ === "number" ? (b as any).elseCount_ : 0;
        const hasElseInput =
          typeof (b as any).getInput === "function" &&
          !!(b as any).getInput("ELSE");
        if (elseCount > 0 || hasElseInput) usedIfElse = true;
      } catch {}
    }

    if (t === "logic_compare") usedCompare = true;
    if (t === "math_modulo") usedModulo = true;
    if (t === "text_print" || t === "add_text") hasPrint = true;
  }

  const expected = (() => {
    if (n === null) return null;
    const parity = n % 2 === 0 ? "even" : "odd";
    const sign = n > 0 ? "positive" : n < 0 ? "negative" : "zero";
    return {
      evenLine: `The number is ${parity}`.toLowerCase(),
      signLine: `The number is ${sign}`.toLowerCase(),
      ruEvenLine:
        n % 2 === 0
          ? "Число чётное".toLowerCase()
          : "Число нечётное".toLowerCase(),
      ruSignLine:
        n > 0
          ? "Число положительное".toLowerCase()
          : n < 0
            ? "Число отрицательное".toLowerCase()
            : "Число равно нулю".toLowerCase(),
    };
  })();

  const normalized = lines.map((l) => l.replace(/[.!]+$/g, "").toLowerCase());

  const hasParityLine = (() => {
    if (!expected) return false;
    return (
      normalized.includes(expected.evenLine) ||
      normalized.includes(expected.ruEvenLine)
    );
  })();

  const hasSignLine = (() => {
    if (!expected) return false;
    return (
      normalized.includes(expected.signLine) ||
      normalized.includes(expected.ruSignLine)
    );
  })();

  const ok =
    hasSetNumber &&
    hasGetNumber &&
    hasPrint &&
    n !== null &&
    hasParityLine &&
    hasSignLine;

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    const usedCore = usedIfElse && usedCompare && usedModulo;
    if (usedCore && count <= 18) stars = 3;
    else if (count <= 24) stars = 2;
    else stars = 1;
  }

  return { ok, stars };
}

async function validateSub10Minus4(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();
  const expected = "6";
  const ok = lines.includes(expected);

  let hasSubtract = false;
  let has10 = false;
  let has4 = false;
  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    if ((b as any).type === "math_arithmetic") {
      const op =
        typeof (b as any).getFieldValue === "function"
          ? (b as any).getFieldValue("OP")
          : undefined;
      if (op === "MINUS") hasSubtract = true;
    }
    if ((b as any).type === "math_number") {
      const num =
        typeof (b as any).getFieldValue === "function"
          ? (b as any).getFieldValue("NUM")
          : undefined;
      if (String(num) === "10") has10 = true;
      if (String(num) === "4") has4 = true;
    }
  }

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (hasSubtract && has10 && has4 && count <= 4) stars = 3;
    else if (count <= 6) stars = 2;
    else stars = 1;
  } else {
    stars = 0;
  }
  return { ok, stars };
}

async function validateSumArray(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();
  const ok = lines.some((l) => /(^|\b)15(\b|$)/.test(l));

  // Эвристика по звёздам: либо SUM через math_on_list, либо суммирование в цикле forEach
  let usedMathOnList = false;
  let usedForEach = false;
  let usedListCreate = false;
  try {
    const blocks = getNonShadowBlocks(ws);
    for (const b of blocks) {
      const t = (b as any).type;
      if (t === "lists_create_with") usedListCreate = true;
      if (t === "controls_forEach") usedForEach = true;
      if (t === "math_on_list") usedMathOnList = true;
    }
  } catch {}

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (usedMathOnList && usedListCreate && count <= 6) stars = 3;
    else if (usedForEach && usedListCreate && count <= 8) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateMinMax(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();
  const hasMin = lines.some(
    (l) => /min\s*[:=]\s*1/i.test(l) || l.trim() === "1",
  );
  const hasMax = lines.some(
    (l) => /max\s*[:=]\s*9/i.test(l) || l.trim() === "9",
  );
  const ok = hasMin && hasMax;

  let usedMathOnList = false;
  let usedMin = false;
  let usedMax = false;
  const blocks = getNonShadowBlocks(ws);
  for (const b of blocks) {
    if ((b as any).type === "math_on_list") {
      usedMathOnList = true;
      // в разных версиях Blockly используется поле OP или MODE
      const mode =
        typeof (b as any).getFieldValue === "function"
          ? (b as any).getFieldValue("OP") || (b as any).getFieldValue("MODE")
          : undefined;
      if (String(mode).toUpperCase().includes("MIN")) usedMin = true;
      if (String(mode).toUpperCase().includes("MAX")) usedMax = true;
    }
  }

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (usedMathOnList && usedMin && usedMax && count <= 8) stars = 3;
    else if (count <= 10) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

async function validateCharFreq(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();
  const need = { a: 3, b: 4, c: 1 } as Record<string, number>;
  const checks = Object.entries(need).map(([ch, n]) =>
    lines.some((l) => new RegExp(`${ch}\s*[:=]\s*${n}`, "i").test(l)),
  );
  const ok = checks.every(Boolean);

  // Эвристика: желательно использовать блоки словаря
  let usedDict = false;
  const dictBlocks = getNonShadowBlocks(ws);
  for (const b of dictBlocks) {
    const t = (b as any).type;
    if (
      t === "dict_create" ||
      t === "dict_set" ||
      t === "dict_get" ||
      t === "dict_has_key"
    ) {
      usedDict = true;
      break;
    }
  }

  const count = countNonShadowBlocks(ws);
  let stars = 0;
  if (ok) {
    if (usedDict && count <= 14) stars = 3;
    else if (count <= 18) stars = 2;
    else stars = 1;
  }
  return { ok, stars };
}

// ---------- Rendering ----------
function renderResult(
  feedbackEl: HTMLDivElement | null,
  starsEl: HTMLDivElement | null,
  ok: boolean,
  stars: number,
  failureHint: string,
) {
  if (starsEl) {
    starsEl.innerHTML = "";
    const total = 3;
    for (let i = 0; i < total; i++) {
      const span = document.createElement("span");
      span.textContent = i < stars ? "★" : "☆";
      span.style.color = i < stars ? "#f5a623" : "#999";
      span.style.fontSize = "18px";
      span.style.marginRight = "2px";
      starsEl.appendChild(span);
    }
  }

  if (feedbackEl) {
    const t = (window as any)._currentLocalizedStrings;
    if (ok) {
      feedbackEl.style.color = "#2e7d32";
      feedbackEl.textContent =
        stars === 3
          ? t?.TaskPerfect || "Отлично! Решение оптимально."
          : t?.TaskPassed || "Решение верное.";
    } else {
      feedbackEl.style.color = "#c62828";
      feedbackEl.textContent = failureHint;
    }
  }
}

export function setActiveTask(taskId: TaskId) {
  activeTaskId = taskId;
  activeDifficulty = tasks[taskId].difficulty;
  const lang = getAppLang();

  const titleEl = document.querySelector(
    "#taskSidebar .task-title",
  ) as HTMLElement | null;
  const descEl = document.querySelector(
    "#taskSidebar .task-desc",
  ) as HTMLElement | null;
  const hintEl = document.querySelector(
    "#taskSidebar .task-hint",
  ) as HTMLElement | null;
  const hintDetails = document.getElementById(
    "taskHintDetails",
  ) as HTMLDetailsElement | null;
  const feedbackEl = document.getElementById(
    "taskFeedback",
  ) as HTMLDivElement | null;
  const starsEl = document.getElementById("taskStars") as HTMLDivElement | null;
  const nextButton = document.getElementById(
    "nextTaskBtn",
  ) as HTMLButtonElement | null;
  const prevButton = document.getElementById(
    "prevTaskBtn",
  ) as HTMLButtonElement | null;

  const tdef = tasks[activeTaskId];
  if (titleEl) titleEl.textContent = tdef.title(lang);
  if (descEl) descEl.innerHTML = tdef.description(lang);
  if (hintEl) hintEl.textContent = tdef.hint(lang);
  if (hintDetails) hintDetails.open = false;
  if (feedbackEl) feedbackEl.textContent = "";
  if (starsEl) starsEl.innerHTML = "";
  const nextId = getNextTaskId(activeTaskId);
  if (nextButton)
    nextButton.disabled =
      nextId === null ? true : !FREE_TASK_NAV && !isSolved(activeTaskId);
  if (prevButton) prevButton.disabled = getPrevTaskId(activeTaskId) === null;

  const consoleInfo = document.getElementById(
    "consoleOutputInfoSection",
  ) as HTMLDivElement | null;
  const dataTypesInfo = document.getElementById(
    "dataTypesInfoSection",
  ) as HTMLDivElement | null;
  const variableInfo = document.getElementById(
    "variableInfoSection",
  ) as HTMLDivElement | null;
  const concatInfo = document.getElementById(
    "concatInfoSection",
  ) as HTMLDivElement | null;
  const incDecInfo = document.getElementById(
    "incDecInfoSection",
  ) as HTMLDivElement | null;
  const conditionInfo = document.getElementById(
    "conditionInfoSection",
  ) as HTMLDivElement | null;
  const showDataTypes = activeTaskId === "add_2_7";
  const showVariableInfo =
    activeTaskId === "var_my_age" || activeTaskId === "calc_sum";
  const showConcatInfo = activeTaskId === "greet_concat";
  const showIncDecInfo = activeTaskId === "inc_counter";
  const showConditionInfo = activeTaskId === "first_condition";
  const showConsole =
    !showDataTypes &&
    !showVariableInfo &&
    !showConcatInfo &&
    !showIncDecInfo &&
    !showConditionInfo;
  if (consoleInfo) consoleInfo.style.display = showConsole ? "" : "none";
  if (dataTypesInfo) dataTypesInfo.style.display = showDataTypes ? "" : "none";
  if (variableInfo) variableInfo.style.display = showVariableInfo ? "" : "none";
  if (concatInfo) concatInfo.style.display = showConcatInfo ? "" : "none";
  if (incDecInfo) incDecInfo.style.display = showIncDecInfo ? "" : "none";
  if (conditionInfo)
    conditionInfo.style.display = showConditionInfo ? "" : "none";
}

export function initTaskValidation(
  ws: Blockly.WorkspaceSvg,
  opts: InitTaskValidationOptions,
) {
  const { checkButton, feedbackEl, starsEl, nextButton, prevButton } = opts;
  if (!checkButton) return;

  // Сброс визуального результата
  const resetResult = () => {
    if (feedbackEl) feedbackEl.textContent = "";
    if (starsEl) starsEl.innerHTML = "";
  };

  checkButton.addEventListener("click", () => {
    void (async () => {
      // Требуем, чтобы пользователь сначала выполнил код через кнопку запуска
      const currentLines = getVisibleOutputLines();
      const t = (window as any)._currentLocalizedStrings;
      if (currentLines.length === 0) {
        const msg =
          t?.RunFirst ||
          (getAppLang() === "ru"
            ? "Сначала запустите код"
            : "Run the code first");
        renderResult(feedbackEl, starsEl, false, 0, msg);
        return;
      }

      const tdef = tasks[activeTaskId];
      const { ok, stars } = await tdef.validate(ws);
      const hint = tdef.hint(getAppLang());
      renderResult(feedbackEl, starsEl, ok, stars, hint);

      if (ok) {
        markSolved(activeTaskId, stars);
        if (nextButton)
          nextButton.disabled =
            getNextTaskId(activeTaskId) === null
              ? true
              : !FREE_TASK_NAV && !isSolved(activeTaskId);
      }
    })();
  });

  if (nextButton) {
    // Кнопка активируется только если текущая задача решена и есть следующая
    nextButton.disabled =
      getNextTaskId(activeTaskId) === null
        ? true
        : !FREE_TASK_NAV && !isSolved(activeTaskId);
    nextButton.addEventListener("click", () => {
      const next = getNextTaskId(activeTaskId);
      if (!next) return;
      setActiveTask(next);
      // после перехода — блокируем кнопку снова, пока новая задача не решена
      nextButton.disabled =
        getNextTaskId(next) === null ? true : !FREE_TASK_NAV && !isSolved(next);
      if (prevButton) prevButton.disabled = getPrevTaskId(next) === null;
      resetResult();
    });
  }

  if (prevButton) {
    // Кнопка предыдущей задачи активна, если есть предыдущая
    prevButton.disabled = getPrevTaskId(activeTaskId) === null;
    prevButton.addEventListener("click", () => {
      const prev = getPrevTaskId(activeTaskId);
      if (!prev) return;
      setActiveTask(prev);
      // после перехода — пересчитываем состояния навигации
      prevButton.disabled = getPrevTaskId(prev) === null;
      if (nextButton)
        nextButton.disabled =
          getNextTaskId(prev) === null
            ? true
            : !FREE_TASK_NAV && !isSolved(prev);
      resetResult();
    });
  }
}
