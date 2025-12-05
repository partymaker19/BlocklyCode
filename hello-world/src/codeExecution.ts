/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";
import { pythonGenerator } from "blockly/python";
import { luaGenerator } from "blockly/lua";
import type {
  SupportedLanguage,
  WorkerOutMsg,
  WorkerInMsg,
} from "./types/messages";
export type { SupportedLanguage } from "./types/messages";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    // Some errors can be plain objects/strings
    return String((err as { message?: unknown })?.message ?? err);
  } catch {
    return "Unknown error";
  }
}

/**
 * Generates code from a Blockly workspace based on the selected language
 */
function generateCode(
  workspace: Blockly.WorkspaceSvg,
  language: SupportedLanguage
): string {
  try {
    switch (language) {
      case "python":
        return pythonGenerator.workspaceToCode(workspace);
      case "lua":
        return luaGenerator.workspaceToCode(workspace);
      case "typescript":
        // TypeScript uses the same generator as JavaScript
        // but we could add type annotations in the future
        return javascriptGenerator.workspaceToCode(workspace);
      case "javascript":
      default:
        return javascriptGenerator.workspaceToCode(workspace);
    }
  } catch (error) {
    console.error("Code generation error:", error);
    throw error;
  }
}

/**
 * Executes generated JavaScript code and handles output
 */
function executeJavaScriptCode(
  code: string,
  outputElement: HTMLElement | null
): void {
  if (!code.trim()) return;

  if (outputElement) {
    outputElement.innerHTML = "";
  }

  // Ограничиваем количество строк вывода, чтобы избежать подвисаний UI при больших объёмах
  const MAX_OUTPUT_LINES = 200; // мягкий лимит
  const appendLine = (text: string, color?: string) => {
    if (!outputElement) return;
    const p = document.createElement("p");
    if (color) p.style.color = color;
    p.textContent = text;
    outputElement.appendChild(p);
    // Если превысили лимит, удаляем самые ранние строки
    try {
      const children = outputElement.children;
      if (children.length > MAX_OUTPUT_LINES) {
        const overflow = children.length - MAX_OUTPUT_LINES;
        for (let i = 0; i < overflow; i++) {
          outputElement.removeChild(children[0]);
        }
      }
    } catch {}
  };

  // Preserve original console methods to restore later
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;

  try {
    if (outputElement) {
      console.log = (...args: unknown[]) => {
        try {
          originalLog.apply(console, args);
        } catch {}
        appendLine(
          args
            .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
            .join(" ")
        );
      };
      console.warn = (...args: unknown[]) => {
        try {
          originalWarn.apply(console, args);
        } catch {}
        appendLine(
          args
            .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
            .join(" "),
          "#b58900"
        );
      };
      console.error = (...args: unknown[]) => {
        try {
          originalError.apply(console, args);
        } catch {}
        appendLine(
          args
            .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
            .join(" "),
          "red"
        );
      };
    }

    // Provide a print function to match Python/Lua UX
    const jsPrint = (s: unknown) => appendLine(String(s ?? ""));

    // Wrap code so it can access the print function
    const wrapper = `(function(print){\n${code}\n})`;
    const fn = eval(wrapper) as (print: (s: unknown) => void) => void;
    fn(jsPrint);
  } catch (error: unknown) {
    console.error("Runtime error:", error);
    if (outputElement) {
      const errorEl = document.createElement("p");
      errorEl.style.color = "red";
      errorEl.textContent = `Ошибка выполнения: ${getErrorMessage(error)}`;
      outputElement.appendChild(errorEl);
    }
  } finally {
    // Restore console methods
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
  }
}

/**
 * Выполнение кода в изолированном Web Worker с таймаутом.
 * Не изменяет исходный сгенерированный код циклов.
 */
async function executeInSandbox(
  language: SupportedLanguage,
  code: string,
  outputElement: HTMLElement | null,
  timeoutMs = 1000
): Promise<void> {
  if (!code.trim() || !outputElement) return;

  // Очистить вывод
  outputElement.innerHTML = "";

  const appendLine = (text: string, color?: string) => {
    const p = document.createElement("p");
    if (color) p.style.color = color;
    p.textContent = text;
    outputElement.appendChild(p);
  };

  // Создаём воркер через URL, чтобы webpack корректно запаковал файл
  let worker: Worker | null = null;
  try {
    worker = new Worker(new URL("./sandboxWorker.ts", import.meta.url));
  } catch (e: unknown) {
    appendLine(
      `Не удалось создать sandbox воркер: ${getErrorMessage(e)}`,
      "red"
    );
    // Фолбэк на старый JS рантайм, если воркер недоступен
    if (language === "javascript" || language === "typescript") {
      executeJavaScriptCode(code, outputElement);
    } else {
      appendLine(
        "Выполнение для данного языка недоступно без воркера.",
        "#666"
      );
    }
    return;
  }

  // Таймаут выполнения: для Python увеличиваем минимум из-за холодного старта Pyodide
  let effectiveTimeout =
    language === "python" ? Math.max(timeoutMs, 10000) : timeoutMs;
  // Если в коде используется input(), даём пользователю больше времени на ввод
  const usesInput = /\binput\s*\(/.test(code);
  if (
    usesInput &&
    (language === "javascript" ||
      language === "typescript" ||
      language === "lua")
  ) {
    effectiveTimeout = Math.max(effectiveTimeout, 20000);
  }
  const timer = setTimeout(() => {
    try {
      // Снимаем слушатель, чтобы избежать утечек и лишних вызовов
      worker?.removeEventListener("message", onMessage);
      worker?.terminate();
    } catch {}
    // Сообщение о прерывании показываем только для JS/TS.
    // Для Python/Lua прерывание по времени сообщается самим рантаймом.
    if (language === "javascript" || language === "typescript") {
      appendLine(
        `Выполнение остановлено: превышен лимит времени ${effectiveTimeout} мс.`,
        "#b58900"
      );
    }
  }, Math.max(0, effectiveTimeout - 50));

  const onMessage = (ev: MessageEvent<WorkerOutMsg>) => {
    const msg = ev.data as WorkerOutMsg;
    if (msg?.type === "stdout") {
      appendLine(String(msg.text ?? ""));
    } else if (msg?.type === "stdout_color") {
      appendLine(String(msg.text ?? ""), String((msg as any).color ?? ""));
    } else if (msg?.type === "stderr") {
      appendLine(String(msg.text ?? ""), "#b58900");
    } else if (msg?.type === "status") {
      if (msg.text) appendLine(String(msg.text), "#666");
    } else if (msg?.type === "input_request") {
      // Показываем нативный prompt для ввода, затем записываем ответ в SharedArrayBuffer
      try {
        const promptText = String(msg.prompt || "Введите значение:");
        const value = window.prompt?.(promptText) ?? "";
        // Записываем в буфер: [status,len] + bytes
        const sab = msg.buffer;
        const ctrl = new Int32Array(sab, 0, 2);
        const data = new Uint8Array(sab, 8);
        const enc = new TextEncoder();
        const bytes = enc.encode(value);
        const n = Math.min(bytes.length, data.length);
        if (n > 0) data.set(bytes.subarray(0, n));
        Atomics.store(ctrl, 1, n);
        Atomics.store(ctrl, 0, 1);
        Atomics.notify(ctrl, 0, 1);
        // Отразим ввод пользователя в выводе
        appendLine("> " + value);
      } catch (e) {
        appendLine("Ошибка ввода: " + getErrorMessage(e), "red");
      }
    } else if (msg?.type === "error") {
      appendLine(`Ошибка выполнения: ${String(msg.message ?? msg)}`, "red");
    } else if (msg?.type === "done") {
      clearTimeout(timer);
      worker?.removeEventListener("message", onMessage);
      worker?.terminate();
    }
  };

  worker.addEventListener("message", onMessage);
  // Прокидываем таймаут внутрь воркера, чтобы рантаймы могли прерывать циклы сами
  const inMsg: WorkerInMsg = { language, code, timeoutMs: effectiveTimeout };
  worker.postMessage(inMsg);
}

/**
 * Displays information message for non-executable languages
 */
function showNonExecutableMessage(
  language: SupportedLanguage,
  outputElement: HTMLElement | null,
  hasCode: boolean
): void {
  if (!hasCode || !outputElement) return;

  const infoEl = document.createElement("p");
  infoEl.style.color = "#666";
  infoEl.style.fontStyle = "italic";

  const langName = language === "python" ? "Python" : "Lua";
  infoEl.textContent = `Код на ${langName} сгенерирован. Для выполнения используйте соответствующий интерпретатор.`;

  outputElement.appendChild(infoEl);
}

/**
 * Main function to run code generation and execution
 */
export async function runCode(
  workspace: Blockly.WorkspaceSvg | null,
  language: SupportedLanguage,
  codeDisplayElement: ChildNode | null,
  outputElement: HTMLElement | null
): Promise<void> {
  if (!workspace) return;

  try {
    const code = generateCode(workspace, language);

    if (codeDisplayElement && codeDisplayElement.parentNode) {
      codeDisplayElement.textContent = code;
    }

    if (outputElement) {
      outputElement.innerHTML = "";
    }

    // Выполняем через изолированный воркер с таймаутом
    await executeInSandbox(language, code, outputElement);
  } catch (error) {
    console.error("Code execution error:", error);
    if (outputElement) {
      const errorEl = document.createElement("p");
      errorEl.style.color = "red";
      errorEl.textContent = `Ошибка генерации/выполнения: ${getErrorMessage(
        error
      )}`;
      outputElement.appendChild(errorEl);
    }
  }
}

// Execute raw source code by language (used by Ace Run button)
export async function runCodeString(
  language: SupportedLanguage,
  sourceCode: string,
  outputElement: HTMLElement | null
): Promise<void> {
  try {
    if (outputElement) outputElement.innerHTML = "";
    const code = sourceCode || "";
    if (!code.trim()) return;

    await executeInSandbox(language, code, outputElement);
  } catch (error) {
    console.error("Code execution error:", error);
    if (outputElement) {
      const errorEl = document.createElement("p");
      errorEl.style.color = "red";
      errorEl.textContent = `Ошибка выполнения: ${getErrorMessage(error)}`;
      outputElement.appendChild(errorEl);
    }
  }
}

// Lazy imports for runtimes
let _pyRuntime: null | typeof import("./pythonRuntime") = null;
let _luaRuntime: null | typeof import("./luaRuntime") = null;

async function ensurePythonRuntime() {
  if (_pyRuntime) return _pyRuntime;
  _pyRuntime = await import("./pythonRuntime");
  return _pyRuntime;
}

async function ensureLuaRuntime() {
  if (_luaRuntime) return _luaRuntime;
  _luaRuntime = await import("./luaRuntime");
  return _luaRuntime;
}

/**
 * Clears the output area
 */
export function clearOutput(outputElement: HTMLElement | null): void {
  if (outputElement) {
    outputElement.innerHTML = "";
  }
}
