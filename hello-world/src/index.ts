/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
// Добавляем импорт стандартных блоков Blockly, чтобы категории тулбокса были заполнены
import 'blockly/blocks';
import {blocks} from './blocks/text';
import {forBlock} from './generators/javascript';
import {javascriptGenerator} from 'blockly/javascript';
import {save, load} from './serialization';
import {toolbox as originalToolbox} from './toolbox';
import './index.css';
import { registerCustomBlocks, importBlockFromJson, getCustomBlocksToolboxCategory, removeCustomBlock, getCustomBlocks } from './customBlocks';

// Добавлено: импорт локалей Blockly
import * as EnLocale from 'blockly/msg/en';
import * as RuLocale from 'blockly/msg/ru';
// Добавлено: регистрация плагина угла
import {registerFieldAngle} from '@blockly/field-angle';

// Регистрируем поле угла до того, как начнём создавать блоки
registerFieldAngle();

// Register the blocks and generator with Blockly
// Регистрация будет выполнена после применения локали, чтобы подтянуть правильные строки

// Настройки локализации приложения
const APP_LANG_KEY = 'app_language';
const defaultLang = (localStorage.getItem(APP_LANG_KEY) || 'ru') as 'ru' | 'en';

function setLanguage(lang: 'ru' | 'en') {
  // Применяем локаль Blockly
  Blockly.setLocale(lang === 'ru' ? (RuLocale as any) : (EnLocale as any));
  
  // Добавляем кастомные переводы для наших блоков (ключи без префикса BKY_)
  if (lang === 'ru') {
    (Blockly as any).Msg.ADD_TEXT = 'Добавить текст %1';
    (Blockly as any).Msg.ANGLE_DEMO = 'Установить угол %1 градусов';
    (Blockly as any).Msg.ANGLE_VALUE = 'Угол %1 градусов';
    (Blockly as any).Msg.DEGREES = 'градусов';
  } else {
    (Blockly as any).Msg.ADD_TEXT = 'Add text %1';
    (Blockly as any).Msg.ANGLE_DEMO = 'Set angle to %1 degrees';
    (Blockly as any).Msg.ANGLE_VALUE = 'Angle %1 degrees';
    (Blockly as any).Msg.DEGREES = 'degrees';
  }
  
  localStorage.setItem(APP_LANG_KEY, lang);
  updateHeaderText(lang);
}

// Функция для обновления текста в шапке
function updateHeaderText(lang: 'ru' | 'en') {
  const subtitle = document.querySelector('.header-subtitle');
  const ruLabel = document.getElementById('lang-ru');
  const enLabel = document.getElementById('lang-en');
  
  if (subtitle) {
    subtitle.textContent = lang === 'ru' ? 
      'Создавайте программы с помощью блоков' : 
      'Create programs using blocks';
  }
  
  // Обновляем активные состояния меток языков
  if (ruLabel && enLabel) {
    ruLabel.className = lang === 'ru' ? 'lang-label active' : 'lang-label';
    enLabel.className = lang === 'en' ? 'lang-label active' : 'lang-label';
  }
}

// Инициализируем язык до создания рабочей области
 setLanguage(defaultLang);

// Объявляем флаг регистрации контекстного меню до первого вызова
let customBlockContextRegistered = false;

// Теперь, когда локаль установлена, регистрируем блоки и генераторы
Blockly.common.defineBlocks(blocks);
Object.assign(javascriptGenerator.forBlock, forBlock);
// Регистрируем пользовательские блоки и контекстное меню удаления
registerCustomBlocks();
setupCustomBlockContextMenu();

