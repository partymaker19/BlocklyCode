import * as Blockly from "blockly";
import { runCode } from "./codeExecution";
import { getAppLang } from "./localization";

export type InitTaskValidationOptions = {
  checkButton: HTMLButtonElement | null;
  feedbackEl: HTMLDivElement | null;
  starsEl: HTMLDivElement | null;
  // Кнопка перехода к следующей задаче (опционально)
  nextButton?: HTMLButtonElement | null;
};

// ---------- Прогресс и порядок задач ----------
export type TaskId = "hello_world" | "add_2_7";

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
};

let activeTaskId: TaskId = "hello_world";

// Порядок задач для последовательного прохождения
const TASKS_ORDER: TaskId[] = ["hello_world", "add_2_7"];
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

export function getActiveTask(): TaskId { return activeTaskId; }

// ---------- Helpers ----------
function collectPrintedLines(el: HTMLDivElement | null): string[] {
  if (!el) return [];
  return Array.from(el.querySelectorAll("p")).map((p) => (p.textContent || "").trim()).filter((s) => s.length > 0);
}

function getBlockCount(ws: Blockly.WorkspaceSvg | null | undefined): number {
  try {
    if (!ws) return 0;
    return ws.getAllBlocks(false).filter((b: any) => !b.isShadow()).length;
  } catch { return 0; }
}

function ensureHiddenOutputs() {
  let container = document.getElementById("hiddenValidationRoot") as HTMLDivElement | null;
  if (!container) {
    container = document.createElement("div");
    container.id = "hiddenValidationRoot";
    container.style.position = "absolute";
    container.style.left = "-99999px";
    container.style.top = "-99999px";
    container.style.width = "1px";
    container.style.height = "1px";
    container.style.overflow = "hidden";
    container.setAttribute("aria-hidden", "true");

    const jsOut = document.createElement("div"); jsOut.id = "hiddenOutJs";
    const pyOut = document.createElement("div"); pyOut.id = "hiddenOutPy";
    const luaOut = document.createElement("div"); luaOut.id = "hiddenOutLua";

    container.appendChild(jsOut); container.appendChild(pyOut); container.appendChild(luaOut);
    document.body.appendChild(container);
  }

  const jsOut = document.getElementById("hiddenOutJs") as HTMLDivElement | null;
  const pyOut = document.getElementById("hiddenOutPy") as HTMLDivElement | null;
  const luaOut = document.getElementById("hiddenOutLua") as HTMLDivElement | null;
  if (jsOut) jsOut.innerHTML = ""; if (pyOut) pyOut.innerHTML = ""; if (luaOut) luaOut.innerHTML = "";
  return { jsOut, pyOut, luaOut };
}

async function validateHelloWorld(ws: Blockly.WorkspaceSvg): Promise<{ ok: boolean; stars: number }> {
  const { jsOut, pyOut, luaOut } = ensureHiddenOutputs();

  await runCode(ws, "javascript", null, jsOut);
  await runCode(ws, "python", null, pyOut);
  await runCode(ws, "lua", null, luaOut);

  const jsLines = collectPrintedLines(jsOut);
  const pyLines = collectPrintedLines(pyOut);
  const luaLines = collectPrintedLines(luaOut);

  const expected = "Hello World!";
  const okJs = jsLines.includes(expected);
  const okPy = pyLines.includes(expected);
  const okLua = luaLines.includes(expected);
  const allOk = okJs && okPy && okLua;

  const count = getBlockCount(ws);
  let stars = 0;
  if (allOk) {
    if (count <= 2) stars = 3; // print + text
    else if (count <= 4) stars = 2;
    else stars = 1;
  } else {
    stars = 0;
  }
  return { ok: allOk, stars };
}

async function validateAdd2Plus7(ws: Blockly.WorkspaceSvg): Promise<{ ok: boolean; stars: number }> {
  const { jsOut, pyOut, luaOut } = ensureHiddenOutputs();

  await runCode(ws, "javascript", null, jsOut);
  await runCode(ws, "python", null, pyOut);
  await runCode(ws, "lua", null, luaOut);

  const jsLines = collectPrintedLines(jsOut);
  const pyLines = collectPrintedLines(pyOut);
  const luaLines = collectPrintedLines(luaOut);

  const expected = "9"; // must print 9 in each language
  const okJs = jsLines.includes(expected);
  const okPy = pyLines.includes(expected);
  const okLua = luaLines.includes(expected);
  const allOk = okJs && okPy && okLua;

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
  if (allOk) {
    if (hasAddition && has2 && has7 && count <= 4) stars = 3; // print + math_arithmetic + 2 numbers
    else if (count <= 6) stars = 2;
    else stars = 1;
  } else {
    stars = 0;
  }
  return { ok: allOk, stars };
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
  const { checkButton, feedbackEl, starsEl, nextButton } = opts;
  if (!checkButton) return;

  // Сброс визуального результата
  const resetResult = () => {
    if (feedbackEl) feedbackEl.textContent = "";
    if (starsEl) starsEl.innerHTML = "";
  };

  checkButton.addEventListener("click", () => {
    void (async () => {
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
      resetResult();
    });
  }
}