/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import {blocks} from './blocks/text';
import {forBlock} from './generators/javascript';
import {javascriptGenerator} from 'blockly/javascript';
import {save, load} from './serialization';
import {toolbox as originalToolbox} from './toolbox';
import './index.css';

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

// Теперь, когда локаль установлена, регистрируем блоки и генераторы
Blockly.common.defineBlocks(blocks);
Object.assign(javascriptGenerator.forBlock, forBlock);

function localizedToolbox(lang: 'ru' | 'en') {
  const t = {
    en: { Logic: 'Logic', Loops: 'Loops', Math: 'Math', Text: 'Text', Lists: 'Lists', Variables: 'Variables', Functions: 'Functions', Custom: 'Custom blocks' },
    ru: { Logic: 'Логика', Loops: 'Циклы', Math: 'Математика', Text: 'Текст', Lists: 'Списки', Variables: 'Переменные', Functions: 'Функции', Custom: 'Кастомные блоки' },
  }[lang];
  const tb = JSON.parse(JSON.stringify(originalToolbox));
  for (const cat of tb.contents) {
    if (cat.kind === 'category' && t[cat.name as keyof typeof t]) {
      cat.name = t[cat.name as keyof typeof t];
    }
  }
  return tb;
}

// Set up UI elements and inject Blockly
const codeDiv = document.getElementById('generatedCode')?.firstChild as ChildNode | null;
const outputDiv = document.getElementById('output');
const blocklyDiv = document.getElementById('blocklyDiv');

if (!blocklyDiv) {
  throw new Error(`div with id 'blocklyDiv' not found`);
}

// Настройка переключателя языка
(function setupLanguageSwitch() {
  const switchInput = document.getElementById('langSwitchInput') as HTMLInputElement;
  
  if (!switchInput) {
    console.error('Language switch input not found');
    return;
  }

  // Устанавливаем начальное состояние переключателя
  switchInput.checked = defaultLang === 'en';
  updateHeaderText(defaultLang);

  // Обработчик переключения языка
  switchInput.addEventListener('change', (e) => {
    const lang = (e.target as HTMLInputElement).checked ? 'en' : 'ru';
    
    setLanguage(lang);

    // Переопределяем блоки под новую локаль
    Blockly.common.defineBlocks(blocks);
 
    const currentState = ws ? Blockly.serialization.workspaces.save(ws as Blockly.Workspace) : null;

    if (ws) {
      ws.dispose();
    }

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

    if (currentState) {
      Blockly.serialization.workspaces.load(currentState, newWs as Blockly.Workspace, undefined);
    }
    ws = newWs as Blockly.WorkspaceSvg;
    
    // Добавляем обработчики для нового workspace
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
  });
})();

let ws = Blockly.inject(blocklyDiv, {
  toolbox: localizedToolbox(defaultLang),
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

const runCode = () => {
  const code = javascriptGenerator.workspaceToCode(ws as Blockly.Workspace);
  if (codeDiv) codeDiv.textContent = code as unknown as string;
  if (outputDiv) outputDiv.innerHTML = '';
  // eslint-disable-next-line no-eval
  eval(code);
};

if (ws) {
  load(ws);
  runCode();
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