function localizedToolbox(lang: 'ru' | 'en') {
  const t = {
    en: { Logic: 'Logic', Loops: 'Loops', Math: 'Math', Text: 'Text', Lists: 'Lists', Variables: 'Variables', Functions: 'Functions', Custom: 'Custom blocks', MyBlocks: 'My Blocks', ImportBlocks: 'Import blocks', ImportModalTitle: 'Import custom blocks', JsonLabel: 'Block definition (JSON):', ImportInfo: 'Paste the block JSON definition below. The block will be added to "My Blocks" category.', Cancel: 'Cancel', Import: 'Import' },
    ru: { Logic: 'Логика', Loops: 'Циклы', Math: 'Математика', Text: 'Текст', Lists: 'Списки', Variables: 'Переменные', Functions: 'Функции', Custom: 'Кастомные блоки', MyBlocks: 'Мои блоки', ImportBlocks: 'Импорт блоков', ImportModalTitle: 'Импорт пользовательских блоков', JsonLabel: 'JSON определение блока:', ImportInfo: 'Вставьте JSON-определение блока в поле ниже. Блок будет добавлен в категорию "Мои блоки".', Cancel: 'Отмена', Import: 'Импортировать' },
  }[lang];
  const tb = JSON.parse(JSON.stringify(originalToolbox));
  for (const cat of tb.contents) {
    if (cat.kind === 'category' && t[cat.name as keyof typeof t]) {
      cat.name = t[cat.name as keyof typeof t];
    }
  }
  // Добавляем динамическую категорию "Мои блоки" в самый низ, если есть пользовательские блоки
  const customCat = getCustomBlocksToolboxCategory();
  if (customCat) {
    customCat.name = t.MyBlocks;
    tb.contents.push({ kind: 'sep' });
    tb.contents.push(customCat);
  }
  return tb;
}

// Set up UI elements and inject Blockly
const codeDiv = document.getElementById('generatedCode')?.firstChild as ChildNode | null;
const outputDiv = document.getElementById('output');
const blocklyDiv = document.getElementById('blocklyDiv');
const importBtn = document.getElementById('importBlockBtn') as HTMLButtonElement | null;
const importModal = document.getElementById('importModal') as HTMLDivElement | null;
const closeModalBtn = document.getElementById('closeModal') as HTMLSpanElement | null;
const cancelImportBtn = document.getElementById('cancelImport') as HTMLButtonElement | null;
const confirmImportBtn = document.getElementById('confirmImport') as HTMLButtonElement | null;
const blockJsonTextarea = document.getElementById('blockJson') as HTMLTextAreaElement | null;
const blockGeneratorTextarea = document.getElementById('blockGenerator') as HTMLTextAreaElement | null;
const importBtnText = document.getElementById('importBtnText');
const modalTitle = document.getElementById('modalTitle');
const jsonLabel = document.getElementById('jsonLabel');
const generatorLabel = document.getElementById('generatorLabel');
const importInfo = document.getElementById('importInfo');
const presetLetBtn = document.getElementById('presetLet') as HTMLButtonElement | null;
const presetConstBtn = document.getElementById('presetConst') as HTMLButtonElement | null;
const presetVarBtn = document.getElementById('presetVar') as HTMLButtonElement | null;
const presetsLabelEl = document.getElementById('presetsLabel');
// Новые элементы модалки
const genLangTabs = document.getElementById('generatorLangTabs') as HTMLDivElement | null;
const genLangJsBtn = document.getElementById('genLangJs') as HTMLButtonElement | null;
const genLangPyBtn = document.getElementById('genLangPy') as HTMLButtonElement | null;
const genLangLuaBtn = document.getElementById('genLangLua') as HTMLButtonElement | null;
const presetNotice = document.getElementById('presetNotice') as HTMLDivElement | null;
const generatorErrorEl = document.getElementById('generatorError') as HTMLDivElement | null;
const generatorOkEl = document.getElementById('generatorOk') as HTMLDivElement | null;

let selectedGeneratorLanguage: 'javascript' | 'python' | 'lua' = 'javascript';

// Объявление рабочей области Blockly
let ws: Blockly.WorkspaceSvg;

function setActiveGenLangButton(lang: 'javascript' | 'python' | 'lua') {
  [genLangJsBtn, genLangPyBtn, genLangLuaBtn].forEach(btn => btn && btn.classList.remove('active'));
  if (lang === 'javascript' && genLangJsBtn) genLangJsBtn.classList.add('active');
  if (lang === 'python' && genLangPyBtn) genLangPyBtn.classList.add('active');
  if (lang === 'lua' && genLangLuaBtn) genLangLuaBtn.classList.add('active');
}

