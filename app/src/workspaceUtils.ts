// Утилиты для работы с Blockly.Workspace без привязки к конкретному типу импорта Blockly
export function getNonShadowBlocks(ws: any): any[] {
  try {
    if (!ws || typeof ws.getAllBlocks !== "function") return [];
    return ws.getAllBlocks(false).filter((b: any) => !b?.isShadow?.());
  } catch {
    return [];
  }
}

// Количество реальных (не теневых) блоков в рабочей области
export function countNonShadowBlocks(ws: any): number {
  return getNonShadowBlocks(ws).length;
}
