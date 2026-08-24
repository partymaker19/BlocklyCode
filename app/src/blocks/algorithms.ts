/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';

// Простые блоки для словаря (хеш-таблицы) — помогут в задачах подсчёта частот

const dictCreate = {
  type: 'dict_create',
  message0: 'Словарь: создать пустой',
  output: ['Object'],
  colour: 290,
  tooltip: 'Создаёт пустой словарь (объект)',
  helpUrl: '',
  init: function(this: Blockly.Block) {
    this.setColour(290);
    this.setOutput(true, 'Object');
    this.setTooltip('Создаёт пустой словарь (объект)');
  }
};

const dictSet = {
  type: 'dict_set',
  message0: 'Словарь: установить %1[%2] = %3',
  args0: [
    { type: 'input_value', name: 'DICT', check: ['Object'] },
    { type: 'input_value', name: 'KEY', check: ['String', 'Number'] },
    { type: 'input_value', name: 'VALUE', check: ['Number', 'String'] },
  ],
  previousStatement: null,
  nextStatement: null,
  colour: 290,
  tooltip: 'Записать значение по ключу в словарь',
  helpUrl: '',
  init: function(this: Blockly.Block) {
    this.setColour(290);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setTooltip('Записать значение по ключу в словарь');
  }
};

const dictGet = {
  type: 'dict_get',
  message0: 'Словарь: получить %1[%2]',
  args0: [
    { type: 'input_value', name: 'DICT', check: ['Object'] },
    { type: 'input_value', name: 'KEY', check: ['String', 'Number'] },
  ],
  output: ['Number', 'String'],
  colour: 290,
  tooltip: 'Получить значение по ключу',
  helpUrl: '',
  init: function(this: Blockly.Block) {
    this.setColour(290);
    this.setOutput(true, ['Number', 'String']);
    this.setTooltip('Получить значение по ключу');
  }
};

const dictHasKey = {
  type: 'dict_has_key',
  message0: 'Словарь: есть ключ? %1 в %2',
  args0: [
    { type: 'input_value', name: 'KEY', check: ['String', 'Number'] },
    { type: 'input_value', name: 'DICT', check: ['Object'] },
  ],
  output: 'Boolean',
  colour: 290,
  tooltip: 'Проверить наличие ключа в словаре',
  helpUrl: '',
  init: function(this: Blockly.Block) {
    this.setColour(290);
    this.setOutput(true, 'Boolean');
    this.setTooltip('Проверить наличие ключа в словаре');
  }
};

// Экспорт определений без побочных эффектов
export const blocks = Blockly.common.createBlockDefinitionsFromJsonArray([
  dictCreate,
  dictSet,
  dictGet,
  dictHasKey,
]);