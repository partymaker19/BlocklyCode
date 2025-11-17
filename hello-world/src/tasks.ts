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
export type TaskId = "hello_world" | "add_2_7" | "sum_array" | "min_max" | "char_freq";

type TaskDef = {
  id: TaskId;
  title: (lang: "ru" | "en") => string;
  description: (lang: "ru" | "en") => string; // can contain HTML
  hint: (lang: "ru" | "en") => string;
  validate: (ws: Blockly.WorkspaceSvg) => Promise<{ ok: boolean; stars: number }>;
};

const tasks: Record<TaskId, TaskDef> = {
  hello_world: {
    id: "hello_world",
    title: (lang) => lang === "ru" ? "Задача 1: Hello World" : "Task 1: Hello World",
    description: (lang) => lang === "ru"
      ? 'Соберите блоки так, чтобы в окне вывода появилась строка: <strong>Hello World!</strong>'
      : 'Assemble blocks so that the output shows: <strong>Hello World!</strong>',
    hint: (lang) => lang === "ru"
      ? "Подсказка: используйте блок вывода текста и текстовый литерал."
      : "Hint: use a print/output block with a text literal.",
    validate: validateHelloWorld,
  },
  add_2_7: {
    id: "add_2_7",
    title: (lang) => lang === "ru" ? "Задача 2: 2 + 7" : "Task 2: 2 + 7",
    description: (lang) => lang === "ru"
      ? 'Сложите <strong>2</strong> и <strong>7</strong> и выведите результат в окно вывода: должно получиться <strong>9</strong>.'
      : 'Add <strong>2</strong> and <strong>7</strong> and print the result to the output: it should be <strong>9</strong>.',
    hint: (lang) => lang === "ru"
      ? "Подсказка: используйте блок сложения из категории Математика и блок печати/вывода."
      : "Hint: use the addition block from Math and a print/output block.",
    validate: validateAdd2Plus7,
  },
  sum_array: {
    id: "sum_array",
    title: (lang) => lang === "ru" ? "Задача 3: Сумма массива" : "Task 3: Array sum",
    description: (lang) => lang === "ru"
      ? 'Создайте список чисел <code>[1, 2, 3, 4, 5]</code> и выведите их сумму: <strong>15</strong>. Можно использовать блоки из категории Списки/Математика или цикл.'
      : 'Create a list of numbers <code>[1, 2, 3, 4, 5]</code> and print their sum: <strong>15</strong>. You may use list/math blocks or a loop.',
    hint: (lang) => lang === "ru"
      ? "Подсказка: попробуйте блок ‘операции над списком’ (SUM) или цикл forEach."
      : "Hint: try ‘math on list’ (SUM) or a forEach loop.",
    validate: validateSumArray,
  },
  min_max: {
    id: "min_max",
    title: (lang) => lang === "ru" ? "Задача 4: Минимум и максимум" : "Task 4: Min and Max",
    description: (lang) => lang === "ru"
      ? 'Создайте список <code>[5, 1, 9, 3, 7]</code> и выведите минимальное и максимальное значения: <strong>min=1</strong> и <strong>max=9</strong>. Допустимо выводить в одну строку или в две.'
      : 'Create a list <code>[5, 1, 9, 3, 7]</code> and print min and max: <strong>min=1</strong> and <strong>max=9</strong>. One or two lines are fine.',
    hint: (lang) => lang === "ru"
      ? "Подсказка: используйте ‘операции над списком’ MIN/MAX или напишите цикл."
      : "Hint: use ‘math on list’ MIN/MAX or write a loop.",
    validate: validateMinMax,
  },
  char_freq: {
    id: "char_freq",
    title: (lang) => lang === "ru" ? "Задача 5: Частоты символов" : "Task 5: Character frequencies",
    description: (lang) => lang === "ru"
      ? 'Подсчитайте частоты символов в строке <code>"abcaabbb"</code> и выведите результат, например: <strong>a:3 b:4 c:1</strong> (формат вывода свободный). Рекомендуется использовать блоки словаря из категории Custom.'
      : 'Count character frequencies in the string <code>"abcaabbb"</code> and print the result, e.g. <strong>a:3 b:4 c:1</strong> (any clear format). Using the dictionary blocks from Custom is recommended.',
    hint: (lang) => lang === "ru"
      ? "Подсказка: создайте словарь, проверяйте наличие ключа и увеличивайте счётчик."
      : "Hint: create a dictionary, check key existence, and increment counters.",
    validate: validateCharFreq,
  },
};

let activeTaskId: TaskId = "hello_world";

// Порядок задач для последовательного прохождения
const TASKS_ORDER: TaskId[] = ["hello_world", "add_2_7", "sum_array", "min_max", "char_freq"];
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
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch { /* noop */ }
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

export function getFirstUnsolvedTask(): TaskId {
  const p = loadProgress();
  for (const id of TASKS_ORDER) {
    if (!p[id]?.solved) return id;
  }
  return TASKS_ORDER[TASKS_ORDER.length - 1];
}

export function getNextTaskId(current: TaskId): TaskId | null {
  const idx = TASKS_ORDER.indexOf(current);
  if (idx < 0) return null;
  return idx + 1 < TASKS_ORDER.length ? TASKS_ORDER[idx + 1] : null;
}

function getPrevTaskId(current: TaskId): TaskId | null {
  const idx = TASKS_ORDER.indexOf(current);
  if (idx <= 0) return null;
  return TASKS_ORDER[idx - 1] || null;
}

export function getActiveTask(): TaskId { return activeTaskId; }

// ---------- Helpers ----------
function collectPrintedLines(el: HTMLDivElement | null): string[] {
  if (!el) return [];
  return Array.from(el.querySelectorAll("p")).map((p) => (p.textContent || "").trim()).filter((s) => s.length > 0);
}