function updatePresetsByGenLang() {
  const lang = selectedGeneratorLanguage;
  const letBtn = presetLetBtn;
  const constBtn = presetConstBtn;
  const varBtn = presetVarBtn;
  if (!letBtn || !constBtn || !varBtn) return;

  if (lang === 'javascript') {
    letBtn.disabled = false; letBtn.textContent = 'let переменная';
    constBtn.disabled = false; constBtn.textContent = 'const переменная';
    varBtn.disabled = false; varBtn.textContent = 'var переменная';
    if (presetNotice) { presetNotice.style.display = 'none'; presetNotice.textContent = ''; }
  } else if (lang === 'python') {
    letBtn.disabled = false; letBtn.textContent = 'переменная';
    constBtn.disabled = true; constBtn.textContent = 'const (недоступно в Python)';
    varBtn.disabled = true; varBtn.textContent = 'var (недоступно в Python)';
    if (presetNotice) { presetNotice.style.display = 'block'; presetNotice.textContent = 'В Python нет let/const/var. Доступен пресет простой присваивания переменной.'; }
  } else { // lua
    letBtn.disabled = false; letBtn.textContent = 'local переменная';
    constBtn.disabled = true; constBtn.textContent = 'const (недоступно в Lua)';
    varBtn.disabled = true; varBtn.textContent = 'var (недоступно в Lua)';
    if (presetNotice) { presetNotice.style.display = 'block'; presetNotice.textContent = 'В Lua используются local/глобальные переменные. Доступен пресет local переменной.'; }
  }
}

function validateGeneratorUI() {
  if (!blockGeneratorTextarea || !generatorErrorEl || !generatorOkEl) return;
  const code = blockGeneratorTextarea.value.trim();
  if (selectedGeneratorLanguage === 'javascript' && code) {
    try {
      // Простая синтаксическая проверка через new Function
      new Function('block', 'javascriptGenerator', 'Order', code);
      generatorErrorEl.style.display = 'none';
      generatorOkEl.style.display = 'block';
      generatorOkEl.textContent = '✓ Генератор корректен';
    } catch (error) {
      const msg = (error && (error as any).message) ? (error as any).message : String(error);
      generatorErrorEl.style.display = 'block';
      generatorErrorEl.textContent = `Ошибка: ${msg}`;
      generatorOkEl.style.display = 'none';
    }
  } else {
    generatorErrorEl.style.display = 'none';
    generatorOkEl.style.display = 'none';
  }
}

// Функция для установки placeholder в зависимости от языка
function setGeneratorPlaceholder(lang: 'ru' | 'en') {
  if (!blockGeneratorTextarea) return;
  const placeholders = {
    javascript: {
      ru: 'Например:\nconst value = javascriptGenerator.valueToCode(block, \'VALUE\', Order.NONE) || \'0\';\nreturn `console.log(${value});\\n`;',
      en: 'Example:\nconst value = javascriptGenerator.valueToCode(block, \'VALUE\', Order.NONE) || \'0\';\nreturn `console.log(${value});\\n`;'
    },
    python: {
      ru: 'Например:\n# value = получить значение входа VALUE\nreturn f\'print({value})\\n\'',
      en: 'Example:\n# value = get input VALUE\nreturn f\'print({value})\\n\''
    },
    lua: {
      ru: 'Например:\n-- local value = получить значение входа VALUE\nreturn string.format(\'print(%s)\\n\', value)',
      en: 'Example:\n-- local value = get input VALUE\nreturn string.format(\'print(%s)\\n\', value)'
    }
  };
  const placeholder = placeholders[selectedGeneratorLanguage][lang];
  blockGeneratorTextarea.placeholder = placeholder;
}

function setGenLang(lang: 'javascript' | 'python' | 'lua') {
  selectedGeneratorLanguage = lang;
  setActiveGenLangButton(lang);
  updatePresetsByGenLang();
  validateGeneratorUI();
  const currentLang = (localStorage.getItem(APP_LANG_KEY) || 'ru') as 'ru' | 'en';
  setGeneratorPlaceholder(currentLang);
}

