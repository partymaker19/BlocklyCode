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
import "./index.css";
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
} from "./localization";
import { runCode as runCodeExec } from "./codeExecution";
import Konva from "konva";
// Import dark theme
import DarkTheme from "@blockly/theme-dark";

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

// Объявляем флаг регистрации контекстного меню до первого вызова
let customBlockContextRegistered = false;
let modalDragInitialized = false;

// Теперь, когда локаль установлена, регистрируем блоки и генераторы
Blockly.common.defineBlocks(blocks);
Object.assign(javascriptGenerator.forBlock, forBlock);
Object.assign(pythonGenerator.forBlock, forBlockPython);
Object.assign(luaGenerator.forBlock, forBlockLua);
// Регистрируем пользовательские блоки и контекстное меню удаления
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
  (localStorage.getItem("generator_language") as
    | "javascript"
    | "python"
    | "lua") || "javascript";

// Theme state
type AppTheme = "light" | "dark";
const APP_THEME_KEY = "app_theme";
let appTheme: AppTheme =
  (localStorage.getItem(APP_THEME_KEY) as AppTheme) || "light";

// Объявление рабочей области Blockly
let ws!: Blockly.WorkspaceSvg;
let aceEditor: any | null = null;

// Helper: get active Blockly theme
function getBlocklyTheme() {
  return appTheme === "dark" ? (DarkTheme as any) : Blockly.Themes.Classic;
}

function setAppTheme(next: AppTheme) {
  appTheme = next;
  localStorage.setItem(APP_THEME_KEY, appTheme);
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
      generatorErrorEl.style.display = "block";
      generatorErrorEl.textContent = `Ошибка: ${msg}`;
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
  localStorage.setItem("generator_language", lang);
  setActiveGenLangButton(lang);
  updatePresetsByGenLang();
  validateGeneratorUI();
  const currentLang = getAppLang();
  setGeneratorPlaceholder(currentLang);
  // Sync ACE editor and output
  updateAceEditorFromWorkspace();
  runCodeExec(
    ws,
    selectedGeneratorLanguage,
    null,
    outputDiv as HTMLElement | null
  );
}

// Функция для генерации и запуска кода выполняется через runCodeExec без локальной обертки

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

if (blockGeneratorTextarea) {
  blockGeneratorTextarea.addEventListener("input", () => validateGeneratorUI());
}

