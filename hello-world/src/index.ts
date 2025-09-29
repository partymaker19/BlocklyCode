/* Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from "blockly";
// Добавляем импорт стандартных блоков Blockly, чтобы категории тулбокса были заполнены
import "blockly/blocks";
import { blocks } from "./blocks/text";
import { forBlock } from "./generators/javascript";
import { forBlock as forBlockPython } from "./generators/python";
import { forBlock as forBlockLua } from "./generators/lua";
import { javascriptGenerator } from "blockly/javascript";
import { pythonGenerator } from "blockly/python";
import { luaGenerator } from "blockly/lua";
import { save, load } from "./serialization";
import { setupAppBootstrap, persistWorkspaceDebounced, setStorageIndicatorUpdater } from "./appBootstrap";
import { setupAuthBootstrap } from "./authBootstrap";
import { initAuthUI } from "./authUI";
import "./index.css";
import {
  initTaskValidation,
  setActiveTask,
  getFirstUnsolvedTask,
} from "./tasks";
import {
  registerCustomBlocks,
  importBlockFromJson,
  removeCustomBlock,
  getCustomBlocks,
} from "./customBlocks";
import {
  setAppLang,
  localizedToolbox,
  localizeImportUI,
  getAppLang,
  localizeTooltips,
  localizeAceSettingsPanel,
} from "./localization";
import {
  setupAceEditor,
  updateAceEditorFromWorkspace,
  getAceEditor,
} from "./aceEditor";
import { clearOutput, runCode } from "./codeExecution";
import Konva from "konva";
// Import dark theme
import DarkTheme from "@blockly/theme-dark";
// Toolbox search plugin (localized)
import "./toolbox_search_localized";

// Добавлено: регистрация плагина угла
import { registerFieldAngle } from "@blockly/field-angle";

// Регистрируем поле угла до того, как начнём создавать блоки
registerFieldAngle();

// Register the blocks and generator with Blockly
// Регистрация будет выполнена после применения локали, чтобы подтянуть правильные строки

// Настройки локализации приложения
const defaultLang = getAppLang();

// Инициализируем язык до создания рабочей области
setAppLang(defaultLang);
// Локализуем статические подписи окна настроек Ace при старте
localizeAceSettingsPanel(defaultLang);

// Объявляем флаг регистрации контекстного меню до первого вызова
let customBlockContextRegistered = false;
let modalDragInitialized = false;

// Теперь, когда локаль установлена, регистрируем блоки и генераторы
Blockly.common.defineBlocks(blocks);
Object.assign(javascriptGenerator.forBlock, forBlock);
Object.assign(pythonGenerator.forBlock, forBlockPython);
Object.assign(luaGenerator.forBlock, forBlockLua);
// Регистрием пользовательские блоки и контекстное меню удаления
registerCustomBlocks();
setupCustomBlockContextMenu();

// Set up UI elements and inject Blockly
// removed unused codeDiv: Ace editor is the single source of truth for generated code
const outputDiv = document.getElementById("output");
const blocklyDiv = document.getElementById("blocklyDiv");
const importBtn = document.getElementById(
  "importBlockBtn"
) as HTMLButtonElement | null;
const importModal = document.getElementById(
  "importModal"
) as HTMLDivElement | null;
const closeModalBtn = document.getElementById(
  "closeModal"
) as HTMLSpanElement | null;
const cancelImportBtn = document.getElementById(
  "cancelImport"
) as HTMLButtonElement | null;
const confirmImportBtn = document.getElementById(
  "confirmImport"
) as HTMLButtonElement | null;
const blockJsonTextarea = document.getElementById(
  "blockJson"
) as HTMLTextAreaElement | null;
const blockGeneratorTextarea = document.getElementById(
  "blockGenerator"
) as HTMLTextAreaElement | null;

// Task UI elements: header toggle button and left sidebar
const taskSolutionBtn = document.getElementById(
  "taskSolutionBtn"
) as HTMLButtonElement | null;
const taskSidebar = document.getElementById(
  "taskSidebar"
) as HTMLDivElement | null;

const presetLetBtn = document.getElementById(
  "presetLet"
) as HTMLButtonElement | null;
const presetConstBtn = document.getElementById(
  "presetConst"
) as HTMLButtonElement | null;
const presetReturnBtn = document.getElementById(
  "presetReturn"
) as HTMLButtonElement | null;
// Добавляем ссылки на элементы модального окна для перетаскивания
const modalContent = importModal?.querySelector(
  ".modal-content"
) as HTMLDivElement | null;
const modalHeader = importModal?.querySelector(
  ".modal-header"
) as HTMLDivElement | null;
// Новые элементы модалки
const genLangTabs = document.getElementById(
  "generatorLangTabs"
) as HTMLDivElement | null;
const genLangJsBtn = document.getElementById(
  "genLangJs"
) as HTMLButtonElement | null;
const genLangPyBtn = document.getElementById(
  "genLangPy"
) as HTMLButtonElement | null;
const genLangLuaBtn = document.getElementById(
  "genLangLua"
) as HTMLButtonElement | null;
// Кнопки выбора языка генератора в шапке
const genLangHeaderContainer = document.getElementById(
  "genLangHeaderSelect"
) as HTMLDivElement | null;
const genLangHeaderSelectedOption = document.getElementById(
  "selectedOption"
) as HTMLDivElement | null;
const genLangHeaderDropdownOptions = document.getElementById(
  "dropdownOptions"
) as HTMLDivElement | null;
const presetNotice = document.getElementById(
  "presetNotice"
) as HTMLDivElement | null;
const generatorErrorEl = document.getElementById(
  "generatorError"
) as HTMLDivElement | null;
const generatorOkEl = document.getElementById(
  "generatorOk"
) as HTMLDivElement | null;

// Task sidebar elements
const checkTaskBtn = document.getElementById(
  "checkTaskBtn"
) as HTMLButtonElement | null;
const taskFeedbackEl = document.getElementById(
  "taskFeedback"
) as HTMLDivElement | null;
const taskStarsEl = document.getElementById(
  "taskStars"
) as HTMLDivElement | null;
const nextTaskBtn = document.getElementById(
  "nextTaskBtn"
) as HTMLButtonElement | null;
const prevTaskBtn = document.getElementById(
  "prevTaskBtn"
) as HTMLButtonElement | null;

// Theme elements
const themeSwitchInput = document.getElementById(
  "themeSwitchInput"
) as HTMLInputElement | null;
const themeLabelLight = document.getElementById(
  "theme-light"
) as HTMLSpanElement | null;
const themeLabelDark = document.getElementById(
  "theme-dark"
) as HTMLSpanElement | null;

let selectedGeneratorLanguage: "javascript" | "python" | "lua" =
  "javascript";

// Theme state
type AppTheme = "light" | "dark";
const APP_THEME_KEY = "app_theme";
let appTheme: AppTheme = "light";

// Объявление рабочей области Blockly
let ws!: Blockly.WorkspaceSvg;

// Элементы модального окна справки
const blockHelpBtn = document.getElementById(
  "blockHelpBtn"
) as HTMLButtonElement | null;
const helpModal = document.getElementById("helpModal") as HTMLDivElement | null;
const closeHelpModal = document.getElementById(
  "closeHelpModal"
) as HTMLSpanElement | null;
const markdownContent = document.getElementById(
  "markdownContent"
) as HTMLDivElement | null;

// ===== Блок: счётчик блоков в тулбоксе =====
function getWorkspaceBlockCount(): number {
  try {
    if (!ws) return 0;
    // Не учитываем теневые блоки
    return ws.getAllBlocks(false).filter((b: any) => !b.isShadow()).length;
  } catch {
    return 0;
  }
}

function ensureToolboxBlockCounter(): HTMLDivElement | null {
  const toolboxDiv = document.querySelector(
    ".blocklyToolboxDiv, .blocklyToolbox"
  ) as HTMLDivElement | null;
  if (!toolboxDiv) {
    console.debug("[block-counter] toolbox not found");
    return null;
  }

  // Контейнер со списком категорий (разные версии Blockly)
  const categoriesContainer = (toolboxDiv.querySelector(
    ".blocklyToolboxContents"
  ) ||
    toolboxDiv.querySelector(".blocklyTreeRoot") ||
    toolboxDiv) as HTMLElement;

  // Создаём/находим элемент бейджа
  let el = document.getElementById(
    "toolbox-block-counter"
  ) as HTMLDivElement | null;
  if (!el) {
    el = document.createElement("div");
    el.id = "toolbox-block-counter";
  }

  // Стили бейджа
  el.style.position = "absolute";
  el.style.pointerEvents = "none";
  el.style.userSelect = "none";
  el.style.fontSize = "13px";
  el.style.fontWeight = "700";
  el.style.padding = "6px 8px";
  el.style.borderRadius = "8px";
  // вместо инлайн-цветов используем CSS-класс для темизации
  el.classList.add("toolbox-counter");
  // зачистим возможные старые инлайн-стили
  el.style.background = "" as any;
  el.style.color = "" as any;
  el.style.boxShadow = "" as any;
  el.style.zIndex = "1";
  el.style.display = "block";
  el.style.margin = "12px 8px 8px 8px";
  // очистим возможные значения от прежней абсолютной раскладки
  el.style.left = "" as any;
  el.style.top = "" as any;
  el.style.bottom = "" as any;

  // Переместим элемент в контейнер категорий, если он был в другом месте
  if (el.parentElement !== categoriesContainer) {
    categoriesContainer.appendChild(el);
  }

  return el;
}

function updateToolboxBlockCounterLabel(): void {
  const el = ensureToolboxBlockCounter();
  if (!el) return;
  const lang = getAppLang();
  const count = getWorkspaceBlockCount();
  el.textContent =
    lang === "ru"
      ? `Блоков на рабочем поле: ${count}`
      : `Blocks in workspace: ${count}`;
  console.debug("[block-counter] updated", { count, lang });
}
// ===== конец блока счётчика блоков =====

// Helper: get active Blockly theme
function getBlocklyTheme() {
  return appTheme === "dark" ? (DarkTheme as any) : Blockly.Themes.Classic;
}

function setAppTheme(next: AppTheme) {
  appTheme = next;
  // update labels state
  if (themeLabelLight && themeLabelDark) {
    themeLabelLight.classList.toggle("active", appTheme === "light");
    themeLabelDark.classList.toggle("active", appTheme === "dark");
  }
  // Add data attribute for CSS chrome
  document.documentElement.setAttribute("data-theme", appTheme);
  // Recreate workspace with preserved state
  refreshWorkspaceWithCustomToolbox();
}

function initThemeSwitchUI() {
  if (!themeSwitchInput) return;
  themeSwitchInput.checked = appTheme === "dark";
  if (themeLabelLight && themeLabelDark) {
    themeLabelLight.classList.toggle("active", appTheme === "light");
    themeLabelDark.classList.toggle("active", appTheme === "dark");
  }
  themeSwitchInput.addEventListener("change", (e: Event) => {
    const checked = (e.target as HTMLInputElement).checked;
    setAppTheme(checked ? "dark" : "light");
  });
}

// Task sidebar toggle
function toggleTaskSidebar(force?: boolean) {
  if (!taskSidebar || !pageContainer || !blocklyDiv || !outputPaneEl) return;

  const BACKUP_KEY = "layout.split.v.backup";
  const sidebarWidth =
    (taskSidebar as HTMLDivElement).getBoundingClientRect().width || 340;

  const isOpen = taskSidebar.classList.contains("open");
  const next = force !== undefined ? force : !isOpen;

  taskSidebar.classList.toggle("open", next);
  const pc = document.getElementById("pageContainer") as HTMLDivElement | null;
  if (pc) pc.classList.toggle("sidebar-open", next);
  if (taskSolutionBtn) {
    taskSolutionBtn.setAttribute("aria-pressed", next ? "true" : "false");
  }

  // Shrink only the left workspace when sidebar opens; right pane stays anchored
  const total = (pageContainer as HTMLDivElement).clientWidth;
  const RESIZER_W = Math.max(4, verticalResizer?.offsetWidth || 6);
  const minLeft = 320; // min width for blockly
  const minRight = 300; // min width for output
  const clamp = (val: number, min: number, max: number) =>
    Math.max(min, Math.min(max, val));

  const currentLeft = (blocklyDiv as HTMLDivElement).getBoundingClientRect()
    .width;

  if (next) {
    // Opening: save previous left width and shrink by sidebar width
    localStorage.setItem(BACKUP_KEY, String(currentLeft));
    const targetLeft = clamp(
      currentLeft - sidebarWidth,
      minLeft,
      total - minRight - RESIZER_W
    );
    // keep left pane width unchanged when toggling sidebar; do not modify its flex here
    // keep outputPane fixed at 301px via CSS; do not adjust its flex here
  } else {
    // Closing: restore previous left width if saved, else add sidebar width back
    const saved = parseFloat(localStorage.getItem(BACKUP_KEY) || "0");
    const restored = saved > 0 ? saved : currentLeft + sidebarWidth;
    const targetLeft = clamp(restored, minLeft, total - minRight - RESIZER_W);
    // keep left pane width unchanged when toggling sidebar; do not modify its flex here
    // keep outputPane fixed at 301px via CSS; do not adjust its flex here
    localStorage.removeItem(BACKUP_KEY);
  }

  // Resize after layout change
  requestAnimationFrame(() => {
    try {
      (Blockly as any).svgResize?.(ws);
    } catch {}
    try {
      const ed = typeof getAceEditor === "function" ? getAceEditor() : null;
      ed?.resize?.(true);
    } catch {}
  });
}

if (taskSolutionBtn) {
  taskSolutionBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleTaskSidebar();
  });
}

function setActiveGenLangButton(lang: "javascript" | "python" | "lua") {
  [genLangJsBtn, genLangPyBtn, genLangLuaBtn].forEach(
    (btn) => btn && btn.classList.remove("active")
  );
  if (lang === "javascript") {
    if (genLangJsBtn) genLangJsBtn.classList.add("active");
  }
  if (lang === "python") {
    if (genLangPyBtn) genLangPyBtn.classList.add("active");
  }
  if (lang === "lua") {
    if (genLangLuaBtn) genLangLuaBtn.classList.add("active");
  }
  // sync custom header dropdown label and selected state
  if (genLangHeaderSelectedOption) {
    const label =
      lang === "javascript"
        ? "JavaScript"
        : lang === "python"
        ? "Python"
        : "Lua";
    genLangHeaderSelectedOption.textContent = label;
  }
  if (genLangHeaderDropdownOptions) {
    Array.from(
      genLangHeaderDropdownOptions.querySelectorAll(".option")
    ).forEach((opt) => {
      opt.classList.toggle(
        "selected",
        (opt as HTMLElement).dataset.value === lang
      );
    });
  }
}

function updatePresetsByGenLang() {
  const lang = selectedGeneratorLanguage;
  const letBtn = presetLetBtn;
  const constBtn = presetConstBtn;
  const returnBtn = presetReturnBtn;
  if (!letBtn || !constBtn || !returnBtn) return;

  const currentLang = getAppLang();

  if (lang === "javascript") {
    letBtn.disabled = false;
    letBtn.textContent =
      currentLang === "ru" ? "let переменная" : "let variable";
    constBtn.disabled = false;
    constBtn.textContent = currentLang === "ru" ? "константа" : "constant";
    returnBtn.disabled = false;
    returnBtn.textContent =
      currentLang === "ru" ? "return значение" : "return value";
    if (presetNotice) {
      presetNotice.style.display = "none";
      presetNotice.textContent = "";
    }
  } else if (lang === "python") {
    // Переменная, print и return
    letBtn.disabled = false;
    letBtn.textContent = currentLang === "ru" ? "переменная" : "variable";
    constBtn.disabled = false;
    constBtn.textContent = "print(...)";
    returnBtn.disabled = false;
    returnBtn.textContent =
      currentLang === "ru" ? "return значение" : "return value";
    if (presetNotice) {
      presetNotice.style.display = "none";
      presetNotice.textContent = "";
    }
  } else {
    // lua
    // local переменная, print и return
    letBtn.disabled = false;
    letBtn.textContent =
      currentLang === "ru" ? "local переменная" : "local variable";
    constBtn.disabled = false;
    constBtn.textContent = "print(...)";
    returnBtn.disabled = false;
    returnBtn.textContent =
      currentLang === "ru" ? "return значение" : "return value";
    if (presetNotice) {
      presetNotice.style.display = "none";
      presetNotice.textContent = "";
    }
  }
}

function validateGeneratorUI() {
  if (!blockGeneratorTextarea || !generatorErrorEl || !generatorOkEl) return;
  const code = blockGeneratorTextarea.value.trim();
  if (selectedGeneratorLanguage === "javascript" && code) {
    try {
      // Простая синтаксическая проверка через new Function
      new Function("block", "javascriptGenerator", "Order", code);
      generatorErrorEl.style.display = "none";
      generatorOkEl.style.display = "block";
      const t = (window as any)._currentLocalizedStrings;
      generatorOkEl.textContent =
        t && t.GeneratorValid ? t.GeneratorValid : "✓ Генератор корректен";
    } catch (error) {
      const msg =
        error && (error as any).message
          ? (error as any).message
          : String(error);
      const t = (window as any)._currentLocalizedStrings;
      generatorErrorEl.style.display = "block";
      generatorErrorEl.textContent = `${
        t?.GeneratorErrorPrefix || "Ошибка:"
      } ${msg}`;
      generatorOkEl.style.display = "none";
    }
  } else {
    generatorErrorEl.style.display = "none";
    generatorOkEl.style.display = "none";
  }
}

// Функция для установки placeholder в зависимости от языка
function setGeneratorPlaceholder(lang: "ru" | "en") {
  if (!blockGeneratorTextarea) return;
  const placeholders = {
    javascript: {
      ru: "Например:\nconst value = javascriptGenerator.valueToCode(block, 'VALUE', Order.NONE) || '0';\nreturn `console.log(${value});\\n`;",
      en: "Example:\nconst value = javascriptGenerator.valueToCode(block, 'VALUE', Order.NONE) || '0';\nreturn `console.log(${value});\\n`;",
    },
    python: {
      ru: "Например:\nconst value = pythonGenerator.valueToCode(block, 'VALUE', Order.NONE) || \"'0'\";\\nreturn `print(${value})\\n`;",
      en: "Example:\nconst value = pythonGenerator.valueToCode(block, 'VALUE', Order.NONE) || \"'0'\";\\nreturn `print(${value})\\n`;",
    },
    lua: {
      ru: "Например:\nconst value = luaGenerator.valueToCode(block, 'VALUE', Order.NONE) || \"'0'\";\\nreturn `print(${value})\\n`;",
      en: "Example:\nconst value = luaGenerator.valueToCode(block, 'VALUE', Order.NONE) || \"'0'\";\\nreturn `print(${value})\\n`;",
    },
  };
  const placeholder = placeholders[selectedGeneratorLanguage][lang];
  blockGeneratorTextarea.placeholder = placeholder;
}

function setGenLang(lang: "javascript" | "python" | "lua") {
  selectedGeneratorLanguage = lang;
  setActiveGenLangButton(lang);
  updatePresetsByGenLang();
  validateGeneratorUI();
  const currentLang = getAppLang();
  setGeneratorPlaceholder(currentLang);
  // sync ACE editor (без авто-выполнения)
  updateAceEditorFromWorkspace(ws, selectedGeneratorLanguage);
}

if (genLangJsBtn)
  genLangJsBtn.addEventListener("click", () => setGenLang("javascript"));
if (genLangPyBtn)
  genLangPyBtn.addEventListener("click", () => setGenLang("python"));
if (genLangLuaBtn)
  genLangLuaBtn.addEventListener("click", () => setGenLang("lua"));
// Обработчики для кастомного dropdown в шапке
if (
  genLangHeaderContainer &&
  genLangHeaderSelectedOption &&
  genLangHeaderDropdownOptions
) {
  // Открыть/закрыть список по клику на выбранной области
  genLangHeaderContainer.addEventListener("click", (e) => {
    const isOpen = genLangHeaderContainer.classList.contains("open");
    genLangHeaderContainer.classList.toggle("open", !isOpen);
    genLangHeaderDropdownOptions.style.display = isOpen ? "none" : "block";
  });

  // Выбор опции
  genLangHeaderDropdownOptions.querySelectorAll(".option").forEach((opt) => {
    opt.addEventListener("click", (ev) => {
      ev.stopPropagation();
      const value = (opt as HTMLElement).dataset.value as
        | "javascript"
        | "python"
        | "lua";
      setGenLang(value);
      genLangHeaderContainer.classList.remove("open");
      genLangHeaderDropdownOptions.style.display = "none";
    });
  });

  // Закрытие по клику вне
  document.addEventListener("click", (evt) => {
    if (!genLangHeaderContainer.contains(evt.target as Node)) {
      genLangHeaderContainer.classList.remove("open");
      genLangHeaderDropdownOptions.style.display = "none";
    }
  });
}

if (importBtn) {
  importBtn.addEventListener("click", () => openImportModal());
}
if (closeModalBtn) {
  closeModalBtn.addEventListener("click", () => closeImportModal());
}
if (cancelImportBtn) {
  cancelImportBtn.addEventListener("click", () => closeImportModal());
}
if (confirmImportBtn) {
  confirmImportBtn.addEventListener("click", () => {
    if (!blockJsonTextarea) return;
    const json = blockJsonTextarea.value;
    const gen = blockGeneratorTextarea?.value?.trim() || undefined;
    const t = (window as any)._currentLocalizedStrings;
    if (
      selectedGeneratorLanguage === "javascript" &&
      generatorErrorEl &&
      generatorErrorEl.style.display !== "none"
    ) {
      alert(
        t?.FixJsGenerator ||
          "Исправьте ошибки в генераторе JavaScript перед импортом"
      );
      return;
    }
    const { success, error, blockType } = importBlockFromJson(
      json,
      gen,
      selectedGeneratorLanguage as any
    );
    if (success) {
      registerCustomBlocks();
      refreshWorkspaceWithCustomToolbox();
      closeImportModal();
      if (outputDiv) {
        const p = document.createElement("p");
        p.textContent = `${
          t?.ImportedBlock || "Импортирован блок:"
        } ${blockType}`;
        outputDiv.appendChild(p);
      }
    } else {
      alert(`${t?.ImportErrorPrefix || "Ошибка импорта:"} ` + error);
    }
  });
}

// Функция регистрации пункта контекстного меню для удаления пользовательского блока
// удалено дублирующееся объявление customBlockContextRegistered
function setupCustomBlockContextMenu() {
  if (customBlockContextRegistered) return;
  const registry = (Blockly as any).ContextMenuRegistry?.registry as any;
  if (!registry) return;

  const ITEM_ID = "delete_custom_block_from_my_blocks";
  // Если уже есть такой пункт — выходим
  if (registry.getItem && registry.getItem(ITEM_ID)) {
    customBlockContextRegistered = true;
    return;
  }

  const displayText = () => {
    const lang = getAppLang();
    return lang === "ru" ? "Удалить из «Моих блоков»" : "Remove from My Blocks";
  };

  const item = {
    id: ITEM_ID,
    displayText,
    preconditionFn: (scope: any) => {
      const block = scope?.block as Blockly.Block | undefined;
      if (!block) return "hidden";
      try {
        const custom = getCustomBlocks();
        return custom.some((b: any) => b.definition?.type === block.type)
          ? "enabled"
          : "hidden";
      } catch {
        return "hidden";
      }
    },
    callback: (scope: any) => {
      const block = scope?.block as Blockly.Block | undefined;
      if (!block) return;
      const type = (block as any).type as string;
      const lang = getAppLang();
      const name = type;
      const question =
        lang === "ru"
          ? `Удалить пользовательский блок «${name}» из раздела «Моих блоки»?\nЭкземпляры на рабочем поле не будут удалены.`
          : `Remove custom block "${name}" from "My Blocks"?\nInstances already on the workspace will not be removed.`;
      if (!confirm(question)) return;

      if (removeCustomBlock(type)) {
        // Перерегистрируем и обновим тулбокс/рабочее поле
        registerCustomBlocks();
        refreshWorkspaceWithCustomToolbox();
        const out = document.getElementById("output");
        if (out) {
          const p = document.createElement("p");
          p.textContent =
            lang === "ru" ? `Удалён блок: ${type}` : `Removed block: ${type}`;
          (out as HTMLElement).appendChild(p);
        }
      } else {
        alert(
          lang === "ru" ? "Не удалось удалить блок." : "Failed to remove block."
        );
      }
    },
    scopeType: (Blockly as any).ContextMenuRegistry.ScopeType.BLOCK,
    weight: 200,
  } as any;

  try {
    registry.register(item);
    customBlockContextRegistered = true;
  } catch (e) {
    // На случай повторной регистрации при горячей перезагрузке
    customBlockContextRegistered = true;
  }
}

function applyPreset(kind: "let" | "const" | "print" | "return") {
  if (!blockJsonTextarea) return;
  const lang = selectedGeneratorLanguage;

  if (lang === "javascript") {
    if (kind === "let") {
      const blockType = `let_variable`;
      const jsonDef = {
        type: blockType,
        message0: "let %1 = %2",
        args0: [
          { type: "field_input", name: "NAME", text: "x" },
          { type: "input_value", name: "VALUE" },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: 180,
        tooltip: "let variable declaration",
        helpUrl: "",
      } as any;
      blockJsonTextarea.value = JSON.stringify(jsonDef, null, 2);
      if (blockGeneratorTextarea) {
        blockGeneratorTextarea.value = [
          "const name = block.getFieldValue('NAME') || 'x';",
          "const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '0';",
          "return 'let ' + name + ' = ' + value + ';\\n';",
        ].join("\n");
      }
    } else if (kind === "const") {
      const blockType = `const_constant`;
      const jsonDef = {
        type: blockType,
        message0: "const %1 = %2",
        args0: [
          { type: "field_input", name: "NAME", text: "PI" },
          { type: "input_value", name: "VALUE" },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: 200,
        tooltip: "constant declaration",
        helpUrl: "",
      } as any;
      blockJsonTextarea.value = JSON.stringify(jsonDef, null, 2);
      if (blockGeneratorTextarea) {
        blockGeneratorTextarea.value = [
          "const name = block.getFieldValue('NAME') || 'PI';",
          "const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '0';",
          "return 'const ' + name + ' = ' + value + ';\\n';",
        ].join("\n");
      }
    } else if (kind === "return") {
      const blockType = `return_value`;
      const jsonDef = {
        type: blockType,
        message0: "return %1",
        args0: [{ type: "input_value", name: "VALUE" }],
        previousStatement: null,
        nextStatement: null,
        colour: 20,
        tooltip: "return with value",
        helpUrl: "",
      } as any;
      blockJsonTextarea.value = JSON.stringify(jsonDef, null, 2);
      if (blockGeneratorTextarea) {
        blockGeneratorTextarea.value = [
          "const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.NONE) || 'null';",
          "return 'return ' + value + ';\\n';",
        ].join("\n");
      }
    }
  } else if (lang === "python") {
    if (kind === "let") {
      const blockType = `py_variable`;
      const jsonDef = {
        type: blockType,
        message0: "%1 = %2",
        args0: [
          { type: "field_input", name: "NAME", text: "x" },
          { type: "input_value", name: "VALUE" },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: 180,
        tooltip: "Присваивание переменной (Python)",
        helpUrl: "",
      } as any;
      blockJsonTextarea.value = JSON.stringify(jsonDef, null, 2);
      if (blockGeneratorTextarea) {
        blockGeneratorTextarea.value = [
          "const name = block.getFieldValue('NAME') || 'x';",
          "const value = pythonGenerator.valueToCode(block, 'VALUE', Order.NONE) || \"'0'\";",
          "return name + ' = ' + value + '\\n';",
        ].join("\n");
      }
    } else if (kind === "print") {
      const blockType = `py_print`;
      const jsonDef = {
        type: blockType,
        message0: "print(%1)",
        args0: [{ type: "input_value", name: "VALUE" }],
        previousStatement: null,
        nextStatement: null,
        colour: 210,
        tooltip: "Печать значения (Python)",
        helpUrl: "",
      } as any;
      blockJsonTextarea.value = JSON.stringify(jsonDef, null, 2);
      if (blockGeneratorTextarea) {
        blockGeneratorTextarea.value = [
          "const value = pythonGenerator.valueToCode(block, 'VALUE', Order.NONE) || \"'0'\";",
          "return `print(${value})\\n`;",
        ].join("\n");
      }
    } else if (kind === "return") {
      const blockType = `return_value`;
      const jsonDef = {
        type: blockType,
        message0: "return %1",
        args0: [{ type: "input_value", name: "VALUE" }],
        previousStatement: null,
        nextStatement: null,
        colour: 20,
        tooltip: "Оператор return (Python)",
        helpUrl: "",
      } as any;
      blockJsonTextarea.value = JSON.stringify(jsonDef, null, 2);
      if (blockGeneratorTextarea) {
        blockGeneratorTextarea.value = [
          "const value = pythonGenerator.valueToCode(block, 'VALUE', Order.NONE) || 'None';",
          "return 'return ' + value + '\\n';",
        ].join("\n");
      }
    }
  } else {
    // lua
    if (kind === "let") {
      const blockType = `lua_local_variable`;
      const jsonDef = {
        type: blockType,
        message0: "local %1 = %2",
        args0: [
          { type: "field_input", name: "NAME", text: "x" },
          { type: "input_value", name: "VALUE" },
        ],
        previousStatement: null,
        nextStatement: null,
        colour: 180,
        tooltip: "Локальная переменная (Lua)",
        helpUrl: "",
      } as any;
      blockJsonTextarea.value = JSON.stringify(jsonDef, null, 2);
      if (blockGeneratorTextarea) {
        blockGeneratorTextarea.value = [
          "const name = block.getFieldValue('NAME') || 'x';",
          "const value = luaGenerator.valueToCode(block, 'VALUE', Order.NONE) || \"'0'\";",
          "return 'local ' + name + ' = ' + value + '\\n';",
        ].join("\n");
      }
    } else if (kind === "print") {
      const blockType = `lua_print`;
      const jsonDef = {
        type: blockType,
        message0: "print(%1)",
        args0: [{ type: "input_value", name: "VALUE" }],
        previousStatement: null,
        nextStatement: null,
        colour: 210,
        tooltip: "Вывод значения (Lua)",
        helpUrl: "",
      } as any;
      blockJsonTextarea.value = JSON.stringify(jsonDef, null, 2);
      if (blockGeneratorTextarea) {
        blockGeneratorTextarea.value = [
          "const value = luaGenerator.valueToCode(block, 'VALUE', Order.NONE) || \"'0'\";",
          "return 'print(' + value + ')\\n';",
        ].join("\n");
      }
    } else if (kind === "return") {
      const blockType = `return_value`;
      const jsonDef = {
        type: blockType,
        message0: "return %1",
        args0: [{ type: "input_value", name: "VALUE" }],
        previousStatement: null,
        nextStatement: null,
        colour: 20,
        tooltip: "Оператор return (Lua)",
        helpUrl: "",
      } as any;
      blockJsonTextarea.value = JSON.stringify(jsonDef, null, 2);
      if (blockGeneratorTextarea) {
        blockGeneratorTextarea.value = [
          "const value = luaGenerator.valueToCode(block, 'VALUE', Order.NONE) || 'nil';",
          "return 'return ' + value + '\\n';",
        ].join("\n");
      }
    }
  }

  updatePresetsByGenLang();
  validateGeneratorUI();
}
if (presetLetBtn)
  presetLetBtn.addEventListener("click", () => applyPreset("let"));
if (presetConstBtn)
  presetConstBtn.addEventListener("click", () => {
    const lang = selectedGeneratorLanguage;
    if (lang === "javascript") return applyPreset("const");
    return applyPreset("print");
  });
if (presetReturnBtn)
  presetReturnBtn.addEventListener("click", () => applyPreset("return"));
// удалено: presetVarBtn listener

// Инициализация состояний при загрузке
setActiveGenLangButton(selectedGeneratorLanguage);
updatePresetsByGenLang();
validateGeneratorUI();
{
  const currentLang = getAppLang();
  setGeneratorPlaceholder(currentLang);
}
// Синхронизируем кастомный dropdown с выбранным языком при старте
if (genLangHeaderSelectedOption && genLangHeaderDropdownOptions) {
  const label =
    selectedGeneratorLanguage === "javascript"
      ? "JavaScript"
      : selectedGeneratorLanguage === "python"
      ? "Python"
      : "Lua";
  genLangHeaderSelectedOption.textContent = label;
  Array.from(genLangHeaderDropdownOptions.querySelectorAll(".option")).forEach(
    (opt) => {
      opt.classList.toggle(
        "selected",
        (opt as HTMLElement).dataset.value === selectedGeneratorLanguage
      );
    }
  );
}

// Инициализация темы
document.documentElement.setAttribute("data-theme", appTheme);
initThemeSwitchUI();

// Инициализация UI локализации
localizeImportUI(defaultLang);
localizeTooltips(defaultLang);
// Установить локализованный текст для кнопки следующей задачи и элементы панели задач
{
  const t = (window as any)._currentLocalizedStrings;
  const nextLabel =
    t?.NextTask || (defaultLang === "ru" ? "Следующая задача" : "Next task");
  const prevLabel =
    t?.PrevTask ||
    (defaultLang === "ru" ? "Предыдущая задача" : "Previous task");
  const btn = document.getElementById("nextTaskBtn");
  if (btn) btn.textContent = `${nextLabel} →`;
  const prev = document.getElementById("prevTaskBtn");
  if (prev) prev.textContent = `← ${prevLabel}`;

  const solText = document.getElementById("taskSolutionBtnText");
  if (solText)
    (solText as HTMLElement).textContent = `ℹ️ ${
      t?.TaskSolutions ||
      (defaultLang === "ru" ? "Решение задач" : "Task Solutions")
    }`;

  const checkBtn = document.getElementById("checkTaskBtn");
  if (checkBtn)
    (checkBtn as HTMLElement).textContent =
      t?.CheckSolution ||
      (defaultLang === "ru" ? "Проверить решение" : "Check solution");

  const criteriaEl = document.querySelector("#taskSidebar .task-criteria");
  if (criteriaEl) {
    const text =
      t?.StarsCriteria ||
      (defaultLang === "ru" ? "Критерии звёзд:" : "Stars criteria:");
    const firstNode = criteriaEl.firstChild;
    if (firstNode && firstNode.nodeType === Node.TEXT_NODE) {
      (firstNode as Text).textContent = text + "\n";
    }

    const ul = criteriaEl.querySelector("ul");
    if (ul) {
      const items = ul.querySelectorAll("li");
      const starsOptimal =
        t?.StarsOptimal ||
        (defaultLang === "ru"
          ? "оптимально (минимум блоков)"
          : "optimal (minimum blocks)");
      const starsGood =
        t?.StarsGood || (defaultLang === "ru" ? "хорошо" : "good");
      const starsCorrect =
        t?.StarsCorrect ||
        (defaultLang === "ru" ? "решение верное" : "solution correct");
      if (items[0])
        (items[0] as HTMLElement).textContent = `★★★ — ${starsOptimal}`;
      if (items[1]) (items[1] as HTMLElement).textContent = `★★ — ${starsGood}`;
      if (items[2])
        (items[2] as HTMLElement).textContent = `★ — ${starsCorrect}`;
    }
  }
}

// Определяем, была ли страница перезагружена
const __navEntries = (performance as any)?.getEntriesByType?.('navigation') || [];
const __isInitialReload = __navEntries[0]?.type === 'reload' || ((performance as any)?.navigation?.type === 1);

// При перезагрузке очищаем сохранённые данные прогресса
if (__isInitialReload) {
  try { window.localStorage?.removeItem('mainWorkspace'); } catch {}
  try { window.localStorage?.removeItem('task_progress_v1'); } catch {}
}

// Инициализация рабочей области при загрузке страницы
refreshWorkspaceWithCustomToolbox();

// Обработчик переключения языка
const langSwitchInput = document.getElementById(
  "langSwitchInput"
) as HTMLInputElement | null;
if (langSwitchInput) {
  // Установить состояние переключателя в соответствии с текущим языком
  langSwitchInput.checked = defaultLang === "en";

  langSwitchInput.addEventListener("change", () => {
    const newLang = langSwitchInput.checked ? "en" : "ru";
    setAppLang(newLang);
    // Обновляем рабочую область с локализованным тулбоксом
    refreshWorkspaceWithCustomToolbox();
    // Локализуем импорт-модалку
    localizeImportUI(newLang);
    // Локализуем тултипы и окно настроек Ace
    localizeTooltips(newLang);
    localizeAceSettingsPanel(newLang);
    // ACE специфичные строки (кнопка Save, статусбар)
    const { refreshAceUILanguage } = require("./aceEditor");
    if (typeof refreshAceUILanguage === "function") refreshAceUILanguage();
    // Обновить текст кнопки следующей задачи и элементы панели задач
    {
      const t = (window as any)._currentLocalizedStrings;
      const nextLabel =
        t?.NextTask || (newLang === "ru" ? "Следующая задача" : "Next task");
      const prevLabel =
        t?.PrevTask ||
        (newLang === "ru" ? "Предыдущая задача" : "Previous task");
      const btn = document.getElementById("nextTaskBtn");
      if (btn) btn.textContent = `${nextLabel} →`;
      const prev = document.getElementById("prevTaskBtn");
      if (prev) prev.textContent = `← ${prevLabel}`;

      const solText = document.getElementById("taskSolutionBtnText");
      if (solText)
        (solText as HTMLElement).textContent = `ℹ️ ${
          t?.TaskSolutions ||
          (newLang === "ru" ? "Решение задач" : "Task Solutions")
        }`;

      const checkBtn = document.getElementById("checkTaskBtn");
      if (checkBtn)
        (checkBtn as HTMLElement).textContent =
          t?.CheckSolution ||
          (newLang === "ru" ? "Проверить решение" : "Check solution");

      const criteriaEl = document.querySelector("#taskSidebar .task-criteria");
      if (criteriaEl) {
        const text =
          t?.StarsCriteria ||
          (newLang === "ru" ? "Критерии звёзд:" : "Stars criteria:");
        const firstNode = criteriaEl.firstChild;
        if (firstNode && firstNode.nodeType === Node.TEXT_NODE) {
          (firstNode as Text).textContent = text + "\n";
        }

        const ul = criteriaEl.querySelector("ul");
        if (ul) {
          const items = ul.querySelectorAll("li");
          const starsOptimal =
            t?.StarsOptimal ||
            (newLang === "ru"
              ? "оптимально (минимум блоков)"
              : "optimal (minimum blocks)");
          const starsGood =
            t?.StarsGood || (newLang === "ru" ? "хорошо" : "good");
          const starsCorrect =
            t?.StarsCorrect ||
            (newLang === "ru" ? "решение верное" : "solution correct");
          if (items[0])
            (items[0] as HTMLElement).textContent = `★★★ — ${starsOptimal}`;
          if (items[1])
            (items[1] as HTMLElement).textContent = `★★ — ${starsGood}`;
          if (items[2])
            (items[2] as HTMLElement).textContent = `★ — ${starsCorrect}`;
        }
      }
    }
  });
}

// Annotation tools and state
type Tool = "brush" | "line" | "arrow" | "rect";

class AnnotationManager {
  private overlay: HTMLDivElement;
  private toolbar: HTMLDivElement;
  private stage: Konva.Stage | null = null;
  private layer: Konva.Layer | null = null;
  private tool: Tool = "brush";
  private color = "#ff2d55";
  private size = 4;
  private drawing = false;
  private points: number[] = [];
  private currentShape: Konva.Shape | null = null;
  private history: Konva.Shape[] = [];
  private redoStack: Konva.Shape[] = [];

  constructor() {
    this.overlay = document.getElementById(
      "annotationOverlay"
    ) as HTMLDivElement;
    this.toolbar = document.getElementById("annotToolbar") as HTMLDivElement;
    this.initUI();
    this.initStage();
    window.addEventListener("resize", () => this.resize());
  }

  private initUI() {
    const toggleBtn = document.getElementById(
      "annotateToggleBtn"
    ) as HTMLButtonElement | null;
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => this.toggle());
    }
    const map: Record<string, () => void> = {
      annotBrush: () => this.setTool("brush"),
      annotLine: () => this.setTool("line"),
      annotArrow: () => this.setTool("arrow"),
      annotRect: () => this.setTool("rect"),
      annotUndo: () => this.undo(),
      annotRedo: () => this.redo(),
      annotClear: () => this.clear(),
      annotColor: () => this.pickColor(),
      annotSize: () => this.pickSize(),
    };
    Object.keys(map).forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("click", map[id]);
    });

    document.addEventListener("keydown", (e) => {
      if (this.overlay.style.display !== "block") return;
      if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        this.undo();
      }
      if (e.ctrlKey && e.key.toLowerCase() === "y") {
        e.preventDefault();
        this.redo();
      }
      if (e.key.toLowerCase() === "b") this.setTool("brush");
      if (e.key.toLowerCase() === "l") this.setTool("line");
      if (e.key.toLowerCase() === "a") this.setTool("arrow");
      if (e.key.toLowerCase() === "r") this.setTool("rect");
      if (e.key === "Escape") this.toggle(false);
    });
  }

  private initStage() {
    if (!this.overlay) return;
    // compute area below header
    const header = document.getElementById("header");
    const topOffset = header ? header.getBoundingClientRect().height : 0;
    const width = window.innerWidth;
    const height = window.innerHeight - topOffset;
    this.overlay.style.top = `${topOffset}px`;
    this.overlay.style.display = "none";

    this.stage = new Konva.Stage({ container: this.overlay, width, height });
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);

    // pointer events
    this.stage.on("mousedown touchstart", (e) => this.onPointerDown(e));
    this.stage.on("mousemove touchmove", (e) => this.onPointerMove(e));
    this.stage.on("mouseup touchend", (e) => this.onPointerUp(e));
  }

  private resize() {
    if (!this.stage) return;
    const header = document.getElementById("header");
    const topOffset = header ? header.getBoundingClientRect().height : 0;
    const width = window.innerWidth;
    const height = window.innerHeight - topOffset;
    this.overlay.style.top = `${topOffset}px`;
    this.stage.size({ width, height });
  }

  private setTool(t: Tool) {
    this.tool = t;
    ["annotBrush", "annotLine", "annotArrow", "annotRect"].forEach((id) => {
      const el = document.getElementById(id);
      if (el)
        el.classList.toggle(
          "active",
          (id === "annotBrush" && t === "brush") ||
            (id === "annotLine" && t === "line") ||
            (id === "annotArrow" && t === "arrow") ||
            (id === "annotRect" && t === "rect")
        );
    });
  }

  private pickColor() {
    const input = document.createElement("input");
    input.type = "color";
    input.value = this.color;
    input.style.position = "fixed";
    input.style.left = "-1000px";
    document.body.appendChild(input);
    input.click();
    input.oninput = () => {
      this.color = input.value;
    };
    input.onchange = () => {
      document.body.removeChild(input);
    };
  }

  private pickSize() {
    const next = prompt("Толщина линии (1-20):", String(this.size));
    if (!next) return;
    const v = Math.max(1, Math.min(20, parseInt(next, 10) || this.size));
    this.size = v;
  }

  private toggle(force?: boolean) {
    const show =
      force !== undefined ? force : this.overlay.style.display !== "block";
    this.overlay.style.display = show ? "block" : "none";
    this.toolbar.style.display = show ? "flex" : "none";
    const btn = document.getElementById("annotateToggleBtn");
    if (btn) btn.classList.toggle("active", show);
    if (show) this.resize();
  }

  private onPointerDown(e: any) {
    if (!this.stage || !this.layer) return;
    this.drawing = true;
    this.points = [];
    this.currentShape = null;
    const pos = this.stage.getPointerPosition();
    if (!pos) return;

    if (this.tool === "brush") {
      this.points.push(pos.x, pos.y);
      const line = new Konva.Line({
        points: this.points,
        stroke: this.color,
        strokeWidth: this.size,
        lineCap: "round",
        lineJoin: "round",
        tension: 0.5,
        listening: false,
      });
      this.layer.add(line);
      this.currentShape = line;
    } else if (this.tool === "line" || this.tool === "arrow") {
      const line = new Konva.Line({
        points: [pos.x, pos.y, pos.x, pos.y],
        stroke: this.color,
        strokeWidth: this.size,
        lineCap: "round",
        lineJoin: "round",
      });
      this.layer.add(line);
      this.currentShape = line;
    } else if (this.tool === "rect") {
      const rect = new Konva.Rect({
        x: pos.x,
        y: pos.y,
        width: 0,
        height: 0,
        stroke: this.color,
        strokeWidth: this.size,
        listening: false,
      });
      this.layer.add(rect);
      this.currentShape = rect;
    }
  }

  private onPointerMove(e: any) {
    if (!this.drawing || !this.stage || !this.layer || !this.currentShape)
      return;
    const pos = this.stage.getPointerPosition();
    if (!pos) return;

    if (this.tool === "brush") {
      const line = this.currentShape as Konva.Line;
      const pts = line.points().concat([pos.x, pos.y]);
      line.points(pts);
    } else if (this.tool === "line" || this.tool === "arrow") {
      const line = this.currentShape as Konva.Line;
      const pts = line.points();
      pts[2] = pos.x;
      pts[3] = pos.y;
      line.points(pts);
    } else if (this.tool === "rect") {
      const rect = this.currentShape as Konva.Rect;
      const w = pos.x - rect.x();
      const h = pos.y - rect.y();
      rect.width(w);
      rect.height(h);
    }
    this.layer.batchDraw();
  }

  private onPointerUp(e: any) {
    if (!this.drawing || !this.layer || !this.currentShape) return;
    this.drawing = false;

    if (this.tool === "arrow") {
      const line = this.currentShape as Konva.Line;
      const pts = line.points();
      // draw simple arrow head
      const [x1, y1, x2, y2] = pts;
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = 10 + this.size * 1.5;
      const hx1 = x2 - headLen * Math.cos(angle - Math.PI / 6);
      const hy1 = y2 - headLen * Math.sin(angle - Math.PI / 6);
      const hx2 = x2 - headLen * Math.cos(angle + Math.PI / 6);
      const hy2 = y2 - headLen * Math.sin(angle + Math.PI / 6);
      const arrow = new Konva.Line({
        points: [x1, y1, x2, y2, hx1, hy1, x2, y2, hx2, hy2],
        stroke: this.color,
        strokeWidth: this.size,
        lineCap: "round",
        lineJoin: "round",
      });
      this.layer.add(arrow);
      line.destroy();
      this.currentShape = arrow;
    }

    this.history.push(this.currentShape);
    this.redoStack = [];
    this.layer.draw();
  }

  private undo() {
    if (!this.layer) return;
    const shape = this.history.pop();
    if (!shape) return;
    this.redoStack.push(shape);
    shape.destroy();
    this.layer.draw();
  }

  private redo() {
    if (!this.layer) return;
    const shape = this.redoStack.pop();
    if (!shape) return;
    this.layer.add(shape);
    this.history.push(shape);
    this.layer.draw();
  }

  private clear() {
    if (!this.layer) return;
    this.layer.destroyChildren();
    this.history = [];
    this.redoStack = [];
    this.layer.draw();
  }
}

function setupAnnotationUI() {
  // Ensure elements exist before init
  const overlay = document.getElementById("annotationOverlay");
  const toolbar = document.getElementById("annotToolbar");
  const btn = document.getElementById("annotateToggleBtn");
  if (!overlay || !toolbar || !btn) return;
  (window as any).__annotationManager = new AnnotationManager();
}

// Call after initial UI and workspace are ready
setupAnnotationUI();

// Initialize external Ace Editor module
setupAceEditor(() => selectedGeneratorLanguage);

// After Ace is initialized, sync UI strings with current app language
try {
  const { refreshAceUILanguage } = require("./aceEditor");
  if (typeof refreshAceUILanguage === "function") refreshAceUILanguage();
} catch {}

// Split layout elements
const pageContainer = document.getElementById(
  "pageContainer"
) as HTMLDivElement | null;
const outputPaneEl = document.getElementById(
  "outputPane"
) as HTMLDivElement | null;
const codePaneEl = document.getElementById("codePane") as HTMLDivElement | null;
const verticalResizer = document.getElementById(
  "verticalResizer"
) as HTMLDivElement | null;
const horizontalResizer = document.getElementById(
  "horizontalResizer"
) as HTMLDivElement | null;

// Ensure final resize after flex-basis transition completes
if (blocklyDiv) {
  blocklyDiv.addEventListener("transitionend", (e: TransitionEvent) => {
    if (e.propertyName === "flex-basis" || e.propertyName === "flex") {
      try {
        (Blockly as any).svgResize?.(ws);
      } catch {}
    }
  });
}
if (outputPaneEl) {
  outputPaneEl.addEventListener("transitionend", (e: TransitionEvent) => {
    if (e.propertyName === "flex-basis" || e.propertyName === "flex") {
      try {
        const ed = typeof getAceEditor === "function" ? getAceEditor() : null;
        ed?.resize?.(true);
      } catch {}
    }
  });
}

(function initSplitters() {
  if (!pageContainer || !blocklyDiv || !outputPaneEl) return;

  const V_KEY = "layout.split.v";
  const H_KEY = "layout.split.h";
  const RESIZER_W = Math.max(4, verticalResizer?.offsetWidth || 6);
  const RESIZER_H = Math.max(4, horizontalResizer?.offsetHeight || 6);

  function resizeAceSoon() {
    const ed = getAceEditor?.();
    if (ed && typeof ed.resize === "function") {
      // Use rAF to avoid layout thrash
      requestAnimationFrame(() => ed.resize(true));
    }
  }

  function applyVerticalByRatio(ratio: number) {
    // Clamp ratio by min widths
    const total = (pageContainer as HTMLDivElement).clientWidth;
    const minLeft = 320; // blockly min width
    const minRight = 300; // outputPane min width
    const minRatio = minLeft / total;
    const maxRatio = 1 - (minRight + RESIZER_W) / total;
    const r = Math.max(minRatio, Math.min(maxRatio, ratio));

    const leftPx = Math.round(r * total);
    const rightPx = Math.max(minRight, total - leftPx - RESIZER_W);

    (blocklyDiv as HTMLDivElement).style.flex = `0 0 ${leftPx}px`;
    (outputPaneEl as HTMLDivElement).style.flex = `0 0 ${rightPx}px`;

    // Resize dependent widgets
    try {
      (Blockly as any).svgResize?.(ws);
    } catch {}
    resizeAceSoon();
  }

  function applyHorizontalByRatio(ratio: number) {
    if (!codePaneEl || !outputPaneEl) return;
    const totalH = (outputPaneEl as HTMLDivElement).clientHeight;
    const minTop = 140; // codePane min height (toolbar+editor)
    const minBottom = 80; // output min height
    const minR = minTop / totalH;
    const maxR = 1 - (minBottom + RESIZER_H) / totalH;
    const r = Math.max(minR, Math.min(maxR, ratio));

    const topPx = Math.round(r * totalH);
    const bottomPx = Math.max(minBottom, totalH - topPx - RESIZER_H);

    codePaneEl.style.flex = `0 0 ${topPx}px`;
    (outputDiv as HTMLDivElement).style.flex = `0 0 ${bottomPx}px`;
    resizeAceSoon();
  }

  function getPointerPosX(e: MouseEvent | TouchEvent) {
    if (e instanceof MouseEvent) return e.clientX;
    const t = e.touches[0] || (e as any).changedTouches?.[0];
    return t ? t.clientX : 0;
  }
  function getPointerPosY(e: MouseEvent | TouchEvent) {
    if (e instanceof MouseEvent) return e.clientY;
    const t = e.touches[0] || (e as any).changedTouches?.[0];
    return t ? t.clientY : 0;
  }

  // Vertical drag
  if (verticalResizer) {
    const startV = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const rect = pageContainer.getBoundingClientRect();
      const onMove = (ev: MouseEvent | TouchEvent) => {
        const x = getPointerPosX(ev) - rect.left;
        const ratio = x / rect.width;
        applyVerticalByRatio(ratio);
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove as any);
        window.removeEventListener(
          "touchmove",
          onMove as any,
          { passive: false } as any
        );
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("touchend", onUp);
        // Save ratio
        const left = (blocklyDiv as HTMLDivElement).getBoundingClientRect()
          .width;
        const total = (pageContainer as HTMLDivElement).clientWidth;
        localStorage.setItem(V_KEY, String(left / total));
      };
      window.addEventListener("mousemove", onMove as any);
      window.addEventListener(
        "touchmove",
        onMove as any,
        { passive: false } as any
      );
      window.addEventListener("mouseup", onUp);
      window.addEventListener("touchend", onUp);
    };
    verticalResizer.addEventListener("mousedown", startV);
    verticalResizer.addEventListener("touchstart", startV, { passive: false });
  }

  // Horizontal drag
  if (horizontalResizer && codePaneEl) {
    const startH = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      const rect = (outputPaneEl as HTMLDivElement).getBoundingClientRect();
      const onMove = (ev: MouseEvent | TouchEvent) => {
        const y = getPointerPosY(ev) - rect.top;
        const ratio = y / rect.height;
        applyHorizontalByRatio(ratio);
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove as any);
        window.removeEventListener(
          "touchmove",
          onMove as any,
          { passive: false } as any
        );
        window.removeEventListener("mouseup", onUp);
        window.removeEventListener("touchend", onUp);
        // Save ratio
        const h = (codePaneEl as HTMLDivElement).getBoundingClientRect().height;
        const totalH = (outputPaneEl as HTMLDivElement).clientHeight;
        localStorage.setItem(H_KEY, String(h / totalH));
      };
      window.addEventListener("mousemove", onMove as any);
      window.addEventListener(
        "touchmove",
        onMove as any,
        { passive: false } as any
      );
      window.addEventListener("mouseup", onUp);
      window.addEventListener("touchend", onUp);
    };
    horizontalResizer.addEventListener("mousedown", startH);
    horizontalResizer.addEventListener("touchstart", startH, {
      passive: false,
    });
  }

  // Apply saved ratios or sensible defaults
  const savedV = parseFloat(localStorage.getItem(V_KEY) || "0");
  if (savedV > 0 && savedV < 1) applyVerticalByRatio(savedV);
  const savedH = parseFloat(localStorage.getItem(H_KEY) || "0");
  if (savedH > 0 && savedH < 1) applyHorizontalByRatio(savedH);

  window.addEventListener("resize", () => {
    // Reapply ratios on window resize to keep layout consistent
    const v = parseFloat(localStorage.getItem(V_KEY) || "0");
    if (v > 0 && v < 1) applyVerticalByRatio(v);
    const h = parseFloat(localStorage.getItem(H_KEY) || "0");
    if (h > 0 && h < 1) applyHorizontalByRatio(h);
  });
})();

if (blockGeneratorTextarea) {
  blockGeneratorTextarea.addEventListener("input", () => validateGeneratorUI());
}

// Функция для открытия модалки — сбрасываем язык генератора на JS по умолчанию
function openImportModal() {
  if (!importModal) return;
  importModal.style.display = "block";
  // Центрируем окно по умолчанию каждый раз при открытии
  if (modalContent) {
    const rect = modalContent.getBoundingClientRect();
    const centerLeft = Math.max(
      0,
      Math.round(window.innerWidth / 2 - rect.width / 2)
    );
    const centerTop = Math.max(
      0,
      Math.round(window.innerHeight / 2 - rect.height / 2)
    );
    // Используем transform для центрирования, как в CSS
    modalContent.style.left = "50%";
    modalContent.style.top = "50%";
    modalContent.style.transform = "translate(-50%, -50%)";
    // Важно: включаем анимацию только при открытии, чтобы она не мешала drag
    modalContent.style.animation = "";
  }
  // Инициализируем перетаскивание один раз
  initImportModalDrag();
  // В модалке по умолчанию активируем выбранный ранее язык
  setActiveGenLangButton(selectedGeneratorLanguage);
}

function closeImportModal() {
  if (!importModal) return;
  importModal.style.display = "none";
  if (blockJsonTextarea) blockJsonTextarea.value = "";
  if (blockGeneratorTextarea) blockGeneratorTextarea.value = "";
}

// Включает перетаскивание модального окна за заголовок
function initImportModalDrag() {
  if (modalDragInitialized) return;
  if (!modalHeader || !modalContent) return;

  // После проверок сохраняем не-null ссылки для замыкания
  const content = modalContent as HTMLDivElement;
  const header = modalHeader as HTMLDivElement;

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  function onMouseDown(ev: MouseEvent) {
    // Начинаем drag только левой кнопкой
    if (ev.button !== 0) return;
    // Если клик по кнопке закрытия — не перетаскиваем
    const target = ev.target as HTMLElement | null;
    if (target && target.closest("#closeModal")) return;
    ev.preventDefault();
    isDragging = true;

    // Получаем текущие координаты окна
    const rect = content.getBoundingClientRect();

    // Фикс: отключаем анимацию/трансформации и фиксируем текущие координаты,
    // чтобы вертикальный drag не блокировался CSS-анимацией translateY
    content.style.left = rect.left + "px";
    content.style.top = rect.top + "px";
    content.style.transform = "none";
    content.style.animation = "none";

    // Вычисляем смещение курсора относительно левого верхнего угла окна
    offsetX = ev.clientX - rect.left;
    offsetY = ev.clientY - rect.top;

    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  function onMouseMove(ev: MouseEvent) {
    if (!isDragging) return;
    const rect = content.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    let nextLeft = ev.clientX - offsetX;
    let nextTop = ev.clientY - offsetY;

    // Ограничиваем в пределах окна
    const maxLeft = window.innerWidth - width;
    const maxTop = window.innerHeight - height;
    // Минимальное значение для top, чтобы заголовок всегда был виден
    const minTop = 10; // Оставляем минимум 10px от верха окна
    if (nextLeft < 0) nextLeft = 0;
    else if (nextLeft > maxLeft) nextLeft = maxLeft;
    if (nextTop < minTop) nextTop = minTop;
    else if (nextTop > maxTop) nextTop = maxTop;

    content.style.left = `${nextLeft}px`;
    content.style.top = `${nextTop}px`;
  }

  function onMouseUp() {
    isDragging = false;
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }

  header.addEventListener("mousedown", onMouseDown);
  modalDragInitialized = true;
}

function refreshWorkspaceWithCustomToolbox() {
  const lang = getAppLang();
  const currentState = ws
    ? Blockly.serialization.workspaces.save(ws as Blockly.Workspace)
    : null;
  if (ws) ws.dispose();
  const newWs = Blockly.inject(blocklyDiv!, {
    toolbox: localizedToolbox(lang),
    grid: {
      spacing: 20,
      length: 3,
      colour: appTheme === "dark" ? "#374151" : "#ccc",
      snap: true,
    },
    zoom: {
      controls: true,
      wheel: true,
      startScale: 1.0,
      maxScale: 3,
      minScale: 0.3,
      scaleSpeed: 1.2,
      pinch: true,
    },
    move: {
      scrollbars: { horizontal: true, vertical: true },
      drag: true,
      wheel: true,
    },
    trashcan: true,
    maxTrashcanContents: 32,
    comments: true,
    collapse: true,
    disable: true,
    sounds: true,
    maxBlocks: Infinity,
    maxInstances: { controls_if: 10, controls_repeat_ext: 5 },
    scrollbars: true,
    renderer: "thrasos",
    theme: getBlocklyTheme(),
    media: "media/",
    horizontalLayout: false,
    toolboxPosition: "start",
    css: true,
    rtl: false,
    oneBasedIndex: true,
    modalInputs: true,
    readOnly: false,
  });
  if (currentState)
    Blockly.serialization.workspaces.load(
      currentState,
      newWs as Blockly.Workspace,
      undefined
    );
  ws = newWs as Blockly.WorkspaceSvg;

  // Инициализация авторизации и переключения провайдера хранения
  setupAuthBootstrap(ws as Blockly.Workspace);
  initAuthUI();
  // Инициализация загрузки/сохранения через bootstrap-модуль (не блокирует UI)
  setupAppBootstrap(ws, { shouldLoad: !__isInitialReload });

  // Подключаем обновление индикатора активного хранилища и времени последнего сохранения
  const storageIndicatorEl = document.getElementById('storageIndicator');
  if (storageIndicatorEl) {
    setStorageIndicatorUpdater(({ kind, lastSavedAt }) => {
      const label = kind === 'server' ? 'Сервер' : 'Локально';
      let suffix = '';
      if (lastSavedAt) {
        const d = new Date(lastSavedAt);
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        const ss = String(d.getSeconds()).padStart(2, '0');
        suffix = ` • ${hh}:${mm}:${ss}`;
      }
      (storageIndicatorEl as HTMLElement).textContent = `${label}${suffix}`;
      const titleBase = 'Активное хранилище и время последнего сохранения';
      (storageIndicatorEl as HTMLElement).setAttribute('title', lastSavedAt ? `${titleBase}: ${new Date(lastSavedAt).toLocaleString()}` : titleBase);
    });
  }

  if (ws) {
    ws.addChangeListener((e: Blockly.Events.Abstract) => {
      if (e.isUiEvent) return;
      // сохраняем через провайдер с дебаунсом
      persistWorkspaceDebounced(ws);
    });
    ws.addChangeListener((e: Blockly.Events.Abstract) => {
      if (
        e.isUiEvent ||
        e.type == Blockly.Events.FINISHED_LOADING ||
        ws.isDragging()
      ) {
        return;
      }
      // Keep ACE editor content in sync (без авто-выполнения)
      updateAceEditorFromWorkspace(ws, selectedGeneratorLanguage);

      // Если блок был удален, очищаем окно вывода
      // Тип события удаления может называться 'BLOCK_DELETE' в текущих версиях Blockly
      if (
        (e as any).type === (Blockly as any).Events?.BLOCK_DELETE ||
        (e as any).type === "block_delete"
      ) {
        const out = document.getElementById("output") as HTMLElement | null;
        clearOutput(out);
      }

      // Обновляем счётчик блоков
      updateToolboxBlockCounterLabel();
    });
  }
  // Инициализируем проверку задач во внешнем модуле
  initTaskValidation(ws, {
    checkButton: checkTaskBtn,
    feedbackEl: taskFeedbackEl,
    starsEl: taskStarsEl,
    nextButton: nextTaskBtn,
    prevButton: prevTaskBtn,
  });
  // Активируем первую не решённую задачу
  setActiveTask(getFirstUnsolvedTask());
  // Initial sync after workspace init (без авто-выполнения)
  updateAceEditorFromWorkspace(ws, selectedGeneratorLanguage);
  // Начальная отрисовка счётчика
  // На всякий случай немного отложим, чтобы DOM тулбокса гарантированно создался
  requestAnimationFrame(() => updateToolboxBlockCounterLabel());
}
const saveXmlBtn = document.getElementById(
  "saveXmlBtn"
) as HTMLButtonElement | null;
const loadXmlBtn = document.getElementById(
  "loadXmlBtn"
) as HTMLButtonElement | null;
const loadXmlInput = document.getElementById(
  "loadXmlInput"
) as HTMLInputElement | null;
if (saveXmlBtn) {
  saveXmlBtn.addEventListener("click", async () => {
    if (!ws) return;
    try {
      const xmlDom = Blockly.Xml.workspaceToDom(ws);
      const xmlText = Blockly.Xml.domToPrettyText(xmlDom);
      const suggested = `workspace_${new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, 19)}.xml`;
      const w: any = window as any;
      if (typeof w.showSaveFilePicker === "function") {
        const handle = await w.showSaveFilePicker({
          suggestedName: suggested,
          types: [
            {
              description: "Blockly XML",
              accept: { "application/xml": [".xml"] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(
          new Blob([xmlText], { type: "application/xml;charset=utf-8" })
        );
        await writable.close();
      } else {
        const name =
          (typeof w?.prompt === "function"
            ? w.prompt(
                getAppLang() === "ru" ? "Имя файла:" : "File name:",
                suggested
              )
            : null) || suggested;
        const blob = new Blob([xmlText], {
          type: "application/xml;charset=utf-8",
        });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch (e) {
      console.error("Save XML failed", e);
    }
  });
}
if (loadXmlBtn) {
  loadXmlBtn.addEventListener("click", () => {
    if (!loadXmlInput) return;
    loadXmlInput.value = "";
    loadXmlInput.click();
  });
}
if (loadXmlInput) {
  loadXmlInput.addEventListener("change", async () => {
    if (!ws || !loadXmlInput.files || loadXmlInput.files.length === 0) return;
    const file = loadXmlInput.files[0];
    try {
      const text = await file.text();
      // Parse XML text via DOMParser instead of Blockly.Xml.textToDom for compatibility
      const doc = new DOMParser().parseFromString(text, "text/xml");
      const xml = doc.documentElement as Element;
      Blockly.Events.disable();
      ws.clear();
      Blockly.Xml.domToWorkspace(xml, ws);
      Blockly.Events.enable();
      // Sync ACE editor after load
      updateAceEditorFromWorkspace(ws, selectedGeneratorLanguage);
      // Обновить счётчик блоков
      updateToolboxBlockCounterLabel();
      // Persist via selected provider (bootstrap)
      persistWorkspaceDebounced(ws);
    } catch (e) {
      console.error("Load XML failed", e);
    }
  });
}

// Логика проверки задач перенесена в ./tasks и инициализируется через initTaskValidation(ws, ...)

// Обработчик кнопки проверки навешивается в tasks.ts через initTaskValidation

// ===== Предупреждение о потере данных при перезагрузке страницы =====
/**
 * Проверяет, есть ли несохранённые данные в рабочей области или редакторе
 */
