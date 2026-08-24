// Общие типы: поддерживаемые языки и сообщения между UI и WebWorker

export type SupportedLanguage =
  | "javascript"
  | "python"
  | "lua"
  | "typescript"
  | "php";

// Сообщение из основного потока (UI) в воркер
export type WorkerInMsg =
  | {
      language: SupportedLanguage;
      code: string;
      timeoutMs?: number;
    }
  | { type: "input_response"; value: string }
  // Запрос статического анализа Python-кода (pyflakes внутри pyodide)
  | { type: "lint_python"; code: string; id: number };

// Диагностика линтера: строка/колонка 1- и 0-базные соответственно
export type LintDiagnostic = {
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning";
};

// Сообщения из воркера в основной поток (UI)
export type WorkerOutMsg =
  | { type: "stdout"; text: string }
  | { type: "stderr"; text: string }
  | { type: "stdout_color"; text: string; color: string }
  | { type: "status"; text: string }
  | { type: "input_request"; prompt?: string; buffer: SharedArrayBuffer }
  | { type: "done" }
  | { type: "error"; message: string }
  | { type: "lint_result"; id: number; diagnostics: LintDiagnostic[] };
