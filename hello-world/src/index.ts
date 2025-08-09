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
import {toolbox} from './toolbox';
import './index.css';

// Register the blocks and generator with Blockly
Blockly.common.defineBlocks(blocks);
Object.assign(javascriptGenerator.forBlock, forBlock);

// Set up UI elements and inject Blockly
const codeDiv = document.getElementById('generatedCode')?.firstChild;
const outputDiv = document.getElementById('output');
const blocklyDiv = document.getElementById('blocklyDiv');

if (!blocklyDiv) {
  throw new Error(`div with id 'blocklyDiv' not found`);
}
// Расширенная конфигурация Blockly со всеми встроенными возможностями
const ws = Blockly.inject(blocklyDiv, {
  toolbox,
  
  // Сетка для выравнивания блоков
  grid: {
    spacing: 20,
    length: 3,
    colour: '#ccc',
    snap: true
  },
  
  // Настройки масштабирования
  zoom: {
    controls: true,
    wheel: true,
    startScale: 1.0,
    maxScale: 3,
    minScale: 0.3,
    scaleSpeed: 1.2,
    pinch: true
  },
  
  // Настройки перемещения рабочей области
  move: {
    scrollbars: {
      horizontal: true,
      vertical: true
    },
    drag: true,
    wheel: true
  },
  
  // Корзина для удаления блоков
  trashcan: true,
  
  // Максимальное количество удаленных элементов в корзине
  maxTrashcanContents: 32,
  
  // Комментарии к блокам
  comments: true,
  
  // Возможность сворачивания блоков
  collapse: true,
  
  // Возможность отключения блоков
  disable: true,
  
  // Звуки
  sounds: true,
  
  // Максимальное количество блоков (для учебных целей)
  maxBlocks: Infinity,
  
  // Максимальное количество экземпляров определенных типов блоков
  maxInstances: {
    'controls_if': 10,
    'controls_repeat_ext': 5
  },
  
  // Полосы прокрутки (уже включены в move.scrollbars)
  scrollbars: true,
  
  // Рендерер (современный Thrasos)
  renderer: 'thrasos',
  
  // Тема (можно использовать 'classic', 'modern', 'deuteranopia', 'tritanopia')
  theme: Blockly.Themes.Classic,
  
  // Медиа-путь для ресурсов
  media: 'https://unpkg.com/blockly/media/',
  
  // Горизонтальная ориентация тулбокса
  horizontalLayout: false,
  
  // Позиция тулбокса
  toolboxPosition: 'start',
  
  // CSS стили
  css: true,
  
  // RTL поддержка
  rtl: false,
  
  // Индексация с 1
  oneBasedIndex: true,
  
  // Модальные редакторы для мобильных устройств
  modalInputs: true,
  
  // Режим только для чтения
  readOnly: false
});

// This function resets the code and output divs, shows the
// generated code from the workspace, and evals the code.
// In a real application, you probably shouldn't use `eval`.
const runCode = () => {
  const code = javascriptGenerator.workspaceToCode(ws as Blockly.Workspace);
  if (codeDiv) codeDiv.textContent = code;

  if (outputDiv) outputDiv.innerHTML = '';

  eval(code);
};

if (ws) {
  // Load the initial state from storage and run the code.
  load(ws);
  runCode();

  // Every time the workspace changes state, save the changes to storage.
  ws.addChangeListener((e: Blockly.Events.Abstract) => {
    // UI events are things like scrolling, zooming, etc.
    // No need to save after one of these.
    if (e.isUiEvent) return;
    save(ws);
  });

  // Whenever the workspace changes meaningfully, run the code again.
  ws.addChangeListener((e: Blockly.Events.Abstract) => {
    // Don't run the code when the workspace finishes loading; we're
    // already running it once when the application starts.
    // Don't run the code during drags; we might have invalid state.
    if (
      e.isUiEvent ||
      e.type == Blockly.Events.FINISHED_LOADING ||
      ws.isDragging()
    ) {
      return;
    }
    runCode();
  });
}
