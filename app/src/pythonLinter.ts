// Клиент Python-линтера: персистентный воркер-песочница с pyflakes (pyodide).
// Отдельный от рантайма запуска воркер: рантайм пересоздаётся на каждый запуск,
// а линтер живёт постоянно и держит кэшированный pyodide-экземпляр.
import type { LintDiagnostic } from "./types/messages";

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, (d: LintDiagnostic[]) => void>();

function getWorker(): Worker | null {
  if (worker) return worker;
  try {
    worker = new Worker(new URL("./sandboxWorker.ts", import.meta.url));
    worker.addEventListener("message", (ev: MessageEvent) => {
      const msg = ev.data as any;
      if (msg?.type === "lint_result") {
        const resolve = pending.get(Number(msg.id));
        if (resolve) {
          pending.delete(Number(msg.id));
          resolve(Array.isArray(msg.diagnostics) ? msg.diagnostics : []);
        }
      }
    });
  } catch {
    worker = null;
  }
  return worker;
}

/**
 * Статический анализ Python-кода (pyflakes): синтаксические ошибки,
 * undefined-имена (опечатки вида `rane` вместо `range`), неиспользуемые
 * переменные и т.п. Первый вызов может занять время (загрузка pyodide).
 */
export function lintPythonCode(code: string): Promise<LintDiagnostic[]> {
  return new Promise((resolve) => {
    const w = getWorker();
    if (!w || !code.trim()) {
      resolve([]);
      return;
    }
    const id = ++seq;
    pending.set(id, resolve);
    w.postMessage({ type: "lint_python", code, id });
    // Страховка: не оставляем висящие промисы (например, нет сети до CDN)
    setTimeout(() => {
      if (pending.has(id)) {
        pending.delete(id);
        resolve([]);
      }
    }, 180000);
  });
}