function getVisibleOutputLines(): string[] {
  const out = document.getElementById("output") as HTMLDivElement | null;
  return collectPrintedLines(out);
}

function getBlockCount(ws: Blockly.WorkspaceSvg | null | undefined): number {
  try {
    if (!ws) return 0;
    return ws.getAllBlocks(false).filter((b: Blockly.Block) => !b.isShadow()).length;
  } catch { return 0; }
}

async function validateHelloWorld(ws: Blockly.WorkspaceSvg): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();
  const expected = "Hello World!";
  const ok = lines.includes(expected);

  const count = getBlockCount(ws);
  let stars = 0;
  if (ok) {
    if (count <= 2) stars = 3; // print + text
    else if (count <= 4) stars = 2;
    else stars = 1;
  } else {
    stars = 0;
  }
  return { ok, stars };
}

async function validateAdd2Plus7(ws: Blockly.WorkspaceSvg): Promise<{ ok: boolean; stars: number }> {
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
        const op = typeof (b as any).getFieldValue === "function" ? (b as any).getFieldValue("OP") : undefined;
        if (op === "ADD") hasAddition = true;
      }
      if ((b as any).type === "math_number") {
        const num = typeof (b as any).getFieldValue === "function" ? (b as any).getFieldValue("NUM") : undefined;
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
    if (hasAddition && has2 && has7 && count <= 4) stars = 3; // print + math_arithmetic + 2 numbers
    else if (count <= 6) stars = 2;
    else stars = 1;
  } else {
    stars = 0;
  }
  return { ok, stars };
}

async function validateSumArray(ws: Blockly.WorkspaceSvg): Promise<{ ok: boolean; stars: number }> {
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
      if (t === 'lists_create_with') usedListCreate = true;
      if (t === 'controls_forEach') usedForEach = true;
      if (t === 'math_on_list') usedMathOnList = true;
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

async function validateMinMax(ws: Blockly.WorkspaceSvg): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();
  const hasMin = lines.some((l) => /min\s*[:=]\s*1/i.test(l) || l.trim() === '1');
  const hasMax = lines.some((l) => /max\s*[:=]\s*9/i.test(l) || l.trim() === '9');
  const ok = hasMin && hasMax;

  let usedMathOnList = false;
  let usedMin = false;
  let usedMax = false;
  try {
    const blocks = ws.getAllBlocks(false).filter((b: any) => !b.isShadow());
    for (const b of blocks) {
      if ((b as any).type === 'math_on_list') {
        usedMathOnList = true;
        // some versions encode MODE field
        const mode = typeof (b as any).getFieldValue === 'function' ? (b as any).getFieldValue('OP') || (b as any).getFieldValue('MODE') : undefined;
        if (String(mode).toUpperCase().includes('MIN')) usedMin = true;
        if (String(mode).toUpperCase().includes('MAX')) usedMax = true;
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

async function validateCharFreq(ws: Blockly.WorkspaceSvg): Promise<{ ok: boolean; stars: number }> {
  const lines = getVisibleOutputLines();
  const need = { a: 3, b: 4, c: 1 } as Record<string, number>;
  const checks = Object.entries(need).map(([ch, n]) =>
    lines.some((l) => new RegExp(`${ch}\s*[:=]\s*${n}`, 'i').test(l))
  );
  const ok = checks.every(Boolean);

  // Prefer dictionary blocks usage
  let usedDict = false;
  try {
    const blocks = ws.getAllBlocks(false).filter((b: any) => !b.isShadow());
    for (const b of blocks) {
      const t = (b as any).type;
      if (t === 'dict_create' || t === 'dict_set' || t === 'dict_get' || t === 'dict_has_key') {
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
  failureHint: string
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
      feedbackEl.textContent = stars === 3
        ? (t?.TaskPerfect || "Отлично! Решение оптимально.")
        : (t?.TaskPassed || "Решение верное.");
    } else {
      feedbackEl.style.color = "#c62828";
      feedbackEl.textContent = failureHint;
    }
  }
}

export function setActiveTask(taskId: TaskId) {
  activeTaskId = taskId;
  const lang = getAppLang();

  const titleEl = document.querySelector("#taskSidebar .task-title") as HTMLElement | null;
  const descEl = document.querySelector("#taskSidebar .task-desc") as HTMLElement | null;
  const hintEl = document.querySelector("#taskSidebar .task-hint") as HTMLElement | null;

  const tdef = tasks[activeTaskId];
  if (titleEl) titleEl.textContent = tdef.title(lang);
  if (descEl) descEl.innerHTML = tdef.description(lang);
  if (hintEl) hintEl.textContent = tdef.hint(lang);
}

export function initTaskValidation(ws: Blockly.WorkspaceSvg, opts: InitTaskValidationOptions) {
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
        const msg = t?.RunFirst || (getAppLang() === 'ru' ? 'Сначала запустите код' : 'Run the code first');
        renderResult(feedbackEl, starsEl, false, 0, msg);
        return;
      }

      const tdef = tasks[activeTaskId];
      const { ok, stars } = await tdef.validate(ws);
      const hint = tdef.hint(getAppLang());
      renderResult(feedbackEl, starsEl, ok, stars, hint);

      if (ok) {
        markSolved(activeTaskId, stars);
        if (nextButton) nextButton.disabled = getNextTaskId(activeTaskId) === null; // включить, если есть куда идти
      }
    })();
  });

  if (nextButton) {
    // Кнопка активируется только если текущая задача решена и есть следующая
    nextButton.disabled = !isSolved(activeTaskId) || getNextTaskId(activeTaskId) === null;
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
      if (nextButton) nextButton.disabled = !isSolved(prev) || getNextTaskId(prev) === null;
      resetResult();
    });
  }
}