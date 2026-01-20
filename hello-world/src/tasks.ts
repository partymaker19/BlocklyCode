import * as Blockly from "blockly";
import { getAppLang } from "./localization";

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
  | "sub_10_4"
  | "sum_array"
  | "min_max"
  | "char_freq";

export type TaskDifficulty = "basic" | "advanced";

type TaskDef = {
  id: TaskId;
  difficulty: TaskDifficulty;
  title: (lang: "ru" | "en") => string;
  description: (lang: "ru" | "en") => string; // can contain HTML
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
        ? "Создайте переменную с именем <code>myAge</code> и сохраните в неё число. Затем выведите значение этой переменной в окно вывода.<br><br><strong>Пример:</strong> вы устанавливаете значение <strong>10</strong>, и в окне вывода появляется <strong>10</strong>.<br><br><strong>Дополнительно (для исследования):</strong> после того как получилось, попробуйте изменить число в переменной или создать новую переменную с другим именем (например, <code>birthYear</code>) и вывести её."
        : "Create a variable named <code>myAge</code> and store a number in it. Then print the value of this variable to the output.<br><br><strong>Example:</strong> you set it to <strong>10</strong>, and the output shows <strong>10</strong>.<br><br><strong>Bonus (explore):</strong> after it works, try changing the number or creating a new variable with another name (e.g. <code>birthYear</code>) and printing it.",
    hint: (lang) =>
      lang === "ru"
        ? 'Подсказка: используйте "create variable..." в категории Variables, затем блок присваивания значения (например, число из Math) и блок вывода.'
        : 'Hint: use "create variable..." in Variables, then a set-value block (e.g. a number from Math) and a print/output block.',
    validate: validateVarMyAge,
  },
  sub_10_4: {
    id: "sub_10_4",
    difficulty: "basic",
    title: (lang) => (lang === "ru" ? "Задача 4: 10 − 4" : "Task 4: 10 − 4"),
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
  sum_array: {
    id: "sum_array",
    difficulty: "advanced",
    title: (lang) =>
      lang === "ru" ? "Задача 5: Сумма массива" : "Task 5: Array sum",
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
      lang === "ru" ? "Задача 6: Минимум и максимум" : "Task 6: Min and Max",
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
        ? "Задача 7: Частоты символов"
        : "Task 7: Character frequencies",
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

// Порядок задач для последовательного прохождения
const TASKS_ORDER_BY_DIFFICULTY: Record<TaskDifficulty, TaskId[]> = {
  basic: ["hello_world", "add_2_7", "var_my_age", "sub_10_4"],
  advanced: ["sum_array", "min_max", "char_freq"],
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
    /* noop */
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

// ---------- Helpers ----------
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

function getBlockCount(ws: Blockly.WorkspaceSvg | null | undefined): number {
  try {
    if (!ws) return 0;
    return ws.getAllBlocks(false).filter((b: Blockly.Block) => !b.isShadow())
      .length;
  } catch {
    return 0;
  }
}

async function validateHelloWorld(
  ws: Blockly.WorkspaceSvg,
): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();
  const expected = "Hello World!";
  const ok = lines.includes(expected);

  const count = getBlockCount(ws);
  let stars = 0;
  if (ok) {
    if (count <= 2)
      stars = 3; // print + text
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
  const expected = "9"; // must print 9
  const ok = lines.includes(expected);

  // Heuristics for stars: prefer using math_arithmetic with ADD and numbers 2 and 7
  let hasAddition = false;
  let has2 = false;
  let has7 = false;
  try {
    const blocks = ws.getAllBlocks(false).filter((b: any) => !b.isShadow());
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
    // ignore
  }

  const count = getBlockCount(ws);
  let stars = 0;
  if (ok) {
    if (hasAddition && has2 && has7 && count <= 4)
      stars = 3; // print + math_arithmetic + 2 numbers
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

  const nonShadowBlocks = (() => {
    try {
      return ws.getAllBlocks(false).filter((b: any) => !b.isShadow());
    } catch {
      return [];
    }
  })();

  const getVarFieldText = (b: any): string => {
    try {
      const f = typeof b?.getField === "function" ? b.getField("VAR") : null;
      const t = typeof f?.getText === "function" ? f.getText() : "";
      return String(t || "");
    } catch {
      return "";
    }
  };

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

  const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const ok = (() => {
    if (!assignedValue) return false;
    const re = new RegExp(`(^|\\b)${escapeRe(assignedValue)}(\\b|$)`);
    const hasValueInOutput = lines.some((l) => re.test(l));
    return hasSetMyAge && hasGetMyAge && hasValueInOutput;
  })();

  const count = getBlockCount(ws);
  let stars = 0;
  if (ok) {
    if (hasSetMyAge && hasGetMyAge && hasPrint && assignedValue && count <= 5)
      stars = 3;
    else if (count <= 8) stars = 2;
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
  try {
    const blocks = ws.getAllBlocks(false).filter((b: any) => !b.isShadow());
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
  } catch {}

  const count = getBlockCount(ws);
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

  // Heuristics for stars: SUM via math_on_list or forEach
  let usedMathOnList = false;
  let usedForEach = false;
  let usedListCreate = false;
  try {
    const blocks = ws.getAllBlocks(false).filter((b: any) => !b.isShadow());
    for (const b of blocks) {
      const t = (b as any).type;
      if (t === "lists_create_with") usedListCreate = true;
      if (t === "controls_forEach") usedForEach = true;
      if (t === "math_on_list") usedMathOnList = true;
    }
  } catch {}

  const count = getBlockCount(ws);
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
  try {
    const blocks = ws.getAllBlocks(false).filter((b: any) => !b.isShadow());
    for (const b of blocks) {
      if ((b as any).type === "math_on_list") {
        usedMathOnList = true;
        // some versions encode MODE field
        const mode =
          typeof (b as any).getFieldValue === "function"
            ? (b as any).getFieldValue("OP") || (b as any).getFieldValue("MODE")
            : undefined;
        if (String(mode).toUpperCase().includes("MIN")) usedMin = true;
        if (String(mode).toUpperCase().includes("MAX")) usedMax = true;
      }
    }
  } catch {}

  const count = getBlockCount(ws);
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

  // Prefer dictionary blocks usage
  let usedDict = false;
  try {
    const blocks = ws.getAllBlocks(false).filter((b: any) => !b.isShadow());
    for (const b of blocks) {
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
  } catch {}

  const count = getBlockCount(ws);
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
  if (feedbackEl) feedbackEl.textContent = "";
  if (starsEl) starsEl.innerHTML = "";
  if (nextButton)
    nextButton.disabled =
      !isSolved(activeTaskId) || getNextTaskId(activeTaskId) === null;
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
  const showDataTypes = activeTaskId === "add_2_7";
  const showVariableInfo = activeTaskId === "var_my_age";
  const showConsole = !showDataTypes && !showVariableInfo;
  if (consoleInfo) consoleInfo.style.display = showConsole ? "" : "none";
  if (dataTypesInfo) dataTypesInfo.style.display = showDataTypes ? "" : "none";
  if (variableInfo)
    variableInfo.style.display = showVariableInfo ? "" : "none";
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
          nextButton.disabled = getNextTaskId(activeTaskId) === null; // включить, если есть куда идти
      }
    })();
  });

  if (nextButton) {
    // Кнопка активируется только если текущая задача решена и есть следующая
    nextButton.disabled =
      !isSolved(activeTaskId) || getNextTaskId(activeTaskId) === null;
    nextButton.addEventListener("click", () => {
      const next = getNextTaskId(activeTaskId);
      if (!next) return;
      setActiveTask(next);
      // после перехода — блокируем кнопку снова, пока новая задача не решена
      nextButton.disabled = !isSolved(next) || getNextTaskId(next) === null;
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
        nextButton.disabled = !isSolved(prev) || getNextTaskId(prev) === null;
      resetResult();
    });
  }
}
