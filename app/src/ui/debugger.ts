// Пошаговый отладчик: подсветка исполняемого блока + управление темпом.
//
// Код генерируется с вызовами highlightBlock('ID') перед каждым блоком
// (см. codeExecution.generateCode с debug=true). Воркер на каждом вызове
// сообщает ID в UI и, в зависимости от режима, ждёт сигнала через
// SharedArrayBuffer (тот же механизм, что у синхронного input()).
import type { SupportedLanguage } from "../types/messages";
import { runDebugCode } from "../codeExecution";

// Режимы (ячейка [0] ctrl): 0 = свободно, 1 = шаг/пауза, 2 = замедленно
const MODE_RUN = 0;
const MODE_STEP = 1;
const MODE_SLOW = 2;
const SLOW_DELAY_MS = 400;

let getWorkspace: () => any = () => null;
let getLanguage: () => SupportedLanguage = () => "javascript";

let sab: SharedArrayBuffer | null = null;
let ctrl: Int32Array | null = null;
let active = false;
let stopFn: (() => void) | null = null;
let currentHighlightedId: string | null = null;
let lastLanguage: SupportedLanguage = "javascript";

let stepBtn: HTMLButtonElement | null = null;
let slowBtn: HTMLButtonElement | null = null;
let runBtn: HTMLButtonElement | null = null;
let stopBtn: HTMLButtonElement | null = null;

function setMode(mode: number) {
  if (ctrl) Atomics.store(ctrl, 0, mode);
}

function stepSignal() {
  if (ctrl) Atomics.store(ctrl, 1, 1);
}

function getOutputEl(): HTMLElement | null {
  return document.getElementById("output") as HTMLElement | null;
}

function highlightBlockById(id: string) {
  const ws = getWorkspace();
  if (!ws || !id) return;
  try {
    if (currentHighlightedId) ws.highlightBlock(currentHighlightedId, false);
    ws.highlightBlock(id, true);
    ws.centerOnBlock(id);
    currentHighlightedId = id;
  } catch {}
}

function clearHighlight() {
  const ws = getWorkspace();
  if (ws && currentHighlightedId) {
    try {
      ws.highlightBlock(currentHighlightedId, false);
    } catch {}
  }
  currentHighlightedId = null;
}

function updateButtons() {
  if (stepBtn) stepBtn.classList.toggle("active", active);
  if (runBtn) runBtn.classList.toggle("active", active);
  if (slowBtn)
    slowBtn.classList.toggle(
      "active",
      active && !!ctrl && Atomics.load(ctrl, 0) === MODE_SLOW,
    );
  if (stopBtn) stopBtn.disabled = !active;
}

function finishDebug() {
  clearHighlight();
  active = false;
  ctrl = null;
  sab = null;
  stopFn = null;
  updateButtons();
}

function startDebug(startMode: number) {
  const ws = getWorkspace();
  if (!ws) return;
  if (active) {
    // Уже выполняется — просто меняем режим
    setMode(startMode);
    updateButtons();
    return;
  }
  lastLanguage = getLanguage();
  sab = new SharedArrayBuffer(12);
  ctrl = new Int32Array(sab);
  Atomics.store(ctrl, 0, startMode);
  Atomics.store(ctrl, 1, 0);
  Atomics.store(ctrl, 2, SLOW_DELAY_MS);
  active = true;
  updateButtons();

  void runDebugCode(ws, lastLanguage, getOutputEl(), sab, {
    onHighlight: (id) => highlightBlockById(id),
    onDone: () => finishDebug(),
    onWorkerReady: (stop) => {
      stopFn = stop;
    },
  });
}

export function initDebugger(options: {
  getWorkspace: () => any;
  getLanguage: () => SupportedLanguage;
}) {
  getWorkspace = options.getWorkspace;
  getLanguage = options.getLanguage;

  stepBtn = document.getElementById("debugStepBtn") as HTMLButtonElement | null;
  slowBtn = document.getElementById("debugSlowBtn") as HTMLButtonElement | null;
  runBtn = document.getElementById("debugRunBtn") as HTMLButtonElement | null;
  stopBtn = document.getElementById("debugStopBtn") as HTMLButtonElement | null;

  // ⏭ Шаг: запускает отладку (если не активна) и продвигает на один блок
  stepBtn?.addEventListener("click", () => {
    if (!active) {
      startDebug(MODE_STEP);
      return;
    }
    setMode(MODE_STEP);
    stepSignal();
  });

  // 🐢 Замедленно: переключить замедленный режим (или запустить в нём)
  slowBtn?.addEventListener("click", () => {
    if (!active) {
      startDebug(MODE_SLOW);
      return;
    }
    setMode(
      ctrl && Atomics.load(ctrl, 0) === MODE_SLOW ? MODE_RUN : MODE_SLOW,
    );
    updateButtons();
  });

  // ⏩ Продолжить без остановок
  runBtn?.addEventListener("click", () => {
    if (!active) {
      startDebug(MODE_RUN);
      return;
    }
    setMode(MODE_RUN);
    updateButtons();
  });

  // ⏹ Стоп
  stopBtn?.addEventListener("click", () => {
    if (!active) return;
    const stop = stopFn;
    stopFn = null;
    stop?.();
    finishDebug();
    const out = getOutputEl();
    if (out) {
      const p = document.createElement("p");
      p.style.color = "#b58900";
      p.textContent = "Отладка остановлена.";
      out.appendChild(p);
    }
  });

  updateButtons();
}