function hasUnsavedChanges(): boolean {
  // Проверяем блоки в workspace
  const hasBlocks =
    ws?.getAllBlocks(false).filter((b: any) => !b.isShadow()).length > 0;

  // Проверяем код в ACE редакторе
  const aceEditor = getAceEditor();
  const hasCode = aceEditor?.getValue()?.trim().length > 0;

  return hasBlocks || hasCode;
}

/**
 * Обработчик события beforeunload для предупреждения о потере данных
 */
function handleBeforeUnload(event: BeforeUnloadEvent): string | undefined {
  if (hasUnsavedChanges()) {
    const lang = getAppLang();
    const message =
      lang === "ru"
        ? "У вас есть несохранённые изменения. Вы уверены, что хотите покинуть страницу?"
        : "You have unsaved changes. Are you sure you want to leave this page?";

    // Стандартный способ для современных браузеров
    event.preventDefault();
    event.returnValue = message;
    return message;
  }
  return undefined;
}

// Подключаем обработчик предупреждения о потере данных
window.addEventListener("beforeunload", handleBeforeUnload);

// ===== Инициализация модального окна справки по созданию блоков =====
/**
 * Инициализирует модальное окно справки по созданию блоков
 * Добавляет обработчики событий для открытия и закрытия окна
 * Вставляет содержимое руководства напрямую вместо загрузки MD файла
 * Добавляет возможность перетаскивания модального окна
 */
