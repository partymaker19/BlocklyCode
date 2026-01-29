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
  | { type: "input_response"; value: string };

// Сообщения из воркера в основной поток (UI)
export type WorkerOutMsg =
  | { type: "stdout"; text: string }
  | { type: "stderr"; text: string }
  | { type: "stdout_color"; text: string; color: string }
  | { type: "status"; text: string }
  | { type: "input_request"; prompt?: string; buffer: SharedArrayBuffer }
  | { type: "done" }
  | { type: "error"; message: string };