// Функция для генерации и запуска кода
function runCode() {
  if (!ws) return;
  
  try {
    const code = javascriptGenerator.workspaceToCode(ws);
    if (codeDiv && codeDiv.parentNode) {
      codeDiv.textContent = code;
    }
    
    // Очищаем область вывода перед выполнением
    if (outputDiv) {
      outputDiv.innerHTML = '';
    }
    
    // Выполняем сгенерированный код
    if (code.trim()) {
      try {
        // Создаем IIFE для изоляции кода
        const executableCode = `(function() {\n${code}\n})();`;
        eval(executableCode);
      } catch (error) {
        console.error('Runtime error:', error);
        if (outputDiv) {
          const errorEl = document.createElement('p');
          errorEl.style.color = 'red';
          errorEl.textContent = `Ошибка выполнения: ${(error as any).message || error}`;
          outputDiv.appendChild(errorEl);
        }
      }
    }
  } catch (error) {
    console.error('Code generation error:', error);
    if (outputDiv) {
      const errorEl = document.createElement('p');
      errorEl.style.color = 'red';
      errorEl.textContent = `Ошибка генерации кода: ${(error as any).message || error}`;
      outputDiv.appendChild(errorEl);
    }
  }
}

if (genLangJsBtn) genLangJsBtn.addEventListener('click', () => setGenLang('javascript'));
if (genLangPyBtn) genLangPyBtn.addEventListener('click', () => setGenLang('python'));
if (genLangLuaBtn) genLangLuaBtn.addEventListener('click', () => setGenLang('lua'));

if (blockGeneratorTextarea) {
  blockGeneratorTextarea.addEventListener('input', () => validateGeneratorUI());
}

// При открытии модалки — сбрасываем язык генератора на JS по умолчанию
function openImportModal() {
  if (!importModal) return;
  importModal.style.display = 'block';
  setGenLang('javascript');
}

function closeImportModal() {
  if (!importModal) return;
  importModal.style.display = 'none';
  if (blockJsonTextarea) blockJsonTextarea.value = '';
  if (blockGeneratorTextarea) blockGeneratorTextarea.value = '';
}

function localizeImportUI(lang: 'ru' | 'en') {
  const t = {
    en: { ImportBlocks: 'Import blocks', ImportModalTitle: 'Import custom blocks', JsonLabel: 'Block definition (JSON):', GeneratorLabel: 'Code generator (optional):', ImportInfo: 'Paste the block JSON definition below. The block will be added to "My Blocks" category. You may also provide a custom code generator below.', Cancel: 'Cancel', Import: 'Import', PresetsLabel: 'Quick block presets:', PresetLet: 'let variable', PresetConst: 'const variable', PresetVar: 'var variable' },
    ru: { ImportBlocks: 'Импорт блоков', ImportModalTitle: 'Импорт пользовательских блоков', JsonLabel: 'JSON определение блока:', GeneratorLabel: 'Генератор кода (опционально):', ImportInfo: 'Вставьте JSON-определение блока в поле ниже. Блок будет добавлен в категорию "Мои блоки". Дополнительно можно указать генератор кода ниже.', Cancel: 'Отмена', Import: 'Импортировать', PresetsLabel: 'Быстрые пресеты блоков:', PresetLet: 'let переменная', PresetConst: 'const переменная', PresetVar: 'var переменная' },
  }[lang];
  if (importBtnText) importBtnText.textContent = t.ImportBlocks;
  if (modalTitle) modalTitle.textContent = t.ImportModalTitle;
  if (jsonLabel) jsonLabel.textContent = t.JsonLabel;
  if (generatorLabel) generatorLabel.textContent = t.GeneratorLabel;
  if (importInfo) importInfo.textContent = t.ImportInfo;
  const cancelBtn = document.getElementById('cancelImport');
  const confirmBtn = document.getElementById('confirmImport');
  if (cancelBtn) (cancelBtn as HTMLButtonElement).textContent = t.Cancel;
  if (confirmBtn) (confirmBtn as HTMLButtonElement).textContent = t.Import;
  if (presetsLabelEl) presetsLabelEl.textContent = t.PresetsLabel;
  if (presetLetBtn) presetLetBtn.textContent = t.PresetLet;
  if (presetConstBtn) presetConstBtn.textContent = t.PresetConst;
  if (presetVarBtn) presetVarBtn.textContent = t.PresetVar;
  setGeneratorPlaceholder(lang);
}

function refreshWorkspaceWithCustomToolbox() {
  const lang = (localStorage.getItem(APP_LANG_KEY) || 'ru') as 'ru' | 'en';
  const currentState = ws ? Blockly.serialization.workspaces.save(ws as Blockly.Workspace) : null;
  if (ws) ws.dispose();
  const newWs = Blockly.inject(blocklyDiv!, {
    toolbox: localizedToolbox(lang),
    grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
    zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2, pinch: true },
    move: { scrollbars: { horizontal: true, vertical: true }, drag: true, wheel: true },
    trashcan: true,
    maxTrashcanContents: 32,
    comments: true,
    collapse: true,
    disable: true,
    sounds: true,
    maxBlocks: Infinity,
    maxInstances: { 'controls_if': 10, 'controls_repeat_ext': 5 },
    scrollbars: true,
    renderer: 'thrasos',
    theme: Blockly.Themes.Classic,
    media: 'https://unpkg.com/blockly/media/',
    horizontalLayout: false,
    toolboxPosition: 'start',
    css: true,
    rtl: false,
    oneBasedIndex: true,
    modalInputs: true,
    readOnly: false,
  });
  if (currentState) Blockly.serialization.workspaces.load(currentState, newWs as Blockly.Workspace, undefined);
  ws = newWs as Blockly.WorkspaceSvg;
  if (ws) {
    ws.addChangeListener((e: Blockly.Events.Abstract) => {
      if (e.isUiEvent) return;
      save(ws);
    });
    ws.addChangeListener((e: Blockly.Events.Abstract) => {
      if (e.isUiEvent || e.type == Blockly.Events.FINISHED_LOADING || ws.isDragging()) {
        return;
      }
      runCode();
    });
  }
  runCode();
}

if (importBtn) {
  importBtn.addEventListener('click', () => openImportModal());
}
if (closeModalBtn) {
  closeModalBtn.addEventListener('click', () => closeImportModal());
}
if (cancelImportBtn) {
  cancelImportBtn.addEventListener('click', () => closeImportModal());
}
if (confirmImportBtn) {
  confirmImportBtn.addEventListener('click', () => {
    if (!blockJsonTextarea) return;
    const json = blockJsonTextarea.value;
    const gen = blockGeneratorTextarea?.value?.trim() || undefined;
    // Если JS и есть ошибка валидации — блокируем импорт
    if (selectedGeneratorLanguage === 'javascript' && generatorErrorEl && generatorErrorEl.style.display !== 'none') {
      alert('Исправьте ошибки в генераторе JavaScript перед импортом');
      return;
    }
    const { success, error, blockType } = importBlockFromJson(json, gen, selectedGeneratorLanguage as any);
    if (success) {
      // Зарегистрировать новые блоки 
      registerCustomBlocks();
      
      // Сохраняем текущее состояние рабочей области
      const currentState = ws ? Blockly.serialization.workspaces.save(ws as Blockly.Workspace) : null;
      
      // Пересоздаем рабочую область с обновленным тулбоксом
      if (ws) {
        ws.dispose();
      }
      
      const currentLang = localStorage.getItem(APP_LANG_KEY) as 'ru' | 'en' || 'ru';
      ws = Blockly.inject(blocklyDiv!, {
      toolbox: localizedToolbox(currentLang),
      grid: { spacing: 20, length: 3, colour: '#ccc', snap: true },
      zoom: { controls: true, wheel: true, startScale: 1.0, maxScale: 3, minScale: 0.3, scaleSpeed: 1.2, pinch: true },
      move: { scrollbars: { horizontal: true, vertical: true }, drag: true, wheel: true },
      trashcan: true,
      maxTrashcanContents: 32,
      comments: true,
      collapse: true,
      disable: true,
      sounds: true,
      maxBlocks: Infinity,
      maxInstances: { 'controls_if': 10, 'controls_repeat_ext': 5 },
      scrollbars: true,
      renderer: 'thrasos',
      theme: Blockly.Themes.Classic,
      media: 'https://unpkg.com/blockly/media/',
      horizontalLayout: false,
      toolboxPosition: 'start',
      css: true,
      rtl: false,
      oneBasedIndex: true,
      modalInputs: true,
      readOnly: false
      });
      
      // Восстанавливаем состояние рабочей области
      if (currentState) {
        try {
          Blockly.serialization.workspaces.load(currentState, ws as Blockly.Workspace);
        } catch (e) {
          console.warn('Could not restore workspace state after block import:', e);
        }
      }
      
      // Настраиваем обработчики событий для новой рабочей области
      if (ws) {
        load(ws);
        ws.addChangeListener((e: Blockly.Events.Abstract) => {
          if (e.isUiEvent) return;
          save(ws);
        });
        ws.addChangeListener((e: Blockly.Events.Abstract) => {
          if (e.isUiEvent || e.type == Blockly.Events.FINISHED_LOADING || ws.isDragging()) {
            return;
          }
          runCode();
        });
      }
      
      closeImportModal();
      
      // Вывести сообщение пользователю в output
      if (outputDiv) {
        const p = document.createElement('p');
        p.textContent = `Импортирован блок: ${blockType}`;
        outputDiv.appendChild(p);
      }
    } else {
      alert('Ошибка импорта: ' + error);
    }
  });
}

// Функция регистрации пункта контекстного меню для удаления пользовательского блока
// удалено дублирующееся объявление customBlockContextRegistered
function setupCustomBlockContextMenu() {
  if (customBlockContextRegistered) return;
  const registry = (Blockly as any).ContextMenuRegistry?.registry as any;
  if (!registry) return;

  const ITEM_ID = 'delete_custom_block_from_my_blocks';
  // Если уже есть такой пункт — выходим
  if (registry.getItem && registry.getItem(ITEM_ID)) {
    customBlockContextRegistered = true;
    return;
  }

  const displayText = () => {
    const lang = (localStorage.getItem('app_language') || 'ru') as 'ru' | 'en';
    return lang === 'ru' ? 'Удалить из «Моих блоков»' : 'Remove from My Blocks';
  };

  const item = {
    id: ITEM_ID,
    displayText,
    preconditionFn: (scope: any) => {
      const block = scope?.block as Blockly.Block | undefined;
      if (!block) return 'hidden';
      try {
        const custom = getCustomBlocks();
        return custom.some((b: any) => b.definition?.type === block.type) ? 'enabled' : 'hidden';
      } catch {
        return 'hidden';
      }
    },
    callback: (scope: any) => {
      const block = scope?.block as Blockly.Block | undefined;
      if (!block) return;
      const type = (block as any).type as string;
      const lang = (localStorage.getItem('app_language') || 'ru') as 'ru' | 'en';
      const name = type;
      const question = lang === 'ru'
        ? `Удалить пользовательский блок «${name}» из раздела «Мои блоки»?\nЭкземпляры на рабочем поле не будут удалены.`
        : `Remove custom block "${name}" from "My Blocks"?\nInstances already on the workspace will not be removed.`;
      if (!confirm(question)) return;

      if (removeCustomBlock(type)) {
        // Перерегистрируем и обновим тулбокс/рабочее поле
        registerCustomBlocks();
        refreshWorkspaceWithCustomToolbox();
        const out = document.getElementById('output');
        if (out) {
          const p = document.createElement('p');
          p.textContent = (lang === 'ru') ? `Удалён блок: ${type}` : `Removed block: ${type}`;
          out.appendChild(p);
        }
      } else {
        alert(lang === 'ru' ? 'Не удалось удалить блок.' : 'Failed to remove block.');
      }
    },
    scopeType: (Blockly as any).ContextMenuRegistry.ScopeType.BLOCK,
    weight: 200,
  };

  try {
    registry.register(item);
    customBlockContextRegistered = true;
  } catch (e) {
    // На случай повторной регистрации при горячей перезагрузке
    customBlockContextRegistered = true;
  }
}

function applyPreset(kind: 'let' | 'const' | 'var') {
  if (!blockJsonTextarea) return;
  const lang = selectedGeneratorLanguage;

  if (lang === 'javascript') {
    const blockType = `${kind}_variable`;
    const color = kind === 'let' ? 180 : kind === 'const' ? 200 : 160;
    const jsonDef = {
      type: blockType,
      message0: `${kind} %1 = %2`,
      args0: [
        { type: 'field_input', name: 'NAME', text: 'x' },
        { type: 'input_value', name: 'VALUE' }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: color,
      tooltip: `${kind} variable declaration`,
      helpUrl: ''
    } as any;
    blockJsonTextarea.value = JSON.stringify(jsonDef, null, 2);
    if (blockGeneratorTextarea) {
      const lastLine = 'return `' + kind + ' ${name} = ${value};\\n`;';
      blockGeneratorTextarea.value = [
        "const name = block.getFieldValue('NAME') || 'x';",
        "const value = javascriptGenerator.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '0';",
        lastLine
      ].join('\n');
    }
  } else if (lang === 'python') {
    const blockType = `py_variable`;
    const jsonDef = {
      type: blockType,
      message0: '%1 = %2',
      args0: [
        { type: 'field_input', name: 'NAME', text: 'x' },
        { type: 'input_value', name: 'VALUE' }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 180,
      tooltip: 'Присваивание переменной (Python)',
      helpUrl: ''
    } as any;
    blockJsonTextarea.value = JSON.stringify(jsonDef, null, 2);
    if (blockGeneratorTextarea) {
      blockGeneratorTextarea.value = [
        "name = block.getFieldValue('NAME') or 'x'",
        "value = '0'  # TODO: получить значение входа по аналогии с pythonGenerator",
        "return f'{name} = {value}\n'"
      ].join('\n');
    }
  } else { // lua
    const blockType = `lua_local_variable`;
    const jsonDef = {
      type: blockType,
      message0: 'local %1 = %2',
      args0: [
        { type: 'field_input', name: 'NAME', text: 'x' },
        { type: 'input_value', name: 'VALUE' }
      ],
      previousStatement: null,
      nextStatement: null,
      colour: 180,
      tooltip: 'Локальная переменная (Lua)',
      helpUrl: ''
    } as any;
    blockJsonTextarea.value = JSON.stringify(jsonDef, null, 2);
    if (blockGeneratorTextarea) {
      blockGeneratorTextarea.value = [
        "local name = block:getFieldValue('NAME') or 'x'",
        "local value = '0' -- TODO: получить значение входа с luaGenerator",
        "return string.format('local %s = %s\\n', name, value)"
      ].join('\n');
    }
  }

  updatePresetsByGenLang();
  validateGeneratorUI();
}
if (presetLetBtn) presetLetBtn.addEventListener('click', () => applyPreset('let'));
if (presetConstBtn) presetConstBtn.addEventListener('click', () => applyPreset('const'));
if (presetVarBtn) presetVarBtn.addEventListener('click', () => applyPreset('var'));

// Инициализация состояний при загрузке
updatePresetsByGenLang();

// Инициализация рабочей области при загрузке страницы
refreshWorkspaceWithCustomToolbox();

// Обработчик переключения языка
const langSwitchInput = document.getElementById('langSwitchInput') as HTMLInputElement | null;
if (langSwitchInput) {
  // Установить состояние переключателя в соответствии с текущим языком
  langSwitchInput.checked = defaultLang === 'en';
  
  langSwitchInput.addEventListener('change', () => {
    const newLang = langSwitchInput.checked ? 'en' : 'ru';
    setLanguage(newLang);
    refreshWorkspaceWithCustomToolbox();
    localizeImportUI(newLang);
  });
}
