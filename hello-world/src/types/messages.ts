// Shared types for worker messaging and supported languages

export type SupportedLanguage = "javascript" | "python" | "lua" | "typescript";

// Message sent from main thread to worker
export type WorkerInMsg = {
  language: SupportedLanguage;
  code: string;
  timeoutMs?: number;
};

// Messages sent from worker to main thread
export type WorkerOutMsg =
  | { type: "stdout"; text: string }
  | { type: "stderr"; text: string }
  | { type: "status"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };