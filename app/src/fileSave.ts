// Унифицированное сохранение текста в файл:
// 1) showSaveFilePicker (если доступно)
// 2) фолбэк через download-ссылку (с запросом имени файла через prompt)
export type SaveTextFileOptions = {
  suggestedName: string;
  text: string;
  description: string;
  accept: Record<string, string[]>;
  mime: string;
  promptLabel?: string;
};

export async function saveTextFile(opts: SaveTextFileOptions): Promise<boolean> {
  const w: any = window as any;
  const blob = new Blob([opts.text], { type: opts.mime });

  if (typeof w.showSaveFilePicker === "function") {
    try {
      const handle = await w.showSaveFilePicker({
        suggestedName: opts.suggestedName,
        types: [
          {
            description: opts.description,
            accept: opts.accept,
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (e: any) {
      if (
        e &&
        (e.name === "AbortError" ||
          e.name === "NotAllowedError" ||
          e.name === "SecurityError")
      ) {
        // Пользователь отменил диалог или доступ запрещён — не делаем фолбэк
        return false;
      }
    }
  }

  const name =
    typeof w?.prompt === "function"
      ? w.prompt(opts.promptLabel || "Имя файла:", opts.suggestedName)
      : opts.suggestedName;
  if (!name) return false;

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 0);
  return true;
}
