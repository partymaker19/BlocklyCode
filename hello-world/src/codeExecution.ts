/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from "blockly/core";
import { javascriptGenerator } from "blockly/javascript";
import { pythonGenerator } from "blockly/python";
import { luaGenerator } from "blockly/lua";
import { phpGenerator } from "blockly/php";
import type {
  SupportedLanguage,
  WorkerOutMsg,
  WorkerInMsg,
} from "./types/messages";
export type { SupportedLanguage } from "./types/messages";

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  try {
    // Иногда ошибка приходит не как Error, а как строка/объект
    return String((err as { message?: unknown })?.message ?? err);
  } catch {
    return "Unknown error";
  }
}

/**
 * Генерирует код из Blockly workspace для выбранного языка
 */
function generateCode(
  workspace: Blockly.WorkspaceSvg,
  language: SupportedLanguage,
): string {
  try {
    switch (language) {
      case "php":
        return phpGenerator.workspaceToCode(workspace);
      case "python":
        return pythonGenerator.workspaceToCode(workspace);
      case "lua":
        return luaGenerator.workspaceToCode(workspace);
      case "typescript":
        // TypeScript использует тот же генератор, что и JavaScript
        // (потенциально можно добавить аннотации типов позже)
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
 * Выполняет JavaScript-код и выводит результат в панель вывода
 */
function executeJavaScriptCode(
  code: string,
  outputElement: HTMLElement | null,
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

  // Сохраняем оригинальные методы console, чтобы восстановить их после выполнения
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
            .join(" "),
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
          "#b58900",
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
          "red",
        );
      };
    }

    // Делаем print(...), чтобы UX совпадал с Python/Lua
    const jsPrint = (s: unknown) => appendLine(String(s ?? ""));

    // Компилируем один раз через Function (без eval) — проще контролировать окружение
    const fn = new Function("print", String(code)) as (
      print: (s: unknown) => void,
    ) => void;
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
    // Восстанавливаем методы console
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
  timeoutMs = 1000,
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
  let closePendingInput: (() => void) | null = null;
  const requestInputValue = (promptText: string): Promise<string> =>
    new Promise((resolve) => {
      const backdrop = document.createElement("div");
      backdrop.style.position = "fixed";
      backdrop.style.inset = "0";
      backdrop.style.background = "rgba(0, 0, 0, 0.45)";
      backdrop.style.display = "flex";
      backdrop.style.alignItems = "center";
      backdrop.style.justifyContent = "center";
      backdrop.style.zIndex = "99999";

      const panel = document.createElement("div");
      panel.style.width = "min(560px, calc(100vw - 24px))";
      panel.style.background = "#111827";
      panel.style.border = "1px solid #374151";
      panel.style.borderRadius = "14px";
      panel.style.padding = "14px";
      panel.style.boxSizing = "border-box";
      panel.style.color = "#f9fafb";
      panel.style.fontFamily = "Inter, system-ui, sans-serif";

      const title = document.createElement("div");
      title.textContent = promptText || "Введите значение:";
      title.style.fontSize = "15px";
      title.style.fontWeight = "600";
      title.style.marginBottom = "10px";

      const input = document.createElement("input");
      input.type = "text";
      input.style.width = "100%";
      input.style.boxSizing = "border-box";
      input.style.height = "42px";
      input.style.borderRadius = "10px";
      input.style.border = "1px solid #4b5563";
      input.style.background = "#0b1220";
      input.style.color = "#f9fafb";
      input.style.padding = "0 12px";
      input.style.fontSize = "16px";
      input.autocomplete = "off";

      const actions = document.createElement("div");
      actions.style.marginTop = "12px";
      actions.style.display = "flex";
      actions.style.justifyContent = "flex-end";
      actions.style.gap = "10px";

      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.textContent = "Отмена";
      cancelBtn.style.height = "38px";
      cancelBtn.style.padding = "0 14px";
      cancelBtn.style.borderRadius = "999px";
      cancelBtn.style.border = "1px solid #1e40af";
      cancelBtn.style.background = "#0b1220";
      cancelBtn.style.color = "#93c5fd";
      cancelBtn.style.cursor = "pointer";

      const okBtn = document.createElement("button");
      okBtn.type = "button";
      okBtn.textContent = "OK";
      okBtn.style.height = "38px";
      okBtn.style.padding = "0 18px";
      okBtn.style.borderRadius = "999px";
      okBtn.style.border = "1px solid #60a5fa";
      okBtn.style.background = "#60a5fa";
      okBtn.style.color = "#0b1220";
      okBtn.style.fontWeight = "700";
      okBtn.style.cursor = "pointer";

      actions.appendChild(okBtn);
      actions.appendChild(cancelBtn);
      panel.appendChild(title);
      panel.appendChild(input);
      panel.appendChild(actions);
      backdrop.appendChild(panel);
      document.body.appendChild(backdrop);

      let done = false;
      const finish = (value: string) => {
        if (done) return;
        done = true;
        document.removeEventListener("keydown", onKeyDown);
        try {
          backdrop.remove();
        } catch {}
        closePendingInput = null;
        resolve(value);
      };
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault();
          finish(input.value ?? "");
          return;
        }
        if (e.key === "Escape") {
          e.preventDefault();
          finish("");
        }
      };
      closePendingInput = () => finish("");
      okBtn.addEventListener("click", () => finish(input.value ?? ""));
      cancelBtn.addEventListener("click", () => finish(""));
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) finish("");
      });
      document.addEventListener("keydown", onKeyDown);
      setTimeout(() => input.focus(), 0);
    });

  // Создаём воркер через URL, чтобы webpack корректно запаковал файл
  let worker: Worker | null = null;
  try {
    worker = new Worker(new URL("./sandboxWorker.ts", import.meta.url));
  } catch (e: unknown) {
    appendLine(
      `Не удалось создать sandbox воркер: ${getErrorMessage(e)}`,
      "red",
    );
    // Фолбэк на старый JS рантайм, если воркер недоступен
    if (language === "javascript" || language === "typescript") {
      executeJavaScriptCode(code, outputElement);
    } else {
      appendLine(
        "Выполнение для данного языка недоступно без воркера.",
        "#666",
      );
    }
    return;
  }

  // Таймаут выполнения: для Python и PHP увеличиваем минимум из-за холодного старта
  // рантайма (Pyodide / php-wasm) и возможной медленной сети на проде
  let effectiveTimeout =
    language === "python" || language === "php"
      ? Math.max(timeoutMs, 60000)
      : timeoutMs;
  // Если в коде используется input(), даём пользователю больше времени на ввод
  const usesInput = /\binput\s*\(/.test(code);
  if (
    usesInput &&
    (language === "javascript" ||
      language === "typescript" ||
      language === "lua" ||
      language === "python")
  ) {
    effectiveTimeout = Math.max(effectiveTimeout, 30000);
  }
  const enableMainTimer = language !== "python" && language !== "php";
  const timer = enableMainTimer
    ? setTimeout(
        () => {
          try {
            if (closePendingInput) closePendingInput();
            // Снимаем слушатель, чтобы избежать утечек и лишних вызовов
            worker?.removeEventListener("message", onMessage);
            worker?.terminate();
          } catch {}
          // Сообщение о прерывании показываем только для JS/TS.
          // Для Python/Lua прерывание по времени сообщается самим рантаймом.
          if (language === "javascript" || language === "typescript") {
            appendLine(
              `Выполнение остановлено: превышен лимит времени ${effectiveTimeout} мс.`,
              "#b58900",
            );
          }
        },
        Math.max(0, effectiveTimeout - 50),
      )
    : null;

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
      void (async () => {
        try {
          const promptText = String(msg.prompt || "Введите значение:");
          const value = await requestInputValue(promptText);
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
          appendLine("> " + value);
        } catch (e) {
          appendLine("Ошибка ввода: " + getErrorMessage(e), "red");
        }
      })();
    } else if (msg?.type === "error") {
      if (closePendingInput) closePendingInput();
      appendLine(`Ошибка выполнения: ${String(msg.message ?? msg)}`, "red");
    } else if (msg?.type === "done") {
      if (closePendingInput) closePendingInput();
      if (timer) clearTimeout(timer as any);
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
 * Основная функция: генерация кода из Blockly и запуск (с выводом)
 */
export async function runCode(
  workspace: Blockly.WorkspaceSvg | null,
  language: SupportedLanguage,
  codeDisplayElement: ChildNode | null,
  outputElement: HTMLElement | null,
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
        error,
      )}`;
      outputElement.appendChild(errorEl);
    }
  }
}

// Запуск «сырого» текста программы по выбранному языку (кнопка Run в Ace)
export async function runCodeString(
  language: SupportedLanguage,
  sourceCode: string,
  outputElement: HTMLElement | null,
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

/**
 * Очищает окно вывода
 */
export function clearOutput(outputElement: HTMLElement | null): void {
  if (outputElement) {
    outputElement.innerHTML = "";
  }
}
