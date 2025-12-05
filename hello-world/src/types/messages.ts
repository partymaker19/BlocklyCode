// Shared types for worker messaging and supported languages

export type SupportedLanguage = "javascript" | "python" | "lua" | "typescript";

// Message sent from main thread to worker
export type WorkerInMsg =
  | {
      language: SupportedLanguage;
      code: string;
      timeoutMs?: number;
    }
  | { type: "input_response"; value: string };

// Messages sent from worker to main thread
export type WorkerOutMsg =
  | { type: "stdout"; text: string }
  | { type: "stderr"; text: string }
  | { type: "stdout_color"; text: string; color: string }
  | { type: "status"; text: string }
  | { type: "input_request"; prompt?: string; buffer: SharedArrayBuffer }
  | { type: "done" }
  | { type: "error"; message: string };