// При открытии модалки — сбрасываем язык генератора на JS по умолчанию
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
    modalContent.style.left = `${centerLeft}px`;
    modalContent.style.top = `${centerTop}px`;
    modalContent.style.transform = "";
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
    if (nextLeft < 0) nextLeft = 0;
    else if (nextLeft > maxLeft) nextLeft = maxLeft;
    if (nextTop < 0) nextTop = 0;
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
    grid: { spacing: 20, length: 3, colour: "#ccc", snap: true },
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
  if (ws) {
    ws.addChangeListener((e: Blockly.Events.Abstract) => {
      if (e.isUiEvent) return;
      save(ws);
    });
    ws.addChangeListener((e: Blockly.Events.Abstract) => {
      if (
        e.isUiEvent ||
        e.type == Blockly.Events.FINISHED_LOADING ||
        ws.isDragging()
      ) {
        return;
      }
      // Keep ACE editor content in sync and re-run execution/output
      updateAceEditorFromWorkspace();
      runCodeExec(
        ws,
        selectedGeneratorLanguage,
        null,
        outputDiv as HTMLElement | null
      );
    });
  }
  // Initial sync after workspace init
  updateAceEditorFromWorkspace();
  runCodeExec(
    ws,
    selectedGeneratorLanguage,
    null,
    outputDiv as HTMLElement | null
  );
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
    if (
      selectedGeneratorLanguage === "javascript" &&
      generatorErrorEl &&
      generatorErrorEl.style.display !== "none"
    ) {
      alert("Исправьте ошибки в генераторе JavaScript перед импортом");
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
        p.textContent = `Импортирован блок: ${blockType}`;
        outputDiv.appendChild(p);
      }
    } else {
      alert("Ошибка импорта: " + error);
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
    const lang = (localStorage.getItem("app_language") || "ru") as "ru" | "en";
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
      const lang = (localStorage.getItem("app_language") || "ru") as
        | "ru"
        | "en";
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
    refreshWorkspaceWithCustomToolbox();
    localizeImportUI(newLang);
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

// ACE Editor imports
import ace from "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/ext-language_tools";
import "ace-builds/src-noconflict/ext-searchbox";
import "ace-builds/src-noconflict/ext-beautify";
import "ace-builds/src-noconflict/ext-keybinding_menu";
import "ace-builds/src-noconflict/keybinding-vim";
import "ace-builds/src-noconflict/keybinding-emacs";
(ace as any).config.set("basePath", "/ace");
(ace as any).config.set("modePath", "/ace");
(ace as any).config.set("themePath", "/ace");
(ace as any).config.set("workerPath", "/ace");

// Ace Editor setup and UI controls
(function initAce() {
  const editorEl = document.getElementById("editor") as HTMLDivElement | null;
  if (!editorEl) return;
  aceEditor = ace.edit(editorEl, {
    mode: "ace/mode/javascript",
    theme: "ace/theme/chrome",
    wrap: true,
    showPrintMargin: false,
    useWorker: true,
    tabSize: 2,
  });
  (ace as any).require("ace/ext/language_tools");
  if (aceEditor) {
    aceEditor.setOptions({
      enableBasicAutocompletion: true,
      enableLiveAutocompletion: true,
      enableSnippets: true,
      fontSize: 13,
      showGutter: true,
      highlightActiveLine: true,
    });
    aceEditor.setShowFoldWidgets(true);
    aceEditor.setShowInvisibles(false);
  }
  // Initialize from app theme
  const currentTheme = document.documentElement.getAttribute("data-theme");
  if (currentTheme === "dark") {
    aceEditor?.setTheme("ace/theme/monokai");
    const themeSelect = document.getElementById(
      "aceThemeSelect"
    ) as HTMLSelectElement | null;
    if (themeSelect) themeSelect.value = "ace/theme/monokai";
  }

  // Hook up toolbar controls
  const themeSelect = document.getElementById(
    "aceThemeSelect"
  ) as HTMLSelectElement | null;
  const fontSizeInput = document.getElementById(
    "aceFontSize"
  ) as HTMLInputElement | null;
  const tabSizeInput = document.getElementById(
    "aceTabSize"
  ) as HTMLInputElement | null;
  const wrapCheckbox = document.getElementById(
    "aceWrap"
  ) as HTMLInputElement | null;
  const invisiblesCheckbox = document.getElementById(
    "aceInvisibles"
  ) as HTMLInputElement | null;
  const activeLineCheckbox = document.getElementById(
    "aceActiveLine"
  ) as HTMLInputElement | null;
  const printMarginCheckbox = document.getElementById(
    "acePrintMargin"
  ) as HTMLInputElement | null;
  const gutterCheckbox = document.getElementById(
    "aceGutter"
  ) as HTMLInputElement | null;
  const softTabsCheckbox = document.getElementById(
    "aceSoftTabs"
  ) as HTMLInputElement | null;
  const foldWidgetsCheckbox = document.getElementById(
    "aceFoldWidgets"
  ) as HTMLInputElement | null;
  const keybindingSelect = document.getElementById(
    "aceKeybinding"
  ) as HTMLSelectElement | null;

  const copyBtn = document.getElementById(
    "copyCodeBtn"
  ) as HTMLButtonElement | null;
  const downloadBtn = document.getElementById(
    "downloadCodeBtn"
  ) as HTMLButtonElement | null;

  const searchBtn = document.getElementById(
    "aceSearchBtn"
  ) as HTMLButtonElement | null;
  const replaceBtn = document.getElementById(
    "aceReplaceBtn"
  ) as HTMLButtonElement | null;
  const gotoBtn = document.getElementById(
    "aceGotoBtn"
  ) as HTMLButtonElement | null;
  const formatBtn = document.getElementById(
    "aceFormatBtn"
  ) as HTMLButtonElement | null;
  const shortcutsBtn = document.getElementById(
    "aceShortcutsBtn"
  ) as HTMLButtonElement | null;

  const settingsToggle = document.getElementById(
    "aceSettingsToggle"
  ) as HTMLButtonElement | null;
  const settingsPanel = document.getElementById(
    "aceSettingsPanel"
  ) as HTMLDivElement | null;

  const statusBar = document.getElementById(
    "editorStatusbar"
  ) as HTMLDivElement | null;

  // Apply saved Ace settings on init
  try {
    const saved = loadAceSettings();
    if (aceEditor) {
      if (saved.theme) {
        aceEditor.setTheme(saved.theme);
        if (themeSelect) themeSelect.value = saved.theme;
      }
      if (typeof saved.fontSize === "number") {
        aceEditor.setFontSize(saved.fontSize);
        if (fontSizeInput) fontSizeInput.value = String(saved.fontSize);
      }
      if (typeof saved.tabSize === "number") {
        aceEditor.session.setTabSize(saved.tabSize);
        if (tabSizeInput) tabSizeInput.value = String(saved.tabSize);
      }
      if (typeof saved.wrap === "boolean") {
        aceEditor.session.setUseWrapMode(saved.wrap);
        if (wrapCheckbox) wrapCheckbox.checked = saved.wrap;
      }
      if (typeof saved.showInvisibles === "boolean") {
        aceEditor.setShowInvisibles(saved.showInvisibles);
        if (invisiblesCheckbox)
          invisiblesCheckbox.checked = saved.showInvisibles;
      }
      if (typeof saved.highlightActiveLine === "boolean") {
        aceEditor.setHighlightActiveLine(saved.highlightActiveLine);
        if (activeLineCheckbox)
          activeLineCheckbox.checked = saved.highlightActiveLine;
      }
      if (typeof saved.showPrintMargin === "boolean") {
        aceEditor.setShowPrintMargin(saved.showPrintMargin);
        if (printMarginCheckbox)
          printMarginCheckbox.checked = saved.showPrintMargin;
      }
      if (typeof saved.showGutter === "boolean") {
        aceEditor.setOption("showGutter", saved.showGutter);
        if (gutterCheckbox) gutterCheckbox.checked = saved.showGutter;
      }
      if (typeof saved.useSoftTabs === "boolean") {
        aceEditor.session.setUseSoftTabs(saved.useSoftTabs);
        if (softTabsCheckbox) softTabsCheckbox.checked = saved.useSoftTabs;
      }
      if (typeof saved.showFoldWidgets === "boolean") {
        aceEditor.setShowFoldWidgets(saved.showFoldWidgets);
        if (foldWidgetsCheckbox)
          foldWidgetsCheckbox.checked = saved.showFoldWidgets;
      }
      if (saved.keybinding) {
        if (saved.keybinding === "vim")
          aceEditor.setKeyboardHandler("ace/keyboard/vim");
        else if (saved.keybinding === "emacs")
          aceEditor.setKeyboardHandler("ace/keyboard/emacs");
        else aceEditor.setKeyboardHandler(null as any);
        if (keybindingSelect) keybindingSelect.value = saved.keybinding;
      }
    }
  } catch {}

  if (themeSelect)
    themeSelect.addEventListener("change", () => {
      if (!aceEditor) return;
      aceEditor.setTheme(themeSelect.value);
      saveAceSettings({ theme: themeSelect.value });
    });
  if (fontSizeInput)
    fontSizeInput.addEventListener("input", () => {
      if (!aceEditor) return;
      const v = Math.max(
        10,
        Math.min(24, parseInt(fontSizeInput.value || "13", 10))
      );
      aceEditor.setFontSize(v);
      saveAceSettings({ fontSize: v });
    });
  if (tabSizeInput)
    tabSizeInput.addEventListener("input", () => {
      if (!aceEditor) return;
      const v = Math.max(
        2,
        Math.min(8, parseInt(tabSizeInput.value || "2", 10))
      );
      aceEditor.session.setTabSize(v);
      saveAceSettings({ tabSize: v });
    });
  if (wrapCheckbox)
    wrapCheckbox.addEventListener("input", () => {
      if (!aceEditor) return;
      aceEditor.session.setUseWrapMode(!!wrapCheckbox.checked);
      saveAceSettings({ wrap: !!wrapCheckbox.checked });
    });
  if (invisiblesCheckbox)
    invisiblesCheckbox.addEventListener("input", () => {
      if (!aceEditor) return;
      aceEditor.setShowInvisibles(!!invisiblesCheckbox.checked);
      saveAceSettings({ showInvisibles: !!invisiblesCheckbox.checked });
    });
  if (activeLineCheckbox)
    activeLineCheckbox.addEventListener("change", () => {
      if (!aceEditor) return;
      aceEditor.setHighlightActiveLine(!!activeLineCheckbox.checked);
      saveAceSettings({ highlightActiveLine: !!activeLineCheckbox.checked });
    });
  if (printMarginCheckbox)
    printMarginCheckbox.addEventListener("change", () => {
      if (!aceEditor) return;
      aceEditor.setShowPrintMargin(!!printMarginCheckbox.checked);
      saveAceSettings({ showPrintMargin: !!printMarginCheckbox.checked });
    });
  if (gutterCheckbox)
    gutterCheckbox.addEventListener("change", () => {
      if (!aceEditor) return;
      aceEditor.setOption("showGutter", !!gutterCheckbox.checked);
      saveAceSettings({ showGutter: !!gutterCheckbox.checked });
    });
  if (softTabsCheckbox)
    softTabsCheckbox.addEventListener("change", () => {
      if (!aceEditor) return;
      aceEditor.session.setUseSoftTabs(!!softTabsCheckbox.checked);
      saveAceSettings({ useSoftTabs: !!softTabsCheckbox.checked });
    });
  if (foldWidgetsCheckbox)
    foldWidgetsCheckbox.addEventListener("change", () => {
      if (!aceEditor) return;
      aceEditor.setShowFoldWidgets(!!foldWidgetsCheckbox.checked);
      saveAceSettings({ showFoldWidgets: !!foldWidgetsCheckbox.checked });
    });
  if (keybindingSelect)
    keybindingSelect.addEventListener("change", () => {
      if (!aceEditor) return;
      const val = keybindingSelect.value;
      if (val === "vim") aceEditor.setKeyboardHandler("ace/keyboard/vim");
      else if (val === "emacs")
        aceEditor.setKeyboardHandler("ace/keyboard/emacs");
      else aceEditor.setKeyboardHandler(null as any);
      saveAceSettings({ keybinding: val });
    });

  if (copyBtn)
    copyBtn.addEventListener("click", async () => {
      if (!aceEditor) return;
      const text = aceEditor.getValue();
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = "Скопировано";
        setTimeout(() => {
          copyBtn.textContent = "⧉";
        }, 1200);
      } catch {}
    });
  if (downloadBtn)
    downloadBtn.addEventListener("click", () => {
      if (!aceEditor) return;
      const text = aceEditor.getValue();
      const lang = selectedGeneratorLanguage;
      const ext = lang === "python" ? "py" : lang === "lua" ? "lua" : "js";
      const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `code.${ext}`;
      a.click();
      URL.revokeObjectURL(a.href);
    });

  if (searchBtn)
    searchBtn.addEventListener("click", () => {
      if (!aceEditor) return;
      aceEditor.execCommand("find");
    });
  if (replaceBtn)
    replaceBtn.addEventListener("click", () => {
      if (!aceEditor) return;
      aceEditor.execCommand("replace");
    });
  if (gotoBtn)
    gotoBtn.addEventListener("click", () => {
      if (!aceEditor) return;
      aceEditor.execCommand("gotoline");
    });
  if (formatBtn)
    formatBtn.addEventListener("click", () => {
      if (!aceEditor) return;
      try {
        const beautify = (ace as any).require("ace/ext/beautify");
        beautify.beautify(aceEditor.session);
      } catch (e) {
        // silently ignore
      }
    });
  if (shortcutsBtn)
    shortcutsBtn.addEventListener("click", () => {
      if (!aceEditor) return;
      aceEditor.execCommand("showKeyboardShortcuts");
    });

  // Statusbar updates (line, col, lines, mode)
  function updateStatusBar() {
    if (!aceEditor || !statusBar) return;
    const pos = aceEditor.getCursorPosition();
    const row = pos.row + 1;
    const col = pos.column + 1;
    const total = aceEditor.session.getLength();
    const mode = aceEditor.session.getMode()?.$id?.split("/").pop() || "";
    statusBar.textContent = `${mode}  |  Строка ${row}, Столбец ${col}  |  Всего: ${total}`;
  }
  if (statusBar && aceEditor) {
    aceEditor.session.on("change", updateStatusBar);
    aceEditor.selection.on("changeCursor", updateStatusBar);
    updateStatusBar();
  }
})();

