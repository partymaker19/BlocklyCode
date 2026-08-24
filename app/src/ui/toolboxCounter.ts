/**
 * Счётчик блоков в тулбоксе и подпись «Сделано с помощью Blockly».
 */

import * as Blockly from "blockly/core";
import { getAppLang } from "../localization";
import { countNonShadowBlocks } from "../workspaceUtils";

let wrapperEl: HTMLDivElement | null = null;
let counterTextEl: HTMLDivElement | null = null;
let creditTextEl: HTMLDivElement | null = null;

function ensureToolboxBlockCounter(): HTMLDivElement | null {
  const toolboxDiv = document.querySelector(
    ".blocklyToolboxDiv, .blocklyToolbox",
  ) as HTMLDivElement | null;
  if (!toolboxDiv) {
    console.debug("[block-counter] toolbox not found");
    return null;
  }

  const categoriesContainer = (toolboxDiv.querySelector(
    ".blocklyToolboxContents",
  ) ||
    toolboxDiv.querySelector(".blocklyTreeRoot") ||
    toolboxDiv) as HTMLElement;

  if (!wrapperEl) {
    wrapperEl = document.createElement("div");
    wrapperEl.id = "toolbox-block-counter";

    counterTextEl = document.createElement("div");
    counterTextEl.id = "toolbox-counter-text";
    counterTextEl.classList.add("toolbox-counter");
    counterTextEl.style.position = "absolute";
    counterTextEl.style.fontSize = "13px";
    counterTextEl.style.fontWeight = "700";
    counterTextEl.style.padding = "6px 8px";
    counterTextEl.style.borderRadius = "8px";
    counterTextEl.style.zIndex = "2";
    counterTextEl.style.display = "block";
    counterTextEl.style.userSelect = "none";
    counterTextEl.style.pointerEvents = "none";
    counterTextEl.style.boxSizing = "border-box";
    counterTextEl.style.lineHeight = "1.25";

    creditTextEl = document.createElement("div");
    creditTextEl.id = "toolbox-credit-text";
    creditTextEl.classList.add("toolbox-counter");
    creditTextEl.style.position = "fixed";
    creditTextEl.style.fontSize = "13px";
    creditTextEl.style.fontWeight = "700";
    creditTextEl.style.padding = "6px 8px";
    creditTextEl.style.borderRadius = "8px";
    creditTextEl.style.zIndex = "9999";
    creditTextEl.style.display = "none";
    creditTextEl.style.userSelect = "none";
    creditTextEl.style.pointerEvents = "none";
    creditTextEl.style.boxSizing = "border-box";
    creditTextEl.style.lineHeight = "1.25";

    wrapperEl.appendChild(counterTextEl);
    wrapperEl.appendChild(creditTextEl);
  }

  wrapperEl.style.position = "absolute";
  wrapperEl.style.pointerEvents = "none";
  wrapperEl.style.userSelect = "none";
  wrapperEl.style.zIndex = "1";
  wrapperEl.style.display = "block";
  wrapperEl.style.margin = "8px 8px 8px 8px";
  wrapperEl.style.boxSizing = "border-box";
  wrapperEl.style.left = "" as any;
  wrapperEl.style.top = "" as any;
  wrapperEl.style.bottom = "" as any;
  wrapperEl.style.width = `${Math.max(toolboxDiv.clientWidth - 16, 0)}px`;

  if (wrapperEl.parentElement !== categoriesContainer) {
    categoriesContainer.appendChild(wrapperEl);
  }

  return wrapperEl;
}

export function updateToolboxBlockCounterLabel(ws: Blockly.WorkspaceSvg): void {
  const wrapper = ensureToolboxBlockCounter();
  if (!wrapper || !counterTextEl || !creditTextEl) return;

  const lang = getAppLang();
  const count = countNonShadowBlocks(ws);
  const isMobile = document.body.classList.contains("mobile");
  const isToolboxOpen = document.body.classList.contains("toolbox-open");
  const toolboxDiv = document.querySelector(
    ".blocklyToolboxDiv, .blocklyToolbox",
  ) as HTMLDivElement | null;
  const toolboxRect = toolboxDiv?.getBoundingClientRect();
  const availableWidth = Math.max(
    Math.floor((toolboxRect?.width ?? toolboxDiv?.clientWidth ?? 0) - 24),
    0,
  );

  if (toolboxDiv) {
    wrapper.style.width = `${Math.max(toolboxDiv.clientWidth - 16, 0)}px`;
  }

  if (isMobile && !isToolboxOpen) {
    counterTextEl.textContent = String(count);
    counterTextEl.setAttribute(
      "aria-label",
      lang === "ru"
        ? `Блоков на рабочем поле: ${count}`
        : `Blocks in workspace: ${count}`,
    );
    counterTextEl.style.width = "34px";
    counterTextEl.style.maxWidth = "34px";
    counterTextEl.style.textAlign = "center";
    counterTextEl.style.padding = "6px 0";
    counterTextEl.style.whiteSpace = "nowrap";
    counterTextEl.style.overflowWrap = "normal";
    counterTextEl.style.left = "50%";
    counterTextEl.style.top = "8px";
    counterTextEl.style.transform = "translateX(-50%)";
    creditTextEl.style.display = "none";
  } else {
    counterTextEl.textContent =
      lang === "ru"
        ? `Блоков на рабочем поле: ${count}`
        : `Blocks in workspace: ${count}`;

    const creditLabel =
      lang === "ru" ? "Создано с помощью Blockly" : "Created with Blockly";
    creditTextEl.textContent = creditLabel;
    creditTextEl.style.display = "block";
    creditTextEl.style.width = "fit-content";
    creditTextEl.style.maxWidth = `${availableWidth}px`;
    creditTextEl.style.textAlign = "center";
    creditTextEl.style.whiteSpace = "normal";
    creditTextEl.style.overflowWrap = "break-word";
    creditTextEl.style.transform = "translateX(-50%)";

    const alignedBadgeWidth = Math.min(
      availableWidth,
      Math.max(creditTextEl.offsetWidth, 120),
    );

    counterTextEl.style.width = `${alignedBadgeWidth}px`;
    counterTextEl.style.maxWidth = `${availableWidth}px`;
    counterTextEl.style.textAlign = "center";
    counterTextEl.style.padding = "6px 8px";
    counterTextEl.style.whiteSpace = "normal";
    counterTextEl.style.overflowWrap = "break-word";
    counterTextEl.style.left = "50%";
    counterTextEl.style.top = "8px";
    counterTextEl.style.transform = "translateX(-50%)";

    if (toolboxRect) {
      try {
        creditTextEl.style.left = `${Math.round(
          toolboxRect.left + toolboxRect.width / 2,
        )}px`;
        creditTextEl.style.bottom = `${Math.max(
          Math.round(window.innerHeight - toolboxRect.bottom + 8),
          8,
        )}px`;
        creditTextEl.style.top = "auto";
      } catch {
        creditTextEl.style.left = "50%";
        creditTextEl.style.bottom = "50px";
        creditTextEl.style.top = "auto";
      }
    } else {
      creditTextEl.style.left = "50%";
      creditTextEl.style.bottom = "50px";
      creditTextEl.style.top = "auto";
    }
  }

  console.debug("[block-counter] updated", { count, lang });
}