function initHelpModal() {
  if (blockHelpBtn && helpModal && closeHelpModal && markdownContent) {
    // Открытие модального окна при клике на кнопку справки
    blockHelpBtn.addEventListener("click", () => {
      if (helpModal) {
        helpModal.style.display = "block";

        // Вставляем содержимое руководства напрямую вместо загрузки MD файла
        markdownContent.innerHTML = `
<h1>Руководство по созданию пользовательских блоков</h1>

<h2>Структура JSON-описания блока</h2>

<p>Каждый блок определяется JSON-объектом со следующими основными полями:</p>

<h3>Обязательные поля</h3>

<ul>
<li><strong>type</strong>: Уникальный идентификатор блока (строка)</li>
<li><strong>message0</strong>: Текст, отображаемый на блоке (может содержать заполнители %1, %2 и т.д.)</li>
<li><strong>args0</strong>: Массив аргументов, соответствующих заполнителям в message0</li>
</ul>

<h3>Дополнительные поля</h3>

<ul>
<li><strong>colour</strong>: Цвет блока (число от 0 до 360 или строка с HEX-кодом)</li>
<li><strong>tooltip</strong>: Всплывающая подсказка при наведении на блок</li>
<li><strong>helpUrl</strong>: URL страницы с дополнительной информацией</li>
<li><strong>inputsInline</strong>: Расположение входов (true - в линию, false - вертикально)</li>
<li><strong>previousStatement</strong>: Позволяет подключать блок сверху (true или тип соединения)</li>
<li><strong>nextStatement</strong>: Позволяет подключать блок снизу (true или тип соединения)</li>
<li><strong>output</strong>: Тип выходного значения блока (строка или null)</li>
</ul>

<h2>Примеры блоков</h2>

<h3>Блок с текстовым полем ввода</h3>

<pre><code>{
  "type": "example_input_text",
  "message0": "текстовое поле: %1",
  "args0": [
    {
      "type": "field_input",
      "name": "TEXT",
      "text": "значение по умолчанию"
    }
  ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 160,
  "tooltip": "Пример блока с текстовым полем"
}
</code></pre>

<h3>Блок с числовым полем ввода</h3>

<pre><code>{
  "type": "example_input_number",
  "message0": "число: %1",
  "args0": [
    {
      "type": "field_number",
      "name": "NUM",
      "value": 42,
      "min": 0,
      "max": 100
    }
  ],
  "output": "Number",
  "colour": 230,
  "tooltip": "Возвращает число"
}
</code></pre>

<h3>Блок с выпадающим списком</h3>

<pre><code>{
  "type": "example_dropdown",
  "message0": "выбрать %1",
  "args0": [
    {
      "type": "field_dropdown",
      "name": "CHOICE",
      "options": [
        ["первый", "FIRST"],
        ["второй", "SECOND"],
        ["третий", "THIRD"]
      ]
    }
  ],
  "output": null,
  "colour": 290,
  "tooltip": "Выберите опцию"
}
</code></pre>

<h3>Блок с подключаемым значением</h3>

<pre><code>{
  "type": "example_input_value",
  "message0": "значение: %1",
  "args0": [
    {
      "type": "input_value",
      "name": "VALUE",
      "check": "Number"
    }
  ],
  "output": "Number",
  "colour": 120,
  "tooltip": "Принимает числовое значение"
}
</code></pre>

<h2>Функция init</h2>

<p>Вместо JSON-описания можно использовать функцию <code>init</code>, которая программно настраивает блок:</p>

<pre><code>Blockly.Blocks['example_block'] = {
  init: function() {
    this.setColour(120);
    this.appendDummyInput()
        .appendField("Мой блок");
    this.appendValueInput("VALUE")
        .setCheck("Number")
        .appendField("со значением");
    this.setOutput(true, "Number");
    this.setTooltip("Описание блока");
  }
};
</code></pre>

<h2>Генераторы кода</h2>

<p>Генераторы определяют, какой код будет создан для каждого блока.</p>

<h3>JavaScript генератор</h3>

<pre><code>javascript.forBlock['example_block'] = function(block) {
  const value = javascript.valueToCode(block, 'VALUE', javascript.ORDER_ATOMIC);
  const code = \`Math.sqrt(\${value})\`;
  return [code, javascript.ORDER_FUNCTION_CALL];
};
</code></pre>

<h3>Python генератор</h3>

<pre><code>python.forBlock['example_block'] = function(block) {
  const value = python.valueToCode(block, 'VALUE', python.ORDER_ATOMIC);
  const code = \`math.sqrt(\${value})\`;
  return [code, python.ORDER_FUNCTION_CALL];
};
</code></pre>

<h3>Lua генератор</h3>

<pre><code>lua.forBlock['example_block'] = function(block) {
  const value = lua.valueToCode(block, 'VALUE', lua.ORDER_ATOMIC);
  const code = \`math.sqrt(\${value})\`;
  return [code, lua.ORDER_FUNCTION_CALL];
};
</code></pre>

<h2>Порядок операций</h2>

<p>При генерации кода важно учитывать приоритет операций. Для этого используются константы ORDER_*:</p>

<ul>
<li>ORDER_ATOMIC: Атомарные значения (числа, строки)</li>
<li>ORDER_FUNCTION_CALL: Вызов функции</li>
<li>ORDER_MULTIPLICATIVE: Умножение, деление</li>
<li>ORDER_ADDITIVE: Сложение, вычитание</li>
<li>ORDER_RELATIONAL: Сравнения (&lt;, &gt;, &lt;=, &gt;=)</li>
<li>ORDER_EQUALITY: Равенство (==, !=)</li>
<li>ORDER_LOGICAL_AND: Логическое И (&amp;&amp;)</li>
<li>ORDER_LOGICAL_OR: Логическое ИЛИ (||)</li>
<li>ORDER_NONE: Без приоритета (требуются скобки)</li>
</ul>

<h2>Советы по созданию блоков</h2>

<ol>
<li>Используйте понятные названия и описания</li>
<li>Выбирайте цвета в соответствии с категорией блока</li>
<li>Добавляйте подробные подсказки (tooltip)</li>
<li>Проверяйте типы входных значений</li>
<li>Тестируйте блоки с разными входными данными</li>
<li>Обрабатывайте краевые случаи в генераторах кода</li>
</ol>
`;
      }
    });

    // Закрытие модального окна при клике на крестик
    closeHelpModal.addEventListener("click", () => {
      if (helpModal) {
        helpModal.style.display = "none";
      }
    });

    // Закрытие модального окна при клике вне его содержимого
    window.addEventListener("click", (event) => {
      if (event.target === helpModal) {
        helpModal.style.display = "none";
      }
    });

    // Добавляем возможность перетаскивания модального окна
    const helpModalContent = document.getElementById("helpModalContent");
    const helpModalHeader = helpModalContent?.querySelector(".modal-header");

    if (helpModalContent && helpModalHeader) {
      let isDragging = false;
      let offsetX = 0;
      let offsetY = 0;

      // Начало перетаскивания
      helpModalHeader.addEventListener("mousedown", (e: Event) => {
        const mouseEvent = e as MouseEvent;
        isDragging = true;

        // Сбрасываем transform для получения правильных координат
        const computedStyle = window.getComputedStyle(helpModalContent);
        const matrix = new DOMMatrix(computedStyle.transform);

        // Устанавливаем начальную позицию в абсолютных координатах
        helpModalContent.style.top =
          helpModalContent.offsetTop + matrix.m42 + "px";
        helpModalContent.style.left =
          helpModalContent.offsetLeft + matrix.m41 + "px";
        helpModalContent.style.transform = "none";

        // Запоминаем смещение курсора относительно окна
        offsetX = mouseEvent.clientX - helpModalContent.offsetLeft;
        offsetY = mouseEvent.clientY - helpModalContent.offsetTop;

        // Предотвращаем выделение текста при перетаскивании
        e.preventDefault();
      });

      // Перетаскивание
      document.addEventListener("mousemove", (e: Event) => {
        const mouseEvent = e as MouseEvent;
        if (isDragging) {
          helpModalContent.style.left = mouseEvent.clientX - offsetX + "px";
          helpModalContent.style.top = mouseEvent.clientY - offsetY + "px";
        }
      });

      // Окончание перетаскивания
      document.addEventListener("mouseup", () => {
        isDragging = false;
      });
    }
  }
}

// Вызываем инициализацию модального окна справки
initHelpModal();
