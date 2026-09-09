/**
 * Эталонные решения: показываются ученику только ПОСЛЕ верного
 * решения задачи («сравни с оптимальным»). Решения лежат в
 * /solutions/<taskId>.xml (копируются webpack'ом из solutions/).
 *
 * Приниципы:
 * - решение недоступно до solve: кнопка появляется в фидбеке задачи
 *   только при ok=true;
 * - загрузка не затирает работу ученика: блоки решения ставятся
 *   рядом (смещение по X), а не вместо.
 */

import * as Blockly from "blockly";
import { getAppLang } from "../localization";
import { isSolvedLocal } from "../progressSync";
import type { TaskId } from "../tasks";

function t(ru: string, en: string): string {
  return getAppLang() === "ru" ? ru : en;
}

/**
 * Загружает ли файл решения для задачи (HEAD-проверка не нужна —
 * просто пробуем fetch, 404 трактуем как «решения нет»).
 */
export async function hasSolution(taskId: TaskId): Promise<boolean> {
  try {
    const res = await fetch(`/solutions/${taskId}.xml`, {
      credentials: "omit",
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Показывает эталонное решение задачи: блоки добавляются на рабочее
 * поле справа от текущих (для сравнения), без затирания работы ученика.
 * Возвращает true при успехе.
 */
export async function showSolution(taskId: TaskId): Promise<boolean> {
  try {
    const res = await fetch(`/solutions/${taskId}.xml`, {
      credentials: "omit",
    });
    if (!res.ok) return false;
    const text = await res.text();

    const ws = Blockly.getMainWorkspace() as Blockly.WorkspaceSvg | null;
    if (!ws) return false;

    // Смещаем решение вправо от занятой области, чтобы не перекрыть
    // блоки ученика — сравнение «бок о бок»
    const metrics = ws.getMetrics();
    let offsetX = 40;
    try {
      const blocks = ws.getAllBlocks(false);
      for (const b of blocks) {
        const xy = b.getRelativeToSurfaceXY();
        const w = (b as unknown as { width?: number }).width ?? 100;
        offsetX = Math.max(offsetX, xy.x + w + 80);
      }
      if (metrics && Number.isFinite(metrics.viewWidth)) {
        offsetX = Math.min(offsetX, Math.max(40, metrics.viewWidth - 300));
      }
    } catch {
      /* дефолтное смещение */
    }

    const dom = Blockly.utils.xml.textToDom(text);
    // Парсим блоки и переносим со смещением
    const kids = Array.from(dom.children || []);
    for (const kid of kids) {
      if ((kid as Element).tagName.toLowerCase() === "variables") continue;
      const block = Blockly.Xml.domToBlock(
        kid as Element,
        ws,
      ) as Blockly.BlockSvg;
      try {
        const xy = block.getRelativeToSurfaceXY();
        block.moveBy(offsetX - xy.x, 40 - xy.y);
        // Разворачиваем свёрнутые блоки для читаемости
        if (typeof block.setCollapsed === "function") block.setCollapsed(false);
      } catch {
        /* позиционирование не критично */
      }
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Рендерит кнопку «Сравнить с оптимальным» в переданный контейнер
 * фидбека задачи. Вызывается из tasks.ts при верном решении.
 */
export function mountSolutionOffer(
  container: HTMLElement,
  taskId: TaskId,
): void {
  container.innerHTML = "";
  if (!isSolvedLocal(taskId)) return; // защита: только после решения

  void hasSolution(taskId).then((ok) => {
    if (!ok) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn small primary solution-compare-btn";
    btn.textContent = t(
      "🔍 Сравнить с оптимальным решением",
      "🔍 Compare with the optimal solution",
    );
    btn.addEventListener("click", async () => {
      btn.disabled = true;
      const loaded = await showSolution(taskId);
      if (loaded) {
        btn.textContent = t(
          "✓ Решение добавлено на поле справа",
          "✓ Solution added on the right",
        );
      } else {
        btn.textContent = t(
          "Не удалось загрузить решение",
          "Could not load the solution",
        );
      }
    });
    container.appendChild(btn);
  });
}