function updateAceEditorFromWorkspace() {
  if (!aceEditor || !ws) return;
  try {
    let code = "";
    switch (selectedGeneratorLanguage) {
      case "python":
        code = pythonGenerator.workspaceToCode(ws);
        aceEditor.session.setMode("ace/mode/python");
        break;
      case "lua":
        code = luaGenerator.workspaceToCode(ws);
        aceEditor.session.setMode("ace/mode/lua");
        break;
      case "javascript":
      default:
        code = javascriptGenerator.workspaceToCode(ws);
        aceEditor.session.setMode("ace/mode/javascript");
        break;
    }
    aceEditor.setValue(code || "", -1);
  } catch (e) {
    // ignore for now; runtime will show errors
  }
}

// Ace settings key for localStorage
const ACE_SETTINGS_KEY = "ace_editor_settings";

interface AceSettings {
  theme?: string;
  fontSize?: number;
  tabSize?: number;
  wrap?: boolean;
  showInvisibles?: boolean;
  highlightActiveLine?: boolean;
  showPrintMargin?: boolean;
  showGutter?: boolean;
  useSoftTabs?: boolean;
  showFoldWidgets?: boolean;
  keybinding?: string;
}

// Load Ace settings from localStorage
function loadAceSettings(): AceSettings {
  try {
    const stored = localStorage.getItem(ACE_SETTINGS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

// Save Ace settings to localStorage
function saveAceSettings(settings: Partial<AceSettings>) {
  try {
    const existing = loadAceSettings();
    const updated = { ...existing, ...settings };
    localStorage.setItem(ACE_SETTINGS_KEY, JSON.stringify(updated));
  } catch {
    // ignore errors
  }
}
