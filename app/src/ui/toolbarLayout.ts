/**
 * Раскладка кнопок тулбара над панелью кода.
 *
 * Кнопок 13, и обычный `flex-wrap` кладёт их «хвостом»: 12 / 1. Здесь
 * подбирается число колонок, при котором ряды заполняются ровно: сначала
 * два плотных ряда, при дальнейшем сужении панели — три.
 */

/** Минимальная ширина между колонками, если CSS ещё не применён. */
const DEFAULT_GAP = 6;

function toolbarItems(grid: HTMLElement): HTMLElement[] {
  const groups = Array.from(grid.children) as HTMLElement[];
  return groups
    .flatMap((group) => Array.from(group.children) as HTMLElement[])
    .filter((item) => getComputedStyle(item).display !== "none");
}

/**
 * Подбирает число колонок под текущую ширину контейнера и пишет его в
 * `--toolbar-cols`. Возвращает выбранное число колонок.
 * @param grid Контейнер тулбара с CSS grid.
 * @returns Число колонок в ряду.
 */
export function applyToolbarColumns(grid: HTMLElement): number {
  const items = toolbarItems(grid);
  const total = items.length;
  const available = grid.clientWidth;
  if (total === 0 || available <= 0) return 0;

  const gap = parseFloat(getComputedStyle(grid).columnGap) || DEFAULT_GAP;
  const widest = Math.max(...items.map((item) => item.offsetWidth));

  // Наименьшее число рядов, при котором ряд влезает целиком: при большем
  // числе рядов колонок меньше, поэтому они заведомо тоже влезают.
  let cols = total;
  for (let rows = 1; rows < total; rows++) {
    cols = Math.ceil(total / rows);
    if (cols * widest + (cols - 1) * gap <= available) break;
  }

  grid.style.setProperty("--toolbar-cols", String(cols));
  return cols;
}

/**
 * Следит за размером панели кода (ресайз перетаскиванием, сужение экрана,
 * поворот) и пересчитывает число колонок тулбара.
 */
export function setupEditorToolbarLayout(): void {
  const grid = document.querySelector<HTMLElement>("#editorToolbar .editor-controls.compact");
  if (!grid) return;
  if (typeof ResizeObserver !== "undefined") {
    new ResizeObserver(() => applyToolbarColumns(grid)).observe(grid);
  }
  window.addEventListener("resize", () => applyToolbarColumns(grid));
  applyToolbarColumns(grid);
}
