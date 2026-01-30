/* Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from "blockly/core";
// Добавляем импорт стандартных блоков Blockly, чтобы категории тулбокса были заполнены
import "blockly/blocks";
import { blocks } from "./blocks/text";
import { blocks as algorithmBlocks } from "./blocks/algorithms";
import { forBlock } from "./generators/javascript";
import { forBlock as forBlockPython } from "./generators/python";
import { forBlock as forBlockLua } from "./generators/lua";
import { forBlock as forBlockPhp } from "./generators/php";
import { javascriptGenerator } from "blockly/javascript";
import { pythonGenerator } from "blockly/python";
import { luaGenerator } from "blockly/lua";
import { phpGenerator } from "blockly/php";
import {
  setupAppBootstrap,
  persistWorkspaceDebounced,
  setStorageIndicatorUpdater,
} from "./appBootstrap";
import { setupAuthBootstrap } from "./authBootstrap";
import { initAuthUI } from "./authUI";
import "./index.css";
import {
  initTaskValidation,
  setActiveTask,
  getActiveTask,
  getFirstUnsolvedTask,
  setActiveDifficulty,
  getActiveDifficulty,
} from "./tasks";
import { countNonShadowBlocks } from "./workspaceUtils";
import { saveTextFile } from "./fileSave";
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
  localizeHelpUI,
  localizeSupportUI,
} from "./localization";
import {
  setupAceEditor,
  updateAceEditorFromWorkspace,
  getAceEditor,
} from "./aceEditor";
import { clearOutput } from "./codeExecution";
import Konva from "konva";
// Тёмная тема Blockly
import DarkTheme from "@blockly/theme-dark";
// Поиск по тулбоксу (локализованный плагин)
import "./toolbox_search_localized";
import * as BlockDynamicConnection from "@blockly/block-dynamic-connection";
import { KeyboardNavigation } from "@blockly/keyboard-navigation";
import { Multiselect } from "@mit-app-inventor/blockly-plugin-workspace-multiselect";

// Добавлено: регистрация плагина угла
import { registerFieldAngle } from "@blockly/field-angle";

// Регистрируем поле угла до того, как начнём создавать блоки
registerFieldAngle();

try {
  KeyboardNavigation.registerKeyboardNavigationStyles();
  KeyboardNavigation.registerNavigationDeferringToolbox();
} catch {}

// Регистрируем блоки/генераторы после применения локали, чтобы подтянуть правильные строки

// Настройки локализации приложения
const defaultLang = getAppLang();

// Инициализируем язык до создания рабочей области
setAppLang(defaultLang);
// Локализуем статические подписи окна настроек Ace при старте
localizeAceSettingsPanel(defaultLang);

// Объявляем флаг регистрации контекстного меню до первого вызова
let customBlockContextRegistered = false;
const ENABLE_KBD_NAV = true;

// Общее ограниченное перетаскивание модальных окон за заголовок (используется несколькими модалками)
const modalDragHandles = new WeakSet<HTMLElement>();

function makeModalDraggable(
  content: HTMLElement,
  header: HTMLElement,
  ignoreCloseSelector: string,
  minTop = 10,
) {
  if (modalDragHandles.has(header)) return;
  modalDragHandles.add(header);

  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;
  let cachedWidth = 0;
  let cachedHeight = 0;
  let dragScheduled = false;
  let pendingLeft = 0;
  let pendingTop = 0;

  function onMouseDown(ev: MouseEvent) {
    if (ev.button !== 0) return;
    const target = ev.target as HTMLElement | null;
    if (target && ignoreCloseSelector && target.closest(ignoreCloseSelector))
      return;
    ev.preventDefault();
    isDragging = true;

    const rect = content.getBoundingClientRect();
    content.style.left = rect.left + "px";
    content.style.top = rect.top + "px";
    content.style.transform = "none";
    content.style.animation = "none";

    cachedWidth = rect.width;
    cachedHeight = rect.height;

    offsetX = ev.clientX - rect.left;
    offsetY = ev.clientY - rect.top;

    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  function onMouseMove(ev: MouseEvent) {
    if (!isDragging) return;
    pendingLeft = ev.clientX - offsetX;
    pendingTop = ev.clientY - offsetY;
    if (dragScheduled) return;
    dragScheduled = true;
    requestAnimationFrame(() => {
      dragScheduled = false;
      let nextLeft = pendingLeft;
      let nextTop = pendingTop;
      const maxLeft = window.innerWidth - cachedWidth;
      const maxTop = window.innerHeight - cachedHeight;
      if (nextLeft < 0) nextLeft = 0;
      else if (nextLeft > maxLeft) nextLeft = maxLeft;
      if (nextTop < minTop) nextTop = minTop;
      else if (nextTop > maxTop) nextTop = maxTop;
      content.style.left = `${nextLeft}px`;
      content.style.top = `${nextTop}px`;
    });
  }

  function onMouseUp() {
    isDragging = false;
    document.body.style.userSelect = "";
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }

  header.addEventListener("mousedown", onMouseDown);
}

// Теперь, когда локаль установлена, регистрируем блоки и генераторы
Blockly.common.defineBlocks(blocks);
Blockly.common.defineBlocks(algorithmBlocks);
Object.assign(javascriptGenerator.forBlock, forBlock);
Object.assign(pythonGenerator.forBlock, forBlockPython);
Object.assign(luaGenerator.forBlock, forBlockLua);
Object.assign(phpGenerator.forBlock, forBlockPhp);
// Регистрием пользовательские блоки и контекстное меню удаления
registerCustomBlocks();
setupCustomBlockContextMenu();

// Инициализация UI и внедрение Blockly
const outputDiv = document.getElementById("output");
const blocklyDiv = document.getElementById("blocklyDiv");
const importBtn = document.getElementById(
  "importBlockBtn",
) as HTMLButtonElement | null;
const importModal = document.getElementById(
  "importModal",
) as HTMLDivElement | null;
const closeModalBtn = document.getElementById(
  "closeModal",
) as HTMLSpanElement | null;
const cancelImportBtn = document.getElementById(
  "cancelImport",
) as HTMLButtonElement | null;
const confirmImportBtn = document.getElementById(
  "confirmImport",
) as HTMLButtonElement | null;
const blockJsonTextarea = document.getElementById(
  "blockJson",
) as HTMLTextAreaElement | null;
const blockGeneratorTextarea = document.getElementById(
  "blockGenerator",
) as HTMLTextAreaElement | null;

// Элементы UI задач: кнопка в шапке и левая панель
const taskSolutionBtn = document.getElementById(
  "taskSolutionBtn",
) as HTMLButtonElement | null;
const taskSidebar = document.getElementById(
  "taskSidebar",
) as HTMLDivElement | null;

const presetLetBtn = document.getElementById(
  "presetLet",
) as HTMLButtonElement | null;
const presetConstBtn = document.getElementById(
  "presetConst",
) as HTMLButtonElement | null;
const presetReturnBtn = document.getElementById(
  "presetReturn",
) as HTMLButtonElement | null;
// Добавляем ссылки на элементы модального окна для перетаскивания
const modalContent = importModal?.querySelector(
  ".modal-content",
) as HTMLDivElement | null;
const modalHeader = importModal?.querySelector(
  ".modal-header",
) as HTMLDivElement | null;
// Новые элементы модалки
const genLangTabs = document.getElementById(
  "generatorLangTabs",
) as HTMLDivElement | null;
const genLangJsBtn = document.getElementById(
  "genLangJs",
) as HTMLButtonElement | null;
const genLangPyBtn = document.getElementById(
  "genLangPy",
) as HTMLButtonElement | null;
const genLangLuaBtn = document.getElementById(
  "genLangLua",
) as HTMLButtonElement | null;
const genLangPhpBtn = document.getElementById(
  "genLangPhp",
) as HTMLButtonElement | null;
// Кнопки выбора языка генератора в шапке
const genLangHeaderContainer = document.getElementById(
  "genLangHeaderSelect",
) as HTMLDivElement | null;
const genLangHeaderSelectedOption = document.getElementById(
  "selectedOption",
) as HTMLDivElement | null;
const genLangHeaderDropdownOptions = document.getElementById(
  "dropdownOptions",
) as HTMLDivElement | null;
const presetNotice = document.getElementById(
  "presetNotice",
) as HTMLDivElement | null;
const generatorErrorEl = document.getElementById(
  "generatorError",
) as HTMLDivElement | null;
const generatorOkEl = document.getElementById(
  "generatorOk",
) as HTMLDivElement | null;

// Элементы боковой панели задач
const checkTaskBtn = document.getElementById(
  "checkTaskBtn",
) as HTMLButtonElement | null;
const taskFeedbackEl = document.getElementById(
  "taskFeedback",
) as HTMLDivElement | null;
const taskStarsEl = document.getElementById(
  "taskStars",
) as HTMLDivElement | null;
const nextTaskBtn = document.getElementById(
  "nextTaskBtn",
) as HTMLButtonElement | null;
const prevTaskBtn = document.getElementById(
  "prevTaskBtn",
) as HTMLButtonElement | null;
const taskDifficultyBasicBtn = document.getElementById(
  "taskDifficultyBasic",
) as HTMLButtonElement | null;
const taskDifficultyAdvancedBtn = document.getElementById(
  "taskDifficultyAdvanced",
) as HTMLButtonElement | null;

// Элементы переключения темы
const themeSwitchInput = document.getElementById(
  "themeSwitchInput",
) as HTMLInputElement | null;
const themeLabelLight = document.getElementById(
  "theme-light",
) as HTMLSpanElement | null;
const themeLabelDark = document.getElementById(
  "theme-dark",
) as HTMLSpanElement | null;

let selectedGeneratorLanguage: "javascript" | "python" | "lua" | "php" =
  "javascript";

// Состояние темы
type AppTheme = "light" | "dark";
const APP_THEME_KEY = "app_theme";
let appTheme: AppTheme = "light";

// Объявление рабочей области Blockly
let ws!: Blockly.WorkspaceSvg;
let __langSwitchTimer: number | null = null;
let __themeSwitchTimer: number | null = null;

// Дебаунсим синхронизацию ACE редактора с workspace в rAF (объявление выше всех вызовов)
let __aceSyncScheduled = false;
function scheduleAceSync() {
  if (__aceSyncScheduled) return;
  __aceSyncScheduled = true;
  requestAnimationFrame(() => {
    __aceSyncScheduled = false;
    try {
      updateAceEditorFromWorkspace(ws, selectedGeneratorLanguage);
    } catch {}
  });
}

// Элементы модального окна справки
const blockHelpBtn = document.getElementById(
  "blockHelpBtn",
) as HTMLButtonElement | null;
const helpModal = document.getElementById("helpModal") as HTMLDivElement | null;
const closeHelpModal = document.getElementById(
  "closeHelpModal",
) as HTMLSpanElement | null;
const markdownContent = document.getElementById(
  "markdownContent",
) as HTMLDivElement | null;

const supportBtn = document.getElementById(
  "supportBtn",
) as HTMLButtonElement | null;
const supportModal = document.getElementById(
  "supportModal",
) as HTMLDivElement | null;
const closeSupportModal = document.getElementById(
  "closeSupportModal",
) as HTMLSpanElement | null;
const closeSupportBtn = document.getElementById(
  "closeSupportBtn",
) as HTMLButtonElement | null;
const copyCardBtn = document.getElementById(
  "copyCardBtn",
) as HTMLButtonElement | null;
const supportCardNumberEl = document.getElementById(
  "supportCardNumber",
) as HTMLDivElement | null;
const copyCardStatusEl = document.getElementById(
  "copyCardStatus",
) as HTMLDivElement | null;

function ensureToolboxBlockCounter(): HTMLDivElement | null {
  const toolboxDiv = document.querySelector(
    ".blocklyToolboxDiv, .blocklyToolbox",
  ) as HTMLDivElement | null;
  if (!toolboxDiv) {
    console.debug("[block-counter] toolbox not found");
    return null;
  }

  // Контейнер со списком категорий (разные версии Blockly)
  const categoriesContainer = (toolboxDiv.querySelector(
    ".blocklyToolboxContents",
  ) ||
    toolboxDiv.querySelector(".blocklyTreeRoot") ||
    toolboxDiv) as HTMLElement;

  // Создаём/находим элемент бейджа
  let el = document.getElementById(
    "toolbox-block-counter",
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
  const count = countNonShadowBlocks(ws);
  el.textContent =
    lang === "ru"
      ? `Блоков на рабочем поле: ${count}`
      : `Blocks in workspace: ${count}`;
  console.debug("[block-counter] updated", { count, lang });
}
// ===== конец блока счётчика блоков =====

// Вспомогательное: получить текущую тему Blockly
function getBlocklyTheme() {
  return appTheme === "dark"
    ? (DarkTheme as unknown as Blockly.Theme)
    : Blockly.Themes.Classic;
}

function setAppTheme(next: AppTheme) {
  appTheme = next;
  if (themeLabelLight && themeLabelDark) {
    themeLabelLight.classList.toggle("active", appTheme === "light");
    themeLabelDark.classList.toggle("active", appTheme === "dark");
  }
  document.documentElement.setAttribute("data-theme", appTheme);
  try {
    const canSetTheme = ws && typeof (ws as any).setTheme === "function";
    if (canSetTheme) {
      (ws as any).setTheme(getBlocklyTheme());
    } else {
      refreshWorkspaceWithCustomToolbox();
    }
  } catch {}
  scheduleAceSync();
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
    if (__themeSwitchTimer) clearTimeout(__themeSwitchTimer);
    __themeSwitchTimer = window.setTimeout(() => {
      setAppTheme(checked ? "dark" : "light");
    }, 120);
  });
}

// Открытие/закрытие панели задач слева
function toggleTaskSidebar(force?: boolean) {
  if (!taskSidebar || !pageContainer || !blocklyDiv || !outputPaneEl) return;

  const isOpen = taskSidebar.classList.contains("open");
  const next = force !== undefined ? force : !isOpen;

  taskSidebar.classList.toggle("open", next);
  if (next) {
    taskSidebar.classList.add("mode-select");
  }
  const pc = document.getElementById("pageContainer") as HTMLDivElement | null;
  if (pc) pc.classList.toggle("sidebar-open", next);
  if (taskSolutionBtn) {
    taskSolutionBtn.setAttribute("aria-pressed", next ? "true" : "false");
  }

  // После изменения layout нужно пересчитать размеры Blockly и Ace
  scheduleUIResize();
}

if (taskSolutionBtn) {
  taskSolutionBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleTaskSidebar();
  });
}

function setActiveGenLangButton(lang: "javascript" | "python" | "lua" | "php") {
  [genLangJsBtn, genLangPyBtn, genLangLuaBtn, genLangPhpBtn].forEach(
    (btn) => btn && btn.classList.remove("active"),
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
  if (lang === "php") {
    if (genLangPhpBtn) genLangPhpBtn.classList.add("active");
  }
  // Синхронизация подписи и выбранного пункта в dropdown в шапке
  if (genLangHeaderSelectedOption) {
    const label =
      lang === "javascript"
        ? "JavaScript"
        : lang === "python"
          ? "Python"
          : lang === "lua"
            ? "Lua"
            : "PHP";
    genLangHeaderSelectedOption.textContent = label;
  }
  if (genLangHeaderDropdownOptions) {
    Array.from(
      genLangHeaderDropdownOptions.querySelectorAll(".option"),
    ).forEach((opt) => {
      opt.classList.toggle(
        "selected",
        (opt as HTMLElement).dataset.value === lang,
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
    // Язык Lua
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
    php: {
      ru: "Пример:\n// PHP генератор функции пишется на JS (как и для других языков).\nconst value = phpGenerator.valueToCode(block, 'VALUE', Order.NONE) || '0';\nreturn `echo ${value};\\n`;",
      en: "Example:\n// PHP generator function is written in JS (like other languages).\nconst value = phpGenerator.valueToCode(block, 'VALUE', Order.NONE) || '0';\nreturn `echo ${value};\\n`;",
    },
  };
  const placeholder =
    (placeholders as any)?.[selectedGeneratorLanguage]?.[lang] ||
    placeholders.javascript[lang];
  blockGeneratorTextarea.placeholder = placeholder;
}

function normalizeGenLang(
  raw: unknown,
): "javascript" | "python" | "lua" | "php" | null {
  const v = String(raw || "")
    .trim()
    .toLowerCase();
  if (v === "javascript" || v === "python" || v === "lua" || v === "php")
    return v;
  return null;
}

function setGenLang(rawLang: unknown) {
  const lang = normalizeGenLang(rawLang);
  if (!lang) return;
  selectedGeneratorLanguage = lang;
  setActiveGenLangButton(lang);
  updatePresetsByGenLang();
  validateGeneratorUI();
  const currentLang = getAppLang();
  setGeneratorPlaceholder(currentLang);
  // Синхронизация Ace с workspace (без авто-выполнения)
  scheduleAceSync();
}

if (genLangJsBtn)
  genLangJsBtn.addEventListener("click", () => setGenLang("javascript"));
if (genLangPyBtn)
  genLangPyBtn.addEventListener("click", () => setGenLang("python"));
if (genLangLuaBtn)
  genLangLuaBtn.addEventListener("click", () => setGenLang("lua"));
if (genLangPhpBtn)
  genLangPhpBtn.addEventListener("click", () => setGenLang("php"));
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
      const el = ev.currentTarget as HTMLElement | null;
      const value = el?.dataset?.value || el?.innerText || "";
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
          "Исправьте ошибки в генераторе JavaScript перед импортом",
      );
      return;
    }
    const { success, error, blockType } = importBlockFromJson(
      json,
      gen,
      selectedGeneratorLanguage as any,
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
    preconditionFn: (scope: { block?: Blockly.Block } | undefined) => {
      const block = scope?.block;
      if (!block) return "hidden";
      try {
        const custom = getCustomBlocks();
        return custom.some((b) => b.definition?.type === block.type)
          ? "enabled"
          : "hidden";
      } catch {
        return "hidden";
      }
    },
    callback: (scope: { block?: Blockly.Block } | undefined) => {
      const block = scope?.block;
      if (!block) return;
      const type = block.type;
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
          lang === "ru"
            ? "Не удалось удалить блок."
            : "Failed to remove block.",
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
    customBlockContextRegistered = true;
  }

  try {
    const registry = (Blockly as any).ContextMenuRegistry?.registry as any;
    if (!registry) return;
    const scopeType = (Blockly as any).ContextMenuRegistry.ScopeType.BLOCK;

    const makeItem = (
      id: string,
      displayText: () => string,
      preconditionFn: (scope: {
        block?: Blockly.Block;
      }) => "enabled" | "disabled" | "hidden",
      callback: (scope: { block?: Blockly.Block }) => void,
      weight = 195,
    ) => ({ id, displayText, preconditionFn, callback, scopeType, weight });

    const t = () => getAppLang() === "ru";
    const text = {
      paste: () => (t() ? "Вставить" : "Paste"),
      expand: () => (t() ? "Развернуть блок" : "Expand block"),
      enable: () => (t() ? "Включить блок" : "Enable block"),
      removeComment: () => (t() ? "Удалить комментарий" : "Remove comment"),
      inline: () => (t() ? "Встроить входы" : "Inline inputs"),
      external: () => (t() ? "Внешние входы" : "External inputs"),
    };

    const hasItem = (id: string) => registry.getItem && registry.getItem(id);

    if (!hasItem("custom_paste_near_block"))
      registry.register(
        makeItem(
          "custom_paste_near_block",
          text.paste,
          (scope) => {
            const data = (Blockly as any).clipboard?.getLastCopiedData?.();
            return data ? "enabled" : "disabled";
          },
          (scope) => {
            const block: any = scope.block;
            if (!block) return;
            try {
              const data = (Blockly as any).clipboard.getLastCopiedData();
              const ws =
                (Blockly as any).clipboard.getLastCopiedWorkspace?.() ||
                block.workspace;
              let p = block.getRelativeToSurfaceXY?.();
              p =
                p && typeof p.clone === "function"
                  ? p.clone()
                  : new (Blockly as any).utils.Coordinate(0, 0);
              p.translate?.(24, 24);
              (Blockly as any).clipboard.paste(data, ws, p);
            } catch {
              try {
                (Blockly as any).clipboard.paste();
              } catch {}
            }
          },
        ),
      );

    if (!hasItem("custom_expand_block"))
      registry.register(
        makeItem(
          "custom_expand_block",
          text.expand,
          (scope) => {
            const b: any = scope.block;
            if (!b) return "hidden";
            return !!b.workspace?.options?.collapse &&
              !!b.isMovable?.() &&
              !!b.isCollapsed?.()
              ? "enabled"
              : "hidden";
          },
          (scope) => {
            const b: any = scope.block;
            b?.setCollapsed?.(false);
          },
        ),
      );

    if (!hasItem("custom_enable_block"))
      registry.register(
        makeItem(
          "custom_enable_block",
          text.enable,
          (scope) => {
            const b: any = scope.block;
            if (!b) return "hidden";
            const isEnabled =
              typeof b.isEnabled === "function" ? b.isEnabled() : true;
            return !isEnabled && !!b.isEditable?.() ? "enabled" : "hidden";
          },
          (scope) => {
            const b: any = scope.block;
            try {
              const reason =
                (Blockly as any).constants?.MANUALLY_DISABLED ||
                "MANUALLY_DISABLED";
              b?.setDisabledReason?.(false, reason);
            } catch {
              b?.setDisabled?.(false);
            }
          },
        ),
      );

    if (!hasItem("custom_remove_comment"))
      registry.register(
        makeItem(
          "custom_remove_comment",
          text.removeComment,
          (scope) => {
            const b: any = scope.block;
            if (!b) return "hidden";
            const hasText = !!(
              typeof b.getCommentText === "function" && b.getCommentText()
            );
            return hasText ? "enabled" : "hidden";
          },
          (scope) => {
            const b: any = scope.block;
            b?.setCommentText?.(null);
          },
        ),
      );

    if (!hasItem("custom_inline_inputs"))
      registry.register(
        makeItem(
          "custom_inline_inputs",
          text.inline,
          (scope) => {
            const b: any = scope.block;
            if (!b) return "hidden";
            const multiple = !!(
              b.inputList &&
              b.inputList.length > 1 &&
              !b.isCollapsed?.()
            );
            return multiple && !b.getInputsInline?.() ? "enabled" : "hidden";
          },
          (scope) => {
            const b: any = scope.block;
            b?.setInputsInline?.(true);
          },
        ),
      );

    if (!hasItem("custom_external_inputs"))
      registry.register(
        makeItem(
          "custom_external_inputs",
          text.external,
          (scope) => {
            const b: any = scope.block;
            if (!b) return "hidden";
            const multiple = !!(
              b.inputList &&
              b.inputList.length > 1 &&
              !b.isCollapsed?.()
            );
            return multiple && !!b.getInputsInline?.() ? "enabled" : "hidden";
          },
          (scope) => {
            const b: any = scope.block;
            b?.setInputsInline?.(false);
          },
        ),
      );
  } catch {}
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
    // Генератор для Lua
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
        (opt as HTMLElement).dataset.value === selectedGeneratorLanguage,
      );
    },
  );
}

// Инициализация темы
document.documentElement.setAttribute("data-theme", appTheme);
initThemeSwitchUI();

// Инициализация UI локализации
localizeImportUI(defaultLang);
localizeTooltips(defaultLang);
// Локализуем кнопку и модалку справки
localizeHelpUI(defaultLang);
localizeSupportUI(defaultLang);

function localizeTaskSidebarStaticUI(lang: "ru" | "en") {
  const t = (window as any)._currentLocalizedStrings;

  const nextLabel =
    t?.NextTask || (lang === "ru" ? "Следующая задача" : "Next task");
  const prevLabel =
    t?.PrevTask || (lang === "ru" ? "Предыдущая задача" : "Previous task");
  const btn = document.getElementById("nextTaskBtn");
  if (btn) btn.textContent = `${nextLabel} →`;
  const prev = document.getElementById("prevTaskBtn");
  if (prev) prev.textContent = `← ${prevLabel}`;

  const solText = document.getElementById("taskSolutionBtnText");
  if (solText)
    (solText as HTMLElement).textContent = `ℹ️ ${
      t?.TaskSolutions || (lang === "ru" ? "Решение задач" : "Task Solutions")
    }`;

  const checkBtn = document.getElementById("checkTaskBtn");
  if (checkBtn)
    (checkBtn as HTMLElement).textContent =
      t?.CheckSolution ||
      (lang === "ru" ? "Проверить решение" : "Check solution");

  const hintSummary = document.getElementById("taskHintSummary");
  if (hintSummary)
    (hintSummary as HTMLElement).textContent =
      t?.TaskHintLabel || (lang === "ru" ? "Подсказка" : "Hint");

  const diffBasic = document.getElementById("taskDifficultyBasic");
  if (diffBasic)
    (diffBasic as HTMLElement).textContent =
      t?.TaskDifficultyBasic || (lang === "ru" ? "Основа" : "Basic");
  const diffAdvanced = document.getElementById("taskDifficultyAdvanced");
  if (diffAdvanced)
    (diffAdvanced as HTMLElement).textContent =
      t?.TaskDifficultyAdvanced || (lang === "ru" ? "Продвинутый" : "Advanced");

  const criteriaLabel = document.getElementById("taskStarsCriteriaLabel");
  if (criteriaLabel) {
    (criteriaLabel as HTMLElement).textContent =
      t?.StarsCriteria ||
      (lang === "ru" ? "Критерии звёзд:" : "Stars criteria:");
  }
  const starsOptimal =
    t?.StarsOptimal ||
    (lang === "ru"
      ? "оптимально (минимум блоков)"
      : "optimal (minimum blocks)");
  const starsGood = t?.StarsGood || (lang === "ru" ? "хорошо" : "good");
  const starsCorrect =
    t?.StarsCorrect || (lang === "ru" ? "решение верное" : "solution correct");
  const optimalEl = document.getElementById("taskStarsCriteriaOptimal");
  if (optimalEl)
    (optimalEl as HTMLElement).textContent = `★★★ — ${starsOptimal}`;
  const goodEl = document.getElementById("taskStarsCriteriaGood");
  if (goodEl) (goodEl as HTMLElement).textContent = `★★ — ${starsGood}`;
  const correctEl = document.getElementById("taskStarsCriteriaCorrect");
  if (correctEl) (correctEl as HTMLElement).textContent = `★ — ${starsCorrect}`;

  const consoleHeader = document.getElementById("consoleOutputHeader");
  if (consoleHeader)
    (consoleHeader as HTMLElement).textContent =
      t?.ConsoleOutputHeader ||
      (lang === "ru" ? "Вывод в консоль:" : "Console output:");

  const consoleDesc = document.getElementById("consoleOutputDescription");
  if (consoleDesc)
    (consoleDesc as HTMLElement).textContent =
      t?.ConsoleOutputDescription ||
      (lang === "ru"
        ? "Для вывода информации в консоль используйте следующие функции в зависимости от выбранного языка:"
        : "Use the following functions to print to the console depending on the selected language:");

  const consoleNote = document.getElementById("consoleOutputNote");
  if (consoleNote)
    (consoleNote as HTMLElement).textContent =
      t?.ConsoleOutputNote ||
      (lang === "ru"
        ? "Примечание: Результат вывода будет отображаться в окне вывода справа внизу."
        : "Note: The output will be shown in the output window at the bottom right.");

  const setText = (id: string, value: any) => {
    const el = document.getElementById(id);
    if (el && typeof value === "string")
      (el as HTMLElement).textContent = value;
  };

  setText("forLoopInfoHeader", t?.ForLoopInfoHeader);
  setText("forLoopIntroPrefix", t?.ForLoopIntroPrefix);
  setText("forLoopIntroMid", t?.ForLoopIntroMid);
  setText("forLoopIntroSuffix", t?.ForLoopIntroSuffix);
  setText("forLoopPartsHeader", t?.ForLoopPartsHeader);
  setText("forLoopStartLabel", t?.ForLoopStartLabel);
  setText("forLoopStartDesc", t?.ForLoopStartDesc);
  setText("forLoopEndLabel", t?.ForLoopEndLabel);
  setText("forLoopEndDesc", t?.ForLoopEndDesc);
  setText("forLoopStepLabel", t?.ForLoopStepLabel);
  setText("forLoopStepDesc", t?.ForLoopStepDesc);
  setText("forLoopBodyLabel", t?.ForLoopBodyLabel);
  setText("forLoopBodyDescPrefix", t?.ForLoopBodyDescPrefix);
  setText("forLoopBodyDescSuffix", t?.ForLoopBodyDescSuffix);
  setText("forLoopExampleHeader", t?.ForLoopExampleHeader);
  setText("forLoopErrorsHeader", t?.ForLoopErrorsHeader);
  setText("forLoopErr1Title", t?.ForLoopErr1Title);
  setText("forLoopErr1TextBefore", t?.ForLoopErr1TextBefore);
  setText("forLoopErr1TextMiddle", t?.ForLoopErr1TextMiddle);
  setText("forLoopErr1TextAfter", t?.ForLoopErr1TextAfter);
  setText("forLoopErr2Title", t?.ForLoopErr2Title);
  setText("forLoopErr2Text", t?.ForLoopErr2Text);
  setText("forLoopErr3Title", t?.ForLoopErr3Title);
  setText("forLoopErr3Text", t?.ForLoopErr3Text);
  setText("forLoopNote", t?.ForLoopNote);

  setText("whileLoopInfoHeader", t?.WhileLoopInfoHeader);
  setText("whileLoopIntroPrefix", t?.WhileLoopIntroPrefix);
  setText("whileLoopIntroSuffix", t?.WhileLoopIntroSuffix);
  setText("whileLoopPartsHeader", t?.WhileLoopPartsHeader);
  setText("whileLoopCondLabel", t?.WhileLoopCondLabel);
  setText("whileLoopCondDesc", t?.WhileLoopCondDesc);
  setText("whileLoopBodyLabel", t?.WhileLoopBodyLabel);
  setText("whileLoopBodyDesc", t?.WhileLoopBodyDesc);
  setText("whileLoopChangeLabel", t?.WhileLoopChangeLabel);
  setText("whileLoopChangeDesc", t?.WhileLoopChangeDesc);
  setText("whileLoopDiffHeader", t?.WhileLoopDiffHeader);
  setText("whileLoopDiffFor", t?.WhileLoopDiffFor);
  setText("whileLoopDiffWhile", t?.WhileLoopDiffWhile);
  setText("whileLoopExampleHeader", t?.WhileLoopExampleHeader);
  setText("whileJsCode", t?.WhileJsCode);
  setText("whilePyCode", t?.WhilePyCode);
  setText("whileLuaCode", t?.WhileLuaCode);
  setText("whilePhpCode", t?.WhilePhpCode);
  setText("whileLoopErrorsHeader", t?.WhileLoopErrorsHeader);
  setText("whileLoopErr1Title", t?.WhileLoopErr1Title);
  setText("whileLoopErr1Text", t?.WhileLoopErr1Text);
  setText("whileLoopErr2Title", t?.WhileLoopErr2Title);
  setText("whileLoopErr2TextBefore", t?.WhileLoopErr2TextBefore);
  setText("whileLoopErr3Title", t?.WhileLoopErr3Title);
  setText("whileLoopErr3Text", t?.WhileLoopErr3Text);
  setText("whileLoopNote", t?.WhileLoopNote);

  setText("listInfoHeader", t?.ListInfoHeader);
  setText("listInfoIntroBefore", t?.ListInfoIntroBefore);
  setText("listInfoIntroAfter", t?.ListInfoIntroAfter);
  setText("listInfoWhyHeader", t?.ListInfoWhyHeader);
  setText("listInfoWhy1", t?.ListInfoWhy1);
  setText("listInfoWhy2", t?.ListInfoWhy2);
  setText("listInfoWhy3", t?.ListInfoWhy3);
  setText("listInfoForEachHeader", t?.ListInfoForEachHeader);
  setText("listInfoForEachBefore", t?.ListInfoForEachBefore);
  setText("listInfoForEachBlockName", t?.ListInfoForEachBlockName);
  setText("listInfoForEachAfter", t?.ListInfoForEachAfter);
  setText("listInfoForEachMid", t?.ListInfoForEachMid);
  setText("listInfoForEachEnd", t?.ListInfoForEachEnd);
  setText("listInfoExampleHeader", t?.ListInfoExampleHeader);
  setText("listInfoNoteBefore", t?.ListInfoNoteBefore);
  setText("listInfoNoteMid", t?.ListInfoNoteMid);
  setText("listInfoNoteAfter", t?.ListInfoNoteAfter);
  setText("listInfoNoteEnd", t?.ListInfoNoteEnd);

  setText("consoleJsLogTextCode", t?.ConsoleJsLogTextCode);
  setText("consoleJsLogNumberCode", t?.ConsoleJsLogNumberCode);
  setText("consoleJsLogTextVarCode", t?.ConsoleJsLogTextVarCode);
  setText("consoleJsTemplateCode", t?.ConsoleJsTemplateCode);
  setText("consolePyPrintTextCode", t?.ConsolePyPrintTextCode);
  setText("consolePyPrintNumberCode", t?.ConsolePyPrintNumberCode);
  setText("consolePyPrintTextVarCode", t?.ConsolePyPrintTextVarCode);
  setText("consolePyFStringCode", t?.ConsolePyFStringCode);
  setText("consoleLuaPrintTextCode", t?.ConsoleLuaPrintTextCode);
  setText("consoleLuaPrintNumberCode", t?.ConsoleLuaPrintNumberCode);
  setText("consoleLuaPrintTextVarCode", t?.ConsoleLuaPrintTextVarCode);
  setText("consoleLuaFormatCode", t?.ConsoleLuaFormatCode);
  setText("consolePhpEchoTextCode", t?.ConsolePhpEchoTextCode);
  setText("consolePhpEchoNumberCode", t?.ConsolePhpEchoNumberCode);
  setText("consolePhpEchoTextVarCode", t?.ConsolePhpEchoTextVarCode);

  const textDesc =
    t?.ConsoleTextDesc || (lang === "ru" ? "вывод текста" : "print text");
  const numberDesc =
    t?.ConsoleNumberDesc || (lang === "ru" ? "вывод числа" : "print number");
  const textVarDesc =
    t?.ConsoleTextVarDesc ||
    (lang === "ru" ? "вывод текста и значения" : "print text and value");
  const jsTemplateDesc =
    t?.ConsoleJsTemplateDesc ||
    (lang === "ru" ? "шаблонные строки" : "template strings");
  const pyFStringDesc =
    t?.ConsolePyFStringDesc ||
    (lang === "ru"
      ? "f-строки для форматирования"
      : "f-strings for formatting");
  const luaFormatDesc =
    t?.ConsoleLuaFormatDesc ||
    (lang === "ru" ? "форматирование строк" : "string formatting");

  setText("consoleJsLogTextDesc", textDesc);
  setText("consoleJsLogNumberDesc", numberDesc);
  setText("consoleJsLogTextVarDesc", textVarDesc);
  setText("consoleJsTemplateDesc", jsTemplateDesc);
  setText("consolePyPrintTextDesc", textDesc);
  setText("consolePyPrintNumberDesc", numberDesc);
  setText("consolePyPrintTextVarDesc", textVarDesc);
  setText("consolePyFStringDesc", pyFStringDesc);
  setText("consoleLuaPrintTextDesc", textDesc);
  setText("consoleLuaPrintNumberDesc", numberDesc);
  setText("consoleLuaPrintTextVarDesc", textVarDesc);
  setText("consoleLuaFormatDesc", luaFormatDesc);
  setText("consolePhpEchoTextDesc", textDesc);
  setText("consolePhpEchoNumberDesc", numberDesc);
  setText("consolePhpEchoTextVarDesc", textVarDesc);

  setText(
    "dataTypesHeader",
    t?.DataTypesHeader || (lang === "ru" ? "Типы данных:" : "Data types:"),
  );
  setText(
    "dataTypesDescription",
    t?.DataTypesDescription ||
      (lang === "ru"
        ? "Текст (строка) нужно оборачивать в кавычки, а числа — нет."
        : "Text (a string) requires quotes, but numbers do not."),
  );
  setText(
    "dataTypesExamplesHeader",
    t?.DataTypesExamplesHeader || (lang === "ru" ? "Примеры:" : "Examples:"),
  );
  setText(
    "dataTypesKindsNote",
    t?.DataTypesKindsNote ||
      (lang === "ru"
        ? "В разных языках названия могут немного отличаться, но идея одинаковая."
        : "Names can vary a bit between languages, but the idea is the same."),
  );
  setText(
    "dataTypesBasicsHeader",
    t?.DataTypesBasicsHeader ||
      (lang === "ru" ? "Основные типы:" : "Core types:"),
  );
  setText("dataTypesStringLine", t?.DataTypesStringLine);
  setText("dataTypesNumberLine", t?.DataTypesNumberLine);
  setText("dataTypesFloatLine", t?.DataTypesFloatLine);
  setText("dataTypesBoolLine", t?.DataTypesBoolLine);
  setText("dataTypesExampleStringCode", t?.DataTypesExampleStringCode);
  setText("dataTypesExampleStringDesc", t?.DataTypesExampleStringDesc);
  setText("dataTypesExampleNumberCode", t?.DataTypesExampleNumberCode);
  setText("dataTypesExampleNumberDesc", t?.DataTypesExampleNumberDesc);
  setText("dataTypesExampleFloatCode", t?.DataTypesExampleFloatCode);
  setText("dataTypesExampleFloatDesc", t?.DataTypesExampleFloatDesc);
  setText("dataTypesExampleBooleanCode", t?.DataTypesExampleBooleanCode);
  setText("dataTypesExampleBooleanDesc", t?.DataTypesExampleBooleanDesc);
  setText("dataTypesExampleNullCode", t?.DataTypesExampleNullCode);
  setText("dataTypesExampleNullDesc", t?.DataTypesExampleNullDesc);
  setText("dataTypesExampleUndefinedCode", t?.DataTypesExampleUndefinedCode);
  setText("dataTypesExampleUndefinedDesc", t?.DataTypesExampleUndefinedDesc);
  setText("dataTypesExampleArrayCode", t?.DataTypesExampleArrayCode);
  setText("dataTypesExampleArrayDesc", t?.DataTypesExampleArrayDesc);
  setText("dataTypesExampleObjectCode", t?.DataTypesExampleObjectCode);
  setText("dataTypesExampleObjectDesc", t?.DataTypesExampleObjectDesc);
  setText(
    "dataTypesConsoleExamplesHeader",
    t?.DataTypesConsoleExamplesHeader ||
      (lang === "ru" ? "Примеры вывода:" : "Output examples:"),
  );
  setText("dataTypesConsoleTextCode", t?.DataTypesConsoleTextCode);
  setText("dataTypesConsoleNumberCode", t?.DataTypesConsoleNumberCode);
  setText("dataTypesConsoleErrorCode", t?.DataTypesConsoleErrorCode);
  setText("dataTypesConsoleTextDesc", t?.DataTypesConsoleOkDesc);
  setText("dataTypesConsoleNumberDesc", t?.DataTypesConsoleOkDesc);
  setText("dataTypesConsoleErrorDesc", t?.DataTypesConsoleErrorDesc);

  setText(
    "variableInfoHeader",
    t?.VariableInfoHeader ||
      (lang === "ru" ? "Что такое переменная?" : "What is a variable?"),
  );
  setText(
    "variableInfoText",
    t?.VariableInfoText ||
      (lang === "ru"
        ? "Переменная — это “коробка” с именем, в которой можно хранить значение (например, число). Это удобно, когда одно и то же значение нужно использовать много раз или менять в одном месте — тогда не надо искать и править число везде."
        : "A variable is like a named “box” that stores a value (for example, a number). It’s useful when you want to reuse the same value or change it in one place instead of editing it everywhere."),
  );
  setText(
    "variableInfoExamplesHeader",
    t?.VariableInfoExamplesHeader || (lang === "ru" ? "Примеры:" : "Examples:"),
  );

  setText(
    "concatInfoHeader",
    t?.ConcatInfoHeader ||
      (lang === "ru" ? "Конкатенация строк" : "String concatenation"),
  );
  setText(
    "concatInfoIntro",
    t?.ConcatInfoIntro ||
      (lang === "ru"
        ? "Конкатенация — это соединение строк в одну строку."
        : "Concatenation means joining strings into one string."),
  );
  setText(
    "concatInfoIdea",
    t?.ConcatInfoIdea ||
      (lang === "ru"
        ? "Идея простая: берём кусочки текста и “склеиваем” их вместе."
        : "The idea is simple: take parts and join them together."),
  );
  setText(
    "concatExamplesHeader",
    t?.ConcatExamplesHeader || (lang === "ru" ? "Примеры:" : "Examples:"),
  );
  setText("concatJsPlusDesc", t?.ConcatJsPlusDesc);
  setText("concatJsTemplateDesc", t?.ConcatJsTemplateDesc);
  setText("concatPyPlusDesc", t?.ConcatPyPlusDesc);
  setText("concatPyFStringDesc", t?.ConcatPyFStringDesc);
  setText("concatLuaDotsDesc", t?.ConcatLuaDotsDesc);
  setText("concatLuaFormatDesc", t?.ConcatLuaFormatDesc);
  setText("concatPhpDotsDesc", t?.ConcatPhpDotsDesc);
  setText("concatPhpInterpDesc", t?.ConcatPhpInterpDesc);
  setText(
    "concatInfoNote",
    t?.ConcatInfoNote ||
      (lang === "ru"
        ? "Примечание: если “склеиваете” строку и число, иногда нужно сначала превратить число в строку."
        : "Note: when joining a string and a number, you may need to convert the number to a string first."),
  );

  setText(
    "incDecInfoHeader",
    t?.IncDecInfoHeader ||
      (lang === "ru" ? "Инкремент и декремент" : "Increment and decrement"),
  );
  setText(
    "incDecInfoIntro",
    t?.IncDecInfoIntro ||
      (lang === "ru"
        ? "Инкремент — это увеличение значения на 1, декремент — уменьшение на 1."
        : "Increment means increasing a value by 1, decrement means decreasing it by 1."),
  );
  setText(
    "incDecExamplesHeader",
    t?.IncDecExamplesHeader || (lang === "ru" ? "Примеры:" : "Examples:"),
  );
  setText("incDecJsIncDesc", t?.IncDecIncDesc);
  setText("incDecJsDecDesc", t?.IncDecDecDesc);
  setText("incDecPyIncDesc", t?.IncDecIncDesc);
  setText("incDecPyDecDesc", t?.IncDecDecDesc);
  setText("incDecLuaIncDesc", t?.IncDecIncDesc);
  setText("incDecLuaDecDesc", t?.IncDecDecDesc);
  setText("incDecPhpIncDesc", t?.IncDecPhpIncDesc);
  setText("incDecPhpDecDesc", t?.IncDecPhpDecDesc);
  setText(
    "incDecInfoNote",
    t?.IncDecInfoNote ||
      (lang === "ru"
        ? "В Blockly это обычно делается так: берём текущее значение переменной, прибавляем 1 и снова присваиваем в ту же переменную."
        : "In Blockly you usually do it like this: take the current value, add 1, and assign it back to the same variable."),
  );

  setText(
    "conditionInfoHeader",
    t?.ConditionInfoHeader ||
      (lang === "ru"
        ? "Условные конструкции (if/else)"
        : "Conditional statements (if/else)"),
  );
  setText(
    "conditionInfoIntro",
    t?.ConditionInfoIntro ||
      (lang === "ru"
        ? "Условный оператор if/else позволяет программе принимать решения. Сначала вычисляется логическое выражение (условие), затем в зависимости от результата выполняется одна ветка кода (if) или другая (else). Так можно реагировать на разные ситуации — например, выводить сообщение только при выполнении нужного условия."
        : "The if/else statement lets a program make decisions. First a boolean expression (condition) is evaluated; depending on the result, either the if-branch or the else-branch runs. This lets you react to different situations — for example, only print a message when some requirement is met."),
  );
  setText(
    "conditionInfoExamplesHeader",
    t?.ConditionInfoExamplesHeader ||
      (lang === "ru" ? "Примеры:" : "Examples:"),
  );
  setText("conditionJsIfDesc", t?.ConditionJsIfDesc);
  setText("conditionJsIfElseDesc", t?.ConditionJsIfElseDesc);
  setText("conditionPyIfDesc", t?.ConditionPyIfDesc);
  setText("conditionPyIfElseDesc", t?.ConditionPyIfElseDesc);
  setText("conditionLuaIfDesc", t?.ConditionLuaIfDesc);
  setText("conditionLuaIfElseDesc", t?.ConditionLuaIfElseDesc);
  setText("conditionPhpIfDesc", t?.ConditionPhpIfDesc);
  setText("conditionPhpIfElseDesc", t?.ConditionPhpIfElseDesc);
  setText(
    "conditionInfoOpsHeader",
    t?.ConditionInfoOpsHeader ||
      (lang === "ru" ? "Операторы сравнения" : "Comparison operators"),
  );
  setText(
    "conditionInfoOpsIntro",
    t?.ConditionInfoOpsText ||
      (lang === "ru"
        ? "Операторы сравнения возвращают логическое значение: true (истина) или false (ложь)."
        : "Comparison operators return a boolean value: true or false."),
  );
  setText(
    "condOpGtDesc",
    t?.CondOpGtDesc || (lang === "ru" ? "больше" : "greater than"),
  );
  setText(
    "condOpLtDesc",
    t?.CondOpLtDesc || (lang === "ru" ? "меньше" : "less than"),
  );
  setText(
    "condOpGteDesc",
    t?.CondOpGteDesc ||
      (lang === "ru" ? "больше или равно" : "greater or equal"),
  );
  setText(
    "condOpLteDesc",
    t?.CondOpLteDesc || (lang === "ru" ? "меньше или равно" : "less or equal"),
  );
  setText(
    "condOpEqDesc",
    t?.CondOpEqDesc ||
      (lang === "ru" ? "сравнение: равно" : "comparison: equal"),
  );
  setText(
    "condOpNeqDesc",
    t?.CondOpNeqDesc ||
      (lang === "ru" ? "сравнение: не равно" : "comparison: not equal"),
  );
  setText(
    "condOpNeqLuaDesc",
    t?.CondOpNeqLuaDesc ||
      (lang === "ru" ? "не равно (в Lua)" : "not equal (in Lua: ~=)"),
  );
  setText(
    "condOpEqNote",
    t?.CondOpEqNote ||
      (lang === "ru"
        ? "Важно: == — это сравнение, а = — присваивание (например, x = 5). А != означает “не равно” (в Lua — ~=)."
        : "Important: == means comparison, while = means assignment (e.g., x = 5). And != means “not equal” (in Lua it is ~=)."),
  );
  setText(
    "conditionInfoNote",
    t?.ConditionInfoNote ||
      (lang === "ru"
        ? "Если нужно “ничего не делать” — просто оставьте ветку else пустой или не добавляйте её."
        : "If you need to “do nothing”, leave the else branch empty or omit it."),
  );
}

localizeTaskSidebarStaticUI(defaultLang);

// Определяем, была ли страница перезагружена
const __navEntries =
  (performance as any)?.getEntriesByType?.("navigation") || [];
const __isInitialReload =
  __navEntries[0]?.type === "reload" ||
  (performance as any)?.navigation?.type === 1;

// При перезагрузке очищаем сохранённые данные прогресса
if (__isInitialReload) {
  try {
    window.localStorage?.removeItem("mainWorkspace");
  } catch {}
  try {
    window.localStorage?.removeItem("task_progress_v1");
  } catch {}
}

// Инициализация рабочей области при загрузке страницы
refreshWorkspaceWithCustomToolbox();

// Обработчик переключения языка
const langSwitchInput = document.getElementById(
  "langSwitchInput",
) as HTMLInputElement | null;
if (langSwitchInput) {
  // Установить состояние переключателя в соответствии с текущим языком
  langSwitchInput.checked = defaultLang === "en";

  langSwitchInput.addEventListener("change", () => {
    const newLang = langSwitchInput.checked ? "en" : "ru";
    if (__langSwitchTimer) clearTimeout(__langSwitchTimer);
    __langSwitchTimer = window.setTimeout(() => {
      setAppLang(newLang);
      // Обновляем рабочую область с локализованным тулбоксом
      try {
        const canUpdate = ws && typeof (ws as any).updateToolbox === "function";
        if (canUpdate) {
          (ws as any).updateToolbox(localizedToolbox(newLang));
        } else {
          refreshWorkspaceWithCustomToolbox();
        }
      } catch {}
      // Локализуем импорт-модалку
      localizeImportUI(newLang);
      // Локализуем тултипы и окно настроек Ace
      localizeTooltips(newLang);
      localizeAceSettingsPanel(newLang);
      // Локализуем кнопку и модалку справки
      localizeHelpUI(newLang);
      localizeSupportUI(newLang);
      // ACE специфичные строки (кнопка Save, статусбар)
      const { refreshAceUILanguage } = require("./aceEditor");
      if (typeof refreshAceUILanguage === "function") refreshAceUILanguage();
      localizeTaskSidebarStaticUI(newLang);
      try {
        setActiveTask(getActiveTask());
      } catch {}
      scheduleAceSync();
      requestAnimationFrame(() => updateToolboxBlockCounterLabel());
    }, 120);
  });
}

// Аннотации: инструменты и состояние
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
  private _drawScheduled = false;

  constructor() {
    this.overlay = document.getElementById(
      "annotationOverlay",
    ) as HTMLDivElement;
    this.toolbar = document.getElementById("annotToolbar") as HTMLDivElement;
    this.initUI();
    this.initStage();
    window.addEventListener("resize", () => this.scheduleResize());
  }

  private initUI() {
    const toggleBtn = document.getElementById(
      "annotateToggleBtn",
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
    // вычисляем область под шапкой
    const header = document.getElementById("header");
    const topOffset = header ? header.getBoundingClientRect().height : 0;
    const width = window.innerWidth;
    const height = window.innerHeight - topOffset;
    this.overlay.style.top = `${topOffset}px`;
    this.overlay.style.display = "none";

    this.stage = new Konva.Stage({ container: this.overlay, width, height });
    this.layer = new Konva.Layer();
    this.stage.add(this.layer);

    // события указателя (Pointer Events)
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

  private _resizeScheduled = false;
  private scheduleResize() {
    if (this._resizeScheduled) return;
    this._resizeScheduled = true;
    requestAnimationFrame(() => {
      this._resizeScheduled = false;
      this.resize();
    });
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
            (id === "annotRect" && t === "rect"),
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
    this.scheduleLayerDraw();
  }

  private onPointerUp(e: any) {
    if (!this.drawing || !this.layer || !this.currentShape) return;
    this.drawing = false;

    if (this.tool === "arrow") {
      const line = this.currentShape as Konva.Line;
      const pts = line.points();
      // рисуем простой наконечник стрелки
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
    this.scheduleLayerDraw();
  }

  private undo() {
    if (!this.layer) return;
    const shape = this.history.pop();
    if (!shape) return;
    this.redoStack.push(shape);
    shape.destroy();
    this.scheduleLayerDraw();
  }

  private redo() {
    if (!this.layer) return;
    const shape = this.redoStack.pop();
    if (!shape) return;
    this.layer.add(shape);
    this.history.push(shape);
    this.scheduleLayerDraw();
  }

  private clear() {
    if (!this.layer) return;
    this.layer.destroyChildren();
    this.history = [];
    this.redoStack = [];
    this.scheduleLayerDraw();
  }

  private scheduleLayerDraw() {
    if (!this.layer) return;
    if (this._drawScheduled) return;
    this._drawScheduled = true;
    requestAnimationFrame(() => {
      this._drawScheduled = false;
      try {
        this.layer && this.layer.batchDraw();
      } catch {}
    });
  }
}

function setupAnnotationUI() {
  // Проверяем наличие элементов перед инициализацией
  const overlay = document.getElementById("annotationOverlay");
  const toolbar = document.getElementById("annotToolbar");
  const btn = document.getElementById("annotateToggleBtn");
  if (!overlay || !toolbar || !btn) return;
  (window as any).__annotationManager = new AnnotationManager();
}

// Вызывается после инициализации UI и workspace
setupAnnotationUI();

// Инициализация Ace Editor
setupAceEditor(() => selectedGeneratorLanguage);

// После инициализации Ace синхронизируем строки UI с текущим языком приложения
try {
  const { refreshAceUILanguage } = require("./aceEditor");
  if (typeof refreshAceUILanguage === "function") refreshAceUILanguage();
} catch {}

// Элементы split-layout (ресайзеры)
const pageContainer = document.getElementById(
  "pageContainer",
) as HTMLDivElement | null;
const outputPaneEl = document.getElementById(
  "outputPane",
) as HTMLDivElement | null;
const codePaneEl = document.getElementById("codePane") as HTMLDivElement | null;
const verticalResizer = document.getElementById(
  "verticalResizer",
) as HTMLDivElement | null;
const horizontalResizer = document.getElementById(
  "horizontalResizer",
) as HTMLDivElement | null;

// Объединяем пересчёт размеров (Blockly + Ace) в один rAF-тик
let __uiResizeScheduled = false;
function scheduleUIResize() {
  if (__uiResizeScheduled) return;
  __uiResizeScheduled = true;
  requestAnimationFrame(() => {
    __uiResizeScheduled = false;
    try {
      (Blockly as any).svgResize?.(ws);
    } catch {}
    try {
      const ed = typeof getAceEditor === "function" ? getAceEditor() : null;
      ed?.resize?.(true);
    } catch {}
  });
}

// (scheduleAceSync перемещён выше для избежания TDZ)

// Делаем финальный resize после завершения transition по flex-basis
if (blocklyDiv) {
  blocklyDiv.addEventListener("transitionend", (e: TransitionEvent) => {
    if (e.propertyName === "flex-basis" || e.propertyName === "flex") {
      scheduleUIResize();
    }
  });
}
if (outputPaneEl) {
  outputPaneEl.addEventListener("transitionend", (e: TransitionEvent) => {
    if (e.propertyName === "flex-basis" || e.propertyName === "flex") {
      scheduleUIResize();
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
    // Оставлено для совместимости: делегируем в единый планировщик
    scheduleUIResize();
  }

  function applyVerticalByRatio(ratio: number) {
    // Ограничиваем ratio минимальными ширинами
    const total = (pageContainer as HTMLDivElement).clientWidth;
    const minLeft = 320; // минимальная ширина Blockly
    const minRight = 300; // минимальная ширина панели кода/вывода
    const minRatio = minLeft / total;
    const maxRatio = 1 - (minRight + RESIZER_W) / total;
    const r = Math.max(minRatio, Math.min(maxRatio, ratio));

    const leftPx = Math.round(r * total);
    const rightPx = Math.max(minRight, total - leftPx - RESIZER_W);

    (blocklyDiv as HTMLDivElement).style.flex = `0 0 ${leftPx}px`;
    (outputPaneEl as HTMLDivElement).style.flex = `0 0 ${rightPx}px`;

    // Перерисовываем зависимые виджеты (объединённо)
    scheduleUIResize();
  }

  function applyHorizontalByRatio(ratio: number) {
    if (!codePaneEl || !outputPaneEl) return;
    const totalH = (outputPaneEl as HTMLDivElement).clientHeight;
    const minTop = 140; // минимальная высота редактора (панель+код)
    const minBottom = 80; // минимальная высота окна вывода
    const minR = minTop / totalH;
    const maxR = 1 - (minBottom + RESIZER_H) / totalH;
    const r = Math.max(minR, Math.min(maxR, ratio));

    const topPx = Math.round(r * totalH);
    const bottomPx = Math.max(minBottom, totalH - topPx - RESIZER_H);

    codePaneEl.style.flex = `0 0 ${topPx}px`;
    (outputDiv as HTMLDivElement).style.flex = `0 0 ${bottomPx}px`;
    resizeAceSoon();
  }

  // Drag на Pointer Events (единый путь для мыши/тача)

  // Вертикальный drag (Pointer Events)
  if (verticalResizer) {
    const startV = (e: PointerEvent) => {
      e.preventDefault();
      const rect = pageContainer.getBoundingClientRect();
      const onMove = (ev: PointerEvent) => {
        ev.preventDefault();
        const x = ev.clientX - rect.left;
        const ratio = x / rect.width;
        applyVerticalByRatio(ratio);
      };
      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        try {
          verticalResizer.releasePointerCapture(e.pointerId);
        } catch {}
        // Сохраняем ratio
        const left = (blocklyDiv as HTMLDivElement).getBoundingClientRect()
          .width;
        const total = (pageContainer as HTMLDivElement).clientWidth;
        localStorage.setItem(V_KEY, String(left / total));
      };
      const onUp = () => cleanup();
      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp);
      try {
        verticalResizer.setPointerCapture(e.pointerId);
      } catch {}
    };
    verticalResizer.addEventListener("pointerdown", startV);
  }

  // Горизонтальный drag (Pointer Events)
  if (horizontalResizer && codePaneEl) {
    const startH = (e: PointerEvent) => {
      e.preventDefault();
      const rect = (outputPaneEl as HTMLDivElement).getBoundingClientRect();
      const onMove = (ev: PointerEvent) => {
        ev.preventDefault();
        const y = ev.clientY - rect.top;
        const ratio = y / rect.height;
        applyHorizontalByRatio(ratio);
      };
      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        try {
          horizontalResizer.releasePointerCapture(e.pointerId);
        } catch {}
        // Сохраняем ratio
        const h = (codePaneEl as HTMLDivElement).getBoundingClientRect().height;
        const totalH = (outputPaneEl as HTMLDivElement).clientHeight;
        localStorage.setItem(H_KEY, String(h / totalH));
      };
      const onUp = () => cleanup();
      window.addEventListener("pointermove", onMove, { passive: false });
      window.addEventListener("pointerup", onUp);
      try {
        horizontalResizer.setPointerCapture(e.pointerId);
      } catch {}
    };
    horizontalResizer.addEventListener("pointerdown", startH);
  }

  // Применяем сохранённые ratio или значения по умолчанию
  const savedV = parseFloat(localStorage.getItem(V_KEY) || "0");
  if (savedV > 0 && savedV < 1) applyVerticalByRatio(savedV);
  const savedH = parseFloat(localStorage.getItem(H_KEY) || "0");
  if (savedH > 0 && savedH < 1) applyHorizontalByRatio(savedH);

  // Ограничиваем перерасчёт на resize окна до одного rAF на кадр
  let __splitReapplyScheduled = false;
  window.addEventListener("resize", () => {
    if (__splitReapplyScheduled) return;
    __splitReapplyScheduled = true;
    requestAnimationFrame(() => {
      __splitReapplyScheduled = false;
      const v = parseFloat(localStorage.getItem(V_KEY) || "0");
      if (v > 0 && v < 1) applyVerticalByRatio(v);
      const h = parseFloat(localStorage.getItem(H_KEY) || "0");
      if (h > 0 && h < 1) applyHorizontalByRatio(h);
    });
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
    // Используем transform для центрирования, как в CSS
    modalContent.style.left = "50%";
    modalContent.style.top = "50%";
    modalContent.style.transform = "translate(-50%, -50%)";
    // Важно: включаем анимацию только при открытии, чтобы она не мешала drag
    modalContent.style.animation = "";
  }
  if (modalContent && modalHeader) {
    makeModalDraggable(modalContent, modalHeader, "#closeModal");
  }
  // В модалке по умолчанию активируем выбранный ранее язык
  setActiveGenLangButton(selectedGeneratorLanguage);
}

function closeImportModal() {
  if (!importModal) return;
  importModal.style.display = "none";
  if (blockJsonTextarea) blockJsonTextarea.value = "";
  if (blockGeneratorTextarea) blockGeneratorTextarea.value = "";
}

function refreshWorkspaceWithCustomToolbox() {
  const lang = getAppLang();
  const currentState = ws
    ? Blockly.serialization.workspaces.save(ws as Blockly.Workspace)
    : null;
  if (ws) ws.dispose();
  const newWs = Blockly.inject(blocklyDiv!, {
    toolbox: localizedToolbox(lang),
    plugins: {
      connectionPreviewer: (BlockDynamicConnection as any).decoratePreviewer(),
    },
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
    renderer: "geras",
    theme: getBlocklyTheme(),
    media: "media/",
    horizontalLayout: false,
    toolboxPosition: "start",
    css: true,
    rtl: false,
    oneBasedIndex: true,
    modalInputs: false,
    readOnly: false,
  });
  try {
    if (ENABLE_KBD_NAV)
      (window as any).__keyboardNav = new KeyboardNavigation(newWs);
  } catch {}
  try {
    const fm =
      (Blockly as any).getFocusManager?.() ||
      (newWs as any).getFocusManager?.() ||
      (newWs as any).focusManager;
    if (fm && typeof fm.focusNode === "function") {
      const origFocusNode = fm.focusNode.bind(fm);
      fm.focusNode = function (node: any) {
        if (!node || typeof node.canBeFocused !== "function") return;
        return origFocusNode(node);
      };
    }
  } catch {}
  try {
    newWs.addChangeListener(
      (BlockDynamicConnection as any).finalizeConnections,
    );
  } catch {}
  if (currentState)
    Blockly.serialization.workspaces.load(
      currentState,
      newWs as Blockly.Workspace,
      undefined,
    );
  ws = newWs as Blockly.WorkspaceSvg;

  try {
    const multiOptions = {
      useDoubleClick: false,
      bumpNeighbours: false,
      multiFieldUpdate: true,
      workspaceAutoFocus: true,
      multiselectIcon: { hideIcon: true },
      multiSelectKeys: ["Shift"],
      multiselectCopyPaste: { crossTab: true, menu: true },
    } as any;
    const multiselect = new Multiselect(newWs);
    multiselect.init(multiOptions);
    (window as any).__multiselect = multiselect;
    try {
      const controls = (multiselect as any).controls_;
      if (controls && typeof controls.updateMultiselect === "function") {
        const origUpdate = controls.updateMultiselect.bind(controls);
        controls.updateMultiselect = function () {
          try {
            origUpdate();
          } catch {}
        };
      }
      const origSetSelected = (Blockly as any).common.setSelected.bind(
        (Blockly as any).common,
      );
      (Blockly as any).common.setSelected = function (sel: any) {
        try {
          return origSetSelected(sel);
        } catch {}
      };
    } catch {}
  } catch {}

  // Инициализация авторизации и переключения провайдера хранения
  setupAuthBootstrap(ws as Blockly.Workspace);
  initAuthUI();
  // Инициализация загрузки/сохранения через bootstrap-модуль (не блокирует UI)
  setupAppBootstrap(ws, { shouldLoad: !__isInitialReload });

  // Подключаем обновление индикатора активного хранилища и времени последнего сохранения
  const storageIndicatorEl = document.getElementById("storageIndicator");
  if (storageIndicatorEl) {
    setStorageIndicatorUpdater(({ kind, lastSavedAt }) => {
      const label = kind === "server" ? "Сервер" : "Локально";
      let suffix = "";
      if (lastSavedAt) {
        const d = new Date(lastSavedAt);
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        const ss = String(d.getSeconds()).padStart(2, "0");
        suffix = ` • ${hh}:${mm}:${ss}`;
      }
      (storageIndicatorEl as HTMLElement).textContent = `${label}${suffix}`;
      const titleBase = "Активное хранилище и время последнего сохранения";
      (storageIndicatorEl as HTMLElement).setAttribute(
        "title",
        lastSavedAt
          ? `${titleBase}: ${new Date(lastSavedAt).toLocaleString()}`
          : titleBase,
      );
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
      // Авто-разворачивание и инициализация мультитекстового поля

      // Держим Ace в синхронизации (без авто-выполнения)
      scheduleAceSync();

      // Если блок был удален, очищаем окно вывода
      // Тип события удаления может называться 'BLOCK_DELETE' в текущих версиях Blockly
      if (
        (e as any).type === (Blockly as any).Events?.BLOCK_DELETE ||
        (e as any).type === "block_delete"
      ) {
        try {
          updateAceEditorFromWorkspace(ws, selectedGeneratorLanguage);
        } catch {}
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
  const setDifficultyUI = () => {
    const diff = getActiveDifficulty();
    if (taskDifficultyBasicBtn) {
      taskDifficultyBasicBtn.classList.toggle("primary", diff === "basic");
      taskDifficultyBasicBtn.classList.toggle("secondary", diff !== "basic");
    }
    if (taskDifficultyAdvancedBtn) {
      taskDifficultyAdvancedBtn.classList.toggle(
        "primary",
        diff === "advanced",
      );
      taskDifficultyAdvancedBtn.classList.toggle(
        "secondary",
        diff !== "advanced",
      );
    }
  };
  const activateDifficulty = (difficulty: "basic" | "advanced") => {
    setActiveDifficulty(difficulty);
    setActiveTask(getFirstUnsolvedTask(difficulty));
    setDifficultyUI();
    if (taskSidebar) taskSidebar.classList.remove("mode-select");
  };
  if (taskDifficultyBasicBtn) {
    taskDifficultyBasicBtn.addEventListener("click", () => {
      activateDifficulty("basic");
    });
  }
  if (taskDifficultyAdvancedBtn) {
    taskDifficultyAdvancedBtn.addEventListener("click", () => {
      activateDifficulty("advanced");
    });
  }
  setDifficultyUI();
  // Первичная синхронизация после инициализации workspace (без авто-выполнения)
  scheduleAceSync();
  // Начальная отрисовка счётчика
  // На всякий случай немного отложим, чтобы DOM тулбокса гарантированно создался
  requestAnimationFrame(() => updateToolboxBlockCounterLabel());
}
const saveXmlBtn = document.getElementById(
  "saveXmlBtn",
) as HTMLButtonElement | null;
const loadXmlBtn = document.getElementById(
  "loadXmlBtn",
) as HTMLButtonElement | null;
const loadXmlInput = document.getElementById(
  "loadXmlInput",
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
      await saveTextFile({
        suggestedName: suggested,
        text: xmlText,
        description: "Blockly XML",
        accept: { "application/xml": [".xml"] },
        mime: "application/xml;charset=utf-8",
        promptLabel: getAppLang() === "ru" ? "Имя файла:" : "File name:",
      });
    } catch (e) {
      console.error("Не удалось сохранить XML", e);
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
      // Парсим XML через DOMParser (для совместимости), а не через Blockly.Xml.textToDom
      const doc = new DOMParser().parseFromString(text, "text/xml");
      const xml = doc.documentElement as Element;
      Blockly.Events.disable();
      ws.clear();
      Blockly.Xml.domToWorkspace(xml, ws);
      Blockly.Events.enable();
      // Синхронизируем Ace после загрузки
      scheduleAceSync();
      // Обновить счётчик блоков
      updateToolboxBlockCounterLabel();
      // Сохраняем через выбранный провайдер (bootstrap)
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
  const val = aceEditor ? aceEditor.getValue() : "";
  const hasCode = val.trim().length > 0;

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
        // Центрируем окно при открытии (сбрасываем возможные координаты после drag)
        const helpModalContent = document.getElementById(
          "helpModalContent",
        ) as HTMLDivElement | null;
        if (helpModalContent) {
          helpModalContent.style.left = "50%";
          helpModalContent.style.top = "50%";
          helpModalContent.style.transform = "translate(-50%, -50%)";
          // Сброс анимации на открытие, чтобы не мешала drag после клика на заголовок
          helpModalContent.style.animation = "";
        }
        // Локализованное содержимое руководства (RU/EN)
        const ru = `
<h1>Руководство по созданию пользовательских блоков</h1>

<h2>Структура JSON-описания блока</h2>

<p>Каждый блок определяется JSON-объектом со следующими основными полями:</p>

<h3>Обязательные поля</h3>

<ul>
<li><strong>type</strong>: Уникальный идентификатор блока (строка)</li>
<li><strong>message0</strong>: Текст, отображаемый на блоке (может содержать заполнители %1, %2 и т.д.)</li>
<li><strong>args0</strong>: Массив аргументов, соответствующих заполнителям в message0</li>
<li><strong>colour</strong>: Цвет блока (число от 0 до 360 или строка с HEX-кодом)</li>
<li><strong>tooltip</strong>: Всплывающая подсказка при наведении на блок</li>
<li><strong>helpUrl</strong>: URL страницы с дополнительной информацией</li>
<li><strong>inputsInline</strong>: Расположение входов (true — в линию, false — вертикально)</li>
<li><strong>previousStatement</strong>: Подключение сверху (true или тип соединения)</li>
<li><strong>nextStatement</strong>: Подключение снизу (true или тип соединения)</li>
<li><strong>output</strong>: Тип выходного значения блока (строка или null)</li>
</ul>

<h2>Примеры блоков</h2>

<h3>Блок с текстовым полем ввода</h3>

<pre><code>{
  "type": "example_input_text",
  "message0": "текстовое поле: %1",
  "args0": [
    { "type": "field_input", "name": "TEXT", "text": "значение по умолчанию" }
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
    { "type": "field_number", "name": "NUM", "value": 42, "min": 0, "max": 100 }
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
    { "type": "field_dropdown", "name": "CHOICE", "options": [["первый","FIRST"],["второй","SECOND"],["третий","THIRD"]] }
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
    { "type": "input_value", "name": "VALUE", "check": "Number" }
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
    this.appendDummyInput().appendField("Мой блок");
    this.appendValueInput("VALUE").setCheck("Number").appendField("со значением");
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
</ol>`;

        const en = `
<h1>Guide to Creating Custom Blocks</h1>

<h2>JSON Block Structure</h2>

<p>Each block is defined by a JSON object with the following fields:</p>

<h3>Required Fields</h3>

<ul>
<li><strong>type</strong>: Unique block identifier (string)</li>
<li><strong>message0</strong>: Text displayed on the block (may contain placeholders %1, %2, etc.)</li>
<li><strong>args0</strong>: Array of arguments matching placeholders in message0</li>
<li><strong>colour</strong>: Block color (number 0–360 or HEX string)</li>
<li><strong>tooltip</strong>: Tooltip shown on hover</li>
<li><strong>helpUrl</strong>: URL for additional information</li>
<li><strong>inputsInline</strong>: Inputs layout (true — inline, false — vertical)</li>
<li><strong>previousStatement</strong>: Connection at the top (true or connection type)</li>
<li><strong>nextStatement</strong>: Connection at the bottom (true or connection type)</li>
<li><strong>output</strong>: Output type (string or null)</li>
</ul>

<h2>Block Examples</h2>

<h3>Block with text input</h3>
<pre><code>{
  "type": "example_input_text",
  "message0": "text field: %1",
  "args0": [ { "type": "field_input", "name": "TEXT", "text": "default value" } ],
  "previousStatement": null,
  "nextStatement": null,
  "colour": 160,
  "tooltip": "Example block with a text field"
}
</code></pre>

<h3>Block with number input</h3>
<pre><code>{
  "type": "example_input_number",
  "message0": "number: %1",
  "args0": [ { "type": "field_number", "name": "NUM", "value": 42, "min": 0, "max": 100 } ],
  "output": "Number",
  "colour": 230,
  "tooltip": "Returns a number"
}
</code></pre>

<h3>Block with dropdown</h3>
<pre><code>{
  "type": "example_dropdown",
  "message0": "choose %1",
  "args0": [ { "type": "field_dropdown", "name": "CHOICE", "options": [["first","FIRST"],["second","SECOND"],["third","THIRD"]] } ],
  "output": null,
  "colour": 290,
  "tooltip": "Choose an option"
}
</code></pre>

<h3>Block with input value</h3>
<pre><code>{
  "type": "example_input_value",
  "message0": "value: %1",
  "args0": [ { "type": "input_value", "name": "VALUE", "check": "Number" } ],
  "output": "Number",
  "colour": 120,
  "tooltip": "Accepts a number"
}
</code></pre>

<h2>init function</h2>
<p>Instead of JSON you can use <code>init</code> function to programmatically configure a block:</p>

<pre><code>Blockly.Blocks['example_block'] = {
  init: function() {
    this.setColour(120);
    this.appendDummyInput().appendField("My block");
    this.appendValueInput("VALUE").setCheck("Number").appendField("with value");
    this.setOutput(true, "Number");
    this.setTooltip("Block description");
  }
};
</code></pre>

<h2>Code generators</h2>
<p>Generators define what code will be produced for a block.</p>

<h3>JavaScript generator</h3>
<pre><code>javascript.forBlock['example_block'] = function(block) {
  const value = javascript.valueToCode(block, 'VALUE', javascript.ORDER_ATOMIC);
  const code = \`Math.sqrt(\${value})\`;
  return [code, javascript.ORDER_FUNCTION_CALL];
};
</code></pre>

<h3>Python generator</h3>
<pre><code>python.forBlock['example_block'] = function(block) {
  const value = python.valueToCode(block, 'VALUE', python.ORDER_ATOMIC);
  const code = \`math.sqrt(\${value})\`;
  return [code, python.ORDER_FUNCTION_CALL];
};
</code></pre>

<h3>Lua generator</h3>
<pre><code>lua.forBlock['example_block'] = function(block) {
  const value = lua.valueToCode(block, 'VALUE', lua.ORDER_ATOMIC);
  const code = \`math.sqrt(\${value})\`;
  return [code, lua.ORDER_FUNCTION_CALL];
};
</code></pre>

<h2>Operator precedence</h2>
<p>When generating code, consider operator precedence via ORDER_* constants:</p>

<ul>
<li>ORDER_ATOMIC: atomic values (numbers, strings)</li>
<li>ORDER_FUNCTION_CALL: function call</li>
<li>ORDER_MULTIPLICATIVE: multiply, divide</li>
<li>ORDER_ADDITIVE: add, subtract</li>
<li>ORDER_RELATIONAL: comparisons (&lt;, &gt;, &lt;=, &gt;=)</li>
<li>ORDER_EQUALITY: equality (==, !=)</li>
<li>ORDER_LOGICAL_AND: logical AND (&amp;&amp;)</li>
<li>ORDER_LOGICAL_OR: logical OR (||)</li>
<li>ORDER_NONE: no precedence (needs parentheses)</li>
</ul>

<h2>Tips</h2>
<ol>
<li>Use clear names and descriptions</li>
<li>Pick colors matching the block category</li>
<li>Add helpful tooltips</li>
<li>Validate input types</li>
<li>Test with different inputs</li>
<li>Handle edge cases in generators</li>
</ol>`;

        const lang = getAppLang();
        markdownContent.innerHTML = lang === "ru" ? ru : en;
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
      makeModalDraggable(
        helpModalContent as HTMLElement,
        helpModalHeader as HTMLElement,
        "#closeHelpModal",
      );
    }
  }
}

function initSupportModal() {
  if (!supportModal || !supportBtn) return;
  supportBtn.addEventListener("click", () => {
    supportModal.style.display = "block";
  });
  const close = () => {
    supportModal.style.display = "none";
  };
  if (closeSupportModal) closeSupportModal.addEventListener("click", close);
  if (closeSupportBtn) closeSupportBtn.addEventListener("click", close);
  supportModal.addEventListener("click", (e) => {
    if (e.target === supportModal) close();
  });
  if (copyCardBtn && supportCardNumberEl) {
    copyCardBtn.addEventListener("click", async () => {
      const text = (
        supportCardNumberEl.getAttribute("data-card") ||
        supportCardNumberEl.textContent ||
        ""
      ).trim();
      try {
        await navigator.clipboard.writeText(text);
        if (copyCardStatusEl) {
          copyCardStatusEl.style.display = "block";
          setTimeout(() => {
            if (copyCardStatusEl) copyCardStatusEl.style.display = "none";
          }, 2000);
        }
      } catch {}
    });
  }
}

// Вызываем инициализацию модального окна справки
initHelpModal();
initSupportModal();
