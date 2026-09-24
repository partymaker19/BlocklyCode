// Вспомогательные функции для валидаторов задач.

export function collectPrintedLines(el: HTMLDivElement | null): string[] {
  if (!el) return [];
  return Array.from(el.querySelectorAll("p"))
    .map((p) => (p.textContent || "").trim())
    .filter((s) => s.length > 0);
}

export function getVisibleOutputLines(): string[] {
  const out = document.getElementById("output") as HTMLDivElement | null;
  return collectPrintedLines(out);
}

export function getVarFieldText(b: any): string {
  try {
    const f = typeof b?.getField === "function" ? b.getField("VAR") : null;
    const t = typeof f?.getText === "function" ? f.getText() : "";
    return String(t || "");
  } catch {
    return "";
  }
}

export function tryGetAssignedNumber(setBlock: any): number | null {
  try {
    const target =
      typeof setBlock?.getInputTargetBlock === "function"
        ? setBlock.getInputTargetBlock("VALUE")
        : null;
    if (!target || (target as any).type !== "math_number") return null;
    const raw =
      typeof (target as any).getFieldValue === "function"
        ? (target as any).getFieldValue("NUM")
        : undefined;
    if (raw === undefined || raw === null) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function hasAncestorOfType(block: any, type: string): boolean {
  let p = typeof block.getParent === "function" ? block.getParent() : null;
  while (p) {
    if ((p as any).type === type) return true;
    p = typeof p.getParent === "function" ? p.getParent() : null;
  }
  return false;
}
