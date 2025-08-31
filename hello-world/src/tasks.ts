import * as Blockly from "blockly";
import { runCode } from "./codeExecution";

export type InitTaskValidationOptions = {
  checkButton: HTMLButtonElement | null;
  feedbackEl: HTMLDivElement | null;
  starsEl: HTMLDivElement | null;
};

function collectPrintedLines(el: HTMLDivElement | null): string[] {
  if (!el) return [];
  return Array.from(el.querySelectorAll("p"))
    .map((p) => (p.textContent || "").trim())
    .filter((s) => s.length > 0);
}

function getBlockCount(ws: Blockly.WorkspaceSvg | null | undefined): number {
  try {
    if (!ws) return 0;
    return ws.getAllBlocks(false).filter((b: any) => !b.isShadow()).length;
  } catch {
    return 0;
  }
}

async function validateHelloWorld(ws: Blockly.WorkspaceSvg): Promise<{ ok: boolean; stars: number }> {
  // Ensure hidden containers exist
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

    const jsOut = document.createElement("div");
    jsOut.id = "hiddenOutJs";
    const pyOut = document.createElement("div");
    pyOut.id = "hiddenOutPy";
    const luaOut = document.createElement("div");
    luaOut.id = "hiddenOutLua";

    container.appendChild(jsOut);
    container.appendChild(pyOut);
    container.appendChild(luaOut);
    document.body.appendChild(container);
  }

  const jsOut = document.getElementById("hiddenOutJs") as HTMLDivElement | null;
  const pyOut = document.getElementById("hiddenOutPy") as HTMLDivElement | null;
  const luaOut = document.getElementById("hiddenOutLua") as HTMLDivElement | null;

  if (jsOut) jsOut.innerHTML = "";
  if (pyOut) pyOut.innerHTML = "";
  if (luaOut) luaOut.innerHTML = "";

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
    if (count <= 2) stars = 3;
    else if (count <= 4) stars = 2;
    else stars = 1;
  } else {
    stars = 0;
  }
  return { ok: allOk, stars };
}

function renderResult(feedbackEl: HTMLDivElement | null, starsEl: HTMLDivElement | null, ok: boolean, stars: number) {
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
      feedbackEl.textContent = t?.TaskHelloWorldHint || "Подсказка: используйте блок печати текста со строкой Hello World!";
    }
  }
}

export function initTaskValidation(ws: Blockly.WorkspaceSvg, opts: InitTaskValidationOptions) {
  const { checkButton, feedbackEl, starsEl } = opts;
  if (!checkButton) return;

  checkButton.addEventListener("click", () => {
    void (async () => {
      const { ok, stars } = await validateHelloWorld(ws);
      renderResult(feedbackEl, starsEl, ok, stars);
    })();
  });
}